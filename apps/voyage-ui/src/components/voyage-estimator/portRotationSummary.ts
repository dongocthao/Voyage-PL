type SummaryAccessors<T> = {
  isSummaryRow: (row: T) => boolean;
  type: (row: T) => string;
  sea: (row: T) => string;
  idle: (row: T) => string;
  working?: (row: T) => string;
  eca?: (row: T) => string;
  wf?: (row: T) => string;
  spd?: (row: T) => string;
  departure: (row: T) => string;
  classifySeaState?: (row: T, index: number, activeRows: T[]) => "ballast" | "laden" | undefined;
  classifyMarginSeaState?: (
    summaryRow: T,
    activeRows: T[],
    lastSeaState: "ballast" | "laden" | undefined,
  ) => "ballast" | "laden" | undefined;
};

export function buildPortRotationSummary<T>(rows: T[], accessors: SummaryAccessors<T>): string {
  const activeRows = rows.filter((row) => !accessors.isSummaryRow(row));
  const summaryRows = rows.filter((row) => accessors.isSummaryRow(row));
  const seaBuckets = buildSeaBuckets(activeRows, summaryRows, accessors);
  const ballastDays = seaBuckets.ballast;
  const ladenDays = seaBuckets.laden;
  const portDays =
    sum(activeRows.map((row) => parseAmount(accessors.idle(row)) + parseAmount(accessors.working?.(row)))) +
    sum(summaryRows.map((row) => parseAmount(accessors.idle(row)) + parseAmount(accessors.working?.(row))));
  const ecaDays = sum(
    activeRows.map((row) =>
      calculateEcaDays(accessors.eca?.(row), accessors.wf?.(row), accessors.spd?.(row)),
    ),
  );
  const totalDuration = ballastDays + ladenDays + portDays;
  const firstDeparture = firstText(activeRows.map((row) => accessors.departure(row)));
  const lastDeparture = lastText(activeRows.map((row) => accessors.departure(row)));

  return `Total Duration: ${formatAmount(totalDuration)} Days (Ballast: ${formatAmount(
    ballastDays,
  )}, Laden: ${formatAmount(ladenDays)}, ECA: ${formatAmount(ecaDays)}, Port: ${formatAmount(
    portDays,
  )}) / (Port local time) ${formatDisplayDateTime(firstDeparture)} ~ ${formatDisplayDateTime(lastDeparture)}`;
}

export function classifySeaStateByCargoFlow<T>(
  rows: T[],
  row: T,
  index: number,
  typeOf: (row: T) => string,
): "ballast" | "laden" {
  const currentType = normalizePortType(typeOf(row));
  if (currentType === "ballast" || currentType === "laden") {
    return currentType;
  }

  let cargoOnBoard = false;

  for (let cursor = 0; cursor < index; cursor += 1) {
    const previousType = normalizePortType(typeOf(rows[cursor]));
    if (previousType === "loading") {
      cargoOnBoard = true;
      continue;
    }
    if (previousType === "discharge") {
      cargoOnBoard = hasFutureDischarge(rows, cursor, typeOf);
      continue;
    }
  }

  if (currentType === "loading") {
    return cargoOnBoard ? "laden" : "ballast";
  }
  if (currentType === "discharge") {
    return cargoOnBoard ? "laden" : "ballast";
  }
  return cargoOnBoard ? "laden" : "ballast";
}

function buildSeaBuckets<T>(
  activeRows: T[],
  summaryRows: T[],
  accessors: SummaryAccessors<T>,
): { ballast: number; laden: number } {
  let ballast = 0;
  let laden = 0;
  let lastSeaState: "ballast" | "laden" | undefined;

  activeRows.forEach((row, index) => {
    const state = resolveSeaState(row, index, activeRows, accessors);
    const sea = parseAmount(accessors.sea(row));
    if (state === "ballast") ballast += sea;
    if (state === "laden") laden += sea;
    if (state) lastSeaState = state;
  });

  summaryRows.forEach((row) => {
    const state =
      accessors.classifyMarginSeaState?.(row, activeRows, lastSeaState) ??
      lastSeaState ??
      normalizeType(accessors.type(row));
    const sea = parseAmount(accessors.sea(row));
    if (state === "ballast") ballast += sea;
    if (state === "laden") laden += sea;
  });

  return { ballast, laden };
}

function resolveSeaState<T>(
  row: T,
  index: number,
  activeRows: T[],
  accessors: SummaryAccessors<T>,
) {
  return accessors.classifySeaState?.(row, index, activeRows) ?? normalizeType(accessors.type(row));
}

function normalizeType(value: string): "ballast" | "laden" | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("ballast")) return "ballast";
  if (normalized.startsWith("laden")) return "laden";
  return undefined;
}

function normalizePortType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("ballast")) return "ballast" as const;
  if (normalized.startsWith("laden")) return "laden" as const;
  if (normalized.startsWith("loading")) return "loading" as const;
  if (normalized.startsWith("dis")) return "discharge" as const;
  return "other" as const;
}

function hasFutureDischarge<T>(rows: T[], fromIndex: number, typeOf: (row: T) => string) {
  for (let cursor = fromIndex + 1; cursor < rows.length; cursor += 1) {
    if (normalizePortType(typeOf(rows[cursor])) === "discharge") {
      return true;
    }
  }
  return false;
}

function calculateEcaDays(eca?: string, wf?: string, spd?: string): number {
  const ecaDistance = parseAmount(eca);
  const weatherFactor = parseAmount(wf);
  const speed = parseAmount(spd);
  if (!ecaDistance || !speed) return 0;
  return (ecaDistance * (1 + weatherFactor / 100)) / (speed * 24);
}

function parseAmount(value?: string): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: Array<number | undefined>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function firstText(values: string[]) {
  return values.find((value) => value.trim()) ?? "";
}

function lastText(values: string[]) {
  return [...values].reverse().find((value) => value.trim()) ?? "";
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDisplayDateTime(value: string) {
  const parsed = parseDateTime(value);
  if (!parsed) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`;
}

function parseDateTime(value: string | undefined) {
  if (!value || /time/i.test(value)) return undefined;
  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (ddmmyyyy) {
    const [, day, month, year, hour, minute] = ddmmyyyy;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (yyyymmdd) {
    const [, year, month, day, hour, minute] = yyyymmdd;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
