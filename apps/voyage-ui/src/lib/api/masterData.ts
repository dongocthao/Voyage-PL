export type LookupItem = {
  id: string | number;
  code?: string | null;
  name?: string;
  term?: string;
  defaultUnit?: string;
  stowageFactor?: number;
  stowageFactorUnit?: string;
  country?: string;
  unlocode?: string | null;
  utcOffsetMin?: number | null;
  isCanal?: boolean;
  shortName?: string | null;
  status?: string;
  flow?: string;
  factor?: number;
  dwt?: number;
  draftM?: number;
  tpc?: number;
  builtYear?: number | null;
  vesselKind?: string;
  vesselType?: string;
  vesselId?: string;
  vesselName?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  modes?: Array<{
    mode: "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";
    speedBallastKn: number;
    speedLadenKn: number;
    consumption: Array<{
      fuelRole: "MAIN" | "SUB";
      condition: "NORMAL" | "ECA";
      fuelTypeId: number;
      fuelCode?: string;
      activity: "BALLAST" | "LADEN" | "IDLE" | "WORK" | "SEA";
      consumptionMtDay: number;
    }>;
  }>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function fetchLookup(
  kind:
    | "cargoes"
    | "ports"
    | "companies"
    | "cp-terms"
    | "laytime-terms"
    | "fuel-types"
    | "vessel-kinds"
    | "vessel-types"
    | "expense-categories"
    | "vessels"
    | "bunker-profiles",
  query = "",
) {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/${kind}${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Lookup failed with status ${response.status}`);
  }

  return (await response.json()) as LookupItem[];
}

export async function fetchBunkerProfiles({
  vesselId,
  query = "",
}: {
  vesselId?: string;
  query?: string;
}) {
  const params = new URLSearchParams();
  if (vesselId) params.set("vesselId", vesselId);
  if (query) params.set("q", query);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/bunker-profiles${suffix}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Lookup failed with status ${response.status}`);
  }

  return (await response.json()) as LookupItem[];
}
