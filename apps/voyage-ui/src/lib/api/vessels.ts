const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export type FuelRole = "MAIN" | "SUB";
export type FuelCondition = "NORMAL" | "ECA";
export type VesselActivity = "BALLAST" | "LADEN" | "IDLE" | "WORK" | "SEA";
export type PerfMode = "FULL" | "ECO" | "CUSTOM1" | "CUSTOM2" | "CUSTOM3";

export type VesselGear = {
  id?: string;
  gearType: string;
  position?: string | null;
  capacityMt?: number | null;
  qtyEa?: number | null;
};

export type VesselBunkerConsumption = {
  fuelRole: FuelRole;
  condition: FuelCondition;
  fuelTypeId: number;
  activity: VesselActivity;
  consumptionMtDay: number;
};

export type VesselPerformanceMode = {
  mode: PerfMode;
  speedBallastKn: number;
  speedLadenKn: number;
  consumption: VesselBunkerConsumption[];
};

export type VesselBunkerProfile = {
  id?: string;
  profileName: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  remark?: string | null;
  modes: VesselPerformanceMode[];
};

export type VesselMaster = {
  id?: string;
  vesselId?: string | null;
  mvName: string;
  imoNo?: string | null;
  callSign?: string | null;
  vesselCode?: string | null;
  hullNo?: string | null;
  ownership: "OWNED" | "CHARTERED" | "MANAGED";
  ownerCompanyId?: string | null;
  vesselKindId?: number | null;
  vesselTypeId?: number | null;
  flag?: string | null;
  class?: string | null;
  builtYear?: number | null;
  dwt?: number | null;
  dwcc?: number | null;
  draftM?: number | null;
  loaM?: number | null;
  beamM?: number | null;
  depthM?: number | null;
  grt?: number | null;
  nrt?: number | null;
  scnt?: number | null;
  pcUmsNt?: number | null;
  tpc?: number | null;
  grainCbm?: number | null;
  baleCbm?: number | null;
  constantMt?: number | null;
  iceClass?: string | null;
  wap?: string | null;
  hoHaType?: string | null;
  hoHaGear?: string | null;
  tankTopStrengthUpper?: number | null;
  tankTopStrengthTween?: number | null;
  hatchCoverStrength?: number | null;
  remark?: string | null;
  isActive?: boolean;
  gears: VesselGear[];
  bunkerProfiles: VesselBunkerProfile[];
};

async function requestVessel(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Vessel request failed with status ${response.status}`);
  }

  return (await response.json()) as VesselMaster;
}

export async function listVessels(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/vessels${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Vessel lookup failed with status ${response.status}`);
  }

  return (await response.json()) as Array<{
    id: string;
    code?: string | null;
    name?: string;
    dwt?: number;
    draftM?: number;
    tpc?: number;
    builtYear?: number | null;
    vesselKind?: string;
    vesselType?: string;
  }>;
}

export function getVessel(id: string) {
  return requestVessel(`${API_BASE_URL}/master-data/vessels/${encodeURIComponent(id)}`);
}

export function saveVessel(vessel: VesselMaster) {
  const { id, ...payload } = sanitizeVessel(vessel);
  const method = id ? "PUT" : "POST";
  const url = id
    ? `${API_BASE_URL}/master-data/vessels/${encodeURIComponent(id)}`
    : `${API_BASE_URL}/master-data/vessels`;

  return requestVessel(url, { method, body: JSON.stringify(payload) });
}

function sanitizeVessel(vessel: VesselMaster): VesselMaster {
  return {
    ...vessel,
    vesselId: cleanString(vessel.vesselId),
    mvName: vessel.mvName.trim(),
    imoNo: cleanString(vessel.imoNo),
    callSign: cleanString(vessel.callSign),
    vesselCode: cleanString(vessel.vesselCode),
    hullNo: cleanString(vessel.hullNo),
    ownerCompanyId: cleanString(vessel.ownerCompanyId),
    flag: cleanString(vessel.flag),
    class: cleanString(vessel.class),
    iceClass: cleanString(vessel.iceClass),
    wap: cleanString(vessel.wap),
    hoHaType: cleanString(vessel.hoHaType),
    hoHaGear: cleanString(vessel.hoHaGear),
    remark: cleanString(vessel.remark),
    gears: vessel.gears.map((gear) => ({
      ...gear,
      gearType: gear.gearType.trim(),
      position: cleanString(gear.position),
      capacityMt: cleanNumber(gear.capacityMt),
      qtyEa: cleanInteger(gear.qtyEa),
    })),
    bunkerProfiles: vessel.bunkerProfiles.map((profile) => ({
      ...profile,
      profileName: profile.profileName.trim(),
      effectiveTo: cleanString(profile.effectiveTo),
      remark: cleanString(profile.remark),
      modes: profile.modes.map((mode) => ({
        ...mode,
        speedBallastKn: cleanNumber(mode.speedBallastKn) ?? 0,
        speedLadenKn: cleanNumber(mode.speedLadenKn) ?? 0,
        consumption: mode.consumption.map((item) => ({
          ...item,
          consumptionMtDay: cleanNumber(item.consumptionMtDay) ?? 0,
        })),
      })),
    })),
  };
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanInteger(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}
