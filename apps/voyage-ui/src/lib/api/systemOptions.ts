import { VoyageApiError } from "./voyageSnapshots";

export type SystemOptions = {
  decimalPlace: number;
  voyageSheetsInNewWorkbook: number;
  cargoReletSheetsInNewWorkbook: number;
  timeCharterSheetsInNewWorkbook: number;
  autoMilestone: boolean;
  timeType: "Days" | "Hours";
  defaultTimeZoneType: "Port local time" | "GMT" | "Ship time";
  defaultVesselSpeed: number;
  normalMainFuel: "VLSFO" | "HSFO" | "ULSFO";
  normalSubFuel: "MGO" | "MDO";
  ecaMainFuel: "ULSFO" | "VLSFO";
  ecaSubFuel: "MGO" | "MDO";
  weatherFactorType: "Distance" | "Speed" | "Time";
  defaultWeatherFactor: number;
  applyEuEtsToSheet: boolean;
  defaultMainCurrency: "USD";
};

export const DEFAULT_SYSTEM_OPTIONS: SystemOptions = {
  decimalPlace: 2,
  voyageSheetsInNewWorkbook: 2,
  cargoReletSheetsInNewWorkbook: 1,
  timeCharterSheetsInNewWorkbook: 1,
  autoMilestone: true,
  timeType: "Days",
  defaultTimeZoneType: "Port local time",
  defaultVesselSpeed: 13,
  normalMainFuel: "VLSFO",
  normalSubFuel: "MGO",
  ecaMainFuel: "ULSFO",
  ecaSubFuel: "MGO",
  weatherFactorType: "Distance",
  defaultWeatherFactor: 0,
  applyEuEtsToSheet: true,
  defaultMainCurrency: "USD",
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function fetchSystemOptions() {
  const response = await fetch(`${API_BASE_URL}/master-data/settings/system-options`);
  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `System options failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }
  const payload = (await response.json()) as { settings?: Partial<SystemOptions> };
  return { ...DEFAULT_SYSTEM_OPTIONS, ...payload.settings, defaultMainCurrency: "USD" as const };
}

export async function saveSystemOptions(settings: SystemOptions) {
  const response = await fetch(`${API_BASE_URL}/master-data/settings/system-options`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => undefined);
    throw new VoyageApiError(
      error?.message ?? `Save system options failed with status ${response.status}`,
      error?.code,
      error?.details ?? [],
    );
  }

  const payload = (await response.json()) as { settings?: Partial<SystemOptions> };
  return { ...DEFAULT_SYSTEM_OPTIONS, ...payload.settings, defaultMainCurrency: "USD" as const };
}
