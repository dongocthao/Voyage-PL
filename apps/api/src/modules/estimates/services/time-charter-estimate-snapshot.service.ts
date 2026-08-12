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
  SaveTimeCharterEstimateDto,
  TimeCharterPortLegDto,
  TimeCharterTermDto,
} from '../dto/time-charter-snapshot.dto';

@Injectable()
export class TimeCharterEstimateSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async save(snapshot: SaveTimeCharterEstimateDto) {
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
      updatedAt: saved.updated_at.toISOString(),
      updatedByName: 'Admin',
      result: {
        totalDurationDays: result.total_duration_days,
        revenue: result.revenue,
        opExpense: result.op_expense,
        opProfit: result.op_profit,
        totalHire: result.total_hire,
        profitUsd: result.profit_usd,
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
        users_estimates_updated_byTousers: true,
        estimate_vessels: true,
        estimate_charter_terms: {
          include: {
            estimate_charter_duration_periods: {
              orderBy: { period_no: 'asc' },
            },
          },
          orderBy: { cp_side: 'asc' },
        },
        estimate_port_legs: { orderBy: { leg_no: 'asc' } },
        estimate_results: true,
      },
    });

    if (!estimate || estimate.estimate_type !== estimate_type.TIME_CHARTER) {
      throw new NotFoundException({
        code: AppErrorCode.ESTIMATE_NOT_FOUND,
        message: 'Time Charter estimate was not found.',
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
        estimateTypeCode: 'TCOV',
        vesselId: estimate.estimate_vessels?.vessel_id?.toString(),
        bunkerProfileId:
          estimate.estimate_vessels?.bunker_profile_id?.toString(),
        performanceMode: estimate.estimate_vessels?.mode,
        updatedAt: estimate.updated_at.toISOString(),
        updatedByName:
          estimate.users_estimates_updated_byTousers?.full_name ??
          estimate.users_estimates_updated_byTousers?.username ??
          'Admin',
        routingSuez: estimate.routing_suez,
        routingPanama: estimate.routing_panama,
        routingKiel: estimate.routing_kiel,
        marginSeaDays: toNumber(estimate.margin_sea_days),
        marginPortIdleDays: toNumber(estimate.margin_port_idle_days),
        timeDisplayUnit: estimate.time_display_unit,
        timezoneDisplayMode: estimate.timezone_display_mode,
      },
      charterTerms: estimate.estimate_charter_terms.map((term) => ({
        cpSide: term.cp_side,
        accountCompanyId: term.account_company_id?.toString(),
        deliveryPortId: term.delivery_port_id?.toString(),
        redeliveryPortId: term.redelivery_port_id?.toString(),
        durationDays: toNumber(term.duration_days),
        dailyHire: toNumber(term.daily_hire),
        grossHire: toNumber(term.gross_hire),
        addCommPct: toNumber(term.add_comm_pct),
        brokeragePct: toNumber(term.brokerage_pct),
        useMultiDuration: term.use_multi_duration,
        durationPeriods: term.estimate_charter_duration_periods.map(
          (period) => ({
            periodNo: period.period_no,
            durationDays: toNumber(period.duration_days),
            dailyHire: toNumber(period.daily_hire),
          }),
        ),
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
        arrivalAt: leg.arrival_at?.toISOString(),
        departureAt: leg.departure_at?.toISOString(),
      })),
      result: result
        ? {
            totalDurationDays: toNumber(result.total_duration_days),
            revenue: toNumber(result.revenue),
            opExpense: toNumber(result.op_expense),
            opProfit: toNumber(result.op_profit),
            totalHire: toNumber(result.total_hire),
            profitUsd: toNumber(result.profit_usd),
            dailyRevenue: toNumber(result.daily_revenue),
            dailyExpense: toNumber(result.daily_expense),
            dailyProfit: toNumber(result.daily_profit),
          }
        : undefined,
    };
  }
}

function validateSnapshot(snapshot: SaveTimeCharterEstimateDto) {
  const details: Array<{ path: string; message: string }> = [];
  const sides = new Set<string>();

  for (const term of snapshot.charterTerms) {
    if (sides.has(term.cpSide)) {
      details.push({
        path: `charterTerms.${term.cpSide}`,
        message: 'Duplicate CP side.',
      });
    }
    sides.add(term.cpSide);

    if (!num(term.durationDays)) {
      details.push({
        path: `charterTerms.${term.cpSide}.durationDays`,
        message: 'Duration is required.',
      });
    }
    if (!num(term.dailyHire)) {
      details.push({
        path: `charterTerms.${term.cpSide}.dailyHire`,
        message: 'Daily hire is required.',
      });
    }
    if (term.useMultiDuration && term.durationPeriods.length === 0) {
      details.push({
        path: `charterTerms.${term.cpSide}.durationPeriods`,
        message: 'At least one duration period is required.',
      });
    }
  }

  if (!sides.has('HEAD')) {
    details.push({
      path: 'charterTerms.HEAD',
      message: 'Head CP is required.',
    });
  }
  if (!sides.has('SUB')) {
    details.push({ path: 'charterTerms.SUB', message: 'Sub CP is required.' });
  }
  if (snapshot.portLegs.length === 0) {
    details.push({ path: 'portLegs', message: 'Port Rotation is required.' });
  }

  if (details.length) {
    throw new BadRequestException({
      code: AppErrorCode.INVALID_VOYAGE_SNAPSHOT,
      message: 'Time Charter estimate input is invalid.',
      details,
    });
  }
}

function estimateData(
  snapshot: SaveTimeCharterEstimateDto,
  estimateFileId: bigint,
) {
  return {
    estimate_file_id: estimateFileId,
    estimate_type: estimate_type.TIME_CHARTER,
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
  snapshot: SaveTimeCharterEstimateDto,
) {
  await tx.estimate_charter_terms.deleteMany({
    where: { estimate_id: estimateId },
  });
  await tx.estimate_port_legs.deleteMany({
    where: { estimate_id: estimateId },
  });

  for (const term of snapshot.charterTerms) {
    const charterTerm = await tx.estimate_charter_terms.create({
      data: {
        estimate_id: estimateId,
        cp_side: term.cpSide as cp_side,
        account_company_id: optionalBigInt(term.accountCompanyId),
        delivery_port_id: optionalBigInt(term.deliveryPortId),
        redelivery_port_id: optionalBigInt(term.redeliveryPortId),
        duration_days: term.durationDays,
        daily_hire: term.dailyHire,
        gross_hire:
          term.grossHire ??
          round2(num(term.durationDays) * num(term.dailyHire)),
        add_comm_pct: term.addCommPct,
        brokerage_pct: term.brokeragePct,
        use_multi_duration: term.useMultiDuration,
      },
    });

    for (const period of term.durationPeriods) {
      await tx.estimate_charter_duration_periods.create({
        data: {
          charter_term_id: charterTerm.id,
          period_no: period.periodNo,
          duration_days: period.durationDays ?? 0,
          daily_hire: period.dailyHire ?? 0,
        },
      });
    }
  }

  for (const leg of snapshot.portLegs) {
    await tx.estimate_port_legs.create({
      data: {
        estimate_id: estimateId,
        leg_no: leg.legNo,
        leg_type: toLegType(leg),
        port_id: optionalBigInt(leg.portId),
        distance_nm: leg.distanceNm,
        eca_nm: leg.ecaNm,
        wf_pct: leg.wfPct,
        speed_kn: leg.speedKn,
        sea_days: leg.seaDays,
        port_idle_days: leg.portIdleDays,
        arrival_at: leg.arrivalAt ? new Date(leg.arrivalAt) : undefined,
        departure_at: leg.departureAt ? new Date(leg.departureAt) : undefined,
      },
    });
  }
}

async function upsertEstimateVessel(
  tx: Prisma.TransactionClient,
  estimateId: bigint,
  snapshot: SaveTimeCharterEstimateDto,
) {
  const vessel = snapshot.header.vesselId
    ? await tx.vessels.findUnique({
        where: { id: BigInt(snapshot.header.vesselId) },
      })
    : undefined;
  const performanceMode = snapshot.header.performanceMode ?? 'FULL';

  await tx.estimate_vessels.upsert({
    where: { estimate_id: estimateId },
    create: {
      estimate_id: estimateId,
      vessel_id: optionalBigInt(snapshot.header.vesselId),
      bunker_profile_id: optionalBigInt(snapshot.header.bunkerProfileId),
      mode: performanceMode,
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
      mode: performanceMode,
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

function calculateResult(snapshot: SaveTimeCharterEstimateDto) {
  const head = snapshot.charterTerms.find((term) => term.cpSide === 'HEAD');
  const sub = snapshot.charterTerms.find((term) => term.cpSide === 'SUB');
  const headNet = netHire(head);
  const subNet = netHire(sub);
  const duration = Math.max(num(head?.durationDays), num(sub?.durationDays));
  const profit = round2(subNet - headNet);

  return {
    total_duration_days: duration,
    revenue: subNet,
    op_expense: 0,
    op_profit: subNet,
    total_hire: headNet,
    profit_usd: profit,
    daily_revenue: duration ? round2(subNet / duration) : 0,
    daily_expense: 0,
    daily_profit: duration ? round2(profit / duration) : 0,
  };
}

function netHire(term: TimeCharterTermDto | undefined) {
  if (!term) return 0;
  const gross = term.useMultiDuration
    ? term.durationPeriods.reduce(
        (total, period) =>
          total + num(period.durationDays) * num(period.dailyHire),
        0,
      )
    : num(term.grossHire) || num(term.durationDays) * num(term.dailyHire);
  return round2(
    gross * (1 - (num(term.addCommPct) + num(term.brokeragePct)) / 100),
  );
}

function optionalBigInt(value: string | undefined): bigint | undefined {
  return value ? BigInt(value) : undefined;
}

function toNumber(
  value: { toNumber(): number } | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === 'number' ? value : value.toNumber();
}

function toLegType(leg: TimeCharterPortLegDto): leg_type {
  return leg.legType as leg_type;
}

function num(value: number | undefined): number {
  return value ?? 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
