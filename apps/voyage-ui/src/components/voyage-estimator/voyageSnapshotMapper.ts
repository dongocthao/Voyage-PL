import type { CargoRow, PortRow } from "./mockData";
import type { LoadedVoyageSnapshot, VoyageSnapshotPayload } from "@/lib/api/voyageSnapshots";

export function buildVoyageSnapshotPayload({
  estimateId,
  estimateFileId,
  header,
  cargoRows,
  portRows,
}: {
  estimateId?: string;
  estimateFileId?: string;
  header?: Partial<VoyageSnapshotPayload["header"]>;
  cargoRows: CargoRow[];
  portRows: PortRow[];
}): VoyageSnapshotPayload {
  const marginRow = portRows.find((row) => row.key === "margin");

  return {
    header: {
      fileName: "Voyage Estimation",
      sheetName: "voyage1",
      estimateTypeCode: "TCOV",
      voyageNo: "",
      routingSuez: true,
      routingPanama: true,
      routingKiel: false,
      timeDisplayUnit: "DAYS",
      timezoneDisplayMode: "PORT_LOCAL",
      ...header,
      estimateId,
      estimateFileId,
      marginSeaDays: parseNumber(marginRow?.sea) ?? header?.marginSeaDays,
      marginPortIdleDays: parseNumber(marginRow?.idle) ?? header?.marginPortIdleDays,
    },
    cargoLines: cargoRows
      .filter((row) => row.key !== "margin" && hasCargoData(row))
      .map((row, index) => ({
        lineNo: Number(row.no) || index + 1,
        accountCompanyId: row.accountCompanyId,
        cargoId: row.cargoId,
        cargoName: emptyToUndefined(row.cargoName),
        loadingPortId: row.loadingPortId,
        dischargingPortId: row.dischargingPortId,
        quantity: parseNumber(row.quantity),
        unit: row.unit || "MT",
        freight: {
          freightRate: parseNumber(row.frt),
          freightTermId: parseInteger(row.freightTermId),
          addCommPct: parsePercent(row.aComm),
          brokeragePct: parsePercent(row.brkg),
          freightTaxPct: parsePercent(row.frtTax),
          freightType: row.frtType === "L" ? "L" : "F",
          freightLumpsum: parseNumber(row.frtLumpsum),
          linerCostAmount: parseNumber(row.linerTerm),
          isFreightFixed: Boolean(row.isFreightFixed),
        },
      })),
    portLegs: portRows
      .filter((row) => row.key !== "margin" && hasPortData(row))
      .map((row, index) => ({
        legNo: Number(row.no) || index + 1,
        legType: mapLegType(row.type),
        portId: row.portId,
        distanceNm: parseNumber(row.distance),
        ecaNm: parseNumber(row.eca),
        wfPct: parsePercent(row.wf),
        speedKn: parseNumber(row.spd),
        seaDays: parseNumber(row.sea),
        portIdleDays: parseNumber(row.idle),
        portCharge: parseNumber(row.portCharge),
        arrivalAt: parseDateTime(row.arrival),
        departureAt: parseDateTime(row.departure),
        cpTerm: {
          ldRate: parseNumber(row.ldRate),
          demurrage: parseNumber(row.dem),
          despatch: parseNumber(row.des),
        },
      })),
  };
}

export function mapVoyageSnapshotToRows(snapshot: LoadedVoyageSnapshot) {
  const cargoRows: CargoRow[] = snapshot.cargoLines.map((line, index) => ({
    key: `loaded-cargo-${line.lineNo || index + 1}`,
    no: line.lineNo || index + 1,
    account: line.accountCompanyName ?? "",
    accountCompanyId: line.accountCompanyId,
    cargoName: line.cargoName ?? "",
    cargoId: line.cargoId,
    loadingPort: line.loadingPortName ?? "",
    loadingPortId: line.loadingPortId,
    dischargingPort: line.dischargingPortName ?? "",
    dischargingPortId: line.dischargingPortId,
    quantity: formatNumber(line.quantity),
    unit: line.unit || "MT",
    frt: formatNumber(line.freight.freightRate),
    term: "",
    freightTermId: line.freight.freightTermId?.toString(),
    frtType: line.freight.freightType,
    isFreightFixed: line.freight.isFreightFixed,
    frtLumpsum: formatNumber(line.freight.freightLumpsum),
    totalFreight: "",
    aComm: formatPercent(line.freight.addCommPct),
    brkg: formatPercent(line.freight.brokeragePct),
    frtTax: formatPercent(line.freight.freightTaxPct),
    linerTerm: formatNumber(line.freight.linerCostAmount),
  }));

  const portRows: PortRow[] = snapshot.portLegs.map((leg, index) => ({
    key: `loaded-port-${leg.legNo || index + 1}`,
    no: String(leg.legNo || index + 1),
    type: formatLegType(leg.legType),
    port: leg.portName ?? "",
    portId: leg.portId,
    distance: formatNumber(leg.distanceNm),
    eca: formatNumber(leg.ecaNm),
    wf: formatPercent(leg.wfPct),
    spd: formatNumber(leg.speedKn),
    sea: formatNumber(leg.seaDays),
    ldRate: formatNumber(leg.cpTerm?.ldRate),
    idle: formatNumber(leg.portIdleDays),
    working: "",
    dem: formatNumber(leg.cpTerm?.demurrage),
    des: formatNumber(leg.cpTerm?.despatch),
    portCharge: formatNumber(leg.portCharge),
    arrival: formatDateTime(leg.arrivalAt),
    departure: formatDateTime(leg.departureAt),
  }));

  portRows.push({
    key: "margin",
    no: "",
    type: "Margin",
    port: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: formatNumber(snapshot.header.marginSeaDays),
    ldRate: "",
    idle: formatNumber(snapshot.header.marginPortIdleDays),
    working: "",
    dem: "",
    des: "",
    portCharge: "",
    arrival: "",
    departure: "",
  });

  return { cargoRows, portRows };
}

function hasCargoData(row: CargoRow) {
  return Boolean(
    row.cargoName || row.quantity || row.frt || row.loadingPort || row.dischargingPort,
  );
}

function hasPortData(row: PortRow) {
  return Boolean(row.type || row.port || row.distance || row.sea || row.departure);
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePercent(value: string | undefined) {
  return parseNumber(value);
}

function parseInteger(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDateTime(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function emptyToUndefined(value: string) {
  return value.trim() ? value : undefined;
}

function mapLegType(value: string): VoyageSnapshotPayload["portLegs"][number]["legType"] {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("laden")) return "OTHER";
  if (normalized.startsWith("ballast")) return "BALLAST";
  if (normalized.startsWith("loading")) return "LOADING";
  if (normalized.startsWith("dis")) return "DISCHARGE";
  if (normalized.startsWith("canal")) return "CANAL";
  if (normalized.startsWith("bunker")) return "BUNKER";
  return "OTHER";
}

function formatNumber(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function formatPercent(value: number | undefined) {
  return value === undefined ? "" : `${value} %`;
}

function formatDateTime(value: string | undefined) {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16);
}

function formatLegType(value: VoyageSnapshotPayload["portLegs"][number]["legType"]) {
  if (value === "DISCHARGE") return "Discharge";
  if (value === "BALLAST") return "Ballast";
  if (value === "LOADING") return "Loading";
  if (value === "CANAL") return "Canal";
  if (value === "BUNKER") return "Bunkering";
  return "Others";
}
