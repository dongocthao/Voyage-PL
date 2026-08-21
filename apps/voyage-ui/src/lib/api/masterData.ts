export type LookupItem = {
  id: string | number;
  code?: string | null;
  name?: string;
  description?: string | null;
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
  typeName?: string;
  kindId?: number | null;
  kindCode?: string | null;
  kindName?: string | null;
  dwtMinRange?: number | null;
  dwtMaxRange?: number | null;
  categoryId?: number | null;
  categoryCode?: string | null;
  categoryName?: string | null;
  fuelTypeName?: string | null;
  isoStandard?: string | null;
  maxSulphurPercent?: number | null;
  carbonFactor?: number | null;
  defaultDensity?: number | null;
  isEcaCompliant?: boolean;
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
  options?: { kindId?: string | number; categoryId?: string | number },
) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (options?.kindId !== undefined) params.set("kindId", String(options.kindId));
  if (options?.categoryId !== undefined) params.set("categoryId", String(options.categoryId));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/${kind}${suffix}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Lookup failed with status ${response.status}`);
  }

  return (await response.json()) as LookupItem[];
}

export async function fetchVesselKinds(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/vessels/kinds${params}`);
  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Vessel kinds lookup failed with status ${response.status}`);
  }
  return (await response.json()) as LookupItem[];
}

export async function fetchVesselTypes(kindId?: string | number, query = "") {
  const params = new URLSearchParams();
  if (kindId !== undefined && kindId !== null && kindId !== "") params.set("kindId", String(kindId));
  if (query) params.set("q", query);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/vessels/types${suffix}`);
  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Vessel types lookup failed with status ${response.status}`);
  }
  return (await response.json()) as LookupItem[];
}

export async function fetchFuelCategories(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/bunker/categories${params}`);
  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Fuel categories lookup failed with status ${response.status}`);
  }
  return (await response.json()) as LookupItem[];
}

export async function fetchFuelTypes(options?: {
  categoryId?: string | number;
  query?: string;
  ecaOnly?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.categoryId !== undefined && options.categoryId !== null && options.categoryId !== "") {
    params.set("categoryId", String(options.categoryId));
  }
  if (options?.query) params.set("q", options.query);
  const path = options?.ecaOnly ? "eca-compliant" : "";
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const url = options?.ecaOnly
    ? `${API_BASE_URL}/bunker/fuels/${path}${suffix}`
    : `${API_BASE_URL}/bunker/fuels${suffix}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Fuel types lookup failed with status ${response.status}`);
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
