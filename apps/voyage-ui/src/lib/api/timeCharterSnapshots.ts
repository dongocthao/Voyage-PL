import type { VoyageSnapshotResult } from "./voyageSnapshots";
import { VoyageApiError } from "./voyageSnapshots";

export type TimeCharterSnapshotPayload = {
  header: {
    estimateId?: string;
    estimateFileId?: string;
    fileName: string;
    sheetName: string;
    estimateTypeCode: "TCOV";
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
  charterTerms: Array<{
    cpSide: "HEAD" | "SUB";
    accountCompanyId?: string;
    deliveryPortId?: string;
    redeliveryPortId?: string;
    durationDays?: number;
    dailyHire?: number;
    grossHire?: number;
    addCommPct?: number;
    brokeragePct?: number;
    useMultiDuration: boolean;
    durationPeriods: Array<{
      periodNo: number;
      durationDays?: number;
      dailyHire?: number;
    }>;
  }>;
  portLegs: Array<{
    legNo: number;
    legType: "BALLAST" | "DELIVERY" | "REDELIVERY" | "CANAL" | "BUNKER" | "OTHER";
    portId?: string;
    distanceNm?: number;
    ecaNm?: number;
    wfPct?: number;
    speedKn?: number;
    seaDays?: number;
    portIdleDays?: number;
    arrivalAt?: string;
    departureAt?: string;
  }>;
};

export type SaveTimeCharterSnapshotResponse = {
  estimateId: string;
  estimateFileId: string;
  updatedAt?: string;
  updatedByName?: string;
  result: VoyageSnapshotResult;
};

export type LoadedTimeCharterSnapshot = TimeCharterSnapshotPayload & {
  header: TimeCharterSnapshotPayload["header"] & {
    updatedAt?: string;
    updatedByName?: string;
  };
  result?: VoyageSnapshotResult;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function saveTimeCharterSnapshot(payload: TimeCharterSnapshotPayload) {
  const response = await fetch(`${API_BASE_URL}/estimates/time-charter-snapshots`, {
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

  return (await response.json()) as SaveTimeCharterSnapshotResponse;
}

export async function loadTimeCharterSnapshot(estimateId: string) {
  const response = await fetch(`${API_BASE_URL}/estimates/time-charter-snapshots/${estimateId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Load failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as LoadedTimeCharterSnapshot;
}
