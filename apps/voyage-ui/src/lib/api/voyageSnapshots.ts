export type VoyageSnapshotPayload = {
  header: {
    estimateId?: string;
    estimateFileId?: string;
    fileName: string;
    sheetName: string;
    estimateTypeCode?: string;
    voyageNo?: string;
    remark?: string;
    vesselId?: string;
    vesselName?: string;
    bunkerProfileId?: string;
    performanceMode?: "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";
    routingSuez?: boolean;
    routingPanama?: boolean;
    routingKiel?: boolean;
    marginSeaDays?: number;
    marginPortIdleDays?: number;
    hireDay?: number;
    hireAddCommPct?: number;
    timeDisplayUnit?: "DAYS" | "HOURS";
    timezoneDisplayMode?: "PORT_LOCAL" | "UTC";
  };
  cargoLines: Array<{
    lineNo: number;
    accountCompanyId?: string;
    accountCompanyName?: string;
    cargoId?: string;
    cargoName?: string;
    loadingPortId?: string;
    loadingPortName?: string;
    dischargingPortId?: string;
    dischargingPortName?: string;
    quantity?: number;
    unit: string;
    freight: {
      freightRate?: number;
      freightTermId?: number;
      addCommPct?: number;
      brokeragePct?: number;
      freightTaxPct?: number;
      freightType: "F" | "L";
      freightLumpsum?: number;
      linerCostAmount?: number;
      isFreightFixed?: boolean;
    };
  }>;
  portLegs: Array<{
    legNo: number;
    legType: "BALLAST" | "LOADING" | "DISCHARGE" | "CANAL" | "BUNKER" | "OTHER";
    portId?: string;
    portName?: string;
    distanceNm?: number;
    ecaNm?: number;
    wfPct?: number;
    speedKn?: number;
    seaDays?: number;
    portIdleDays?: number;
    portCharge?: number;
    arrivalAt?: string;
    departureAt?: string;
    cpTerm?: {
      ldRate?: number;
      demurrage?: number;
      despatch?: number;
    };
  }>;
  bunkerProfile?: Array<{
    role: "MAIN" | "SUB";
    condition: "NORMAL" | "ECA";
    activity: "BALLAST" | "LADEN" | "IDLE" | "WORK" | "SEA";
    fuelTypeId: number;
    fuelCode?: string;
    consumptionMtDay: number;
    pricePerMt?: number;
  }>;
  operationExpenseItems?: Array<{
    categoryId?: number;
    categoryCode?: string;
    cpSide?: "HEAD" | "SUB";
    amount: number;
    remark?: string;
  }>;
  miscOperationExpenseItems?: Array<{
    itemId: number;
    itemDescription: string;
    itemType?: string;
    itemAmount: number;
    cpSide?: "HEAD" | "SUB";
  }>;
  miscVoyageRevenueItems?: Array<{
    itemId: number;
    itemDescription: string;
    itemType?: string;
    itemAmount: number;
    cpSide?: "HEAD" | "SUB";
  }>;
};

export type SaveVoyageSnapshotResponse = {
  estimateId: string;
  estimateFileId: string;
  updatedAt?: string;
  updatedByName?: string;
  result: VoyageSnapshotResult;
};

export type VoyageSnapshotResult = {
  revenue: number;
  opExpense?: number;
  opProfit?: number;
  totalFreight?: number;
  totalHire?: number;
  profitUsd: number;
  totalDurationDays: number;
  tceUsdDay?: number;
  dailyRevenue?: number;
  dailyExpense?: number;
  dailyProfit?: number;
  bunkerSummaries?: Array<{
    fuelTypeId: number;
    fuelCode?: string;
    pricePerMt?: number;
    consumptionMt: number;
    expense: number;
  }>;
};

export type LoadedVoyageSnapshot = VoyageSnapshotPayload & {
  header: VoyageSnapshotPayload["header"] & {
    status?: string;
    updatedAt?: string;
    updatedByName?: string;
  };
  result?: VoyageSnapshotResult;
};

export type ApiErrorDetail = {
  path?: string;
  message?: string;
};

export class VoyageApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function saveVoyageSnapshot(payload: VoyageSnapshotPayload) {
  const response = await fetch(`${API_BASE_URL}/estimates/voyage-snapshots`, {
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

  return (await response.json()) as SaveVoyageSnapshotResponse;
}

export type SnapshotAudit = {
  updatedAt?: string;
  updatedByName?: string;
};

export async function loadVoyageSnapshot(estimateId: string) {
  const response = await fetch(`${API_BASE_URL}/estimates/voyage-snapshots/${estimateId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Load failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as LoadedVoyageSnapshot;
}

export type VoyageReportSummary = {
  estimateId: string;
  voyageNo?: string;
  status?: string;
  totalDurationDays: number;
  totalDistanceNm?: number;
  revenue: number;
  opExpense?: number;
  opProfit?: number;
  totalFreight?: number;
  hireDay: number;
  hireAddCommPct: number;
  netHire: number;
  totalHire: number;
  cBase: number;
  profitUsd: number;
  tceUsdDay?: number;
  generatedAt: string;
  bunkerSummaries: NonNullable<VoyageSnapshotResult["bunkerSummaries"]>;
};

export async function loadVoyageReportSummary(estimateId: string) {
  const response = await fetch(
    `${API_BASE_URL}/estimates/voyage-snapshots/${estimateId}/report-summary`,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Report summary failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  return (await response.json()) as VoyageReportSummary;
}

export async function deleteEstimateSnapshot(estimateId: string) {
  const response = await fetch(`${API_BASE_URL}/estimates/${estimateId}`, {
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

  return (await response.json()) as { estimateId: string; deleted: true };
}
