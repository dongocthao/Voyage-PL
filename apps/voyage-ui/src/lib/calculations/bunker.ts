export type BunkerFuel = "VLSFO" | "MGO" | "ULSFO";

export type BunkerInputRow = {
  type: BunkerFuel | string;
  arrivalSupplyQty: number;
  arrivalSupplyUnitPrice: number;
  departureSupplyQty: number;
  departureSupplyUnitPrice: number;
  seaConsumption: number;
  portConsumption: number;
};

export type BunkerPriceInput = Record<string, number>;

export type BunkerRobPlanRow = {
  type: BunkerFuel | string;
  initialRob: number;
  startUnitPrice: number;
  arrivalSupplyQty: number;
  arrivalSupplyUnitPrice: number;
  departureSupplyQty: number;
  departureSupplyUnitPrice: number;
  seaConsumption: number;
  portConsumption: number;
};

export const DEFAULT_CO2_FACTORS: Record<BunkerFuel, number> = {
  VLSFO: 3.114,
  MGO: 3.206,
  ULSFO: 3.114,
};

export function summarizeBunker(rows: BunkerInputRow[], fallbackPrices: BunkerPriceInput) {
  const fuels = new Map<string, BunkerInputRow[]>();
  for (const row of rows) {
    fuels.set(row.type, [...(fuels.get(row.type) ?? []), row]);
  }

  return [...fuels.entries()].map(([type, fuelRows]) => {
    const supplyQty = sum(fuelRows.map((row) => row.arrivalSupplyQty + row.departureSupplyQty));
    const supplyCost = sum(
      fuelRows.map(
        (row) =>
          row.arrivalSupplyQty * row.arrivalSupplyUnitPrice +
          row.departureSupplyQty * row.departureSupplyUnitPrice,
      ),
    );
    const consumptionQty = sum(
      fuelRows.map((row) => row.seaConsumption + row.portConsumption),
    );
    const fallbackPrice = fallbackPrices[type] ?? 0;
    const averageSupplyPrice = supplyQty > 0 ? supplyCost / supplyQty : fallbackPrice;
    const consumptionCost = consumptionQty * averageSupplyPrice;

    return {
      type,
      supplyQty,
      supplyCost,
      consumptionQty,
      averageSupplyPrice,
      consumptionCost,
      remainQty: supplyQty - consumptionQty,
      remainValue: supplyCost - consumptionCost,
    };
  });
}

export function valueBunkerPlan(
  rows: BunkerRobPlanRow[],
  fallbackPrices: BunkerPriceInput,
) {
  const fuels = new Map<string, BunkerRobPlanRow[]>();
  for (const row of rows) {
    fuels.set(row.type, [...(fuels.get(row.type) ?? []), row]);
  }

  return [...fuels.entries()].map(([type, fuelRows]) => {
    const initialQty = sum(fuelRows.map((row) => row.initialRob));
    const initialCost = sum(
      fuelRows.map((row) => row.initialRob * row.startUnitPrice),
    );
    const supplyQty = sum(
      fuelRows.map((row) => row.arrivalSupplyQty + row.departureSupplyQty),
    );
    const supplyCost = sum(
      fuelRows.map(
        (row) =>
          row.arrivalSupplyQty * row.arrivalSupplyUnitPrice +
          row.departureSupplyQty * row.departureSupplyUnitPrice,
      ),
    );
    const availableQty = initialQty + supplyQty;
    const availableCost = initialCost + supplyCost;
    const fallbackPrice = fallbackPrices[type] ?? 0;
    const averageUnitPrice = availableQty > 0 ? availableCost / availableQty : fallbackPrice;
    const consumptionQty = sum(
      fuelRows.map((row) => row.seaConsumption + row.portConsumption),
    );
    const consumptionCost = consumptionQty * averageUnitPrice;
    const remainQty = availableQty - consumptionQty;
    const remainValue = availableCost - consumptionCost;

    return {
      type,
      initialQty,
      initialCost,
      supplyQty,
      supplyCost,
      availableQty,
      availableCost,
      consumptionQty,
      averageUnitPrice,
      consumptionCost,
      remainQty,
      remainValue,
    };
  });
}

export function calculateCo2Emissions(
  consumption: Array<{ type: BunkerFuel | string; quantity: number }>,
  factors: Record<string, number> = DEFAULT_CO2_FACTORS,
) {
  const rows = consumption.map((row) => ({
    ...row,
    factor: factors[row.type] ?? 0,
    co2Mt: row.quantity * (factors[row.type] ?? 0),
  }));
  return {
    rows,
    totalQuantity: sum(rows.map((row) => row.quantity)),
    totalCo2Mt: sum(rows.map((row) => row.co2Mt)),
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
