import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  actual_leg_status,
  estimate_type,
  Prisma,
  voyage_event_type,
} from '@prisma/client';
import { AppErrorCode } from '../../../common/errors/app-error-code';
import { PrismaService } from '../../../prisma.service';
import type {
  OperationActualReportDto,
  OperationBunkerRowDto,
  OperationCargoRowDto,
  OperationPortRowDto,
  SaveOperationSnapshotDto,
} from '../dto/operation-snapshot.dto';

type Tx = Prisma.TransactionClient;

@Injectable()
export class OperationSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const operations = await this.prisma.actual_voyages.findMany({
      include: {
        vessels: true,
        estimates: {
          include: {
            estimate_cargo_lines: {
              include: {
                companies: true,
                cargoes: true,
                ports_estimate_cargo_lines_loading_port_idToports: true,
                ports_estimate_cargo_lines_discharging_port_idToports: true,
              },
              orderBy: { line_no: 'asc' },
            },
          },
        },
        actual_voyage_cargo_lines: {
          include: {
            companies: true,
            cargoes: true,
            ports_actual_voyage_cargo_lines_loading_port_idToports: true,
            ports_actual_voyage_cargo_lines_discharging_port_idToports: true,
          },
          orderBy: { line_no: 'asc' },
        },
        actual_voyage_port_calls: {
          include: { ports: true },
          orderBy: { call_no: 'asc' },
        },
        users: true,
      },
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    });

    return operations.map((operation) => {
      const cargoLines =
        operation.actual_voyage_cargo_lines.length > 0
          ? operation.actual_voyage_cargo_lines
          : operation.estimates?.estimate_cargo_lines ?? [];
      const totalQuantity = cargoLines.reduce((sum, line) => {
        const quantity =
          'bl_quantity_mt' in line ? line.bl_quantity_mt : line.quantity_mt;
        return sum + Number(quantity ?? 0);
      }, 0);
      const charterer =
        cargoLines.find((line) => line.companies)?.companies?.company_name ?? '';

      return {
        operationId: operation.id.toString(),
        operationName: operation.voyage_code || `Operation ${operation.id}`,
        operationType: mapOperationType(operation.voyage_type),
        operationTypeCode: operation.voyage_type,
        estimateId: operation.estimate_id?.toString(),
        vessel: operation.vessels.mv_name,
        voyageNo: operation.voyage_code,
        charterer,
        operator: operation.users?.full_name ?? '',
        status: mapOperationStatus(operation.status),
        cargo: summarizeOperationCargo(cargoLines),
        quantity: totalQuantity ? `${formatNumber(totalQuantity)} MT` : '',
        loadPort:
          summarizeOperationLoadPort(cargoLines) ||
          operation.actual_voyage_port_calls.find((call) => call.ports)?.ports
            ?.port_name ||
          '',
        dischargePort:
          summarizeOperationDischargePort(cargoLines) ||
          [...operation.actual_voyage_port_calls].reverse().find((call) => call.ports)
            ?.ports?.port_name ||
          '',
        commenced: '',
        completed: '',
        preparedBy: operation.users?.full_name ?? '',
        lastUpdated: formatDateTime(operation.updated_at),
      };
    });
  }

  async save(snapshot: SaveOperationSnapshotDto) {
    const saved = await this.prisma.$transaction(async (tx) => {
      const vesselId = await this.resolveVesselId(tx, snapshot);
      const operationId = snapshot.header.operationId
        ? BigInt(snapshot.header.operationId)
        : undefined;
      const estimateId = snapshot.header.estimateId
        ? BigInt(snapshot.header.estimateId)
        : undefined;

      const data = {
        estimate_id: estimateId,
        vessel_id: vesselId,
        voyage_code: snapshot.header.voyageNo,
        voyage_type: estimate_type.VOYAGE,
        status: snapshot.header.status ?? 'ONGOING',
        currency: snapshot.header.currency ?? 'USD',
        updated_at: new Date(),
      };

      const actualVoyage = operationId
        ? await tx.actual_voyages.update({ where: { id: operationId }, data })
        : await tx.actual_voyages.create({ data });

      await this.replaceChildren(tx, actualVoyage.id);
      await this.saveCargoRows(tx, actualVoyage.id, snapshot.cargoRows);
      const portKeyMap = await this.savePortRows(tx, actualVoyage.id, snapshot.portRows);
      await this.saveReports(tx, actualVoyage.id, portKeyMap, snapshot.reports);
      await this.saveBunkerSummary(tx, actualVoyage.id, snapshot.bunkerRows);

      return actualVoyage;
    });

    return {
      operationId: saved.id.toString(),
      estimateId: saved.estimate_id?.toString(),
      vesselId: saved.vessel_id.toString(),
      voyageNo: saved.voyage_code,
      status: saved.status,
      updatedAt: saved.updated_at.toISOString(),
      updatedByName: 'Admin',
    };
  }

  async load(operationId: string) {
    const actualVoyage = await this.prisma.actual_voyages.findUnique({
      where: { id: BigInt(operationId) },
      include: {
        vessels: true,
        actual_voyage_cargo_lines: {
          include: {
            companies: true,
            cargoes: true,
            actual_voyage_cargo_freight_terms: true,
            ports_actual_voyage_cargo_lines_loading_port_idToports: true,
            ports_actual_voyage_cargo_lines_discharging_port_idToports: true,
          },
          orderBy: { line_no: 'asc' },
        },
        actual_voyage_port_calls: {
          include: { ports: true },
          orderBy: { call_no: 'asc' },
        },
        actual_voyage_events: {
          include: { actual_voyage_bunker_readings: { include: { fuel_types: true } } },
          orderBy: { event_time: 'asc' },
        },
        actual_voyage_bunker_summary: { include: { fuel_types: true } },
        users: true,
      },
    });

    if (!actualVoyage) {
      throw new NotFoundException({
        code: AppErrorCode.ESTIMATE_NOT_FOUND,
        message: 'Operation was not found.',
        details: [{ path: 'operationId', message: operationId }],
      });
    }

    return {
      header: {
        operationId: actualVoyage.id.toString(),
        estimateId: actualVoyage.estimate_id?.toString(),
        vesselId: actualVoyage.vessel_id.toString(),
        vesselName: actualVoyage.vessels.mv_name,
        voyageNo: actualVoyage.voyage_code,
        status: actualVoyage.status,
        currency: actualVoyage.currency,
        updatedAt: actualVoyage.updated_at.toISOString(),
        updatedByName: actualVoyage.users?.full_name ?? actualVoyage.users?.username ?? 'Admin',
      },
      cargoRows: actualVoyage.actual_voyage_cargo_lines.map((row) => {
        const freight = row.actual_voyage_cargo_freight_terms[0];
        return {
          lineNo: row.line_no,
          account: row.companies?.company_name,
          cargoName: row.cargoes?.cargo_name ?? row.cargo_name,
          loadingPort:
            row.ports_actual_voyage_cargo_lines_loading_port_idToports?.port_name,
          dischargingPort:
            row.ports_actual_voyage_cargo_lines_discharging_port_idToports?.port_name,
          quantity: toNumber(row.bl_quantity_mt),
          freightRate: toNumber(freight?.freight_rate),
          linerCost: toNumber(freight?.net_freight),
          totalFreight: toNumber(freight?.total_freight),
          remark: row.remark,
        };
      }),
      portRows: actualVoyage.actual_voyage_port_calls.map((row) => ({
        lineNo: row.call_no,
        type: row.call_purpose,
        portName: row.ports?.port_name,
        remark: row.remark,
      })),
      bunkerRows: actualVoyage.actual_voyage_bunker_summary.map((row) => ({
        fuelType: row.fuel_types.code,
        pricePerMt: toNumber(row.weighted_avg_price),
        consumptionMt: toNumber(row.total_consumption_mt),
        expense: toNumber(row.total_cost),
      })),
      reports: actualVoyage.actual_voyage_events.map((event) => ({
        kind: event.event_type === voyage_event_type.ALL_FAST ? 'arrival' : 'departure',
        time: event.event_time.toISOString(),
        remark: event.remark,
        fuels: event.actual_voyage_bunker_readings.map((fuel) => ({
          fuelType: fuel.fuel_types.code,
          robMt: toNumber(fuel.rob_mt),
          supplyQtyMt: toNumber(fuel.supply_qty_mt),
          supplyUnitPrice: toNumber(fuel.supply_unit_price),
        })),
      })),
    };
  }

  async findByEstimateId(estimateId: string) {
    const actualVoyage = await this.prisma.actual_voyages.findFirst({
      where: { estimate_id: BigInt(estimateId) },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        estimate_id: true,
        voyage_code: true,
        status: true,
        updated_at: true,
      },
    });

    if (!actualVoyage) {
      return { exists: false as const, estimateId };
    }

    return {
      exists: true as const,
      estimateId: actualVoyage.estimate_id?.toString(),
      operationId: actualVoyage.id.toString(),
      voyageNo: actualVoyage.voyage_code,
      status: actualVoyage.status,
      updatedAt: actualVoyage.updated_at.toISOString(),
    };
  }

  async delete(operationId: string) {
    await this.prisma.actual_voyages.delete({ where: { id: BigInt(operationId) } });
    return { operationId, deleted: true };
  }

  private async replaceChildren(tx: Tx, actualVoyageId: bigint) {
    await tx.actual_voyage_events.deleteMany({
      where: { actual_voyage_id: actualVoyageId },
    });
    await tx.actual_voyage_bunker_summary.deleteMany({
      where: { actual_voyage_id: actualVoyageId },
    });
    await tx.actual_voyage_cargo_lines.deleteMany({
      where: { actual_voyage_id: actualVoyageId },
    });
    await tx.actual_voyage_legs.deleteMany({
      where: { actual_voyage_id: actualVoyageId },
    });
    await tx.actual_voyage_port_calls.deleteMany({
      where: { actual_voyage_id: actualVoyageId },
    });
  }

  private async saveCargoRows(
    tx: Tx,
    actualVoyageId: bigint,
    rows: OperationCargoRowDto[],
  ) {
    const nonBlankRows = rows.filter(
      (row) =>
        row.account ||
        row.cargoName ||
        row.loadingPort ||
        row.dischargingPort ||
        row.quantity,
    );

    for (const [index, row] of nonBlankRows.entries()) {
      const cargoLine = await tx.actual_voyage_cargo_lines.create({
        data: {
          actual_voyage_id: actualVoyageId,
          line_no: index + 1,
          account_company_id: await this.resolveCompanyId(tx, row.account),
          cargo_id: await this.resolveCargoId(tx, row.cargoName),
          cargo_name: row.cargoName,
          loading_port_id: await this.resolvePortId(tx, row.loadingPort),
          discharging_port_id: await this.resolvePortId(tx, row.dischargingPort),
          bl_quantity_mt: decimal(row.quantity),
        },
      });

      await tx.actual_voyage_cargo_freight_terms.create({
        data: {
          cargo_line_id: cargoLine.id,
          freight_rate: decimalOrNull(row.freightRate),
          net_freight: decimalOrNull(row.linerCost),
          total_freight: decimalOrNull(row.totalFreight ?? row.freightLumpsum),
        },
      });
    }
  }

  private async savePortRows(
    tx: Tx,
    actualVoyageId: bigint,
    rows: OperationPortRowDto[],
  ) {
    const portKeyMap = new Map<string, { portCallId: bigint; legId: bigint }>();
    const nonBlankRows = rows.filter((row) => row.portName || row.type);

    for (const [index, row] of nonBlankRows.entries()) {
      const portId = await this.resolvePortId(tx, row.portName);
      const portCall = await tx.actual_voyage_port_calls.create({
        data: {
          actual_voyage_id: actualVoyageId,
          call_no: index + 1,
          port_id: portId,
          call_purpose: row.type ?? 'Other',
          remark: buildPortRemark(row),
        },
      });
      const leg = await tx.actual_voyage_legs.create({
        data: {
          actual_voyage_id: actualVoyageId,
          leg_no: index + 1,
          to_port_id: portId,
          leg_status: toActualLegStatus(row.type),
          remark: buildPortRemark(row),
        },
      });
      portKeyMap.set(String(row.lineNo), { portCallId: portCall.id, legId: leg.id });
    }

    return portKeyMap;
  }

  private async saveReports(
    tx: Tx,
    actualVoyageId: bigint,
    portKeyMap: Map<string, { portCallId: bigint; legId: bigint }>,
    reports: OperationActualReportDto[],
  ) {
    for (const report of reports) {
      const portRefs = portKeyMap.get(report.portKey);
      if (!portRefs) {
        continue;
      }
      const event = await tx.actual_voyage_events.create({
        data: {
          actual_voyage_id: actualVoyageId,
          port_call_id: portRefs.portCallId,
          event_type:
            report.kind === 'arrival'
              ? voyage_event_type.ALL_FAST
              : voyage_event_type.UNMOOR,
          event_time: parseEventTime(report.time),
          remark: report.remark,
        },
      });

      for (const fuel of report.fuels) {
        await tx.actual_voyage_bunker_readings.create({
          data: {
            event_id: event.id,
            fuel_type_id: await this.resolveFuelTypeId(tx, fuel.fuelType),
            rob_mt: decimalOrNull(fuel.robMt),
            supply_qty_mt: decimalOrNull(fuel.supplyQtyMt),
            supply_unit_price: decimalOrNull(fuel.supplyUnitPrice),
          },
        });
      }
    }
  }

  private async saveBunkerSummary(
    tx: Tx,
    actualVoyageId: bigint,
    rows: OperationBunkerRowDto[],
  ) {
    for (const row of rows) {
      await tx.actual_voyage_bunker_summary.create({
        data: {
          actual_voyage_id: actualVoyageId,
          fuel_type_id: await this.resolveFuelTypeId(tx, row.fuelType),
          weighted_avg_price: decimalOrNull(row.pricePerMt),
          total_consumption_mt: decimalOrNull(row.consumptionMt),
          total_cost: decimalOrNull(row.expense),
        },
      });
    }
  }

  private async resolveVesselId(tx: Tx, snapshot: SaveOperationSnapshotDto) {
    if (snapshot.header.vesselId) {
      return BigInt(snapshot.header.vesselId);
    }
    const name = snapshot.header.vesselName.trim();
    if (!name) {
      throw new BadRequestException('Operation vesselName is required.');
    }
    const existing = await tx.vessels.findFirst({ where: { mv_name: name } });
    if (existing) {
      return existing.id;
    }
    return (await tx.vessels.create({ data: { mv_name: name } })).id;
  }

  private async resolvePortId(tx: Tx, name?: string) {
    const portName = cleanName(name);
    if (!portName) {
      return null;
    }
    const existing = await tx.ports.findFirst({ where: { port_name: portName } });
    if (existing) {
      return existing.id;
    }
    return (await tx.ports.create({ data: { port_name: portName } })).id;
  }

  private async resolveCargoId(tx: Tx, name?: string) {
    const cargoName = cleanName(name);
    if (!cargoName) {
      return null;
    }
    const existing = await tx.cargoes.findFirst({ where: { cargo_name: cargoName } });
    if (existing) {
      return existing.id;
    }
    return (await tx.cargoes.create({ data: { cargo_name: cargoName } })).id;
  }

  private async resolveCompanyId(tx: Tx, name?: string) {
    const companyName = cleanName(name);
    if (!companyName) {
      return null;
    }
    const existing = await tx.companies.findFirst({
      where: { company_name: companyName },
    });
    if (existing) {
      return existing.id;
    }
    return (await tx.companies.create({ data: { company_name: companyName } })).id;
  }

  private async resolveFuelTypeId(tx: Tx, code: string) {
    const fuelCode = code.trim().toUpperCase();
    const existing = await tx.fuel_types.findUnique({ where: { code: fuelCode } });
    if (existing) {
      return existing.id;
    }
    return (await tx.fuel_types.create({ data: { code: fuelCode } })).id;
  }
}

function cleanName(value?: string) {
  return value?.replace(/\s*<[^>]+>\s*/g, '').trim() || undefined;
}

function toActualLegStatus(type?: string) {
  return type?.toLowerCase().includes('ballast')
    ? actual_leg_status.BALLAST
    : actual_leg_status.LADEN;
}

function buildPortRemark(row: OperationPortRowDto) {
  const parts = [
    row.distanceNm != null ? `distance=${row.distanceNm}` : undefined,
    row.ecaNm != null ? `eca=${row.ecaNm}` : undefined,
    row.arrival ? `arrival=${row.arrival}` : undefined,
    row.departure ? `departure=${row.departure}` : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join('; ') : undefined;
}

function parseEventTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function decimal(value?: number) {
  return new Prisma.Decimal(value ?? 0);
}

function decimalOrNull(value?: number) {
  return value == null ? null : new Prisma.Decimal(value);
}

function toNumber(value?: Prisma.Decimal | null) {
  return value == null ? undefined : value.toNumber();
}

function mapOperationType(value: estimate_type) {
  if (value === estimate_type.TIME_CHARTER) return 'Time Charter';
  if (value === estimate_type.CARGO_RELET) return 'Cargo Relet';
  return 'Voyage Charter';
}

function mapOperationStatus(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'DRAFT') return 'Draft';
  if (normalized === 'FIXED') return 'Fixed';
  if (normalized === 'FAILED') return 'Failed';
  if (normalized === 'CANCELLED' || normalized === 'CANCEL') return 'Cancelled';
  return 'Estimated';
}

function summarizeOperationCargo(
  cargoLines: Array<{ cargo_name: string | null; cargoes: { cargo_name: string } | null }>,
) {
  const names = cargoLines
    .map((line) => line.cargo_name ?? line.cargoes?.cargo_name)
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(names)).join(', ');
}

function summarizeOperationLoadPort(
  cargoLines: Array<
    | {
        ports_actual_voyage_cargo_lines_loading_port_idToports: {
          port_name: string;
        } | null;
      }
    | {
        ports_estimate_cargo_lines_loading_port_idToports: {
          port_name: string;
        } | null;
      }
  >,
) {
  for (const line of cargoLines) {
    if (
      'ports_actual_voyage_cargo_lines_loading_port_idToports' in line &&
      line.ports_actual_voyage_cargo_lines_loading_port_idToports
    ) {
      return line.ports_actual_voyage_cargo_lines_loading_port_idToports.port_name;
    }
    if (
      'ports_estimate_cargo_lines_loading_port_idToports' in line &&
      line.ports_estimate_cargo_lines_loading_port_idToports
    ) {
      return line.ports_estimate_cargo_lines_loading_port_idToports.port_name;
    }
  }
  return '';
}

function summarizeOperationDischargePort(
  cargoLines: Array<
    | {
        ports_actual_voyage_cargo_lines_discharging_port_idToports: {
          port_name: string;
        } | null;
      }
    | {
        ports_estimate_cargo_lines_discharging_port_idToports: {
          port_name: string;
        } | null;
      }
  >,
) {
  for (const line of [...cargoLines].reverse()) {
    if (
      'ports_actual_voyage_cargo_lines_discharging_port_idToports' in line &&
      line.ports_actual_voyage_cargo_lines_discharging_port_idToports
    ) {
      return line.ports_actual_voyage_cargo_lines_discharging_port_idToports.port_name;
    }
    if (
      'ports_estimate_cargo_lines_discharging_port_idToports' in line &&
      line.ports_estimate_cargo_lines_discharging_port_idToports
    ) {
      return line.ports_estimate_cargo_lines_discharging_port_idToports.port_name;
    }
  }
  return '';
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDateTime(value?: Date | null) {
  if (!value) return '';
  return value.toISOString().slice(0, 16).replace('T', ' ');
}
