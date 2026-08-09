import type { TcCpRow, TcPortRow } from "./timeCharterData";
import type {
  LoadedTimeCharterSnapshot,
  TimeCharterSnapshotPayload,
} from "@/lib/api/timeCharterSnapshots";

export function buildTimeCharterSnapshotPayload({
  estimateId,
  estimateFileId,
  header,
  headCpRows,
  subCpRows,
  portRows,
  headMultiDuration,
  subMultiDuration,
}: {
  estimateId?: string;
  estimateFileId?: string;
  header?: Partial<TimeCharterSnapshotPayload["header"]>;
  headCpRows: TcCpRow[];
  subCpRows: TcCpRow[];
  portRows: TcPortRow[];
  headMultiDuration: boolean;
  subMultiDuration: boolean;
}): TimeCharterSnapshotPayload {
  const marginRow = portRows.find((row) => row.key === "margin");

  return {
    header: {
      fileName: "Time Charter Estimation",
      sheetName: "time-charter1",
      estimateTypeCode: "TCOV",
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
    charterTerms: [
      ...mapCpRows(headCpRows, "HEAD", headMultiDuration),
      ...mapCpRows(subCpRows, "SUB", subMultiDuration),
    ],
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
        arrivalAt: parseDateTime(row.arrival),
        departureAt: parseDateTime(row.departure),
      })),
  };
}

export function mapTimeCharterSnapshotToRows(snapshot: LoadedTimeCharterSnapshot) {
  const headTerms = snapshot.charterTerms.filter((term) => term.cpSide === "HEAD");
  const subTerms = snapshot.charterTerms.filter((term) => term.cpSide === "SUB");

  const headCpRows = mapTermsToRows(headTerms, "head");
  const subCpRows = mapTermsToRows(subTerms, "sub");
  const portRows: TcPortRow[] = snapshot.portLegs.map((leg, index) => ({
    key: `loaded-tc-port-${leg.legNo || index + 1}`,
    no: String(leg.legNo || index + 1),
    type: formatLegType(leg.legType),
    port: "",
    portId: leg.portId,
    timezone: "",
    distance: formatNumber(leg.distanceNm),
    eca: formatNumber(leg.ecaNm),
    wf: formatPercent(leg.wfPct),
    spd: formatNumber(leg.speedKn),
    sea: formatNumber(leg.seaDays),
    idle: formatNumber(leg.portIdleDays),
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
    idle: formatNumber(snapshot.header.marginPortIdleDays),
    arrival: "",
    departure: "",
  });

  return {
    headCpRows,
    subCpRows,
    portRows,
    headMultiDuration: headTerms.some((term) => term.useMultiDuration),
    subMultiDuration: subTerms.some((term) => term.useMultiDuration),
  };
}

function mapCpRows(
  rows: TcCpRow[],
  cpSide: "HEAD" | "SUB",
  useMultiDuration: boolean,
): TimeCharterSnapshotPayload["charterTerms"] {
  const dataRows = rows.filter(hasCpData);
  const primaryRow = dataRows[0];
  if (!primaryRow) {
    return [];
  }

  return [
    {
      cpSide,
      accountCompanyId: primaryRow.accountCompanyId,
      deliveryPortId: primaryRow.deliveryPortId,
      redeliveryPortId: primaryRow.redeliveryPortId,
      durationDays: parseNumber(primaryRow.duration),
      dailyHire: parseNumber(primaryRow.dailyHire),
      grossHire: parseNumber(primaryRow.grossHire),
      addCommPct: parsePercent(primaryRow.addComm),
      brokeragePct: parsePercent(primaryRow.brkg),
      useMultiDuration,
      durationPeriods: useMultiDuration
        ? dataRows.map((row, index) => ({
            periodNo: index + 1,
            durationDays: parseNumber(row.duration),
            dailyHire: parseNumber(row.dailyHire),
          }))
        : [],
    },
  ];
}

function mapTermsToRows(
  terms: TimeCharterSnapshotPayload["charterTerms"],
  keyPrefix: string,
): TcCpRow[] {
  return terms.map((term, index) => ({
    key: `loaded-${keyPrefix}-cp-${index + 1}`,
    account: "",
    accountCompanyId: term.accountCompanyId,
    deliveryPort: "",
    deliveryPortId: term.deliveryPortId,
    redeliveryPort: "",
    redeliveryPortId: term.redeliveryPortId,
    duration: formatNumber(term.durationDays),
    dailyHire: formatNumber(term.dailyHire),
    grossHire: formatNumber(term.grossHire),
    addComm: formatPercent(term.addCommPct),
    brkg: formatPercent(term.brokeragePct),
  }));
}

function hasCpData(row: TcCpRow) {
  return Boolean(
    row.account || row.deliveryPort || row.redeliveryPort || row.duration || row.dailyHire,
  );
}

function hasPortData(row: TcPortRow) {
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

function mapLegType(value: string): TimeCharterSnapshotPayload["portLegs"][number]["legType"] {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("delivery")) return "DELIVERY";
  if (normalized.startsWith("redelivery")) return "REDELIVERY";
  if (normalized.startsWith("ballast")) return "BALLAST";
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

function formatLegType(value: TimeCharterSnapshotPayload["portLegs"][number]["legType"]) {
  if (value === "DELIVERY") return "Delivery";
  if (value === "REDELIVERY") return "Redelivery";
  if (value === "BALLAST") return "Ballast";
  if (value === "CANAL") return "Canal";
  if (value === "BUNKER") return "Bunker";
  return "Others";
}
