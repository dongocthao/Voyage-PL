import { useEffect, useState } from "react";
import { Table, Button, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  LineChartOutlined,
  FileTextOutlined,
  ReloadOutlined,
  MinusCircleFilled,
  PlusCircleFilled,
} from "@ant-design/icons";
import { SectionTitle, TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import {
  tcHireTable,
  tcOperationTable,
  tcBunkerTable,
  tcOthers,
  tcResultTable,
  tcResultProfit,
  type TcHireRow,
  type TcOperationRow,
  type TcBunkerRow,
} from "./timeCharterData";

const label = (v: string) => <b>{v}</b>;
const y = (v: string) => <YCell value={v} />;
const yFind = (v: string) => (
  <div className="flex items-center gap-1">
    <SearchOutlined style={{ color: "#888", fontSize: 11 }} />
    <YCell value={v} />
  </div>
);

export type TcMiscItem = {
  itemId: number;
  itemDescription: string;
  itemType?: string;
  itemAmount: number;
};

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/,/g, "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatNumber = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const hireCols: ColumnsType<TcHireRow> = [
  { title: "", dataIndex: "label", width: "12%", render: label },
  { title: "Daily Gross Hire", dataIndex: "dailyGross", width: "14.6%", align: "right", render: y },
  { title: "Daily Net Hire", dataIndex: "dailyNet", width: "14.6%", align: "right", render: y },
  { title: "Total Gross Hire", dataIndex: "totalGross", width: "14.6%", align: "right", render: y },
  { title: "Add. Comm.", dataIndex: "addComm", width: "14.6%", align: "right", render: y },
  { title: "Brokerage", dataIndex: "brokerage", width: "14.6%", align: "right", render: yFind },
  { title: "Total Net Hire", dataIndex: "totalNet", width: "15%", align: "right", render: y },
];

const opCols: ColumnsType<TcOperationRow> = [
  { title: "", dataIndex: "label", width: "12%", render: label },
  {
    title: "Ballast Bonus",
    dataIndex: "ballastBonus",
    width: "17.6%",
    align: "right",
    render: yFind,
  },
  { title: "ILOHC", dataIndex: "ilohc", width: "17.6%", align: "right", render: yFind },
  { title: "C.E.V.", dataIndex: "cev", width: "17.6%", align: "right", render: yFind },
  {
    title: "Bunker Expense",
    dataIndex: "bunkerExpense",
    width: "17.6%",
    align: "right",
    render: yFind,
  },
  { title: "Total", dataIndex: "total", width: "17.6%", align: "right", render: y },
];

const bunkerCols: ColumnsType<TcBunkerRow> = [
  { title: "", dataIndex: "fuel", width: "22%", render: (v: string) => <TxtCell value={v} /> },
  {
    title: "Price / MT",
    dataIndex: "price",
    width: "26%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Consumption",
    dataIndex: "consumption",
    width: "26%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  { title: "Expense", dataIndex: "expense", width: "26%", align: "right", render: y },
];

export type TcBottomPanelData = {
  hireRows?: TcHireRow[];
  operationRows?: TcOperationRow[];
  bunkerRows?: TcBunkerRow[];
  others?: typeof tcOthers;
  resultRows?: Array<[string, string]>;
  resultProfit?: string;
};

export default function TcBottomPanels({
  onOpenAnalyzer,
  data = {},
  miscRevenueItems = [],
  otherExpenseItems = [],
  onMiscRevenueItemsChange,
  onOtherExpenseItemsChange,
}: {
  onOpenAnalyzer?: () => void;
  data?: TcBottomPanelData;
  miscRevenueItems?: TcMiscItem[];
  otherExpenseItems?: TcMiscItem[];
  onMiscRevenueItemsChange?: (items: TcMiscItem[]) => void;
  onOtherExpenseItemsChange?: (items: TcMiscItem[]) => void;
} = {}) {
  const [miscRevenueOpen, setMiscRevenueOpen] = useState(false);
  const [otherExpenseOpen, setOtherExpenseOpen] = useState(false);
  const hireRows = data.hireRows ?? tcHireTable;
  const operationRows = data.operationRows ?? tcOperationTable;
  const bunkerRows = data.bunkerRows ?? tcBunkerTable;
  const others = data.others ?? tcOthers;
  const resultRows = data.resultRows ?? tcResultTable;
  const resultProfit = data.resultProfit ?? tcResultProfit;

  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start">
      {/* Left — 250% of Result */}
      <div className="min-w-0 lg:w-[50%]">
        <div className="mb-1">
          <SectionTitle>Hire</SectionTitle>
        </div>
        <Table<TcHireRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={hireCols}
          dataSource={hireRows}
        />

        <div className="mb-1 mt-2">
          <SectionTitle>Operation</SectionTitle>
        </div>
        <Table<TcOperationRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={opCols}
          dataSource={operationRows}
        />
      </div>

      {/* Middle — 150% of Result */}
      <div className="min-w-0 lg:w-[30%]">
        <div className="mb-1 flex items-center gap-2">
          <SectionTitle>Bunker Expense</SectionTitle>
          <div className="ml-auto flex items-center gap-1">
            <Button size="small" icon={<ReloadOutlined />}>
              Recent
            </Button>
            <Button size="small" icon={<LineChartOutlined />}>
              Bunker Index
            </Button>
          </div>
        </div>
        <Table<TcBunkerRow>
          size="small"
          bordered
          pagination={false}
          tableLayout="fixed"
          columns={bunkerCols}
          dataSource={bunkerRows}
        />

        <div className="mb-1 mt-2">
          <SectionTitle>Others</SectionTitle>
        </div>
        <div className="border" style={{ borderColor: VE_COLORS.border }}>
          <div
            className="grid grid-cols-2 text-[11px] font-semibold"
            style={{ background: VE_COLORS.headerBg, color: VE_COLORS.headerText }}
          >
            <div
              className="border-r px-1 py-[3px] text-center"
              style={{ borderColor: VE_COLORS.border }}
            >
              Income
            </div>
            <div className="px-1 py-[3px] text-center">Expense</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r px-1" style={{ borderColor: VE_COLORS.border }}>
              <SearchValue value={others.income} onClick={() => setMiscRevenueOpen(true)} />
            </div>
            <div className="px-1">
              <SearchValue value={others.expense} onClick={() => setOtherExpenseOpen(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* Right — Result (base width) */}
      <div className="min-w-0 lg:w-[20%]">
        <div className="mb-1 flex items-center gap-1">
          <SectionTitle>Result</SectionTitle>
          <div className="ml-auto flex items-center gap-1">
            <Button size="small" icon={<LineChartOutlined />} onClick={onOpenAnalyzer}>
              Analyzer
            </Button>
            <Button size="small" icon={<FileTextOutlined />}>
              Remark
            </Button>
          </div>
        </div>
        <div className="border text-[11px]" style={{ borderColor: VE_COLORS.border }}>
          {resultRows.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] border-b"
              style={{ borderColor: VE_COLORS.border }}
            >
              <div
                className="border-r px-1 py-[3px]"
                style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
              >
                {k}
              </div>
              <div className="px-1 py-[3px] text-right" style={{ background: VE_COLORS.editable }}>
                {v}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] font-bold">
            <div
              className="border-r px-1 py-[3px]"
              style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
            >
              PROFIT (USD)
            </div>
            <div
              className="px-1 py-[3px] text-right"
              style={{ background: VE_COLORS.editable, color: VE_COLORS.sectionTitle }}
            >
              {resultProfit}
            </div>
          </div>
        </div>
      </div>

      <TcDetailModal
        title="Misc Revenue"
        open={miscRevenueOpen}
        idTitle="Rev ID"
        descTitle="Rev Description"
        typeTitle="Rev Type"
        amountTitle="Rev Amount"
        rows={miscRevenueItems}
        onSave={(rows) => onMiscRevenueItemsChange?.(rows)}
        onClose={() => setMiscRevenueOpen(false)}
      />
      <TcDetailModal
        title="Other Expense"
        open={otherExpenseOpen}
        idTitle="Exp Id"
        descTitle="Exp Description"
        typeTitle="Exp Type"
        amountTitle="Exp Amount"
        rows={otherExpenseItems}
        onSave={(rows) => onOtherExpenseItemsChange?.(rows)}
        onClose={() => setOtherExpenseOpen(false)}
      />
    </div>
  );
}

function SearchValue({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Open detail" className="text-[#637381]" onClick={onClick}>
        <SearchOutlined style={{ fontSize: 11 }} />
      </button>
      <YCell value={value} readOnly />
    </div>
  );
}

function TcDetailModal({
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
  rows: TcMiscItem[];
  onSave: (rows: TcMiscItem[]) => void;
  onClose: () => void;
}) {
  const [draftRows, setDraftRows] = useState<TcMiscItem[]>([]);
  const paddedRows = draftRows.length ? draftRows : [emptyMiscItem(1)];
  const total = draftRows.reduce((sum, row) => sum + row.itemAmount, 0);
  const update = (index: number, patch: Partial<TcMiscItem>) => {
    const next = [...paddedRows];
    next[index] = { ...next[index], ...patch };
    setDraftRows(next);
  };
  const remove = (index: number) => {
    const next = paddedRows.filter((_, rowIndex) => rowIndex !== index);
    setDraftRows(next.length ? next : [emptyMiscItem(1)]);
  };

  useEffect(() => {
    if (open) setDraftRows(rows.length ? rows : [emptyMiscItem(1)]);
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
        <Button
          key="save"
          type="primary"
          size="small"
          onClick={() => {
            onSave(sanitizeMiscRows(paddedRows));
            onClose();
          }}
        >
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
      <Table<TcMiscItem>
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

function sanitizeMiscRows(rows: TcMiscItem[]) {
  return rows
    .filter((row) => row.itemDescription.trim() || row.itemType?.trim() || row.itemAmount)
    .map((row, index) => ({ ...row, itemId: row.itemId || index + 1 }));
}

function emptyMiscItem(itemId: number): TcMiscItem {
  return { itemId, itemDescription: "", itemType: "", itemAmount: 0 };
}
