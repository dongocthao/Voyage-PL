import { Injectable, NotFoundException } from '@nestjs/common';
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
import {
  deriveSeaDays,
  VoyageCalculationEngine,
} from '../calculation/voyage-calculation.engine';
import type {
  SaveVoyageEstimateDto,
  VoyageBunkerRateDto,
  VoyagePortLegDto,
} from '../dto/voyage-estimate-snapshot.dto';
import { VoyageEstimateInputValidator } from '../validators/voyage-estimate-input.validator';

@Injectable()
export class VoyageEstimateSnapshotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: VoyageCalculationEngine,
    private readonly validator: VoyageEstimateInputValidator,
  ) {}

  async save(snapshot: SaveVoyageEstimateDto) {
    const calculationSnapshot = await this.withDefaultBunkerProfile(snapshot);
    this.validator.validate(calculationSnapshot);
    const result = this.engine.calculate(calculationSnapshot);

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
            data: this.estimateData(snapshot, estimateFileId),
          })
        : await tx.estimates.create({
            data: this.estimateData(snapshot, estimateFileId),
          });

      await this.replaceChildren(tx, estimate.id, snapshot);
      await this.upsertEstimateVessel(tx, estimate.id, snapshot);

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
          total_duration_days: result.totalDurationDays,
          total_distance_nm: result.totalDistanceNm,
          revenue: result.revenue,
          op_expense: result.opExpense,
          op_profit: result.opProfit,
          total_hire: result.totalHire,
          total_freight: result.totalFreight,
          profit_usd: result.profitUsd,
          profit_rate_pct: result.profitRatePct,
          tce_usd_day: result.tceUsdDay,
          daily_revenue: result.dailyRevenue,
          daily_expense: result.dailyExpense,
          daily_profit: result.dailyProfit,
        },
        update: {
          total_duration_days: result.totalDurationDays,
          total_distance_nm: result.totalDistanceNm,
          revenue: result.revenue,
          op_expense: result.opExpense,
          op_profit: result.opProfit,
          total_hire: result.totalHire,
          total_freight: result.totalFreight,
          profit_usd: result.profitUsd,
          profit_rate_pct: result.profitRatePct,
          tce_usd_day: result.tceUsdDay,
          daily_revenue: result.dailyRevenue,
          daily_expense: result.dailyExpense,
          daily_profit: result.dailyProfit,
          calculated_at: new Date(),
        },
      });

      await tx.estimate_voyage_durations.upsert({
        where: { estimate_id: estimate.id },
        create: {
          estimate_id: estimate.id,
          voyage_total_days: result.totalDurationDays,
          laden_days: result.ladenDays,
          ballast_days: result.ballastDays,
          eca_days: result.ecaDays,
          load_days: result.loadDays,
          discharge_days: result.dischargeDays,
          idle_days: result.idleDays,
          margin_days: result.marginDays,
        },
        update: {
          voyage_total_days: result.totalDurationDays,
          laden_days: result.ladenDays,
          ballast_days: result.ballastDays,
          eca_days: result.ecaDays,
          load_days: result.loadDays,
          discharge_days: result.dischargeDays,
          idle_days: result.idleDays,
          margin_days: result.marginDays,
          calculated_at: new Date(),
        },
      });

      await tx.estimate_bunker_summary.deleteMany({
        where: { estimate_id: estimate.id },
      });
      for (const bunker of result.bunkerSummaries) {
        await tx.estimate_bunker_summary.create({
          data: {
            estimate_id: estimate.id,
            fuel_type_id: bunker.fuelTypeId,
            price_per_mt: bunker.pricePerMt,
            consumption_mt: bunker.consumptionMt,
            expense: bunker.expense,
          },
        });
      }

      return estimate;
    });

    return {
      estimateId: saved.id.toString(),
      estimateFileId: saved.estimate_file_id.toString(),
      updatedAt: saved.updated_at.toISOString(),
      updatedByName: 'Admin',
      result,
    };
  }

  async load(estimateId: string) {
    const estimate = await this.prisma.estimates.findUnique({
      where: { id: BigInt(estimateId) },
      include: {
        estimate_files: true,
        users_estimates_updated_byTousers: true,
        estimate_vessels: true,
        estimate_cargo_lines: {
          include: {
            estimate_cargo_freight_terms: true,
            companies: true,
            cargoes: true,
            ports_estimate_cargo_lines_loading_port_idToports: true,
            ports_estimate_cargo_lines_discharging_port_idToports: true,
          },
          orderBy: { line_no: 'asc' },
        },
        estimate_port_legs: {
          include: { estimate_port_leg_cp_terms: true, ports: true },
          orderBy: { leg_no: 'asc' },
        },
        estimate_expense_items: {
          include: { expense_categories: true },
          orderBy: { id: 'asc' },
        },
        estimate_misc_operation_expense_items: {
          orderBy: { sort_order: 'asc' },
        },
        estimate_misc_voyage_revenue_items: { orderBy: { sort_order: 'asc' } },
        estimate_bunker_summary: { include: { fuel_types: true } },
        estimate_results: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException({
        code: AppErrorCode.ESTIMATE_NOT_FOUND,
        message: 'Estimate was not found.',
        details: [{ path: 'estimateId', message: estimateId }],
      });
    }

    return {
      header: {
        estimateId: estimate.id.toString(),
        estimateFileId: estimate.estimate_file_id.toString(),
        fileName: estimate.estimate_files.file_name,
        sheetName: estimate.sheet_name,
        estimateTypeCode: 'TCOV',
        sheetOrder: estimate.sheet_order,
        status: estimate.status,
        voyageNo: estimate.voyage_no,
        remark: estimate.remark,
        vesselId: estimate.estimate_vessels?.vessel_id?.toString(),
        vesselName: estimate.estimate_vessels?.mv_name,
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
        hireDay: toNumber(estimate.hire_day),
        hireAddCommPct: toNumber(estimate.hire_add_comm_pct),
        timeDisplayUnit: estimate.time_display_unit,
        timezoneDisplayMode: estimate.timezone_display_mode,
      },
      cargoLines: estimate.estimate_cargo_lines.map((line) => {
        const freight = line.estimate_cargo_freight_terms[0];
        return {
          lineNo: line.line_no,
          accountCompanyId: line.account_company_id?.toString(),
          accountCompanyName: line.companies?.company_name,
          cargoId: line.cargo_id?.toString(),
          cargoName: line.cargo_name ?? line.cargoes?.cargo_name,
          loadingPortId: line.loading_port_id?.toString(),
          loadingPortName:
            line.ports_estimate_cargo_lines_loading_port_idToports?.port_name,
          dischargingPortId: line.discharging_port_id?.toString(),
          dischargingPortName:
            line.ports_estimate_cargo_lines_discharging_port_idToports
              ?.port_name,
          quantity: toNumber(line.quantity_mt),
          unit: line.quantity_unit,
          freight: freight
            ? {
                freightRate: toNumber(freight.freight_rate),
                freightTermId: freight.freight_term_id,
                addCommPct: toNumber(freight.add_comm_pct),
                brokeragePct: toNumber(freight.brokerage_pct),
                freightTaxPct: toNumber(freight.freight_tax_pct),
                freightType: freight.freight_type,
                freightLumpsum: toNumber(freight.freight_lumpsum),
                linerCostAmount: toNumber(freight.liner_cost_amount),
                isFreightFixed: freight.is_freight_fixed,
              }
            : undefined,
        };
      }),
      portLegs: estimate.estimate_port_legs.map((leg) => {
        const cpTerm = leg.estimate_port_leg_cp_terms[0];
        return {
          legNo: leg.leg_no,
          legType: leg.leg_type,
          portId: leg.port_id?.toString(),
          portName: leg.ports?.port_name,
          distanceNm: toNumber(leg.distance_nm),
          ecaNm: toNumber(leg.eca_nm),
          wfPct: toNumber(leg.wf_pct),
          speedKn: toNumber(leg.speed_kn),
          seaDays: toNumber(leg.sea_days),
          portIdleDays: toNumber(leg.port_idle_days),
          portCharge: toNumber(leg.port_charge),
          arrivalAt: leg.arrival_at?.toISOString(),
          departureAt: leg.departure_at?.toISOString(),
          cpTerm: cpTerm
            ? {
                ldRate: toNumber(cpTerm.ld_rate),
                laytimeTermId: cpTerm.laytime_term_id,
                demurrage: toNumber(cpTerm.demurrage),
                despatch: toNumber(cpTerm.despatch),
              }
            : undefined,
        };
      }),
      operationExpenseItems: estimate.estimate_expense_items.map((item) => ({
        categoryId: item.category_id,
        categoryCode: item.expense_categories.code,
        cpSide: item.cp_side,
        amount: toNumber(item.amount) ?? 0,
        remark: item.remark,
      })),
      miscOperationExpenseItems:
        estimate.estimate_misc_operation_expense_items.map((item) => ({
          itemId: item.sort_order,
          itemDescription: item.item_description,
          itemType: item.item_type,
          itemAmount: toNumber(item.item_amount) ?? 0,
          cpSide: item.cp_side,
        })),
      miscVoyageRevenueItems: estimate.estimate_misc_voyage_revenue_items.map(
        (item) => ({
          itemId: item.sort_order,
          itemDescription: item.item_description,
          itemType: item.item_type,
          itemAmount: toNumber(item.item_amount) ?? 0,
          cpSide: item.cp_side,
        }),
      ),
      result: estimate.estimate_results[0]
        ? {
            ...mapResult(estimate.estimate_results[0]),
            bunkerSummaries: estimate.estimate_bunker_summary.map((item) => ({
              fuelTypeId: item.fuel_type_id,
              fuelCode: item.fuel_types.code,
              pricePerMt: toNumber(item.price_per_mt),
              consumptionMt: toNumber(item.consumption_mt) ?? 0,
              expense: toNumber(item.expense) ?? 0,
            })),
          }
        : undefined,
    };
  }

  async reportSummary(estimateId: string) {
    const snapshot = await this.load(estimateId);
    if (!snapshot.result) {
      throw new NotFoundException({
        code: AppErrorCode.ESTIMATE_NOT_FOUND,
        message: 'Estimate result was not found.',
        details: [{ path: 'estimateId', message: estimateId }],
      });
    }

    const result = snapshot.result;
    const hireDay = snapshot.header.hireDay ?? 0;
    const hireAddCommPct = snapshot.header.hireAddCommPct ?? 0;
    const totalDurationDays = result.totalDurationDays ?? 0;
    const profitUsd = result.profitUsd ?? 0;
    const netHire = round2(hireDay * (1 - hireAddCommPct / 100));
    const totalHire = round2(netHire * totalDurationDays);
    const cBase =
      totalDurationDays === 0
        ? 0
        : round2(
            (result.opExpense ?? 0) / totalDurationDays +
              netHire -
              profitUsd / totalDurationDays,
          );

    return {
      estimateId,
      voyageNo: snapshot.header.voyageNo,
      status: snapshot.header.status,
      totalDurationDays,
      totalDistanceNm: result.totalDistanceNm,
      revenue: result.revenue,
      opExpense: result.opExpense,
      opProfit: result.opProfit,
      totalFreight: result.totalFreight,
      hireDay,
      hireAddCommPct,
      netHire,
      totalHire,
      cBase,
      profitUsd,
      tceUsdDay: result.tceUsdDay,
      bunkerSummaries: result.bunkerSummaries ?? [],
      generatedAt: new Date().toISOString(),
    };
  }

  private async withDefaultBunkerProfile(
    snapshot: SaveVoyageEstimateDto,
  ): Promise<SaveVoyageEstimateDto> {
    if (snapshot.bunkerProfile?.length) {
      return snapshot;
    }

    const profileBunkerRates = await this.bunkerProfileRates(
      snapshot.header.bunkerProfileId,
      snapshot.header.performanceMode,
    );
    if (profileBunkerRates.length) {
      return { ...snapshot, bunkerProfile: profileBunkerRates };
    }

    const fuelTypes = await this.prisma.fuel_types.findMany({
      where: { code: { in: ['VLSFO', 'ULSFO', 'MGO', 'LSMGO'] } },
      select: { id: true, code: true },
    });
    const fuelTypeByCode = new Map(
      fuelTypes.map((fuelType) => [fuelType.code, fuelType.id]),
    );
    const normalMainFuel = fuelTypeByCode.get('VLSFO');
    const normalMainFuelCode = 'VLSFO';
    const ecaMainFuel =
      fuelTypeByCode.get('ULSFO') ??
      fuelTypeByCode.get('LSMGO') ??
      fuelTypeByCode.get('MGO') ??
      normalMainFuel;
    const ecaMainFuelCode = fuelTypeByCode.get('ULSFO')
      ? 'ULSFO'
      : fuelTypeByCode.get('LSMGO')
        ? 'LSMGO'
        : fuelTypeByCode.get('MGO')
          ? 'MGO'
          : normalMainFuelCode;
    const subFuel =
      fuelTypeByCode.get('MGO') ??
      fuelTypeByCode.get('LSMGO') ??
      normalMainFuel;
    const subFuelCode = fuelTypeByCode.get('MGO')
      ? 'MGO'
      : fuelTypeByCode.get('LSMGO')
        ? 'LSMGO'
        : normalMainFuelCode;

    const bunkerProfile: VoyageBunkerRateDto[] = [];
    if (normalMainFuel) {
      bunkerProfile.push(
        defaultBunkerRate(
          'MAIN',
          'NORMAL',
          'BALLAST',
          normalMainFuel,
          normalMainFuelCode,
          29,
          320,
        ),
        defaultBunkerRate(
          'MAIN',
          'NORMAL',
          'LADEN',
          normalMainFuel,
          normalMainFuelCode,
          33,
          320,
        ),
        defaultBunkerRate(
          'MAIN',
          'NORMAL',
          'IDLE',
          normalMainFuel,
          normalMainFuelCode,
          2.5,
          320,
        ),
        defaultBunkerRate(
          'MAIN',
          'NORMAL',
          'WORK',
          normalMainFuel,
          normalMainFuelCode,
          5,
          320,
        ),
      );
    }
    if (ecaMainFuel) {
      bunkerProfile.push(
        defaultBunkerRate(
          'MAIN',
          'ECA',
          'BALLAST',
          ecaMainFuel,
          ecaMainFuelCode,
          29,
          350,
        ),
        defaultBunkerRate(
          'MAIN',
          'ECA',
          'LADEN',
          ecaMainFuel,
          ecaMainFuelCode,
          33,
          350,
        ),
        defaultBunkerRate(
          'MAIN',
          'ECA',
          'IDLE',
          ecaMainFuel,
          ecaMainFuelCode,
          2.5,
          350,
        ),
        defaultBunkerRate(
          'MAIN',
          'ECA',
          'WORK',
          ecaMainFuel,
          ecaMainFuelCode,
          5,
          350,
        ),
      );
    }
    if (subFuel) {
      bunkerProfile.push(
        defaultBunkerRate(
          'SUB',
          'NORMAL',
          'SEA',
          subFuel,
          subFuelCode,
          0.1,
          360,
        ),
        defaultBunkerRate(
          'SUB',
          'NORMAL',
          'IDLE',
          subFuel,
          subFuelCode,
          0,
          360,
        ),
        defaultBunkerRate(
          'SUB',
          'NORMAL',
          'WORK',
          subFuel,
          subFuelCode,
          0,
          360,
        ),
        defaultBunkerRate('SUB', 'ECA', 'SEA', subFuel, subFuelCode, 0.1, 360),
        defaultBunkerRate('SUB', 'ECA', 'IDLE', subFuel, subFuelCode, 0, 360),
        defaultBunkerRate('SUB', 'ECA', 'WORK', subFuel, subFuelCode, 0, 360),
      );
    }

    return { ...snapshot, bunkerProfile };
  }

  private async bunkerProfileRates(
    bunkerProfileId: string | undefined,
    performanceMode: SaveVoyageEstimateDto['header']['performanceMode'] = 'FULL',
  ): Promise<VoyageBunkerRateDto[]> {
    if (!bunkerProfileId) {
      return [];
    }

    const modes = await this.prisma.vessel_performance_modes.findMany({
      where: { profile_id: BigInt(bunkerProfileId), mode: performanceMode },
      include: { vessel_bunker_consumption: { include: { fuel_types: true } } },
    });

    return modes.flatMap((mode) =>
      mode.vessel_bunker_consumption.map((item) => ({
        role: item.fuel_role,
        condition: item.condition,
        activity: item.activity,
        fuelTypeId: item.fuel_type_id,
        fuelCode: item.fuel_types.code,
        consumptionMtDay: item.consumption_mt_day.toNumber(),
        pricePerMt: defaultFuelPrice(item.fuel_types.code),
      })),
    );
  }

  private estimateData(
    snapshot: SaveVoyageEstimateDto,
    estimateFileId: bigint,
  ) {
    return {
      estimate_file_id: estimateFileId,
      estimate_type: estimate_type.VOYAGE,
      sheet_name: snapshot.header.sheetName,
      sheet_order: snapshot.header.sheetOrder ?? 1,
      status: snapshot.header.status ?? estimate_status.DRAFT,
      voyage_no: snapshot.header.voyageNo,
      remark: snapshot.header.remark,
      routing_suez: snapshot.header.routingSuez ?? false,
      routing_panama: snapshot.header.routingPanama ?? false,
      routing_kiel: snapshot.header.routingKiel ?? false,
      margin_sea_days: snapshot.header.marginSeaDays ?? 0,
      margin_port_idle_days: snapshot.header.marginPortIdleDays ?? 0,
      hire_day: snapshot.header.hireDay,
      hire_add_comm_pct: snapshot.header.hireAddCommPct,
      time_display_unit: snapshot.header.timeDisplayUnit ?? 'DAYS',
      timezone_display_mode:
        snapshot.header.timezoneDisplayMode ?? 'PORT_LOCAL',
      updated_at: new Date(),
    };
  }

  private async upsertEstimateVessel(
    tx: Prisma.TransactionClient,
    estimateId: bigint,
    snapshot: SaveVoyageEstimateDto,
  ) {
    const vessel = snapshot.header.vesselId
      ? await tx.vessels.findUnique({
          where: { id: BigInt(snapshot.header.vesselId) },
        })
      : undefined;
    const performanceMode = snapshot.header.performanceMode ?? 'FULL';
    const mode = snapshot.header.bunkerProfileId
      ? await tx.vessel_performance_modes.findFirst({
          where: {
            profile_id: BigInt(snapshot.header.bunkerProfileId),
            mode: performanceMode,
          },
        })
      : undefined;

    const data = {
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
      speed_ballast_kn: mode?.speed_ballast_kn ?? 14,
      speed_laden_kn: mode?.speed_laden_kn ?? 14,
    };

    await tx.estimate_vessels.upsert({
      where: { estimate_id: estimateId },
      create: { estimate_id: estimateId, ...data },
      update: data,
    });
  }

  private async replaceChildren(
    tx: Prisma.TransactionClient,
    estimateId: bigint,
    snapshot: SaveVoyageEstimateDto,
  ) {
    await tx.estimate_cargo_lines.deleteMany({
      where: { estimate_id: estimateId },
    });
    await tx.estimate_port_legs.deleteMany({
      where: { estimate_id: estimateId },
    });
    await tx.estimate_expense_items.deleteMany({
      where: { estimate_id: estimateId },
    });
    await tx.estimate_misc_operation_expense_items.deleteMany({
      where: { estimate_id: estimateId },
    });
    await tx.estimate_misc_voyage_revenue_items.deleteMany({
      where: { estimate_id: estimateId },
    });

    for (const cargo of snapshot.cargoLines) {
      const cargoLine = await tx.estimate_cargo_lines.create({
        data: {
          estimate_id: estimateId,
          line_no: cargo.lineNo,
          account_company_id: optionalBigInt(cargo.accountCompanyId),
          cargo_id: optionalBigInt(cargo.cargoId),
          cargo_name: cargo.cargoName,
          loading_port_id: optionalBigInt(cargo.loadingPortId),
          discharging_port_id: optionalBigInt(cargo.dischargingPortId),
          quantity_mt: cargo.quantity,
          quantity_unit: cargo.unit,
        },
      });

      await tx.estimate_cargo_freight_terms.create({
        data: {
          cargo_line_id: cargoLine.id,
          cp_side: cp_side.HEAD,
          freight_rate: cargo.freight.freightRate,
          freight_term_id: cargo.freight.freightTermId,
          add_comm_pct: cargo.freight.addCommPct,
          brokerage_pct: cargo.freight.brokeragePct,
          freight_tax_pct: cargo.freight.freightTaxPct,
          freight_type: cargo.freight.freightType,
          freight_lumpsum: cargo.freight.freightLumpsum,
          liner_cost_amount: cargo.freight.linerCostAmount,
          total_freight:
            cargo.freight.freightType === 'L'
              ? cargo.freight.freightLumpsum
              : (cargo.quantity ?? 0) * (cargo.freight.freightRate ?? 0),
          is_freight_fixed: cargo.freight.isFreightFixed ?? false,
        },
      });
    }

    for (const leg of snapshot.portLegs) {
      const portLeg = await tx.estimate_port_legs.create({
        data: {
          estimate_id: estimateId,
          leg_no: leg.legNo,
          leg_type: toLegType(leg),
          port_id: optionalBigInt(leg.portId),
          distance_nm: leg.distanceNm,
          eca_nm: leg.ecaNm,
          wf_pct: leg.wfPct,
          speed_kn: leg.speedKn,
          sea_days: deriveSeaDays(leg),
          port_idle_days: leg.portIdleDays,
          port_charge: leg.portCharge,
          arrival_at: leg.arrivalAt ? new Date(leg.arrivalAt) : undefined,
          departure_at: leg.departureAt ? new Date(leg.departureAt) : undefined,
        },
      });

      if (leg.cpTerm) {
        await tx.estimate_port_leg_cp_terms.create({
          data: {
            leg_id: portLeg.id,
            cp_side: cp_side.HEAD,
            ld_rate: leg.cpTerm.ldRate,
            laytime_term_id: leg.cpTerm.laytimeTermId,
            demurrage: leg.cpTerm.demurrage,
            despatch: leg.cpTerm.despatch,
          },
        });
      }
    }

    await this.replaceOperationExpenseItems(tx, estimateId, snapshot);
    await this.replaceMiscOperationExpenseItems(tx, estimateId, snapshot);
    await this.replaceMiscVoyageRevenueItems(tx, estimateId, snapshot);
  }

  private async replaceOperationExpenseItems(
    tx: Prisma.TransactionClient,
    estimateId: bigint,
    snapshot: SaveVoyageEstimateDto,
  ) {
    for (const item of snapshot.operationExpenseItems ?? []) {
      const categoryId =
        item.categoryId ??
        (item.categoryCode
          ? (
              await tx.expense_categories.findUnique({
                where: { code: item.categoryCode },
                select: { id: true },
              })
            )?.id
          : undefined);

      if (!categoryId) {
        continue;
      }

      await tx.estimate_expense_items.create({
        data: {
          estimate_id: estimateId,
          category_id: categoryId,
          cp_side: toCpSide(item.cpSide),
          amount: item.amount,
          remark: item.remark,
        },
      });
    }
  }

  private async replaceMiscOperationExpenseItems(
    tx: Prisma.TransactionClient,
    estimateId: bigint,
    snapshot: SaveVoyageEstimateDto,
  ) {
    for (const item of snapshot.miscOperationExpenseItems ?? []) {
      await tx.estimate_misc_operation_expense_items.create({
        data: {
          estimate_id: estimateId,
          item_description: item.itemDescription,
          item_type: item.itemType,
          item_amount: item.itemAmount,
          cp_side: toCpSide(item.cpSide),
          sort_order: item.itemId,
        },
      });
    }
  }

  private async replaceMiscVoyageRevenueItems(
    tx: Prisma.TransactionClient,
    estimateId: bigint,
    snapshot: SaveVoyageEstimateDto,
  ) {
    for (const item of snapshot.miscVoyageRevenueItems ?? []) {
      await tx.estimate_misc_voyage_revenue_items.create({
        data: {
          estimate_id: estimateId,
          item_description: item.itemDescription,
          item_type: item.itemType,
          item_amount: item.itemAmount,
          cp_side: toCpSide(item.cpSide),
          sort_order: item.itemId,
        },
      });
    }
  }
}

function defaultBunkerRate(
  role: VoyageBunkerRateDto['role'],
  condition: VoyageBunkerRateDto['condition'],
  activity: VoyageBunkerRateDto['activity'],
  fuelTypeId: number,
  fuelCode: string,
  consumptionMtDay: number,
  pricePerMt: number,
): VoyageBunkerRateDto {
  return {
    role,
    condition,
    activity,
    fuelTypeId,
    fuelCode,
    consumptionMtDay,
    pricePerMt,
  };
}

function defaultFuelPrice(fuelCode: string): number {
  if (fuelCode === 'ULSFO') return 350;
  if (fuelCode === 'MGO' || fuelCode === 'LSMGO') return 360;
  return 320;
}

function optionalBigInt(value: string | undefined): bigint | undefined {
  return value ? BigInt(value) : undefined;
}

function toNumber(
  value: { toNumber(): number } | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return typeof value === 'number' ? value : value.toNumber();
}

function toLegType(leg: VoyagePortLegDto): leg_type {
  return leg.legType as leg_type;
}

function toCpSide(
  value: 'HEAD' | 'SUB' | null | undefined,
): cp_side | undefined {
  return value ? (value as cp_side) : undefined;
}

function mapResult(result: {
  side: result_side;
  total_duration_days: { toNumber(): number } | null;
  total_distance_nm: { toNumber(): number } | null;
  revenue: { toNumber(): number } | null;
  op_expense: { toNumber(): number } | null;
  op_profit: { toNumber(): number } | null;
  total_hire: { toNumber(): number } | null;
  total_freight: { toNumber(): number } | null;
  profit_usd: { toNumber(): number } | null;
  profit_rate_pct: { toNumber(): number } | null;
  tce_usd_day: { toNumber(): number } | null;
  daily_revenue: { toNumber(): number } | null;
  daily_expense: { toNumber(): number } | null;
  daily_profit: { toNumber(): number } | null;
  calculated_at: Date;
}) {
  return {
    side: result.side,
    totalDurationDays: toNumber(result.total_duration_days),
    totalDistanceNm: toNumber(result.total_distance_nm),
    revenue: toNumber(result.revenue),
    opExpense: toNumber(result.op_expense),
    opProfit: toNumber(result.op_profit),
    totalHire: toNumber(result.total_hire),
    totalFreight: toNumber(result.total_freight),
    profitUsd: toNumber(result.profit_usd),
    profitRatePct: toNumber(result.profit_rate_pct),
    tceUsdDay: toNumber(result.tce_usd_day),
    dailyRevenue: toNumber(result.daily_revenue),
    dailyExpense: toNumber(result.daily_expense),
    dailyProfit: toNumber(result.daily_profit),
    calculatedAt: result.calculated_at.toISOString(),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
