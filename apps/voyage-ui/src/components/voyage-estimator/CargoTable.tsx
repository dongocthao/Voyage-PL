import { Button, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, type CSSProperties } from "react";
import {
  SearchOutlined,
  DeleteOutlined,
  PlusOutlined,
  InsertRowLeftOutlined,
  InsertRowRightOutlined,
  TableOutlined,
  CalculatorOutlined,
  FundOutlined,
} from "@ant-design/icons";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { cargoData, type CargoRow } from "./mockData";
import { useRowOps } from "./useRowOps";
import { useResizableColumns } from "./useResizableColumns";
import type { LookupItem } from "@/lib/api/masterData";

type CargoField = keyof CargoRow;
type CargoLookupKind = "companies" | "cargoes" | "ports" | "cpTerms";

type CargoLookups = Partial<Record<CargoLookupKind, LookupItem[]>>;
const UNIT_OPTIONS = ["MT", "KG", "TON", "M3", "CBM", "BBL", "GAL", "LTR", "PCS", "UNIT"];
const PERCENT_COL_WIDTH = 58;

function lookupLabel(item: LookupItem) {
  if (item.term && item.code) return item.code;
  if (item.name && item.country) return `${item.name} <${item.country}>`;
  return item.name ?? item.term ?? item.code ?? String(item.id);
}

function LookupCell({
  value,
  options = [],
  onChange,
  onSelect,
}: {
  value: string;
  options?: LookupItem[];
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

const buildColumns = (
  update: (key: string, field: CargoField, value: string | boolean) => void,
  selectLookup: (
    key: string,
    kind: CargoLookupKind,
    value: string,
    targetField?: CargoField,
  ) => void,
  lookups: CargoLookups,
): ColumnsType<CargoRow> => [
  { title: "#", dataIndex: "no", width: 42, align: "center" },
  {
    title: "Account",
    dataIndex: "account",
    width: 108,
    render: (v: string, row) => (
      <LookupCell
        value={v}
        options={lookups.companies}
        onChange={(value) => update(row.key, "account", value)}
        onSelect={(value) => selectLookup(row.key, "companies", value)}
      />
    ),
  },
  {
    title: "Cargo Name",
    dataIndex: "cargoName",
    width: 136,
    render: (v: string, row) => (
      <LookupCell
        value={v}
        options={lookups.cargoes}
        onChange={(value) => update(row.key, "cargoName", value)}
        onSelect={(value) => selectLookup(row.key, "cargoes", value)}
      />
    ),
  },
  {
    title: "Loading Port",
    dataIndex: "loadingPort",
    width: 145,
    render: (v: string, row) => (
      <LookupCell
        value={v}
        options={lookups.ports}
        onChange={(value) => update(row.key, "loadingPort", value)}
        onSelect={(value) => selectLookup(row.key, "ports", value)}
      />
    ),
  },
  {
    title: "Discharging Port",
    dataIndex: "dischargingPort",
    width: 145,
    render: (v: string, row) => (
      <LookupCell
        value={v}
        options={lookups.ports}
        onChange={(value) => update(row.key, "dischargingPort", value)}
        onSelect={(value) => selectLookup(row.key, "ports", value, "dischargingPort")}
      />
    ),
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    width: 88,
    align: "right",
    render: (v: string, row) => (
      <TxtCell value={v} right onChange={(value) => update(row.key, "quantity", value)} />
    ),
  },
  {
    title: "Unit",
    dataIndex: "unit",
    width: 58,
    align: "center",
    render: (v: string, row) => (
      <Select
        size="small"
        variant="borderless"
        value={v || undefined}
        onChange={(value) => update(row.key, "unit", value)}
        style={{ width: "100%", fontSize: 11 }}
        options={UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit }))}
      />
    ),
  },
  {
    title: "Freight",
    children: [
      {
        title: "Frt",
        dataIndex: "frt",
        width: 72,
        align: "right",
        render: (v: string, row) => (
          <TxtCell
            value={v}
            right
            readOnly={row.frtType === "L"}
            onChange={(value) => update(row.key, "frt", value)}
          />
        ),
      },
      {
        title: "Term",
        dataIndex: "term",
        width: 82,
        align: "center",
        render: (v: string, row) => (
          <LookupCell
            value={v}
            options={lookups.cpTerms}
            onChange={(value) => update(row.key, "term", value)}
            onSelect={(value) => selectLookup(row.key, "cpTerms", value)}
          />
        ),
      },
      {
        title: "Frt Type",
        dataIndex: "frtType",
        width: 64,
        align: "center",
        render: (v: string, row) => (
          <Select
            size="small"
            variant="borderless"
            value={v || "F"}
            onChange={(value) => update(row.key, "frtType", value)}
            style={{ width: "100%", fontSize: 11 }}
            options={[
              { value: "F", label: "F" },
              { value: "L", label: "L" },
            ]}
          />
        ),
      },
      {
        title: "Frt Lumpsum",
        dataIndex: "frtLumpsum",
        width: 96,
        align: "right",
        render: (v: string, row) => (
          <TxtCell
            value={v}
            right
            readOnly={row.frtType !== "L"}
            onChange={(value) => update(row.key, "frtLumpsum", value)}
          />
        ),
      },
      {
        title: "Total Freight",
        dataIndex: "totalFreight",
        width: 118,
        align: "right",
        render: (_v: string, row) => <YCell value={formatAmount(freightAmount(row))} readOnly />,
      },
    ],
  },
  {
    title: "A. Comm",
    dataIndex: "aComm",
    width: PERCENT_COL_WIDTH,
    align: "right",
    render: (v: string, row) => (
      <TxtCell
        value={v}
        right
        onChange={(value) => update(row.key, "aComm", formatPercentInput(value))}
      />
    ),
  },
  {
    title: "Brkg",
    dataIndex: "brkg",
    width: PERCENT_COL_WIDTH,
    align: "right",
    render: (v: string, row) => (
      <TxtCell
        value={v}
        right
        onChange={(value) => update(row.key, "brkg", formatPercentInput(value))}
      />
    ),
  },
  {
    title: "Frt Tax",
    dataIndex: "frtTax",
    width: PERCENT_COL_WIDTH,
    align: "right",
    render: (v: string, row) => (
      <TxtCell
        value={v}
        right
        onChange={(value) => update(row.key, "frtTax", formatPercentInput(value))}
      />
    ),
  },
  {
    title: "Liner Term",
    dataIndex: "linerTerm",
    width: 76,
    align: "center",
    render: (v: string, row) => (
      <TxtCell value={v} onChange={(value) => update(row.key, "linerTerm", value)} />
    ),
  },
  {
    title: "",
    key: "search",
    width: 44,
    align: "center",
    render: () => <SearchOutlined style={{ color: "#888" }} />,
  },
];

export default function CargoTable({
  onOpenLoadableQuantity,
  onOpenFreightSimulator,
  onRowsChange,
  initialRows = cargoData,
  reloadKey,
  lookups = {},
}: {
  onOpenLoadableQuantity?: () => void;
  onOpenFreightSimulator?: () => void;
  onRowsChange?: (rows: CargoRow[]) => void;
  initialRows?: CargoRow[];
  reloadKey?: number;
  lookups?: CargoLookups;
} = {}) {
  const cargo = useRowOps<CargoRow>(initialRows);
  const { setRows } = cargo;
  const update = (key: string, field: CargoField, value: string | boolean) => {
    cargo.setRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };
  const selectLookup = (
    key: string,
    kind: CargoLookupKind,
    value: string,
    targetField?: CargoField,
  ) => {
    const options = lookups[kind] ?? [];
    const selected = options.find((item) => lookupLabel(item) === value);
    cargo.setRows((rows) =>
      rows.map((row) => {
        if (row.key !== key) return row;
        if (kind === "companies") {
          return { ...row, account: value, accountCompanyId: selected?.id?.toString() };
        }
        if (kind === "cargoes") {
          return {
            ...row,
            cargoName: value,
            cargoId: selected?.id?.toString(),
            unit: selected?.defaultUnit ?? row.unit,
          };
        }
        if (kind === "ports") {
          const field = targetField === "dischargingPort" ? "dischargingPort" : "loadingPort";
          const idField = field === "dischargingPort" ? "dischargingPortId" : "loadingPortId";
          return { ...row, [field]: value, [idField]: selected?.id?.toString() };
        }
        return { ...row, term: value, freightTermId: selected?.id?.toString() };
      }),
    );
  };
  const columns = useResizableColumns(buildColumns(update, selectLookup, lookups));
  const totals = cargoTotals(cargo.rows);

  useEffect(() => {
    onRowsChange?.(cargo.rows);
  }, [cargo.rows, onRowsChange]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows, reloadKey, setRows]);

  return (
    <section className="mb-2">
      <div className="mb-1 flex items-center gap-3">
        <SectionTitle>Cargo</SectionTitle>
        <Button size="small" icon={<CalculatorOutlined />} onClick={onOpenLoadableQuantity}>
          Loadable Quantity Calculator
        </Button>
        <Button size="small" icon={<FundOutlined />} onClick={onOpenFreightSimulator}>
          Frt. Simulator
        </Button>
      </div>
      <Table<CargoRow>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        columns={columns}
        dataSource={cargo.rows}
        onRow={cargo.onRow}
        rowClassName={(row) => (row.key === cargo.selectedKey ? "ve-row-selected" : "")}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ background: "#F5F7FA", fontWeight: 600 }}>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                Total
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                {formatAmount(totals.quantity)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
              <Table.Summary.Cell index={7} align="right">
                {formatAmount(totals.averageFreight)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} />
              <Table.Summary.Cell index={9} />
              <Table.Summary.Cell index={10} align="right">
                {formatAmount(totals.freightLumpsum)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11} align="right">
                {formatAmount(totals.totalFreight)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={12} align="right">
                {formatPercent(totals.addCommPct)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={13} align="right">
                {formatPercent(totals.brokeragePct)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={14} align="right">
                {formatPercent(totals.freightTaxPct)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={15} align="right">
                {formatAmount(totals.linerTerm)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={16} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
      <RowToolbar
        onDelete={cargo.remove}
        onAdd={cargo.add}
        onInsertAbove={cargo.insertAbove}
        onInsertBelow={cargo.insertBelow}
      />
    </section>
  );
}

function cargoTotals(rows: CargoRow[]) {
  const activeRows = rows.filter((row) => row.key !== "margin");
  const quantity = sum(activeRows.map((row) => parseAmount(row.quantity)));
  const freightLumpsum = sum(activeRows.map((row) => parseAmount(row.frtLumpsum)));
  const totalFreight = sum(activeRows.map((row) => freightAmount(row)));
  const linerTerm = sum(activeRows.map((row) => parseAmount(row.linerTerm)));
  const averageFreight = quantity ? totalFreight / quantity : 0;

  return {
    quantity,
    averageFreight,
    freightLumpsum,
    totalFreight,
    addCommPct: weightedPct(activeRows, "aComm"),
    brokeragePct: weightedPct(activeRows, "brkg"),
    freightTaxPct: weightedPct(activeRows, "frtTax"),
    linerTerm,
  };
}

function weightedPct(rows: CargoRow[], field: "aComm" | "brkg" | "frtTax") {
  const totalFreight = sum(rows.map((row) => freightAmount(row)));
  if (!totalFreight) return 0;

  return sum(rows.map((row) => freightAmount(row) * parseAmount(row[field]))) / totalFreight;
}

function freightAmount(row: CargoRow) {
  return row.frtType === "L"
    ? parseAmount(row.frtLumpsum)
    : parseAmount(row.quantity) * parseAmount(row.frt);
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

function formatPercent(value: number) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

function formatPercentInput(value: string) {
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
  if (!cleaned.trim() || cleaned === "-" || cleaned === ".") return "";
  return `${cleaned} %`;
}

export type RowToolbarProps = {
  onDelete?: () => void;
  onAdd?: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
};

export function RowToolbar({
  onDelete,
  onAdd,
  onInsertAbove,
  onInsertBelow,
}: RowToolbarProps = {}) {
  const buttonStyle: CSSProperties = {
    width: 22,
    height: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${VE_COLORS.border}`,
    background: "#FFFFFF",
    color: VE_COLORS.titleBar,
    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
  };

  return (
    <div
      className="mt-[2px] flex items-center gap-[4px] border bg-[#F5F7FA] px-2 py-[2px] text-[12px]"
      style={{ borderColor: VE_COLORS.border }}
    >
      <button type="button" title="Delete row" style={buttonStyle} onClick={onDelete}>
        <DeleteOutlined style={{ color: "#5A6E7F" }} />
      </button>
      <button type="button" title="Add row" style={buttonStyle} onClick={onAdd}>
        <PlusOutlined style={{ color: "#20A26B" }} />
      </button>
      <button type="button" title="Insert row above" style={buttonStyle} onClick={onInsertAbove}>
        <InsertRowLeftOutlined />
      </button>
      <button type="button" title="Insert row below" style={buttonStyle} onClick={onInsertBelow}>
        <InsertRowRightOutlined />
      </button>
      <button type="button" title="Rows" style={buttonStyle}>
        <TableOutlined />
      </button>
      <button type="button" title="Columns" style={buttonStyle}>
        <TableOutlined rotate={90} />
      </button>
    </div>
  );
}
