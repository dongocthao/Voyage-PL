const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export type PortMaster = {
  id?: string;
  portName: string;
  portType?: string | null;
  countryName?: string | null;
  state?: string | null;
  portOperator?: string | null;
  portNo?: number | null;
  timeZoneCode?: string | null;
  unlocode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  latitudeText?: string | null;
  longitudeText?: string | null;
  regionCode?: string | null;
  loadlineZone?: string | null;
  stdGmtOffset?: number | null;
  dstGmtOffset?: number | null;
  isActive?: boolean;
};

export type PortLookup = {
  id: string;
  name?: string;
  country?: string;
  unlocode?: string | null;
  timeZoneCode?: string | null;
  portType?: string | null;
  status?: string;
  latitude?: number | null;
  longitude?: number | null;
  utcOffsetMin?: number | null;
  lastUpdated?: string;
  isActive?: boolean;
};

export type CountryLookup = {
  id: number;
  code: string;
  name: string;
};

export type PortTypeLookup = {
  id: number;
  code: string;
  name: string;
};

async function requestPort(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.message ?? `Port request failed with status ${response.status}`);
  }
  return body as PortMaster;
}

export async function listPorts(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/ports${params}`);
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.message ?? `Port lookup failed with status ${response.status}`);
  }
  return body as PortLookup[];
}

export function getPort(id: string) {
  return requestPort(`${API_BASE_URL}/master-data/ports/${encodeURIComponent(id)}`);
}

export async function listCountries(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/countries${params}`);
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.message ?? `Country lookup failed with status ${response.status}`);
  }
  return body as CountryLookup[];
}

export async function listPortTypes(query = "") {
  const params = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await fetch(`${API_BASE_URL}/master-data/port-types${params}`);
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(body?.message ?? `Port type lookup failed with status ${response.status}`);
  }
  return body as PortTypeLookup[];
}

export function savePort(port: PortMaster) {
  const { id, ...payload } = sanitizePort(port);
  const method = id ? "PUT" : "POST";
  const url = id
    ? `${API_BASE_URL}/master-data/ports/${encodeURIComponent(id)}`
    : `${API_BASE_URL}/master-data/ports`;
  return requestPort(url, { method, body: JSON.stringify(payload) });
}

function sanitizePort(port: PortMaster): PortMaster {
  return {
    portName: port.portName.trim(),
    portType: cleanString(port.portType),
    countryName: cleanString(port.countryName),
    state: cleanString(port.state),
    portOperator: cleanString(port.portOperator),
    timeZoneCode: cleanString(port.timeZoneCode),
    unlocode: cleanString(port.unlocode),
    latitude: cleanNumber(port.latitude),
    longitude: cleanNumber(port.longitude),
    latitudeText: cleanString(port.latitudeText),
    longitudeText: cleanString(port.longitudeText),
    regionCode: cleanString(port.regionCode),
    loadlineZone: cleanString(port.loadlineZone),
    portNo: cleanNumber(port.portNo),
    stdGmtOffset: cleanNumber(port.stdGmtOffset),
    dstGmtOffset: cleanNumber(port.dstGmtOffset),
    isActive: port.isActive ?? true,
  };
}

function cleanString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function cleanNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
