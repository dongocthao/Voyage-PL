import { useState } from "react";
import { Table, Tabs, Select, Checkbox, Button, Radio, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PrinterOutlined, LineChartOutlined, ReloadOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle } from "./DialogShell";
import { VE_COLORS } from "./theme";
import {
  buildAnalyzerRows,
  interactiveBunker,
  interactiveBunkerTotal,
  type AnalyzerCalcRow,
  type AnalyzerVariable,
} from "./simulatorData";
import {
  simulateAnalyzer,
  type AnalyzerVariable as ApiAnalyzerVariable,
} from "@/lib/api/estimateSimulations";
import type { VoyageSnapshotPayload } from "@/lib/api/voyageSnapshots";

const right = (v: string) => (
  <span
    className="block pr-1 text-right"
    style={{ color: v.startsWith("-") ? VE_COLORS.alert : undefined }}
  >
    {v}
  </span>
);

/** Cột thu hẹp còn ~75% độ rộng cũ */
const baseCols: ColumnsType<AnalyzerCalcRow> = [
  { title: "Freight", dataIndex: "freight", width: 66, align: "right", render: right },
  { title: "Quantity", dataIndex: "quantity", width: 82, align: "right", render: right },
  { title: "Revenue", dataIndex: "revenue", width: 82, align: "right", render: right },
  { title: "Daily Hire", dataIndex: "dailyHire", width: 72, align: "right", render: right },
  { title: "Total Hire", dataIndex: "totalHire", width: 82, align: "right", render: right },
  { title: "C/Base", dataIndex: "cBase", width: 72, align: "right", render: right },
  { title: "OP. Expense", dataIndex: "opExpense", width: 82, align: "right", render: right },
  { title: "Profit/Loss", dataIndex: "profit", width: 82, align: "right", render: right },
];

const bunkerCol: ColumnsType<AnalyzerCalcRow>[number] = {
  title: "Bunker Price",
  dataIndex: "bunkerPrice",
  width: 82,
  align: "right",
  render: right,
};

const API_VARIABLES: Record<AnalyzerVariable, ApiAnalyzerVariable> = {
  freight: "FREIGHT",
  hire: "HIRE",
  quantity: "QUANTITY",
  bunker: "BUNKER_PRICE",
};

function SensitivityTable({
  variable,
  step,
  snapshot,
}: {
  variable: AnalyzerVariable;
  step: number;
  snapshot?: VoyageSnapshotPayload;
}) {
  const [apiRows, setApiRows] = useState<AnalyzerCalcRow[]>();
  const [loading, setLoading] = useState(false);
  const cols = variable === "bunker" ? [bunkerCol, ...baseCols] : baseCols;
  const run = async () => {
    if (!snapshot) return;
    setLoading(true);
    try {
      const response = await simulateAnalyzer({
        snapshot,
        scenario: {
          variable: API_VARIABLES[variable],
          deltas: [-2, -1, 0, 1, 2].map((n) => n * step),
        },
      });
      setApiRows(
        response.rows.map((row) => ({
          key: String(row.delta),
          freight: row.delta.toLocaleString("en-US"),
          quantity: "",
          revenue: row.result.revenue.toLocaleString("en-US", { maximumFractionDigits: 1 }),
          dailyHire: "",
          totalHire: (row.result.totalHire ?? 0).toLocaleString("en-US", {
            maximumFractionDigits: 1,
          }),
          cBase: "",
          opExpense: (row.result.opExpense ?? 0).toLocaleString("en-US", {
            maximumFractionDigits: 1,
          }),
          profit: row.result.profitUsd.toLocaleString("en-US", { maximumFractionDigits: 1 }),
          bunkerPrice: row.delta.toLocaleString("en-US"),
          highlight: row.delta === 0 ? "blue" : "orange",
        })),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {snapshot && (
        <Button size="small" className="mb-2" loading={loading} onClick={run}>
          Recalculate
        </Button>
      )}
      <Table<AnalyzerCalcRow>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        columns={cols}
        dataSource={apiRows ?? buildAnalyzerRows(variable, step)}
        rowClassName={(r) => (r.highlight === "blue" ? "ve-row-blue" : "ve-row-orange")}
      />
    </>
  );
}

function InteractiveTab() {
  const [target, setTarget] = useState("freight");
  const field = (label: string, value: number, radio?: string, yellow?: boolean) => (
    <div className="flex items-center gap-2 py-[6px]">
      <span style={{ width: 70 }}>{label}</span>
      <InputNumber
        size="small"
        value={value}
        style={{ width: 150, background: yellow ? VE_COLORS.rowAlt : undefined }}
        className="text-right"
      />
      {radio ? (
        <Radio checked={target === radio} onChange={() => setTarget(radio)} />
      ) : (
        <span className="w-[16px]" />
      )}
    </div>
  );
  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <span>
          You can change and simulate all other 3 variables and bunker prices to get the one result.
        </span>
        <Button size="small" icon={<ReloadOutlined />}>
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-dashed p-3" style={{ borderColor: VE_COLORS.alert }}>
          <GroupTitle>Interactive</GroupTitle>
          {field("Quantity", 50000)}
          {field("Profit", 36308.4, "profit")}
          {field("Hire", 8500, "hire")}
          {field("Freight", 30.5, "freight", target === "freight")}
        </div>
        <div>
          <GroupTitle>Bunker</GroupTitle>
          <div
            className="grid grid-cols-[70px_1fr_1fr] items-center gap-2 border-b pb-1"
            style={{ borderColor: VE_COLORS.border }}
          >
            <span>Type</span>
            <span>Unit Price</span>
            <span>Expense</span>
          </div>
          {interactiveBunker.map((b) => (
            <div key={b.type} className="grid grid-cols-[70px_1fr_1fr] items-center gap-2 py-[6px]">
              <span>{b.type}</span>
              <InputNumber size="small" value={Number(b.unitPrice)} style={{ width: "100%" }} />
              <div
                className="border px-1 py-[3px] text-right"
                style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
              >
                {b.expense}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[70px_1fr_1fr] items-center gap-2 py-[6px]">
            <span>Total</span>
            <span />
            <div
              className="border px-1 py-[3px] text-right font-bold"
              style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
            >
              {interactiveBunkerTotal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzerApp({
  onClose,
  snapshot,
}: {
  onClose?: () => void;
  snapshot?: VoyageSnapshotPayload;
}) {
  const [interval, setInterval] = useState("0.25");
  return (
    <DialogShell
      title="Analyzer"
      icon={<LineChartOutlined />}
      width={880}
      onClose={onClose}
      actions={[{ label: "Apply", primary: true }, { label: "Close" }]}
      footerLeft={
        <>
          <Button size="small" icon={<PrinterOutlined />}>
            Print
          </Button>
          <span className="ml-2">Interval</span>
          <Select
            size="small"
            value={interval}
            onChange={setInterval}
            style={{ width: 90 }}
            options={["0.10", "0.25", "0.50", "1.00"].map((v) => ({ value: v, label: v }))}
          />
          <Checkbox className="ml-2">Break Even Point</Checkbox>
        </>
      }
    >
      <Tabs
        size="small"
        defaultActiveKey="freight"
        items={[
          {
            key: "freight",
            label: "Freight",
            children: (
              <SensitivityTable variable="freight" step={Number(interval)} snapshot={snapshot} />
            ),
          },
          {
            key: "hire",
            label: "Hire",
            children: (
              <SensitivityTable
                variable="hire"
                step={Number(interval) * 1000}
                snapshot={snapshot}
              />
            ),
          },
          {
            key: "quantity",
            label: "Quantity",
            children: (
              <SensitivityTable
                variable="quantity"
                step={Number(interval) * 4000}
                snapshot={snapshot}
              />
            ),
          },
          {
            key: "bunker",
            label: "Bunker",
            children: (
              <SensitivityTable
                variable="bunker"
                step={Number(interval) * 40}
                snapshot={snapshot}
              />
            ),
          },
          { key: "interactive", label: "Interactive", children: <InteractiveTab /> },
        ]}
      />
    </DialogShell>
  );
}
