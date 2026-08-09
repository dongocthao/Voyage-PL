import { useEffect, useState } from "react";
import { Table, Button, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  MinusCircleFilled,
  PlusCircleFilled,
  PlusOutlined,
  SwapOutlined,
  FileTextOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { operationExpense, bunkerData, resultRows, profitUsd, type BunkerRow } from "./mockData";
import type { VoyageSnapshotPayload, VoyageSnapshotResult } from "@/lib/api/voyageSnapshots";

const normalizeLabel = (value: string) => value.toLowerCase().replace(/[\s./]/g, "");
type OperationExpenseItem = NonNullable<VoyageSnapshotPayload["operationExpenseItems"]>[number];
type MiscItem = NonNullable<VoyageSnapshotPayload["miscOperationExpenseItems"]>[number];

const formatNumber = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const bunkerCols: ColumnsType<BunkerRow> = [
  { title: "", dataIndex: "type", width: 60 },
  {
    title: "Price / MT",
    dataIndex: "price",
    width: 70,
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
  {
    title: "Consumption",
    dataIndex: "consumption",
    width: 80,
    align: "right",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
  {
    title: "Expense",
    dataIndex: "expense",
    width: 90,
    align: "right",
    render: (v: string) => <TxtCell value={v} right readOnly />,
  },
];

function KVGrid({
  rows,
  editableLabels = [],
  labelActions = {},
  valueHandlers = {},
}: {
  rows: Array<[string, string, string, string]>;
  editableLabels?: string[];
  labelActions?: Record<string, React.ReactNode>;
  valueHandlers?: Record<string, (value: string) => void>;
}) {
  const editableSet = new Set(editableLabels.map(normalizeLabel));
  const renderValue = (label: string, value: string) => {
    const normalized = normalizeLabel(label);
    const onChange = valueHandlers[normalized];
    return (
      <TxtCell
        value={value}
        right
        readOnly={!onChange && !editableSet.has(normalized)}
        onChange={onChange}
      />
    );
  };
  const renderLabel = (label: string) => {
    const action = labelActions[normalizeLabel(label)];
    return (
      <span className="flex items-center justify-between gap-1">
        <span>{label}</span>
        {action}
      </span>
    );
  };

  return (
    <div className="border text-[11px]" style={{ borderColor: VE_COLORS.border }}>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b last:border-b-0"
          style={{ borderColor: VE_COLORS.border }}
        >
          <div
            className="border-r px-1 py-[3px]"
            style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
          >
            {renderLabel(r[0])}
          </div>
          <div className="border-r p-[1px]" style={{ borderColor: VE_COLORS.border }}>
            {renderValue(r[0], r[1])}
          </div>
          <div
            className="border-r px-1 py-[3px]"
            style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
          >
            {renderLabel(r[2])}
          </div>
          <div className="p-[1px]">{renderValue(r[2], r[3])}</div>
        </div>
      ))}
    </div>
  );
}

function DetailModal({
  title,
  open,
  idTitle,
  descTitle,
  typeTitle,
  amountTitle,
  rows,
  onSave,
  onClose,
}: {
  title: string;
  open: boolean;
  idTitle: string;
  descTitle: string;
  typeTitle: string;
  amountTitle: string;
  rows: MiscItem[];
  onSave: (rows: MiscItem[]) => void;
  onClose: () => void;
}) {
  const [draftRows, setDraftRows] = useState<MiscItem[]>([]);
  const paddedRows = draftRows.length ? draftRows : [emptyMiscItem(1)];
  const total = draftRows.reduce((sum, row) => sum + row.itemAmount, 0);
  const update = (index: number, patch: Partial<MiscItem>) => {
    const next = [...paddedRows];
    next[index] = { ...next[index], ...patch };
    setDraftRows(next);
  };
  const remove = (index: number) => {
    const next = paddedRows.filter((_, rowIndex) => rowIndex !== index);
    setDraftRows(next.length ? next : [emptyMiscItem(1)]);
  };
  const save = () => {
    onSave(sanitizeMiscRows(paddedRows));
    onClose();
  };

  useEffect(() => {
    if (open) {
      setDraftRows(rows.length ? rows : [emptyMiscItem(1)]);
    }
  }, [open, rows]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        setDraftRows([]);
        onClose();
      }}
      footer={[
        <Button key="save" type="primary" size="small" onClick={save}>
          Save
        </Button>,
        <Button
          key="cancel"
          size="small"
          onClick={() => {
            setDraftRows([]);
            onClose();
          }}
        >
          Cancel
        </Button>,
      ]}
      width={604}
      styles={{ body: { height: 252, overflow: "hidden" } }}
    >
      <Table<MiscItem>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        dataSource={paddedRows}
        rowKey={(_, index) => String(index ?? 0)}
        columns={[
          {
            title: idTitle,
            dataIndex: "itemId",
            width: "15%",
            render: (value: number, _row, index) => (
              <TxtCell
                value={String(value || "")}
                right
                onChange={(next) => update(index, { itemId: parseNumber(next) ?? index + 1 })}
              />
            ),
          },
          {
            title: descTitle,
            dataIndex: "itemDescription",
            width: "42%",
            render: (value: string, _row, index) => (
              <TxtCell
                value={value}
                onChange={(next) => update(index, { itemDescription: next })}
              />
            ),
          },
          {
            title: typeTitle,
            dataIndex: "itemType",
            width: "22%",
            render: (value: string, _row, index) => (
              <TxtCell value={value ?? ""} onChange={(next) => update(index, { itemType: next })} />
            ),
          },
          {
            title: amountTitle,
            dataIndex: "itemAmount",
            width: "20%",
            align: "right",
            render: (value: number, _row, index) => (
              <YCell
                value={formatNumber(value || 0)}
                onChange={(next) => update(index, { itemAmount: parseNumber(next) ?? 0 })}
              />
            ),
          },
          {
            title: "",
            key: "rowActions",
            width: 56,
            align: "center",
            render: (_value, _row, index) => (
              <span className="inline-flex items-center justify-center gap-2">
                <button
                  type="button"
                  title="Add row"
                  className="text-[#63b76b]"
                  onClick={() =>
                    setDraftRows([...paddedRows, emptyMiscItem(paddedRows.length + 1)])
                  }
                >
                  <PlusCircleFilled />
                </button>
                <button
                  type="button"
                  title="Delete row"
                  className="text-[#4f9bd3]"
                  onClick={() => remove(index)}
                >
                  <MinusCircleFilled />
                </button>
              </span>
            ),
          },
        ]}
        footer={() => (
          <div className="grid grid-cols-[15%_42%_22%_20%_56px] text-[11px] font-bold">
            <div />
            <div />
            <div className="px-1">Total</div>
            <div className="px-1 text-right">{formatNumber(total)}</div>
            <div />
          </div>
        )}
      />
    </Modal>
  );
}

function sanitizeMiscRows(rows: MiscItem[]) {
  return rows
    .filter((row) => row.itemDescription.trim() || row.itemType?.trim() || row.itemAmount)
    .map((row, index) => ({ ...row, itemId: row.itemId || index + 1 }));
}

function emptyMiscItem(itemId: number): MiscItem {
  return {
    itemId,
    itemDescription: "",
    itemType: "",
    itemAmount: 0,
  };
}

export default function BottomPanels({
  onOpenBunkerSimulator,
  onOpenRemark,
  result,
  operationExpenseRows,
  operationExpenseItems = [],
  onOperationExpenseItemsChange,
  miscOperationExpenseItems = [],
  onMiscOperationExpenseItemsChange,
  miscVoyageRevenueItems = [],
  onMiscVoyageRevenueItemsChange,
  hireDay = 0,
  hireAddCommPct = 0,
  onHireDayChange,
  onHireAddCommPctChange,
}: {
  onOpenBunkerSimulator?: () => void;
  onOpenRemark?: () => void;
  result?: VoyageSnapshotResult;
  operationExpenseRows?: Array<[string, string, string, string]>;
  operationExpenseItems?: OperationExpenseItem[];
  onOperationExpenseItemsChange?: (items: OperationExpenseItem[]) => void;
  miscOperationExpenseItems?: MiscItem[];
  onMiscOperationExpenseItemsChange?: (items: MiscItem[]) => void;
  miscVoyageRevenueItems?: MiscItem[];
  onMiscVoyageRevenueItemsChange?: (items: MiscItem[]) => void;
  hireDay?: number;
  hireAddCommPct?: number;
  onHireDayChange?: (value: number | undefined) => void;
  onHireAddCommPctChange?: (value: number | undefined) => void;
} = {}) {
  const [otherExpenseOpen, setOtherExpenseOpen] = useState(false);
  const [miscRevenueOpen, setMiscRevenueOpen] = useState(false);
  const updateOperationExpenseItem = (categoryCode: string, amount: number | undefined) => {
    const next = operationExpenseItems.filter((item) => item.categoryCode !== categoryCode);
    if (amount !== undefined && amount !== 0) {
      next.push({ categoryCode, amount });
    }
    onOperationExpenseItemsChange?.(next);
  };
  const miscRevenueTotal = miscVoyageRevenueItems.reduce((sum, item) => sum + item.itemAmount, 0);
  const netHire = hireDay * (1 - hireAddCommPct / 100);
  const displayResultRows: Array<[string, string, string, string]> = result
    ? [
        ["Hire / Day", formatNumber(hireDay), "Revenue", formatNumber(result.revenue)],
        [
          "H/Add Comm.",
          formatNumber(hireAddCommPct),
          "Op. Expense",
          formatNumber(result.opExpense ?? 0),
        ],
        ["Net Hire", formatNumber(netHire), "Op. Profit", formatNumber(result.opProfit ?? 0)],
        [
          "TCE / Day",
          formatNumber(result.tceUsdDay ?? 0),
          "Total Hire",
          formatNumber(result.totalHire ?? 0),
        ],
        ["", "", "Total Freight", formatNumber(result.totalFreight ?? 0)],
      ]
    : resultRows.map((row) => {
        if (row[0] === "Hire / Day") return [row[0], formatNumber(hireDay), row[2], row[3]];
        if (row[0] === "H/Add Comm.") {
          return [row[0], formatNumber(hireAddCommPct), row[2], row[3]];
        }
        if (row[0] === "Net Hire") return [row[0], formatNumber(netHire), row[2], row[3]];
        return row;
      });
  const displayProfit = result ? formatNumber(result.profitUsd) : profitUsd;
  const displayBunkerData: BunkerRow[] = result?.bunkerSummaries?.length
    ? result.bunkerSummaries.map((item) => ({
        key: String(item.fuelTypeId),
        type: item.fuelCode ?? String(item.fuelTypeId),
        price: formatNumber(item.pricePerMt ?? 0),
        consumption: formatNumber(item.consumptionMt),
        expense: formatNumber(item.expense),
      }))
    : bunkerData;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <section>
        <div className="mb-1">
          <SectionTitle>Operation Expense</SectionTitle>
        </div>
        <KVGrid
          rows={operationExpenseRows ?? operationExpense}
          editableLabels={["CVE", "C.E.V.", "ILOHC", "Ballast Bonus", "Routing Service"]}
          valueHandlers={{
            [normalizeLabel("Routing Service")]: (value) =>
              updateOperationExpenseItem("ROUTING_SERVICE", parseNumber(value)),
          }}
          labelActions={{
            [normalizeLabel("Other")]: (
              <Button
                size="small"
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setOtherExpenseOpen(true)}
              />
            ),
          }}
        />
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <SectionTitle>Bunker Expense</SectionTitle>
          <Button size="small" icon={<DashboardOutlined />}>
            Bunker Index
          </Button>
          <Button size="small" icon={<ExperimentOutlined />} onClick={onOpenBunkerSimulator}>
            Bunker Simulator
          </Button>
        </div>
        <Table<BunkerRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={bunkerCols}
          dataSource={displayBunkerData}
        />
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <SectionTitle>Result</SectionTitle>
          <Button size="small" icon={<PlusOutlined />}>
            Result +
          </Button>
          <Button size="small" icon={<SwapOutlined />}>
            Comparison
          </Button>
          <Button size="small" icon={<FileTextOutlined />} onClick={onOpenRemark}>
            Remark
          </Button>
        </div>
        <KVGrid
          rows={displayResultRows}
          editableLabels={["Hire / Day", "Hire/Day", "H/Add Comm.", "H/Add comm"]}
          valueHandlers={{
            [normalizeLabel("Hire / Day")]: (value) => onHireDayChange?.(parseNumber(value)),
            [normalizeLabel("H/Add Comm.")]: (value) =>
              onHireAddCommPctChange?.(parseNumber(value)),
          }}
        />
        <div
          className="mt-[2px] grid grid-cols-[1fr_1fr_1fr_1fr] border text-[12px] font-bold"
          style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
        >
          <div className="border-r px-1 py-[3px]" style={{ borderColor: VE_COLORS.border }}>
            <span className="flex items-center justify-between gap-1">
              <span>Misc Revenue</span>
              <Button
                size="small"
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setMiscRevenueOpen(true)}
              />
            </span>
          </div>
          <div className="border-r p-[1px]" style={{ borderColor: VE_COLORS.border }}>
            <TxtCell value={formatNumber(miscRevenueTotal)} right readOnly />
          </div>
          <div className="border-r px-1 py-[3px]" style={{ borderColor: VE_COLORS.border }}>
            Profit (USD)
          </div>
          <div className="px-1 py-[3px] text-right" style={{ color: VE_COLORS.sectionTitle }}>
            {displayProfit}
          </div>
        </div>
      </section>
      <DetailModal
        title="Other Expense"
        open={otherExpenseOpen}
        idTitle="Exp Id"
        descTitle="Exp Description"
        typeTitle="Exp Type"
        amountTitle="Exp Amount"
        rows={miscOperationExpenseItems}
        onSave={(rows) => onMiscOperationExpenseItemsChange?.(rows)}
        onClose={() => setOtherExpenseOpen(false)}
      />
      <DetailModal
        title="Misc Revenue"
        open={miscRevenueOpen}
        idTitle="Rev ID"
        descTitle="Revenue Desc"
        typeTitle="Revenue Type"
        amountTitle="Revenue Amount"
        rows={miscVoyageRevenueItems}
        onSave={(rows) => onMiscVoyageRevenueItemsChange?.(rows)}
        onClose={() => setMiscRevenueOpen(false)}
      />
    </div>
  );
}
