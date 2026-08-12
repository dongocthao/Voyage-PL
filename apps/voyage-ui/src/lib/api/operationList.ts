import { VoyageApiError } from "./voyageSnapshots";

export type OperationListRow = {
  operationId: string;
  operationName: string;
  operationType: "Voyage Charter" | "Time Charter" | "Cargo Relet";
  operationTypeCode: "VOYAGE" | "TIME_CHARTER" | "CARGO_RELET";
  estimateId?: string;
  vessel: string;
  voyageNo: string;
  charterer: string;
  operator: string;
  status: "Draft" | "Estimated" | "Fixed" | "Failed" | "Cancelled";
  cargo: string;
  quantity: string;
  loadPort: string;
  dischargePort: string;
  commenced: string;
  completed: string;
  preparedBy: string;
  lastUpdated: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function fetchOperationList() {
  const response = await fetch(`${API_BASE_URL}/estimates/operations`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Operation list failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as OperationListRow[];
}
