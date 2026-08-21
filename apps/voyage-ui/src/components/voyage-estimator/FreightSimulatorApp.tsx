import { useEffect, useMemo, useState } from "react";
import { Alert, Button, InputNumber, Table, Radio, Checkbox } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FundOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import DialogShell, { FieldRow } from "./DialogShell";
import { TxtCell, YCell } from "./cells";
import { VE_COLORS } from "./theme";
import type { FreightSimRow } from "./simulatorData";
import { simulateFreight, type FreightSimulationResponse } from "@/lib/api/estimateSimulations";
import type { VoyageSnapshotPayload } from "@/lib/api/voyageSnapshots";

type FreightSimDisplayRow = FreightSimRow & { fixed?: boolean };

export default function FreightSimulatorApp({
  onClose,
  snapshot,
  onApply,
  currentProfitUsd,
  currentDurationDays,
}: {
  onClose?: () => void;
  snapshot?: VoyageSnapshotPayload;
  onApply?: (response?: FreightSimulationResponse) => void;
  currentProfitUsd?: number;
  currentDurationDays?: number;
}) {
  const [editableCargoLines, setEditableCargoLines] = useState(
    () => snapshot?.cargoLines ?? [],
  );
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [fixedLines, setFixedLines] = useState<Record<string, boolean>>({});
  const [targetProfitUsd, setTargetProfitUsd] = useState<number | null>(null);
  const [targetDailyProfit, setTargetDailyProfit] = useState<number | null>(null);
  const [targetMode, setTargetMode] = useState<"daily" | "total">("total");
  const [simulation, setSimulation] = useState<FreightSimulationResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setEditableCargoLines(snapshot?.cargoLines ?? []);
    setSelectedRowKey(null);
    setFixedLines({});
    setSimulation(undefined);
  }, [snapshot]);

  const effectiveSnapshot = useMemo<VoyageSnapshotPayload | undefined>(
    () => applySnapshotEdits(snapshot, editableCargoLines, fixedLines),
    [editableCargoLines, fixedLines, snapshot],
  );
  const baseDuration = simulation?.baseResult.totalDurationDays ?? effectiveSnapshot?.portLegs.reduce(
    (total, leg) => total + (leg.seaDays ?? 0) + (leg.portIdleDays ?? 0),
    0,
  ) ?? 0;
  const effectiveTargetTotal = useMemo(() => {
    if (targetMode === "daily") return (targetDailyProfit ?? 0) * baseDuration;
    return targetProfitUsd ?? 0;
  }, [baseDuration, targetDailyProfit, targetMode, targetProfitUsd]);

  const runSimulation = async () => {
    if (!snapshot || !effectiveSnapshot) return;
    setError("");
    setLoading(true);
    try {
      setSimulation(
        await simulateFreight({
          snapshot: effectiveSnapshot,
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
    setFixedLines({});
  };

  const toggleFixed = (key: string, checked: boolean) => {
    setFixedLines((current) => ({ ...current, [key]: checked }));
    setSimulation(undefined);
  };

  const addLine = () => {
    setEditableCargoLines((current) => {
      const nextLineNo =
        current.reduce((max, line) => Math.max(max, line.lineNo ?? 0), 0) + 1;
      const next = [...current, buildEmptyCargoLine(nextLineNo)];
      setSelectedRowKey(String(nextLineNo));
      return next;
    });
    setSimulation(undefined);
  };

  const removeLine = () => {
    setEditableCargoLines((current) => {
      if (!current.length) return current;
      const targetKey = selectedRowKey ?? String(current[current.length - 1]?.lineNo ?? "");
      const next = current.filter((line) => String(line.lineNo) !== targetKey);
      if (next.length === current.length) return current;
      setSelectedRowKey(next.length ? String(next[next.length - 1].lineNo) : null);
      return next;
    });
    if (selectedRowKey) {
      setFixedLines((current) => {
        const next = { ...current };
        delete next[selectedRowKey];
        return next;
      });
    }
    setSimulation(undefined);
  };

  const displayRows: FreightSimDisplayRow[] =
    simulation?.cargoAdjustments?.map((item) => ({
      key: String(item.lineNo),
      account:
        editableCargoLines.find((line) => line.lineNo === item.lineNo)?.accountCompanyName ??
        editableCargoLines.find((line) => line.lineNo === item.lineNo)?.accountCompanyId ??
        "",
      cargoName:
        editableCargoLines.find((line) => line.lineNo === item.lineNo)?.cargoName ??
        `Line ${item.lineNo}`,
      fixed: fixedLines[String(item.lineNo)] ?? item.fixed,
      freight: (item.freightRate ?? 0).toLocaleString("en-US", { maximumFractionDigits: 3 }),
      revenue: item.revenue.toLocaleString("en-US", { maximumFractionDigits: 1 }),
    })) ??
    editableCargoLines.map((line) => ({
      key: String(line.lineNo),
      account: line.accountCompanyName ?? line.accountCompanyId ?? "",
      cargoName: line.cargoName ?? `Line ${line.lineNo}`,
      fixed: fixedLines[String(line.lineNo)] ?? line.freight.isFreightFixed,
      freight: (line.freight.freightType === "L"
        ? (line.freight.freightLumpsum ?? 0)
        : (line.freight.freightRate ?? 0)
      ).toLocaleString("en-US", { maximumFractionDigits: 3 }),
      revenue: (line.freight.freightType === "L"
        ? (line.freight.freightLumpsum ?? 0)
        : (line.quantity ?? 0) * (line.freight.freightRate ?? 0)
      ).toLocaleString("en-US", { maximumFractionDigits: 1 }),
    })) ??
    [];
  const columns: ColumnsType<FreightSimDisplayRow> = [
    { title: "Account", dataIndex: "account", width: "24%" },
    { title: "Cargo Name", dataIndex: "cargoName", width: "22%" },
    {
      title: "Fixed",
      dataIndex: "fixed",
      width: "12%",
      align: "center",
      render: (value: boolean | undefined, record) => (
        <Checkbox
          checked={Boolean(value)}
          disabled={!snapshot}
          onChange={(event) => toggleFixed(record.key, event.target.checked)}
        />
      ),
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
  const displayTotal =
    simulation?.adjustedResult.totalFreight?.toLocaleString("en-US", {
      maximumFractionDigits: 1,
    }) ??
    editableCargoLines
      .reduce((total, line) => {
        const freight =
          line.freight.freightType === "L"
            ? (line.freight.freightLumpsum ?? 0)
            : (line.quantity ?? 0) * (line.freight.freightRate ?? 0);
        return total + freight;
      }, 0)
      .toLocaleString("en-US", { maximumFractionDigits: 1 }) ??
    "";
  const currentTotalProfit = simulation?.baseResult.profitUsd ?? currentProfitUsd;
  const currentDailyProfit = simulation?.baseResult.dailyProfit ??
    (currentProfitUsd !== undefined && currentDurationDays
      ? currentProfitUsd / currentDurationDays
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
        <style>
          {`
            .freight-simulator-dialog .ant-radio-wrapper,
            .freight-simulator-dialog .ant-checkbox-wrapper {
              color: ${VE_COLORS.headerText};
            }
            .freight-simulator-dialog .ant-radio-checked .ant-radio-inner,
            .freight-simulator-dialog .ant-checkbox-checked .ant-checkbox-inner {
              border-color: ${VE_COLORS.headerText} !important;
              background-color: ${VE_COLORS.headerText} !important;
            }
            .freight-simulator-dialog .ant-radio-inner::after {
              background-color: #fff !important;
            }
            .freight-simulator-dialog .ant-radio-checked .ant-radio-wrapper,
            .freight-simulator-dialog .ant-radio-wrapper-checked,
            .freight-simulator-dialog .ant-checkbox-checked + span,
            .freight-simulator-dialog .ant-radio-wrapper-checked {
              color: ${VE_COLORS.headerText} !important;
            }
            .freight-simulator-dialog .ant-radio-wrapper:hover .ant-radio-inner,
            .freight-simulator-dialog .ant-radio-input:focus + .ant-radio-inner,
            .freight-simulator-dialog .ant-checkbox-wrapper:hover .ant-checkbox-inner,
            .freight-simulator-dialog .ant-checkbox-input:focus + .ant-checkbox-inner {
              border-color: ${VE_COLORS.headerText} !important;
            }
          `}
        </style>
        <div className="freight-simulator-dialog grid grid-cols-2 gap-x-4">
          <FieldRow label="Current Daily Profit">
            <TxtCell
              value={formatNumber(currentDailyProfit) ?? ""}
              right
              readOnly
            />
          </FieldRow>
          <FieldRow label="Current Total Profit">
            <TxtCell
              value={formatNumber(currentTotalProfit) ?? ""}
              right
              readOnly
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
              <YCell value="" />
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
              <YCell value="" />
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
            columns={columns}
            dataSource={displayRows}
            onRow={(record) => ({
              onClick: () => setSelectedRowKey(record.key),
            })}
            rowClassName={(record) => (record.key === selectedRowKey ? "ve-row-selected" : "")}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: VE_COLORS.rowAlt, fontWeight: 600 }}>
                  <Table.Summary.Cell index={0} colSpan={2} align="left">
                    <div className="flex items-center gap-1">
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        disabled={!snapshot}
                        onClick={addLine}
                      />
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        disabled={!snapshot || displayRows.length === 0}
                        onClick={removeLine}
                      />
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={2} align="right">
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

function applyFixedOverrides(
  snapshot: VoyageSnapshotPayload | undefined,
  fixedLines: Record<string, boolean>,
) {
  if (!snapshot) return snapshot;
  const hasOverride = Object.keys(fixedLines).length > 0;
  if (!hasOverride) return snapshot;

  return {
    ...snapshot,
    cargoLines: snapshot.cargoLines.map((line) => applyLineFixedOverride(line, fixedLines)),
  };
}

function applySnapshotEdits(
  snapshot: VoyageSnapshotPayload | undefined,
  cargoLines: VoyageSnapshotPayload["cargoLines"],
  fixedLines: Record<string, boolean>,
) {
  if (!snapshot) return undefined;
  return applyFixedOverrides(
    {
      ...snapshot,
      cargoLines,
    },
    fixedLines,
  );
}

function buildEmptyCargoLine(lineNo: number): VoyageSnapshotPayload["cargoLines"][number] {
  return {
    lineNo,
    accountCompanyId: "",
    accountCompanyName: "",
    cargoName: "",
    loadingPortId: "",
    loadingPortName: "",
    dischargingPortId: "",
    dischargingPortName: "",
    quantity: 0,
    unit: "MT",
    freight: {
      freightRate: 0,
      freightType: "F",
      freightLumpsum: 0,
      addCommPct: 0,
      brokeragePct: 0,
      linerCostAmount: 0,
      isFreightFixed: false,
    },
  };
}

function applyLineFixedOverride(
  line: VoyageSnapshotPayload["cargoLines"][number],
  fixedLines: Record<string, boolean>,
): VoyageSnapshotPayload["cargoLines"][number] {
  const override = fixedLines[String(line.lineNo)];
  if (override === undefined) return line;
  return {
    ...line,
    freight: {
      ...line.freight,
      isFreightFixed: override,
    },
  };
}
