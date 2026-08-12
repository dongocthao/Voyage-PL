import { useEffect, useMemo, useState } from "react";
import { Table, Tabs, Select, Checkbox, Button, Radio, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PrinterOutlined, LineChartOutlined, ReloadOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle } from "./DialogShell";
import { VE_COLORS } from "./theme";
import {
  buildAnalyzerRows,
  interactiveBunker,
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
  showBreakEven,
}: {
  variable: AnalyzerVariable;
  step: number;
  snapshot?: VoyageSnapshotPayload;
  showBreakEven: boolean;
}) {
  const [apiRows, setApiRows] = useState<AnalyzerCalcRow[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cols = variable === "bunker" ? [bunkerCol, ...baseCols] : baseCols;
  const baseValues = useMemo(() => buildAnalyzerBaseValues(snapshot), [snapshot]);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!snapshot) {
        setApiRows(undefined);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await simulateAnalyzer({
          snapshot,
          scenario: {
            variable: API_VARIABLES[variable],
            deltas: [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map((n) => n * step),
          },
        });
        if (cancelled) return;
        setApiRows(
          response.rows.map((row) => ({
            key: String(row.delta),
            freight: formatMoney(variable === "freight" ? baseValues.freight + row.delta : baseValues.freight),
            quantity: formatMoney(variable === "quantity" ? baseValues.quantity + row.delta : baseValues.quantity),
            revenue: row.result.revenue.toLocaleString("en-US", { maximumFractionDigits: 1 }),
            dailyHire: formatMoney(variable === "hire" ? baseValues.hire + row.delta : baseValues.hire),
            totalHire: (row.result.totalHire ?? 0).toLocaleString("en-US", {
              maximumFractionDigits: 1,
            }),
            cBase: (row.result.tceUsdDay ?? 0).toLocaleString("en-US", { maximumFractionDigits: 1 }),
            opExpense: (row.result.opExpense ?? 0).toLocaleString("en-US", {
              maximumFractionDigits: 1,
            }),
            profit: row.result.profitUsd.toLocaleString("en-US", { maximumFractionDigits: 1 }),
            bunkerPrice: formatMoney(variable === "bunker" ? baseValues.bunkerPrice + row.delta : baseValues.bunkerPrice),
            highlight: row.delta === 0 ? "blue" : "orange",
          })),
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Analyzer simulation failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [baseValues, snapshot, step, variable]);

  const rows = useMemo(() => {
    const source = apiRows ?? buildAnalyzerRows(variable, step);
    if (!showBreakEven) return source;
    return markBreakEven(source);
  }, [apiRows, showBreakEven, step, variable]);

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
      {error && <div className="mb-2 text-xs text-red-600">{error}</div>}
      <Table<AnalyzerCalcRow>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        columns={cols}
        dataSource={rows}
        rowClassName={(r) => (r.highlight === "blue" ? "ve-row-blue" : "ve-row-orange")}
      />
    </>
  );
}

function InteractiveTab({ snapshot }: { snapshot?: VoyageSnapshotPayload }) {
  const base = useMemo(() => buildInteractiveBase(snapshot), [snapshot]);
  const [target, setTarget] = useState("freight");
  const [quantity, setQuantity] = useState(base.quantity);
  const [profit, setProfit] = useState(base.profit);
  const [hire, setHire] = useState(base.hire);
  const [freight, setFreight] = useState(base.freight);
  const [bunkerPrices, setBunkerPrices] = useState(base.bunkerPrices);
  useEffect(() => {
    setQuantity(base.quantity);
    setProfit(base.profit);
    setHire(base.hire);
    setFreight(base.freight);
    setBunkerPrices(base.bunkerPrices);
  }, [base]);
  const calculated = useMemo(
    () => calculateInteractive({ ...base, quantity, profit, hire, freight, bunkerPrices, target }),
    [base, bunkerPrices, freight, hire, profit, quantity, target],
  );
  const reset = () => {
    setQuantity(base.quantity);
    setProfit(base.profit);
    setHire(base.hire);
    setFreight(base.freight);
    setBunkerPrices(base.bunkerPrices);
  };
  const field = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    radio?: string,
    yellow?: boolean,
  ) => (
    <div className="flex items-center gap-2 py-[6px]">
      <span style={{ width: 70 }}>{label}</span>
      <InputNumber
        size="small"
        value={value}
        onChange={(next) => onChange(Number(next ?? 0))}
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
        <Button size="small" icon={<ReloadOutlined />} onClick={reset}>
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-dashed p-3" style={{ borderColor: VE_COLORS.alert }}>
          <GroupTitle>Interactive</GroupTitle>
          {field("Quantity", calculated.quantity, setQuantity)}
          {field("Profit", calculated.profit, setProfit, "profit", target === "profit")}
          {field("Hire", calculated.hire, setHire, "hire", target === "hire")}
          {field("Freight", calculated.freight, setFreight, "freight", target === "freight")}
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
          {calculated.bunkers.map((b) => (
            <div key={b.type} className="grid grid-cols-[70px_1fr_1fr] items-center gap-2 py-[6px]">
              <span>{b.type}</span>
              <InputNumber
                size="small"
                value={b.unitPrice}
                onChange={(next) =>
                  setBunkerPrices((current) => ({
                    ...current,
                    [b.type]: Number(next ?? 0),
                  }))
                }
                style={{ width: "100%" }}
              />
              <div
                className="border px-1 py-[3px] text-right"
                style={{ borderColor: VE_COLORS.border, background: VE_COLORS.rowAlt }}
              >
                {formatMoney(b.expense)}
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
              {formatMoney(calculated.bunkerTotal)}
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
  onApply,
}: {
  onClose?: () => void;
  snapshot?: VoyageSnapshotPayload;
  onApply?: () => void;
}) {
  const [interval, setInterval] = useState("0.25");
  const [showBreakEven, setShowBreakEven] = useState(false);
  return (
    <DialogShell
      title="Analyzer"
      icon={<LineChartOutlined />}
      width={880}
      onClose={onClose}
      actions={[{ label: "Apply", primary: true, onClick: onApply }, { label: "Close" }]}
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
          <Checkbox className="ml-2" checked={showBreakEven} onChange={(event) => setShowBreakEven(event.target.checked)}>
            Break Even Point
          </Checkbox>
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
              <SensitivityTable variable="freight" step={Number(interval)} snapshot={snapshot} showBreakEven={showBreakEven} />
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
                showBreakEven={showBreakEven}
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
                showBreakEven={showBreakEven}
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
                showBreakEven={showBreakEven}
              />
            ),
          },
          { key: "interactive", label: "Interactive", children: <InteractiveTab snapshot={snapshot} /> },
        ]}
      />
    </DialogShell>
  );
}

function markBreakEven(rows: AnalyzerCalcRow[]) {
  return rows.map((row, index) => {
    const previous = index > 0 ? parseMoney(rows[index - 1]!.profit) : undefined;
    const current = parseMoney(row.profit);
    if (previous !== undefined && previous < 0 && current >= 0) {
      return { ...row, highlight: "blue" as const };
    }
    return row;
  });
}

function buildInteractiveBase(snapshot?: VoyageSnapshotPayload) {
  const quantity = snapshot?.cargoLines.reduce((total, line) => total + (line.quantity ?? 0), 0) || 50000;
  const revenue =
    snapshot?.cargoLines.reduce((total, line) => {
      const freight =
        line.freight.freightType === "L"
          ? (line.freight.freightLumpsum ?? 0)
          : (line.quantity ?? 0) * (line.freight.freightRate ?? 0);
      return total + freight;
    }, 0) ?? quantity * 30.5;
  const freight = quantity > 0 ? revenue / quantity : 30.5;
  const hire = snapshot?.header.hireDay ?? 8500;
  const duration =
    snapshot?.portLegs.reduce((total, leg) => total + (leg.seaDays ?? 0) + (leg.portIdleDays ?? 0), 0) || 63.6;
  const bunkerPrices: Record<string, number> = {};
  const bunkerQuantities: Record<string, number> = {};
  snapshot?.bunkerProfile?.forEach((item) => {
    const code = item.fuelCode ?? `Fuel ${item.fuelTypeId}`;
    bunkerPrices[code] = item.pricePerMt ?? bunkerPrices[code] ?? 0;
    bunkerQuantities[code] = (bunkerQuantities[code] ?? 0) + item.consumptionMtDay * duration;
  });
  if (!Object.keys(bunkerPrices).length) {
    interactiveBunker.forEach((item) => {
      bunkerPrices[item.type] = parseMoney(item.unitPrice);
      bunkerQuantities[item.type] = parseMoney(item.expense) / Math.max(parseMoney(item.unitPrice), 1);
    });
  }
  const bunkerTotal = Object.entries(bunkerPrices).reduce(
    (total, [type, price]) => total + price * (bunkerQuantities[type] ?? 0),
    0,
  );
  const fixedExpense = Math.max(0, revenue - hire * duration - bunkerTotal - 36308.4);
  return { quantity, freight, hire, duration, fixedExpense, profit: 36308.4, bunkerPrices, bunkerQuantities };
}

function buildAnalyzerBaseValues(snapshot?: VoyageSnapshotPayload) {
  const quantity = snapshot?.cargoLines.reduce((total, line) => total + (line.quantity ?? 0), 0) || 55000;
  const revenue =
    snapshot?.cargoLines.reduce((total, line) => {
      const freight =
        line.freight.freightType === "L"
          ? (line.freight.freightLumpsum ?? 0)
          : (line.quantity ?? 0) * (line.freight.freightRate ?? 0);
      return total + freight;
    }, 0) ?? quantity * 8.5;
  const bunkerPrices = snapshot?.bunkerProfile?.map((item) => item.pricePerMt ?? 0).filter((value) => value > 0) ?? [];
  return {
    freight: quantity > 0 ? revenue / quantity : 8.5,
    quantity,
    hire: snapshot?.header.hireDay ?? 9000,
    bunkerPrice: bunkerPrices.length
      ? bunkerPrices.reduce((total, value) => total + value, 0) / bunkerPrices.length
      : 320,
  };
}

function calculateInteractive(base: ReturnType<typeof buildInteractiveBase> & { target: string }) {
  const bunkerTotal = Object.entries(base.bunkerPrices).reduce(
    (total, [type, price]) => total + price * (base.bunkerQuantities[type] ?? 0),
    0,
  );
  const expenseWithoutHire = base.fixedExpense + bunkerTotal;
  let quantity = base.quantity;
  let freight = base.freight;
  let hire = base.hire;
  let profit = quantity * freight - hire * base.duration - expenseWithoutHire;
  if (base.target === "freight") {
    freight = quantity > 0 ? (base.profit + hire * base.duration + expenseWithoutHire) / quantity : 0;
    profit = base.profit;
  } else if (base.target === "hire") {
    hire = base.duration > 0 ? (quantity * freight - expenseWithoutHire - base.profit) / base.duration : 0;
    profit = base.profit;
  } else if (base.target === "profit") {
    profit = base.profit;
  }
  return {
    quantity,
    freight,
    hire,
    profit,
    bunkers: Object.entries(base.bunkerPrices).map(([type, unitPrice]) => ({
      type,
      unitPrice,
      expense: unitPrice * (base.bunkerQuantities[type] ?? 0),
    })),
    bunkerTotal,
  };
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
