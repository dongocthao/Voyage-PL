import { VoyageApiError } from "./voyageSnapshots";

export type EstimateListRow = {
  estimateId: string;
  estimateName: string;
  estimateType: "Voyage Charter" | "Time Charter" | "Cargo Relet";
  estimateTypeCode: "VOYAGE" | "TIME_CHARTER" | "CARGO_RELET";
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

export async function fetchEstimateList() {
  const response = await fetch(`${API_BASE_URL}/estimates`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Estimate list failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as EstimateListRow[];
}
