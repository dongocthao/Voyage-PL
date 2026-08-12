import { Button, Checkbox, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo } from "react";
import {
  EnvironmentOutlined,
  DesktopOutlined,
  LineChartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { portRotationData, portSummary, type CargoRow, type PortRow } from "./mockData";
import { RowToolbar } from "./CargoTable";
import { useRowOps } from "./useRowOps";
import { useResizableColumns } from "./useResizableColumns";
import type { LookupItem } from "@/lib/api/masterData";
import { buildPortRotationSummary, classifySeaStateByCargoFlow } from "./portRotationSummary";

const isMargin = (r: PortRow) => r.key === "margin";
type PortField = keyof PortRow;
const PORT_TYPE_OPTIONS = [
  "Laden",
  "Ballast",
  "Loading",
  "Discharge",
  "Bunkering",
  "Canal",
  "Drydocking",
  "Others",
];

function lookupLabel(item: LookupItem) {
  if (item.name && item.country) return `${item.name} <${item.country}>`;
  return item.name ?? item.code ?? String(item.id);
}

function PortLookupCell({
  value,
  options,
  onChange,
  onSelect,
}: {
  value: string;
  options: LookupItem[];
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Select
      showSearch
      allowClear
      size="small"
      variant="borderless"
      value={value || undefined}
      onSearch={onChange}
      onChange={(next) => {
        const value = next ?? "";
        onChange(value);
        onSelect(value);
      }}
      style={{ width: "100%", fontSize: 11 }}
      options={options.map((item) => ({ value: lookupLabel(item), label: lookupLabel(item) }))}
      filterOption={(input, option) =>
        String(option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    />
  );
}

const text =
  (
    update: (key: string, field: PortField, value: string) => void,
    field: PortField,
    right?: boolean,
    editable?: (r: PortRow) => boolean,
  ) =>
  (v: string, r: PortRow) =>
    editable?.(r) || !isMargin(r) ? (
      <TxtCell
        value={v}
        right={right}
        readOnly={Boolean(!editable?.(r) && field === "working")}
        onChange={(value) => update(r.key, field, value)}
      />
    ) : isMargin(r) ? (
      <span className={right ? "block pr-1 text-right" : ""}>{v}</span>
    ) : (
      <TxtCell value={v} right={right} readOnly />
    );

const yellow =
  (
    update: (key: string, field: PortField, value: string) => void,
    field: PortField,
    right = true,
    editable?: (r: PortRow) => boolean,
  ) =>
  (v: string, r: PortRow) =>
    editable?.(r) || !isMargin(r) ? (
      <YCell value={v} right={right} onChange={(value) => update(r.key, field, value)} />
    ) : isMargin(r) ? (
      <span className={right ? "block pr-1 text-right" : ""}>{v}</span>
    ) : (
      <YCell value={v} right={right} readOnly />
    );

const buildColumns = (
  update: (key: string, field: PortField, value: string) => void,
  selectPort: (key: string, value: string) => void,
  ports: LookupItem[],
): ColumnsType<PortRow> => [
  { title: "#", dataIndex: "no", width: 42, align: "center" },
  {
    title: "Type",
    dataIndex: "type",
    width: 86,
    render: (v: string, r) =>
      isMargin(r) ? (
        <b>{v}</b>
      ) : (
        <Select
          size="small"
          variant="borderless"
          value={v || undefined}
          onChange={(value) => update(r.key, "type", value)}
          style={{ width: "100%", fontSize: 11 }}
          options={PORT_TYPE_OPTIONS.map((value) => ({ value, label: value }))}
        />
      ),
  },
  {
    title: "Port Name / Coordinate",
    dataIndex: "port",
    width: 220,
    render: (v: string, row) =>
      isMargin(row) ? (
        <span>{v}</span>
      ) : (
        <PortLookupCell
          value={v}
          options={ports}
          onChange={(value) => update(row.key, "port", value)}
          onSelect={(value) => selectPort(row.key, value)}
        />
      ),
  },
  {
    title: "Time Zone",
    dataIndex: "timezone",
    width: 82,
    align: "center",
    render: (value: string) => <YCell value={value} right={false} readOnly />,
  },
  {
    title: "Distance",
    children: [
      {
        title: "TTL",
        dataIndex: "distance",
        width: 70,
        align: "right",
        render: text(update, "distance", true),
      },
      {
        title: "ECA",
        dataIndex: "eca",
        width: 64,
        align: "right",
        render: text(update, "eca", true),
      },
    ],
  },
  { title: "WF", dataIndex: "wf", width: 66, align: "right", render: text(update, "wf", true) },
  {
    title: "Spd",
    dataIndex: "spd",
    width: 64,
    align: "right",
    render: yellow(update, "spd", true),
  },
  {
    title: "Sea",
    dataIndex: "sea",
    width: 64,
    align: "right",
    render: (value: string, row) =>
      isMargin(row) ? (
        <YCell value={value} right onChange={(next) => update(row.key, "sea", next)} />
      ) : (
        <YCell value={value} right readOnly />
      ),
  },
  {
    title: "L/D Rate",
    dataIndex: "ldRate",
    width: 86,
    align: "right",
    render: yellow(update, "ldRate", true),
  },
  {
    title: "Port (I/W)",
    children: [
      {
        title: "Idle",
        dataIndex: "idle",
        width: 64,
        align: "right",
        render: yellow(update, "idle", true, isMargin),
      },
      {
        title: "Working",
        dataIndex: "working",
        width: 72,
        align: "right",
        render: (value: string) => <YCell value={value} right readOnly />,
      },
    ],
  },
  {
    title: "Dem",
    dataIndex: "dem",
    width: 64,
    align: "right",
    render: text(update, "dem", true),
  },
  {
    title: "Des",
    dataIndex: "des",
    width: 72,
    align: "right",
    render: text(update, "des", true),
  },
  {
    title: "Port Charge",
    dataIndex: "portCharge",
    width: 96,
    align: "right",
    render: yellow(update, "portCharge", true),
  },
  {
    title: "Arrival",
    dataIndex: "arrival",
    width: 118,
    align: "center",
    render: (value: string, row) =>
      row.key === "1" ? (
        <TxtCell value={value} onChange={(next) => update(row.key, "arrival", next)} />
      ) : (
        <YCell value={value} right={false} readOnly />
      ),
  },
  {
    title: "Departure",
    dataIndex: "departure",
    width: 118,
    align: "center",
    render: (value: string, row) =>
      row.key === "1" ? (
        <TxtCell value={value} onChange={(next) => update(row.key, "departure", next)} />
      ) : (
        <YCell value={value} right={false} readOnly />
      ),
  },
];

export default function PortRotationTable({
  onOpenAnalyzer,
  onOpenRemark,
  onRowsChange,
  timeDisplayUnit = "DAYS",
  timezoneDisplayMode = "PORT_LOCAL",
  onTimeDisplayUnitChange,
  onTimezoneDisplayModeChange,
  routingSuez = true,
  routingPanama = true,
  routingKiel = false,
  onRoutingSuezChange,
  onRoutingPanamaChange,
  onRoutingKielChange,
  initialRows = portRotationData,
  reloadKey,
  ports = [],
  cargoRows = [],
}: {
  onOpenAnalyzer?: () => void;
  onOpenRemark?: () => void;
  onRowsChange?: (rows: PortRow[]) => void;
  timeDisplayUnit?: "DAYS" | "HOURS";
  timezoneDisplayMode?: "PORT_LOCAL" | "UTC";
  onTimeDisplayUnitChange?: (value: "DAYS" | "HOURS") => void;
  onTimezoneDisplayModeChange?: (value: "PORT_LOCAL" | "UTC") => void;
  routingSuez?: boolean;
  routingPanama?: boolean;
  routingKiel?: boolean;
  onRoutingSuezChange?: (value: boolean) => void;
  onRoutingPanamaChange?: (value: boolean) => void;
  onRoutingKielChange?: (value: boolean) => void;
  initialRows?: PortRow[];
  reloadKey?: number;
  ports?: LookupItem[];
  cargoRows?: CargoRow[];
} = {}) {
  const port = useRowOps<PortRow>(initialRows);
  const { setRows } = port;
  const update = (key: string, field: PortField, value: string) => {
    port.setRows((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };
  const selectPort = (key: string, value: string) => {
    const selected = ports.find((item) => lookupLabel(item) === value);
    port.setRows((rows) =>
      rows.map((row) =>
        row.key === key ? { ...row, port: value, portId: selected?.id?.toString() } : row,
      ),
    );
  };
  const columns = useResizableColumns(buildColumns(update, selectPort, ports));
  const calculatedRows = useMemo(
    () => calculatePortSchedule(port.rows, cargoRows),
    [cargoRows, port.rows],
  );
  const totals = portTotals(calculatedRows);
  const summaryText = useMemo(
    () =>
      buildPortRotationSummary(calculatedRows, {
        isSummaryRow: isMargin,
        type: (row) => row.type,
        sea: (row) => row.sea,
        idle: (row) => row.idle,
        working: (row) => row.working,
        eca: (row) => row.eca,
        wf: (row) => row.wf,
        spd: (row) => row.spd,
        departure: (row) => row.departure,
        classifySeaState: (row, index, activeRows) =>
          classifySeaStateByCargoFlow(activeRows, row, index, (item) => item.type),
        classifyMarginSeaState: (_row, _activeRows, lastSeaState) => lastSeaState,
      }),
    [calculatedRows],
  );

  useEffect(() => {
    onRowsChange?.(calculatedRows);
  }, [calculatedRows, onRowsChange]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows, reloadKey, setRows]);

  return (
    <section className="mb-2">
      <div className="ve-routing-checkboxes mb-1 flex flex-wrap items-center gap-3">
        <SectionTitle>Port Rotation</SectionTitle>
        <Checkbox
          checked={routingSuez}
          className="text-[11px]"
          onChange={(event) => onRoutingSuezChange?.(event.target.checked)}
        >
          SUEZ
        </Checkbox>
        <Checkbox
          checked={routingPanama}
          className="text-[11px]"
          onChange={(event) => onRoutingPanamaChange?.(event.target.checked)}
        >
          PANAMA
        </Checkbox>
        <Checkbox
          checked={routingKiel}
          className="text-[11px]"
          onChange={(event) => onRoutingKielChange?.(event.target.checked)}
        >
          KIEL
        </Checkbox>
        <span className="text-[11px] font-bold text-gray-700" style={{ marginLeft: 430 }}>
          {summaryText || portSummary}
        </span>
      </div>

      <Table<PortRow>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        columns={columns}
        dataSource={calculatedRows}
        onRow={port.onRow}
        rowClassName={(r) =>
          isMargin(r) ? "ve-margin-row" : r.key === port.selectedKey ? "ve-row-selected" : ""
        }
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ background: "#EAF3FF", fontWeight: 600 }}>
              <Table.Summary.Cell index={0} colSpan={4} align="right">
                Totals
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                {formatAmount(totals.distance)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                {formatAmount(totals.eca)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
              <Table.Summary.Cell index={7} />
              <Table.Summary.Cell index={8} align="right">
                {formatAmount(totals.sea)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
              <Table.Summary.Cell index={10} align="right">
                {formatAmount(totals.idle)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11} align="right">
                {formatAmount(totals.working)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={12} align="right">
                {formatAmount(totals.dem)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={13} align="right">
                {formatAmount(totals.des)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={14} align="right">
                {formatAmount(totals.portCharge)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={15} align="center">
                {totals.arrival}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={16} align="center">
                {totals.departure}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
      <RowToolbar
        onDelete={port.remove}
        onAdd={port.add}
        onInsertAbove={port.insertAbove}
        onInsertBelow={port.insertBelow}
      />

      {/* Control row */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button size="small" icon={<LineChartOutlined />} onClick={onOpenAnalyzer}>
          Analyzer
        </Button>
        <Button size="small" icon={<FileTextOutlined />} onClick={onOpenRemark}>
          Remark
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Select
            size="small"
            value={timeDisplayUnit}
            onChange={onTimeDisplayUnitChange}
            style={{ width: 80 }}
            options={[
              { value: "DAYS", label: "Days" },
              { value: "HOURS", label: "Hours" },
            ]}
          />
          <span
            className="rounded-sm border px-2 py-[1px] text-[11px]"
            style={{
              borderColor: VE_COLORS.titleBar,
              color: VE_COLORS.titleBar,
              background: "#EAF3FF",
            }}
          >
            <EnvironmentOutlined /> Port Local
          </span>
          <span
            className="rounded-sm border px-2 py-[1px] text-[11px]"
            style={{ borderColor: VE_COLORS.border }}
          >
            <DesktopOutlined /> PC Time
          </span>
          <Select
            size="small"
            value={timezoneDisplayMode}
            onChange={onTimezoneDisplayModeChange}
            style={{ width: 130 }}
            options={[
              { value: "PORT_LOCAL", label: "Port local time" },
              { value: "UTC", label: "UTC" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function portTotals(rows: PortRow[]) {
  const activeRows = rows.filter((row) => !isMargin(row));
  return {
    distance: sum(activeRows.map((row) => parseAmount(row.distance))),
    eca: sum(activeRows.map((row) => parseAmount(row.eca))),
    sea: sum(activeRows.map((row) => parseAmount(row.sea))),
    idle:
      sum(activeRows.map((row) => parseAmount(row.idle))) + parseAmount(rows.find(isMargin)?.idle),
    working: sum(activeRows.map((row) => parseAmount(row.working))),
    dem: sum(activeRows.map((row) => parseAmount(row.dem))),
    des: sum(activeRows.map((row) => parseAmount(row.des))),
    portCharge: sum(activeRows.map((row) => parseAmount(row.portCharge))),
    arrival: activeRows.find((row) => row.arrival)?.arrival ?? "",
    departure: [...activeRows].reverse().find((row) => row.departure)?.departure ?? "",
  };
}

function calculatePortSchedule(rows: PortRow[], cargoRows: CargoRow[]) {
  let previousDeparture: Date | undefined;
  let previousTimezone = "";

  return rows.map((row) => {
    const timezone = resolvePortTimezone(row.port) || row.timezone || "";

    if (isMargin(row)) {
      const arrival = addDays(previousDeparture, parseAmount(row.sea));
      const departure = addDays(arrival, parseAmount(row.idle));
      return {
        ...row,
        timezone: "",
        arrival: formatDateTime(arrival),
        departure: formatDateTime(departure),
      };
    }

    const seaDays = calculateSeaDays(row);
    const working = calculateWorkingDays(row, cargoRows);
    const arrival = previousDeparture
      ? addDays(previousDeparture, (seaDays ?? 0) + timezoneDeltaDays(previousTimezone, timezone))
      : parseDateTime(row.arrival);
    const initialDeparture = parseDateTime(row.departure);
    const departure =
      addDays(arrival, parseAmount(row.idle) + parseAmount(working)) ?? initialDeparture;
    previousDeparture = departure ?? arrival ?? previousDeparture;
    previousTimezone = timezone || previousTimezone;

    return {
      ...row,
      timezone,
      sea: seaDays === undefined ? "" : formatAmount(seaDays, 2),
      working,
      arrival: formatDateTime(arrival),
      departure: formatDateTime(departure),
    };
  });
}

function calculateSeaDays(row: PortRow) {
  const ttl = parseAmount(row.distance);
  const eca = parseAmount(row.eca);
  const wf = parseAmount(row.wf);
  const speed = parseAmount(row.spd);
  if (!speed) return undefined;
  return ((ttl + eca) * (1 + wf / 100)) / (speed * 24);
}

function calculateWorkingDays(row: PortRow, cargoRows: CargoRow[]) {
  const ldRate = parseAmount(row.ldRate);
  if (!ldRate) return "";

  const portName = normalizePortName(row.port);
  const isLoading = /load/i.test(row.type);
  const isDischarging = /disch|discharge/i.test(row.type);
  if (!isLoading && !isDischarging) return "";

  const quantity = sum(
    cargoRows
      .filter((cargo) => {
        const cargoPort = normalizePortName(isLoading ? cargo.loadingPort : cargo.dischargingPort);
        return cargoPort && cargoPort === portName;
      })
      .map((cargo) => parseAmount(cargo.quantity)),
  );

  if (!quantity) return "";
  return formatAmount(quantity / ldRate, 2);
}

function normalizePortName(value: string | undefined) {
  return (value ?? "")
    .replace(/\s*\[[+-]\d{2}:\d{2}\]\s*/g, "")
    .trim()
    .toLowerCase();
}

function resolvePortTimezone(portNameOrCoordinate: string) {
  const match = portNameOrCoordinate.match(/\[([+-]\d{2}:\d{2})\]/);
  return match?.[1] ?? "";
}

function timezoneDeltaDays(fromTimezone: string, toTimezone: string) {
  return (parseTimezoneHours(toTimezone) - parseTimezoneHours(fromTimezone)) / 24;
}

function parseTimezoneHours(value: string) {
  const match = value.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) + Number(match[3]) / 60);
}

function addDays(date: Date | undefined, days: number | undefined) {
  if (!date || days === undefined) return undefined;
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + days * 24 * 60);
  return next;
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

function formatDateTime(value: Date | undefined) {
  if (!value) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(
    value.getHours(),
  )}:${pad(value.getMinutes())}`;
}

function parseAmount(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatAmount(value: number, digits = 1) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
