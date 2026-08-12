import { Injectable } from '@nestjs/common';
import { estimate_status, estimate_type } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';

export type EstimateListRowDto = {
  estimateId: string;
  estimateName: string;
  estimateType: 'Voyage Charter' | 'Time Charter' | 'Cargo Relet';
  estimateTypeCode: 'VOYAGE' | 'TIME_CHARTER' | 'CARGO_RELET';
  vessel: string;
  voyageNo: string;
  charterer: string;
  operator: string;
  status: 'Draft' | 'Estimated' | 'Fixed' | 'Failed' | 'Cancelled';
  cargo: string;
  quantity: string;
  loadPort: string;
  dischargePort: string;
  commenced: string;
  completed: string;
  preparedBy: string;
  lastUpdated: string;
};

@Injectable()
export class EstimateListService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<EstimateListRowDto[]> {
    const estimates = await this.prisma.estimates.findMany({
      include: {
        estimate_files: {
          include: {
            users_estimate_files_created_byTousers: true,
          },
        },
        estimate_vessels: true,
        estimate_cargo_lines: {
          include: {
            companies: true,
            cargoes: true,
            ports_estimate_cargo_lines_loading_port_idToports: true,
            ports_estimate_cargo_lines_discharging_port_idToports: true,
          },
          orderBy: { line_no: 'asc' },
        },
        estimate_charter_terms: {
          include: {
            companies: true,
          },
          orderBy: { cp_side: 'asc' },
        },
        estimate_port_legs: {
          include: {
            ports: true,
          },
          orderBy: { leg_no: 'asc' },
        },
        users_estimates_operator_user_idTousers: true,
        users_estimates_updated_byTousers: true,
      },
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    });

    return estimates.map((estimate) => {
      const cargoLines = estimate.estimate_cargo_lines;
      const portLegs = estimate.estimate_port_legs;
      const charterTerms = estimate.estimate_charter_terms;
      const firstCargo = cargoLines[0];
      const totalQuantity = cargoLines.reduce(
        (sum, line) => sum + Number(line.quantity_mt ?? 0),
        0,
      );
      const commenced = portLegs.find((leg) => leg.arrival_at)?.arrival_at;
      const completed = [...portLegs]
        .reverse()
        .find((leg) => leg.departure_at)?.departure_at;
      const charterer =
        firstCargo?.companies?.company_name ??
        charterTerms.find((term) => term.companies)?.companies?.company_name ??
        '';

      return {
        estimateId: estimate.id.toString(),
        estimateName:
          estimate.sheet_name || estimate.estimate_files.file_name || `Estimate ${estimate.id}`,
        estimateType: mapEstimateType(estimate.estimate_type),
        estimateTypeCode: estimate.estimate_type,
        vessel: estimate.estimate_vessels?.mv_name ?? '',
        voyageNo: estimate.voyage_no ?? '',
        charterer,
        operator: estimate.users_estimates_operator_user_idTousers?.full_name ?? '',
        status: mapStatus(estimate.status),
        cargo: summarizeCargo(cargoLines),
        quantity: totalQuantity ? `${formatNumber(totalQuantity)} MT` : '',
        loadPort: summarizeLoadPort(cargoLines) || summarizeFirstPort(portLegs),
        dischargePort: summarizeDischargePort(cargoLines) || summarizeLastPort(portLegs),
        commenced: formatDate(commenced),
        completed: formatDate(completed),
        preparedBy: estimate.estimate_files.users_estimate_files_created_byTousers?.full_name ?? '',
        lastUpdated: formatDateTime(estimate.updated_at),
      };
    });
  }
}

function mapEstimateType(value: estimate_type): EstimateListRowDto['estimateType'] {
  if (value === estimate_type.TIME_CHARTER) return 'Time Charter';
  if (value === estimate_type.CARGO_RELET) return 'Cargo Relet';
  return 'Voyage Charter';
}

function mapStatus(value: estimate_status): EstimateListRowDto['status'] {
  const normalized = value.toLowerCase();
  return (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as EstimateListRowDto['status'];
}

function summarizeCargo(
  cargoLines: Array<{ cargo_name: string | null; cargoes: { cargo_name: string } | null }>,
) {
  const names = cargoLines
    .map((line) => line.cargo_name ?? line.cargoes?.cargo_name)
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(names)).join(', ');
}

function summarizeLoadPort(
  cargoLines: Array<{
    ports_estimate_cargo_lines_loading_port_idToports: { port_name: string } | null;
  }>,
) {
  return cargoLines.find((line) => line.ports_estimate_cargo_lines_loading_port_idToports)
    ?.ports_estimate_cargo_lines_loading_port_idToports?.port_name ?? '';
}

function summarizeDischargePort(
  cargoLines: Array<{
    ports_estimate_cargo_lines_discharging_port_idToports: { port_name: string } | null;
  }>,
) {
  return [...cargoLines]
    .reverse()
    .find((line) => line.ports_estimate_cargo_lines_discharging_port_idToports)
    ?.ports_estimate_cargo_lines_discharging_port_idToports?.port_name ?? '';
}

function summarizeFirstPort(
  portLegs: Array<{ ports: { port_name: string } | null }>,
) {
  return portLegs.find((leg) => leg.ports)?.ports?.port_name ?? '';
}

function summarizeLastPort(portLegs: Array<{ ports: { port_name: string } | null }>) {
  return [...portLegs].reverse().find((leg) => leg.ports)?.ports?.port_name ?? '';
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatDate(value?: Date | null) {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value?: Date | null) {
  if (!value) return '';
  return value.toISOString().slice(0, 16).replace('T', ' ');
}
