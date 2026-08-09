import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  cp_side,
  estimate_status,
  estimate_type,
  leg_type,
  Prisma,
  result_side,
} from '@prisma/client';
import { AppErrorCode } from '../../../common/errors/app-error-code';
import { PrismaService } from '../../../prisma.service';
import type {
  CargoReletFreightTermDto,
  CargoReletPortCpTermDto,
  SaveCargoReletEstimateDto,
} from '../dto/cargo-relet-snapshot.dto';

@Injectable()
export class CargoReletEstimateSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async save(snapshot: SaveCargoReletEstimateDto) {
    validateSnapshot(snapshot);
    const result = calculateResult(snapshot);

    const saved = await this.prisma.$transaction(async (tx) => {
      const estimateFileId = snapshot.header.estimateFileId
        ? BigInt(snapshot.header.estimateFileId)
        : (
            await tx.estimate_files.create({
              data: { file_name: snapshot.header.fileName },
            })
          ).id;

      const estimateId = snapshot.header.estimateId
        ? BigInt(snapshot.header.estimateId)
        : undefined;

      const estimate = estimateId
        ? await tx.estimates.update({
            where: { id: estimateId },
            data: estimateData(snapshot, estimateFileId),
          })
        : await tx.estimates.create({
            data: estimateData(snapshot, estimateFileId),
          });

      await replaceChildren(tx, estimate.id, snapshot);
      await upsertEstimateVessel(tx, estimate.id, snapshot);

      await tx.estimate_results.upsert({
        where: {
          estimate_id_side: {
            estimate_id: estimate.id,
            side: result_side.TOTAL,
          },
        },
        create: {
          estimate_id: estimate.id,
          side: result_side.TOTAL,
          ...result,
        },
        update: { ...result, calculated_at: new Date() },
      });

      return estimate;
    });

    return {
      estimateId: saved.id.toString(),
      estimateFileId: saved.estimate_file_id.toString(),
      result: {
        totalDurationDays: result.total_duration_days,
        revenue: result.revenue,
        opExpense: result.op_expense,
        opProfit: result.op_profit,
        totalFreight: result.total_freight,
        profitUsd: result.profit_usd,
        tceUsdDay: result.tce_usd_day,
        dailyRevenue: result.daily_revenue,
        dailyExpense: result.daily_expense,
        dailyProfit: result.daily_profit,
      },
    };
  }

  async load(estimateId: string) {
    const estimate = await this.prisma.estimates.findUnique({
      where: { id: BigInt(estimateId) },
      include: {
        estimate_files: true,
        estimate_vessels: true,
        estimate_cargo_lines: {
          include: { estimate_cargo_freight_terms: true },
          orderBy: { line_no: 'asc' },
        },
        estimate_port_legs: {
          include: { estimate_port_leg_cp_terms: true },
          orderBy: { leg_no: 'asc' },
        },
        estimate_results: true,
      },
    });

    if (!estimate || estimate.estimate_type !== estimate_type.CARGO_RELET) {
      throw new NotFoundException({
        code: AppErrorCode.ESTIMATE_NOT_FOUND,
        message: 'Cargo Relet estimate was not found.',
        details: [{ path: 'estimateId', message: estimateId }],
      });
    }

    const result = estimate.estimate_results[0];
    return {
      header: {
        estimateId: estimate.id.toString(),
        estimateFileId: estimate.estimate_file_id.toString(),
        fileName: estimate.estimate_files.file_name,
        sheetName: estimate.sheet_name,
        estimateTypeCode: 'RELT',
        vesselId: estimate.estimate_vessels?.vessel_id?.toString(),
        bunkerProfileId:
          estimate.estimate_vessels?.bunker_profile_id?.toString(),
        performanceMode: estimate.estimate_vessels?.mode,
        routingSuez: estimate.routing_suez,
        routingPanama: estimate.routing_panama,
        routingKiel: estimate.routing_kiel,
        marginSeaDays: toNumber(estimate.margin_sea_days),
        marginPortIdleDays: toNumber(estimate.margin_port_idle_days),
        timeDisplayUnit: estimate.time_display_unit,
        timezoneDisplayMode: estimate.timezone_display_mode,
      },
      cargoLines: estimate.estimate_cargo_lines.map((line) => ({
        lineNo: line.line_no,
        accountCompanyId: line.account_company_id?.toString(),
        cargoId: line.cargo_id?.toString(),
        cargoName: line.cargo_name ?? undefined,
        loadingPortId: line.loading_port_id?.toString(),
        dischargingPortId: line.discharging_port_id?.toString(),
        quantityMt: toNumber(line.quantity_mt),
        quantityUnit: line.quantity_unit,
        head: mapFreightTerm(line.estimate_cargo_freight_terms, cp_side.HEAD),
        sub: mapFreightTerm(line.estimate_cargo_freight_terms, cp_side.SUB),
      })),
      portLegs: estimate.estimate_port_legs.map((leg) => ({
        legNo: leg.leg_no,
        legType: leg.leg_type,
        portId: leg.port_id?.toString(),
        distanceNm: toNumber(leg.distance_nm),
        ecaNm: toNumber(leg.eca_nm),
        wfPct: toNumber(leg.wf_pct),
        speedKn: toNumber(leg.speed_kn),
        seaDays: toNumber(leg.sea_days),
        portIdleDays: toNumber(leg.port_idle_days),
        portWorkingDays: undefined,
        portCharge: toNumber(leg.port_charge),
        arrivalAt: leg.arrival_at?.toISOString(),
        departureAt: leg.departure_at?.toISOString(),
        head: mapPortCpTerm(leg.estimate_port_leg_cp_terms, cp_side.HEAD),
        sub: mapPortCpTerm(leg.estimate_port_leg_cp_terms, cp_side.SUB),
      })),
      result: result
        ? {
            totalDurationDays: toNumber(result.total_duration_days),
            revenue: toNumber(result.revenue),
            opExpense: toNumber(result.op_expense),
            opProfit: toNumber(result.op_profit),
            totalFreight: toNumber(result.total_freight),
            profitUsd: toNumber(result.profit_usd),
            tceUsdDay: toNumber(result.tce_usd_day),
            dailyRevenue: toNumber(result.daily_revenue),
            dailyExpense: toNumber(result.daily_expense),
            dailyProfit: toNumber(result.daily_profit),
          }
        : undefined,
    };
  }
}

function validateSnapshot(snapshot: SaveCargoReletEstimateDto) {
  const details: Array<{ path: string; message: string }> = [];
  if (snapshot.cargoLines.length === 0) {
    details.push({ path: 'cargoLines', message: 'Cargo rows are required.' });
  }
  if (snapshot.portLegs.length === 0) {
    details.push({ path: 'portLegs', message: 'Port Rotation is required.' });
  }
  for (const line of snapshot.cargoLines) {
    if (!num(line.quantityMt)) {
      details.push({
        path: `cargoLines.${line.lineNo}.quantityMt`,
        message: 'Quantity is required.',
      });
    }
  }
  if (details.length) {
    throw new BadRequestException({
      code: AppErrorCode.INVALID_VOYAGE_SNAPSHOT,
      message: 'Cargo Relet estimate input is invalid.',
      details,
    });
  }
}

function estimateData(
  snapshot: SaveCargoReletEstimateDto,
  estimateFileId: bigint,
) {
  return {
    estimate_file_id: estimateFileId,
    estimate_type: estimate_type.CARGO_RELET,
    sheet_name: snapshot.header.sheetName,
    sheet_order: 1,
    status: estimate_status.DRAFT,
    routing_suez: snapshot.header.routingSuez ?? false,
    routing_panama: snapshot.header.routingPanama ?? false,
    routing_kiel: snapshot.header.routingKiel ?? false,
    margin_sea_days: snapshot.header.marginSeaDays ?? 0,
    margin_port_idle_days: snapshot.header.marginPortIdleDays ?? 0,
    time_display_unit: snapshot.header.timeDisplayUnit ?? 'DAYS',
    timezone_display_mode: snapshot.header.timezoneDisplayMode ?? 'PORT_LOCAL',
    updated_at: new Date(),
  };
}

async function replaceChildren(
  tx: Prisma.TransactionClient,
  estimateId: bigint,
  snapshot: SaveCargoReletEstimateDto,
) {
  await tx.estimate_cargo_lines.deleteMany({
    where: { estimate_id: estimateId },
  });
  await tx.estimate_port_legs.deleteMany({
    where: { estimate_id: estimateId },
  });

  for (const line of snapshot.cargoLines) {
    const cargoLine = await tx.estimate_cargo_lines.create({
      data: {
        estimate_id: estimateId,
        line_no: line.lineNo,
        account_company_id: optionalBigInt(line.accountCompanyId),
        cargo_id: optionalBigInt(line.cargoId),
        cargo_name: line.cargoName,
        loading_port_id: optionalBigInt(line.loadingPortId),
        discharging_port_id: optionalBigInt(line.dischargingPortId),
        quantity_mt: line.quantityMt,
        quantity_unit: line.quantityUnit ?? 'MT',
      },
    });

    await createFreightTerm(tx, cargoLine.id, cp_side.HEAD, line.head);
    await createFreightTerm(tx, cargoLine.id, cp_side.SUB, line.sub);
  }

  for (const leg of snapshot.portLegs) {
    const portLeg = await tx.estimate_port_legs.create({
      data: {
        estimate_id: estimateId,
        leg_no: leg.legNo,
        leg_type: leg.legType as leg_type,
        port_id: optionalBigInt(leg.portId),
        distance_nm: leg.distanceNm,
        eca_nm: leg.ecaNm,
        wf_pct: leg.wfPct,
        speed_kn: leg.speedKn,
        sea_days: leg.seaDays,
        port_idle_days: leg.portIdleDays,
        port_charge: leg.portCharge,
        arrival_at: leg.arrivalAt ? new Date(leg.arrivalAt) : undefined,
        departure_at: leg.departureAt ? new Date(leg.departureAt) : undefined,
      },
    });

    await createPortCpTerm(tx, portLeg.id, cp_side.HEAD, leg.head);
    await createPortCpTerm(tx, portLeg.id, cp_side.SUB, leg.sub);
  }
}

async function createFreightTerm(
  tx: Prisma.TransactionClient,
  cargoLineId: bigint,
  side: cp_side,
  term: CargoReletFreightTermDto,
) {
  await tx.estimate_cargo_freight_terms.create({
    data: {
      cargo_line_id: cargoLineId,
      cp_side: side,
      freight_rate: term.freightRate,
      freight_type: term.freightType ?? 'F',
      freight_lumpsum: term.freightLumpsum,
      add_comm_pct: term.addCommPct,
      brokerage_pct: term.brokeragePct,
      net_freight: term.netFreight,
      total_freight: grossFreight(term),
      liner_cost_amount: term.linerCostAmount,
      is_freight_fixed: (term.freightType ?? 'F') === 'L',
    },
  });
}

async function createPortCpTerm(
  tx: Prisma.TransactionClient,
  legId: bigint,
  side: cp_side,
  term: CargoReletPortCpTermDto,
) {
  await tx.estimate_port_leg_cp_terms.create({
    data: {
      leg_id: legId,
      cp_side: side,
      ld_rate: term.ldRate,
      demurrage: term.demurrage,
      despatch: term.despatch,
    },
  });
}

async function upsertEstimateVessel(
  tx: Prisma.TransactionClient,
  estimateId: bigint,
  snapshot: SaveCargoReletEstimateDto,
) {
  const vessel = snapshot.header.vesselId
    ? await tx.vessels.findUnique({
        where: { id: BigInt(snapshot.header.vesselId) },
      })
    : undefined;

  await tx.estimate_vessels.upsert({
    where: { estimate_id: estimateId },
    create: {
      estimate_id: estimateId,
      vessel_id: optionalBigInt(snapshot.header.vesselId),
      bunker_profile_id: optionalBigInt(snapshot.header.bunkerProfileId),
      mode: snapshot.header.performanceMode ?? 'FULL',
      mv_name: vessel?.mv_name ?? 'Default Vessel',
      dwt: vessel?.dwt,
      draft_m: vessel?.draft_m,
      tpc: vessel?.tpc,
      built_year: vessel?.built_year,
      vessel_kind_id: vessel?.vessel_kind_id,
      vessel_type_id: vessel?.vessel_type_id,
      speed_ballast_kn: 14,
      speed_laden_kn: 14,
    },
    update: {
      vessel_id: optionalBigInt(snapshot.header.vesselId),
      bunker_profile_id: optionalBigInt(snapshot.header.bunkerProfileId),
      mode: snapshot.header.performanceMode ?? 'FULL',
      mv_name: vessel?.mv_name ?? 'Default Vessel',
      dwt: vessel?.dwt,
      draft_m: vessel?.draft_m,
      tpc: vessel?.tpc,
      built_year: vessel?.built_year,
      vessel_kind_id: vessel?.vessel_kind_id,
      vessel_type_id: vessel?.vessel_type_id,
    },
  });
}

function calculateResult(snapshot: SaveCargoReletEstimateDto) {
  const headNet = sum(
    snapshot.cargoLines.map((line) => num(line.head.netFreight)),
  );
  const subNet = sum(
    snapshot.cargoLines.map((line) => num(line.sub.netFreight)),
  );
  const totalDuration = sum(
    snapshot.portLegs.map((leg) => num(leg.seaDays) + num(leg.portIdleDays)),
  );
  const portCharge = sum(snapshot.portLegs.map((leg) => num(leg.portCharge)));
  const profit = round2(subNet - headNet - portCharge);

  return {
    total_duration_days: round2(totalDuration),
    revenue: round2(subNet),
    op_expense: round2(portCharge),
    op_profit: round2(subNet - portCharge),
    total_freight: round2(headNet),
    profit_usd: profit,
    tce_usd_day: totalDuration ? round2(profit / totalDuration) : 0,
    daily_revenue: totalDuration ? round2(subNet / totalDuration) : 0,
    daily_expense: totalDuration ? round2(portCharge / totalDuration) : 0,
    daily_profit: totalDuration ? round2(profit / totalDuration) : 0,
  };
}

function grossFreight(term: CargoReletFreightTermDto) {
  return (term.freightType ?? 'F') === 'L' ? term.freightLumpsum : undefined;
}

function mapFreightTerm(
  terms: Array<{
    cp_side: cp_side;
    freight_rate: unknown;
    freight_type: string;
    freight_lumpsum: unknown;
    add_comm_pct: unknown;
    brokerage_pct: unknown;
    net_freight: unknown;
    liner_cost_amount: unknown;
  }>,
  side: cp_side,
) {
  const term = terms.find((item) => item.cp_side === side);
  return {
    freightRate: toNumber(term?.freight_rate),
    freightType: term?.freight_type,
    freightLumpsum: toNumber(term?.freight_lumpsum),
    addCommPct: toNumber(term?.add_comm_pct),
    brokeragePct: toNumber(term?.brokerage_pct),
    netFreight: toNumber(term?.net_freight),
    linerCostAmount: toNumber(term?.liner_cost_amount),
  };
}

function mapPortCpTerm(
  terms: Array<{
    cp_side: cp_side;
    ld_rate: unknown;
    demurrage: unknown;
    despatch: unknown;
  }>,
  side: cp_side,
) {
  const term = terms.find((item) => item.cp_side === side);
  return {
    ldRate: toNumber(term?.ld_rate),
    demurrage: toNumber(term?.demurrage),
    despatch: toNumber(term?.despatch),
  };
}

function optionalBigInt(value: string | undefined): bigint | undefined {
  return value ? BigInt(value) : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  ) {
    return value.toNumber();
  }
  return undefined;
}

function num(value: number | undefined): number {
  return value ?? 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
