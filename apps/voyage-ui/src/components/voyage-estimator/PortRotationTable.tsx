import { Button, Checkbox, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect } from "react";
import {
  EnvironmentOutlined,
  DesktopOutlined,
  LineChartOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { portRotationData, portSummary, type PortRow } from "./mockData";
import { RowToolbar } from "./CargoTable";
import { useRowOps } from "./useRowOps";
import type { LookupItem } from "@/lib/api/masterData";

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
  { title: "#", dataIndex: "no", width: "2.6%", align: "center" },
  {
    title: "Type",
    dataIndex: "type",
    width: "5.7%",
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
    width: "18%",
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
    title: "Distance",
    children: [
      {
        title: "TTL",
        dataIndex: "distance",
        width: "5%",
        align: "right",
        render: text(update, "distance", true),
      },
      {
        title: "ECA",
        dataIndex: "eca",
        width: "4.1%",
        align: "right",
        render: text(update, "eca", true),
      },
    ],
  },
  { title: "WF", dataIndex: "wf", width: "4.4%", align: "right", render: text(update, "wf", true) },
  {
    title: "Spd",
    dataIndex: "spd",
    width: "4.4%",
    align: "right",
    render: yellow(update, "spd", true),
  },
  {
    title: "Sea",
    dataIndex: "sea",
    width: "4.4%",
    align: "right",
    render: yellow(update, "sea", true, isMargin),
  },
  {
    title: "L/D Rate",
    dataIndex: "ldRate",
    width: "6.4%",
    align: "right",
    render: yellow(update, "ldRate", true),
  },
  {
    title: "Port (I/W)",
    children: [
      {
        title: "Idle",
        dataIndex: "idle",
        width: "4.1%",
        align: "right",
        render: yellow(update, "idle", true, isMargin),
      },
      {
        title: "Working",
        dataIndex: "working",
        width: "4.7%",
        align: "right",
        render: text(update, "working", true),
      },
    ],
  },
  {
    title: "Dem",
    dataIndex: "dem",
    width: "4.1%",
    align: "right",
    render: text(update, "dem", true),
  },
  {
    title: "Des",
    dataIndex: "des",
    width: "5.5%",
    align: "right",
    render: text(update, "des", true),
  },
  {
    title: "Port Charge",
    dataIndex: "portCharge",
    width: "7.3%",
    align: "right",
    render: yellow(update, "portCharge", true),
  },
  {
    title: "Arrival",
    dataIndex: "arrival",
    width: "9.6%",
    align: "center",
    render: text(update, "arrival"),
  },
  {
    title: "Departure",
    dataIndex: "departure",
    width: "9.7%",
    align: "center",
    render: text(update, "departure", false, (r) => r.key === "1"),
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
  const columns = buildColumns(update, selectPort, ports);
  const totals = portTotals(port.rows);

  useEffect(() => {
    onRowsChange?.(port.rows);
  }, [port.rows, onRowsChange]);

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
        <span className="text-[11px] text-gray-600">{portSummary}</span>
      </div>

      <Table<PortRow>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        columns={columns}
        dataSource={port.rows}
        onRow={port.onRow}
        rowClassName={(r) =>
          isMargin(r) ? "ve-margin-row" : r.key === port.selectedKey ? "ve-row-selected" : ""
        }
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ background: "#EAF3FF", fontWeight: 600 }}>
              <Table.Summary.Cell index={0} colSpan={3} align="right">
                Totals
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                {formatAmount(totals.distance)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                {formatAmount(totals.eca)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} />
              <Table.Summary.Cell index={6} />
              <Table.Summary.Cell index={7} align="right">
                {formatAmount(totals.sea)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} />
              <Table.Summary.Cell index={9} align="right">
                {formatAmount(totals.idle)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">
                {formatAmount(totals.working)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11} align="right">
                {formatAmount(totals.dem)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={12} align="right">
                {formatAmount(totals.des)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={13} align="right">
                {formatAmount(totals.portCharge)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={14} align="center">
                {totals.arrival}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={15} align="center">
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

function parseAmount(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
