import { VoyageApiError } from "./voyageSnapshots";

export type OperationSnapshotPayload = {
  header: {
    operationId?: string;
    estimateId?: string;
    vesselId?: string;
    vesselName: string;
    voyageNo: string;
    status?: string;
    currency?: string;
  };
  cargoRows: Array<{
    lineNo: number;
    account?: string;
    cargoName?: string;
    loadingPort?: string;
    dischargingPort?: string;
    quantity?: number;
    frtType?: "F" | "L";
    freightRate?: number;
    freightLumpsum?: number;
    linerCost?: number;
    totalFreight?: number;
  }>;
  portRows: Array<{
    lineNo: number;
    type?: string;
    portName?: string;
    distanceNm?: number;
    ecaNm?: number;
    arrival?: string;
    departure?: string;
  }>;
  bunkerRows: Array<{
    fuelType: string;
    pricePerMt?: number;
    consumptionMt?: number;
    expense?: number;
  }>;
  reports: Array<{
    portKey: string;
    kind: "arrival" | "departure";
    time: string;
    remark?: string;
    fuels: Array<{
      fuelType: string;
      robMt?: number;
      supplyQtyMt?: number;
      supplyUnitPrice?: number;
    }>;
  }>;
};

export type SaveOperationSnapshotResponse = {
  operationId: string;
  estimateId?: string;
  vesselId: string;
  voyageNo: string;
  status: string;
  updatedAt: string;
  updatedByName?: string;
};

export type LoadedOperationSnapshot = OperationSnapshotPayload & {
  header: OperationSnapshotPayload["header"] & {
    updatedAt?: string;
    updatedByName?: string;
  };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function saveOperationSnapshot(payload: OperationSnapshotPayload) {
  const response = await fetch(`${API_BASE_URL}/estimates/operation-snapshots`, {
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

  return (await response.json()) as SaveOperationSnapshotResponse;
}

export async function loadOperationSnapshot(operationId: string) {
  const response = await fetch(`${API_BASE_URL}/estimates/operation-snapshots/${operationId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Load failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as LoadedOperationSnapshot;
}

export async function findOperationByEstimateId(estimateId: string) {
  const response = await fetch(
    `${API_BASE_URL}/estimates/operation-snapshots/by-estimate/${estimateId}`,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Operation lookup failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as
    | { exists: false; estimateId: string }
    | {
        exists: true;
        estimateId?: string;
        operationId: string;
        voyageNo: string;
        status: string;
        updatedAt: string;
      };
}

export async function deleteOperationSnapshot(operationId: string) {
  const response = await fetch(`${API_BASE_URL}/estimates/operation-snapshots/${operationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Delete failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as { operationId: string; deleted: true };
}
