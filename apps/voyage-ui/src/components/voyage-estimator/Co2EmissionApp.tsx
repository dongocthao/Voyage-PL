import { useMemo, useState } from "react";
import { Table, InputNumber } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CloudOutlined } from "@ant-design/icons";
import DialogShell, { GroupTitle } from "./DialogShell";
import { robData } from "./simulatorData";
import {
  calculateCo2Emissions,
  DEFAULT_CO2_FACTORS,
  summarizeBunker,
  type BunkerFuel,
} from "@/lib/calculations/bunker";

type Co2Row = {
  key: BunkerFuel;
  type: BunkerFuel;
  quantity: number;
  factor: number;
  co2Mt: number;
};

const fuelTypes: BunkerFuel[] = ["VLSFO", "MGO", "ULSFO"];

function format(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Co2EmissionApp({ onClose }: { onClose?: () => void }) {
  const [quantities, setQuantities] = useState<Record<BunkerFuel, number>>(() =>
    buildDefaultQuantities(),
  );
  const [factors, setFactors] = useState<Record<BunkerFuel, number>>(DEFAULT_CO2_FACTORS);

  const result = useMemo(
    () =>
      calculateCo2Emissions(
        fuelTypes.map((type) => ({ type, quantity: quantities[type] })),
        factors,
      ),
    [factors, quantities],
  );

  const rows: Co2Row[] = result.rows.map((row) => ({
    ...row,
    key: row.type as BunkerFuel,
    type: row.type as BunkerFuel,
  }));

  const columns: ColumnsType<Co2Row> = [
    { title: "Fuel Type", dataIndex: "type", width: "20%" },
    {
      title: "Consumption (MT)",
      dataIndex: "quantity",
      width: "28%",
      align: "right",
      render: (_value, row) => (
        <InputNumber
          size="small"
          value={row.quantity}
          min={0}
          step={0.1}
          style={{ width: "100%" }}
          onChange={(value) =>
            setQuantities((current) => ({ ...current, [row.type]: sanitize(value) }))
          }
        />
      ),
    },
    {
      title: "CO2 Factor",
      dataIndex: "factor",
      width: "22%",
      align: "right",
      render: (_value, row) => (
        <InputNumber
          size="small"
          value={row.factor}
          min={0}
          step={0.001}
          style={{ width: "100%" }}
          onChange={(value) =>
            setFactors((current) => ({ ...current, [row.type]: sanitize(value) }))
          }
        />
      ),
    },
    { title: "CO2 Emission (MT)", dataIndex: "co2Mt", width: "30%", align: "right", render: format },
  ];

  return (
    <DialogShell
      title="CO2 Emission Calculator"
      icon={<CloudOutlined />}
      width={760}
      onClose={onClose}
      actions={[{ label: "OK", primary: true }, { label: "Cancel" }]}
    >
      <GroupTitle>Fuel Consumption</GroupTitle>
      <Table<Co2Row>
        size="small"
        bordered
        pagination={false}
        tableLayout="fixed"
        columns={columns}
        dataSource={rows}
      />
      <div className="mt-2 grid grid-cols-[1fr_160px] gap-2 text-right font-bold">
        <span>Total Consumption / CO2</span>
        <span>
          {format(result.totalQuantity)} MT / {format(result.totalCo2Mt)} MT
        </span>
      </div>
    </DialogShell>
  );
}

function buildDefaultQuantities(): Record<BunkerFuel, number> {
  const summary = summarizeBunker(
    robData.map((row) => ({
      type: row.type as BunkerFuel,
      arrivalSupplyQty: parseAmount(row.aQty),
      arrivalSupplyUnitPrice: parseAmount(row.aUnit),
      departureSupplyQty: parseAmount(row.dQty),
      departureSupplyUnitPrice: parseAmount(row.dUnit),
      seaConsumption: parseAmount(row.cSea),
      portConsumption: parseAmount(row.cPort),
    })),
    DEFAULT_CO2_FACTORS,
  );

  return fuelTypes.reduce<Record<BunkerFuel, number>>((acc, type) => {
    acc[type] = summary.find((row) => row.type === type)?.consumptionQty ?? 0;
    return acc;
  }, { VLSFO: 0, MGO: 0, ULSFO: 0 });
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitize(value: string | number | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
