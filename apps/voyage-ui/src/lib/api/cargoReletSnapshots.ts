import type { VoyageSnapshotResult } from "./voyageSnapshots";
import { VoyageApiError } from "./voyageSnapshots";

export type CargoReletSnapshotPayload = {
  header: {
    estimateId?: string;
    estimateFileId?: string;
    fileName: string;
    sheetName: string;
    estimateTypeCode: "RELT";
    vesselId?: string;
    bunkerProfileId?: string;
    performanceMode?: "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";
    routingSuez?: boolean;
    routingPanama?: boolean;
    routingKiel?: boolean;
    marginSeaDays?: number;
    marginPortIdleDays?: number;
    timeDisplayUnit?: "DAYS" | "HOURS";
    timezoneDisplayMode?: "PORT_LOCAL" | "UTC";
  };
  cargoLines: Array<{
    lineNo: number;
    accountCompanyId?: string;
    cargoId?: string;
    cargoName?: string;
    loadingPortId?: string;
    dischargingPortId?: string;
    quantityMt?: number;
    quantityUnit?: string;
    head: CargoReletFreightTermPayload;
    sub: CargoReletFreightTermPayload;
  }>;
  portLegs: Array<{
    legNo: number;
    legType: "BALLAST" | "LOADING" | "DISCHARGE" | "CANAL" | "BUNKER" | "OTHER";
    portId?: string;
    distanceNm?: number;
    ecaNm?: number;
    wfPct?: number;
    speedKn?: number;
    seaDays?: number;
    portIdleDays?: number;
    portWorkingDays?: number;
    portCharge?: number;
    arrivalAt?: string;
    departureAt?: string;
    head: CargoReletPortCpTermPayload;
    sub: CargoReletPortCpTermPayload;
  }>;
};

export type CargoReletFreightTermPayload = {
  freightRate?: number;
  freightType?: string;
  freightLumpsum?: number;
  addCommPct?: number;
  brokeragePct?: number;
  netFreight?: number;
  linerCostAmount?: number;
};

export type CargoReletPortCpTermPayload = {
  ldRate?: number;
  demurrage?: number;
  despatch?: number;
};

export type SaveCargoReletSnapshotResponse = {
  estimateId: string;
  estimateFileId: string;
  result: VoyageSnapshotResult;
};

export type LoadedCargoReletSnapshot = CargoReletSnapshotPayload & {
  result?: VoyageSnapshotResult;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function saveCargoReletSnapshot(payload: CargoReletSnapshotPayload) {
  const response = await fetch(`${API_BASE_URL}/estimates/cargo-relet-snapshots`, {
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

  return (await response.json()) as SaveCargoReletSnapshotResponse;
}

export async function loadCargoReletSnapshot(estimateId: string) {
  const response = await fetch(`${API_BASE_URL}/estimates/cargo-relet-snapshots/${estimateId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Load failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as LoadedCargoReletSnapshot;
}
