import { Table, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  LineChartOutlined,
  FileTextOutlined,
  ReloadOutlined,
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

export default function TcBottomPanels({ onOpenAnalyzer }: { onOpenAnalyzer?: () => void } = {}) {
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
          dataSource={tcHireTable}
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
          dataSource={tcOperationTable}
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
          dataSource={tcBunkerTable}
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
              {yFind(tcOthers.income)}
            </div>
            <div className="px-1">{yFind(tcOthers.expense)}</div>
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
          {tcResultTable.map(([k, v]) => (
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
              {tcResultProfit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
