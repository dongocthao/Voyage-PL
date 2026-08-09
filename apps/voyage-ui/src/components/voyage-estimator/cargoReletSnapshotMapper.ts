import type { ReletCargoRow, ReletPortRow } from "./cargoReletData";
import type {
  CargoReletSnapshotPayload,
  LoadedCargoReletSnapshot,
} from "@/lib/api/cargoReletSnapshots";

export function buildCargoReletSnapshotPayload({
  estimateId,
  estimateFileId,
  header,
  cargoRows,
  portRows,
}: {
  estimateId?: string;
  estimateFileId?: string;
  header?: Partial<CargoReletSnapshotPayload["header"]>;
  cargoRows: ReletCargoRow[];
  portRows: ReletPortRow[];
}): CargoReletSnapshotPayload {
  const marginRow = portRows.find((row) => row.key === "margin");

  return {
    header: {
      fileName: "Cargo Relet Estimation",
      sheetName: "cargo-relet1",
      estimateTypeCode: "RELT",
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
    cargoLines: cargoRows.filter(hasCargoData).map((row, index) => ({
      lineNo: Number(row.no) || index + 1,
      cargoName: row.cargoName || undefined,
      quantityMt: parseNumber(row.quantity),
      quantityUnit: row.unit || "MT",
      head: mapFreight(row, "h"),
      sub: mapFreight(row, "s"),
    })),
    portLegs: portRows
      .filter((row) => row.key !== "margin" && hasPortData(row))
      .map((row, index) => ({
        legNo: Number(row.no) || index + 1,
        legType: mapLegType(row.type),
        distanceNm: parseNumber(row.distance),
        ecaNm: parseNumber(row.eca),
        wfPct: parsePercent(row.wf),
        speedKn: parseNumber(row.spd),
        seaDays: parseNumber(row.sea),
        portIdleDays: parseNumber(row.idle),
        portWorkingDays: parseNumber(row.working),
        portCharge: parseNumber(row.portCharge),
        arrivalAt: parseDateTime(row.arrival),
        departureAt: parseDateTime(row.departure),
        head: {
          ldRate: parseNumber(row.hLd),
          demurrage: parseNumber(row.hDem),
          despatch: parseNumber(row.hDes),
        },
        sub: {
          ldRate: parseNumber(row.sLd),
          demurrage: parseNumber(row.sDem),
          despatch: parseNumber(row.sDes),
        },
      })),
  };
}

export function mapCargoReletSnapshotToRows(snapshot: LoadedCargoReletSnapshot) {
  const cargoRows: ReletCargoRow[] = snapshot.cargoLines.map((line, index) => ({
    key: `loaded-relet-cargo-${line.lineNo || index + 1}`,
    no: String(line.lineNo || index + 1),
    account: "",
    cargoName: line.cargoName ?? "",
    loadingPort: "",
    dischargingPort: "",
    quantity: formatNumber(line.quantityMt),
    unit: line.quantityUnit ?? "MT",
    hFrt: formatNumber(line.head.freightRate),
    hFrtType: line.head.freightType ?? "F",
    hFrtLumpsum: formatNumber(line.head.freightLumpsum),
    hComm: formatPercent(line.head.addCommPct),
    hBrkg: formatPercent(line.head.brokeragePct),
    hNet: formatNumber(line.head.netFreight),
    hLiner: formatNumber(line.head.linerCostAmount),
    sFrt: formatNumber(line.sub.freightRate),
    sFrtType: line.sub.freightType ?? "F",
    sFrtLumpsum: formatNumber(line.sub.freightLumpsum),
    sComm: formatPercent(line.sub.addCommPct),
    sBrkg: formatPercent(line.sub.brokeragePct),
    sNet: formatNumber(line.sub.netFreight),
    sLiner: formatNumber(line.sub.linerCostAmount),
  }));

  const portRows: ReletPortRow[] = snapshot.portLegs.map((leg, index) => ({
    key: `loaded-relet-port-${leg.legNo || index + 1}`,
    no: String(leg.legNo || index + 1),
    type: formatLegType(leg.legType),
    port: "",
    timezone: "",
    distance: formatNumber(leg.distanceNm),
    eca: formatNumber(leg.ecaNm),
    wf: formatPercent(leg.wfPct),
    spd: formatNumber(leg.speedKn),
    sea: formatNumber(leg.seaDays),
    hLd: formatNumber(leg.head.ldRate),
    hDem: formatNumber(leg.head.demurrage),
    hDes: formatNumber(leg.head.despatch),
    sLd: formatNumber(leg.sub.ldRate),
    sDem: formatNumber(leg.sub.demurrage),
    sDes: formatNumber(leg.sub.despatch),
    idle: formatNumber(leg.portIdleDays),
    working: formatNumber(leg.portWorkingDays),
    portCharge: formatNumber(leg.portCharge),
    arrival: formatDateTime(leg.arrivalAt),
    departure: formatDateTime(leg.departureAt),
  }));

  portRows.push({
    key: "margin",
    no: "",
    type: "Margin",
    port: "",
    timezone: "",
    distance: "",
    eca: "",
    wf: "",
    spd: "",
    sea: formatNumber(snapshot.header.marginSeaDays),
    hLd: "",
    hDem: "",
    hDes: "",
    sLd: "",
    sDem: "",
    sDes: "",
    idle: formatNumber(snapshot.header.marginPortIdleDays),
    working: "",
    portCharge: "",
    arrival: "",
    departure: "",
  });

  return { cargoRows, portRows };
}

function mapFreight(row: ReletCargoRow, side: "h" | "s") {
  return {
    freightRate: parseNumber(side === "h" ? row.hFrt : row.sFrt),
    freightType: side === "h" ? row.hFrtType : row.sFrtType,
    freightLumpsum: parseNumber(side === "h" ? row.hFrtLumpsum : row.sFrtLumpsum),
    addCommPct: parsePercent(side === "h" ? row.hComm : row.sComm),
    brokeragePct: parsePercent(side === "h" ? row.hBrkg : row.sBrkg),
    netFreight: parseNumber(side === "h" ? row.hNet : row.sNet),
    linerCostAmount: parseNumber(side === "h" ? row.hLiner : row.sLiner),
  };
}

function hasCargoData(row: ReletCargoRow) {
  return Boolean(row.cargoName || row.loadingPort || row.dischargingPort || row.quantity);
}

function hasPortData(row: ReletPortRow) {
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

function parseDateTime(value: string | undefined) {
  if (!value || /time/i.test(value)) return undefined;
  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (ddmmyyyy) {
    const [, day, month, year, hour, minute] = ddmmyyyy;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ).toISOString();
  }
  const parsed = new Date(trimmed.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function mapLegType(value: string): CargoReletSnapshotPayload["portLegs"][number]["legType"] {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("ballast")) return "BALLAST";
  if (normalized.startsWith("load")) return "LOADING";
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

function formatLegType(value: CargoReletSnapshotPayload["portLegs"][number]["legType"]) {
  if (value === "BALLAST") return "Ballast";
  if (value === "LOADING") return "Loading";
  if (value === "DISCHARGE") return "Dischg.";
  if (value === "CANAL") return "Canal";
  if (value === "BUNKER") return "Bunker";
  return "Others";
}
