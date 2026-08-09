import { useState } from "react";
import { Button, InputNumber, Table, Radio, Checkbox } from "antd";
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
}: {
  onClose?: () => void;
  snapshot?: VoyageSnapshotPayload;
}) {
  const [targetProfitUsd, setTargetProfitUsd] = useState<number | null>(null);
  const [simulation, setSimulation] = useState<FreightSimulationResponse>();
  const [loading, setLoading] = useState(false);
  const runSimulation = async () => {
    if (!snapshot) return;
    setLoading(true);
    try {
      setSimulation(
        await simulateFreight({ snapshot, targetProfitUsd: targetProfitUsd ?? undefined }),
      );
    } finally {
      setLoading(false);
    }
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
    }) ?? freightSimTotal;

  return (
    <DialogShell
      title="Freight Simulator"
      icon={<FundOutlined />}
      width={730}
      bodyPadding={3}
      onClose={onClose}
      actions={[{ label: "Apply", primary: true }, { label: "Cancel" }]}
      footerLeft={
        <Radio.Group size="small" defaultValue="dist">
          <Radio value="dist">Distance Rate</Radio>
          <Radio value="avg">Average Rate</Radio>
        </Radio.Group>
      }
    >
      <div className="w-full">
        <div className="grid grid-cols-2 gap-x-4">
          <FieldRow label="Current Daily Profit">
            <TxtCell
              value={simulation?.baseResult.dailyProfit?.toLocaleString("en-US") ?? "571.3"}
              right
            />
          </FieldRow>
          <FieldRow label="Current Total Profit">
            <TxtCell
              value={simulation?.baseResult.profitUsd.toLocaleString("en-US") ?? "36,308.4"}
              right
            />
          </FieldRow>
          <FieldRow label="Target Daily Profit">
            <YCell value="571.3" />
          </FieldRow>
          <FieldRow label="Target Total Profit">
            {snapshot ? (
              <InputNumber
                size="small"
                value={targetProfitUsd}
                onChange={setTargetProfitUsd}
                style={{ width: "100%" }}
              />
            ) : (
              <YCell value="36,308.4" />
            )}
          </FieldRow>
        </div>
        {snapshot && (
          <div className="mt-2">
            <Button size="small" type="primary" loading={loading} onClick={runSimulation}>
              Simulate
            </Button>
          </div>
        )}

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
