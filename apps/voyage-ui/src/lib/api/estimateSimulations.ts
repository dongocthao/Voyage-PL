import type { VoyageSnapshotPayload, VoyageSnapshotResult } from "./voyageSnapshots";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export type FreightSimulationResponse = {
  baseResult: VoyageSnapshotResult;
  targetProfitUsd: number;
  adjustedResult: VoyageSnapshotResult;
  adjustedSnapshot: VoyageSnapshotPayload;
  cargoAdjustments?: Array<{
    lineNo: number;
    fixed: boolean;
    freightRate?: number;
    freightLumpsum?: number;
    revenue: number;
  }>;
};

export type AnalyzerVariable = "FREIGHT" | "HIRE" | "QUANTITY" | "BUNKER_PRICE";

export type AnalyzerSimulationResponse = {
  baseResult: VoyageSnapshotResult;
  rows: Array<{
    variable: AnalyzerVariable;
    delta: number;
    result: VoyageSnapshotResult;
  }>;
};

export async function simulateFreight(payload: {
  snapshot: VoyageSnapshotPayload;
  targetProfitUsd?: number;
  targetDailyProfit?: number;
}) {
  const response = await fetch(`${API_BASE_URL}/estimates/voyage-simulations/freight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Freight simulation failed with status ${response.status}`);
  }

  return (await response.json()) as FreightSimulationResponse;
}

export async function simulateAnalyzer(payload: {
  snapshot: VoyageSnapshotPayload;
  scenario: { variable: AnalyzerVariable; deltas: number[] };
}) {
  const response = await fetch(`${API_BASE_URL}/estimates/voyage-simulations/analyzer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Analyzer simulation failed with status ${response.status}`);
  }

  return (await response.json()) as AnalyzerSimulationResponse;
}
