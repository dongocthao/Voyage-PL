import { useMemo, useState } from "react";
import { Alert, Button, InputNumber, Table, Radio, Checkbox } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FundOutlined } from "@ant-design/icons";
import DialogShell, { FieldRow } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import { freightSimData, freightSimTotal, type FreightSimRow } from "./simulatorData";
import { simulateFreight, type FreightSimulationResponse } from "@/lib/api/estimateSimulations";
import type { VoyageSnapshotPayload } from "@/lib/api/voyageSnapshots";

type FreightSimDisplayRow = FreightSimRow & { fixed?: boolean };

const cols: ColumnsType<FreightSimDisplayRow> = [
  { title: "Account", dataIndex: "account", width: "24%" },
  { title: "Cargo Name", dataIndex: "cargoName", width: "22%" },
  {
    title: "Fixed",
    dataIndex: "fixed",
    width: "12%",
    align: "center",
    render: (value: boolean | undefined) => <Checkbox checked={Boolean(value)} disabled />,
  },
  {
    title: "Freight",
    dataIndex: "freight",
    width: "20%",
    align: "right",
    render: (v: string) => <TxtCell value={v} right />,
  },
  {
    title: "Revenue",
    dataIndex: "revenue",
    width: "22%",
    align: "right",
    render: (v: string) => <YCell value={v} />,
  },
];

export default function FreightSimulatorApp({
  onClose,
  snapshot,
  onApply,
}: {
  onClose?: () => void;
  snapshot?: VoyageSnapshotPayload;
  onApply?: (response?: FreightSimulationResponse) => void;
}) {
  const [targetProfitUsd, setTargetProfitUsd] = useState<number | null>(null);
  const [targetDailyProfit, setTargetDailyProfit] = useState<number | null>(null);
  const [targetMode, setTargetMode] = useState<"daily" | "total">("total");
  const [simulation, setSimulation] = useState<FreightSimulationResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const baseDuration = simulation?.baseResult.totalDurationDays ?? snapshot?.portLegs.reduce(
    (total, leg) => total + (leg.seaDays ?? 0) + (leg.portIdleDays ?? 0),
    0,
  ) ?? 0;
  const effectiveTargetTotal = useMemo(() => {
    if (targetMode === "daily") return (targetDailyProfit ?? 0) * baseDuration;
    return targetProfitUsd ?? 0;
  }, [baseDuration, targetDailyProfit, targetMode, targetProfitUsd]);

  const runSimulation = async () => {
    if (!snapshot) return;
    setError("");
    setLoading(true);
    try {
      setSimulation(
        await simulateFreight({
          snapshot,
          targetProfitUsd: targetMode === "total" ? targetProfitUsd ?? undefined : undefined,
          targetDailyProfit: targetMode === "daily" ? targetDailyProfit ?? undefined : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Freight simulation failed.");
    } finally {
      setLoading(false);
    }
  };
  const resetSimulation = () => {
    setTargetProfitUsd(null);
    setTargetDailyProfit(null);
    setTargetMode("total");
    setSimulation(undefined);
    setError("");
  };
  const displayRows: FreightSimDisplayRow[] =
    simulation?.cargoAdjustments?.map((item) => ({
      key: String(item.lineNo),
      account: "",
      cargoName: `Line ${item.lineNo}`,
      fixed: item.fixed,
      freight: (item.freightRate ?? 0).toLocaleString("en-US", { maximumFractionDigits: 3 }),
      revenue: item.revenue.toLocaleString("en-US", { maximumFractionDigits: 1 }),
    })) ??
    snapshot?.cargoLines.map((line) => ({
      key: String(line.lineNo),
      account: line.accountCompanyId ?? "",
      cargoName: line.cargoName ?? `Line ${line.lineNo}`,
      fixed: line.freight.isFreightFixed,
      freight: (line.freight.freightType === "L"
        ? (line.freight.freightLumpsum ?? 0)
        : (line.freight.freightRate ?? 0)
      ).toLocaleString("en-US", { maximumFractionDigits: 3 }),
      revenue: (line.freight.freightType === "L"
        ? (line.freight.freightLumpsum ?? 0)
        : (line.quantity ?? 0) * (line.freight.freightRate ?? 0)
      ).toLocaleString("en-US", { maximumFractionDigits: 1 }),
    })) ??
    freightSimData;
  const displayTotal =
    simulation?.adjustedResult.totalFreight?.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    }) ??
    snapshot?.cargoLines
      .reduce((total, line) => {
        const freight =
          line.freight.freightType === "L"
            ? (line.freight.freightLumpsum ?? 0)
            : (line.quantity ?? 0) * (line.freight.freightRate ?? 0);
        return total + freight;
      }, 0)
      .toLocaleString("en-US", { maximumFractionDigits: 1 }) ??
    freightSimTotal;
  const currentDailyProfit =
    simulation?.baseResult.dailyProfit ??
    (simulation?.baseResult.profitUsd && simulation.baseResult.totalDurationDays
      ? simulation.baseResult.profitUsd / simulation.baseResult.totalDurationDays
      : undefined);
  const adjustedDailyProfit =
    simulation?.adjustedResult.dailyProfit ??
    (simulation?.adjustedResult.profitUsd && simulation.adjustedResult.totalDurationDays
      ? simulation.adjustedResult.profitUsd / simulation.adjustedResult.totalDurationDays
      : undefined);

  return (
    <DialogShell
      title="Freight Simulator"
      icon={<FundOutlined />}
      width={730}
      bodyPadding={3}
      onClose={onClose}
      actions={[
        {
          label: "Apply",
          primary: true,
          disabled: Boolean(snapshot) && !simulation,
          onClick: () => onApply?.(simulation),
        },
        { label: "Cancel", onClick: onClose },
      ]}
      footerLeft={
        <>
          <Radio.Group size="small" value={targetMode} onChange={(event) => setTargetMode(event.target.value)}>
            <Radio value="total">Target Total</Radio>
            <Radio value="daily">Target Daily</Radio>
          </Radio.Group>
          <Button size="small" onClick={resetSimulation}>
            Reset
          </Button>
        </>
      }
    >
      <div className="w-full">
        <div className="grid grid-cols-2 gap-x-4">
          <FieldRow label="Current Daily Profit">
            <TxtCell
              value={formatNumber(currentDailyProfit) ?? "571.3"}
              right
            />
          </FieldRow>
          <FieldRow label="Current Total Profit">
            <TxtCell
              value={formatNumber(simulation?.baseResult.profitUsd) ?? "36,308.4"}
              right
            />
          </FieldRow>
          <FieldRow label="Target Daily Profit">
            {snapshot ? (
              <InputNumber
                size="small"
                value={targetDailyProfit}
                disabled={targetMode !== "daily"}
                onChange={setTargetDailyProfit}
                style={{ width: "100%" }}
              />
            ) : (
              <YCell value="571.3" />
            )}
          </FieldRow>
          <FieldRow label="Target Total Profit">
            {snapshot ? (
              <InputNumber
                size="small"
                value={targetProfitUsd}
                disabled={targetMode !== "total"}
                onChange={setTargetProfitUsd}
                style={{ width: "100%" }}
              />
            ) : (
              <YCell value="36,308.4" />
            )}
          </FieldRow>
        </div>
        {snapshot && (
          <div className="mt-2 flex items-center gap-2">
            <Button size="small" type="primary" loading={loading} onClick={runSimulation}>
              Simulate
            </Button>
            <span className="text-xs text-slate-600">
              Target Total: {formatNumber(effectiveTargetTotal) ?? "0.0"}
            </span>
            {adjustedDailyProfit !== undefined && (
              <span className="text-xs text-slate-600">
                Adjusted Daily: {formatNumber(adjustedDailyProfit)}
              </span>
            )}
          </div>
        )}
        {error && <Alert className="mt-2" type="error" showIcon message={error} />}

        <div className="mt-2">
          <Table<FreightSimDisplayRow>
            size="small"
            bordered
            pagination={false}
            tableLayout="fixed"
            columns={cols}
            dataSource={displayRows}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    Total
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    {displayTotal}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      </div>
    </DialogShell>
  );
}

function formatNumber(value: number | undefined) {
  return value?.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
