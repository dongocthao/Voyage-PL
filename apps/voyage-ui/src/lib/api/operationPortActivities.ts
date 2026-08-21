import { VoyageApiError } from "./voyageSnapshots";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export type OperationPortActivitySummary = {
  operationId: string;
  portRotationId: number;
  portName?: string;
  channelDays: number;
  portWorkingDays: number;
  portIdleDays: number;
  portMarginDay: number;
  portStayDuration: number;
};

export async function saveOperationPortActivities(payload: OperationPortActivitySummary) {
  const response = await fetch(`${API_BASE_URL}/estimates/operation-port-activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Save failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as OperationPortActivitySummary & { portId?: string | null };
}
