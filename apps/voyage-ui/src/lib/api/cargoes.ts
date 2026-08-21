const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export type CargoMaster = {
  id?: string;
  code?: string | null;
  cargoName: string;
  cargoGroup?: string | null;
  cargoClass?: string | null;
  imoName?: string | null;
  ibcCode?: string | null;
  imsbcCode?: string | null;
  billBy?: string | null;
  defaultUnit?: string | null;
  stowageFactor?: number | null;
  stowageFactorFt3?: number | null;
  stowageFactorUnit?: string | null;
  unNumber?: string | null;
  hazardClass?: string | null;
  productCode?: string | null;
  capacityBasis?: string | null;
  description?: string | null;
  preclearanceUsCanada?: boolean;
  isDangerous?: boolean;
  isActive?: boolean;
  specialHandlingRequired?: boolean;
};

export type CargoLookup = {
  id: string;
  code?: string | null;
  name?: string;
  cargoGroup?: string | null;
  cargoClass?: string | null;
  unNumber?: string | null;
  defaultUnit?: string;
  stowageFactor?: number;
  stowageFactorUnit?: string;
  lastUpdated?: string;
  isActive?: boolean;
};

async function requestCargo(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Cargo request failed with status ${response.status}`);
  }

  return (await response.json()) as CargoMaster;
}

export async function listCargoes(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/cargoes${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new Error(error?.message ?? `Cargo lookup failed with status ${response.status}`);
  }

  return (await response.json()) as CargoLookup[];
}

export function getCargo(id: string) {
  return requestCargo(`${API_BASE_URL}/master-data/cargoes/${encodeURIComponent(id)}`);
}

export function saveCargo(cargo: CargoMaster) {
  const { id, ...payload } = sanitizeCargo(cargo);
  const method = id ? "PUT" : "POST";
  const url = id
    ? `${API_BASE_URL}/master-data/cargoes/${encodeURIComponent(id)}`
    : `${API_BASE_URL}/master-data/cargoes`;

  return requestCargo(url, { method, body: JSON.stringify(payload) });
}

function sanitizeCargo(cargo: CargoMaster): CargoMaster {
  return {
    ...cargo,
    code: cleanString(cargo.code),
    cargoName: cargo.cargoName.trim(),
    cargoGroup: cleanString(cargo.cargoGroup),
    cargoClass: cleanString(cargo.cargoClass),
    imoName: cleanString(cargo.imoName),
    ibcCode: cleanString(cargo.ibcCode),
    imsbcCode: cleanString(cargo.imsbcCode),
    billBy: cleanString(cargo.billBy),
    defaultUnit: cleanString(cargo.defaultUnit) ?? "MT",
    stowageFactor: cleanNumber(cargo.stowageFactor),
    stowageFactorFt3: cleanNumber(cargo.stowageFactorFt3),
    stowageFactorUnit: cleanString(cargo.stowageFactorUnit) ?? "CBM/MT",
    unNumber: cleanString(cargo.unNumber),
    hazardClass: cleanString(cargo.hazardClass),
    productCode: cleanString(cargo.productCode),
    capacityBasis: cleanString(cargo.capacityBasis),
    description: cleanString(cargo.description),
    isActive: cargo.isActive ?? true,
    preclearanceUsCanada: cargo.preclearanceUsCanada ?? false,
    isDangerous: cargo.isDangerous ?? false,
    specialHandlingRequired: cargo.specialHandlingRequired ?? false,
  };
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
