const assert = require("node:assert/strict");

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:3003/api";

async function request(path, init) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function lookup(path) {
  return request(`/master-data/${path}`);
}

function consumption(fuelRole, condition, activity, fuelTypeId, consumptionMtDay) {
  return { fuelRole, condition, activity, fuelTypeId, consumptionMtDay };
}

function mode(modeName, fuelIds, factor) {
  return {
    mode: modeName,
    speedBallastKn: 12 * factor,
    speedLadenKn: 11 * factor,
    consumption: [
      consumption("MAIN", "NORMAL", "BALLAST", fuelIds.VLSFO, 18 * factor),
      consumption("MAIN", "NORMAL", "LADEN", fuelIds.VLSFO, 22 * factor),
      consumption("MAIN", "NORMAL", "IDLE", fuelIds.VLSFO, 1.2 * factor),
      consumption("MAIN", "NORMAL", "WORK", fuelIds.VLSFO, 2 * factor),
      consumption("MAIN", "ECA", "BALLAST", fuelIds.ULSFO, 18 * factor),
      consumption("MAIN", "ECA", "LADEN", fuelIds.ULSFO, 22 * factor),
      consumption("MAIN", "ECA", "IDLE", fuelIds.ULSFO, 1.2 * factor),
      consumption("MAIN", "ECA", "WORK", fuelIds.ULSFO, 2 * factor),
      consumption("SUB", "NORMAL", "SEA", fuelIds.MGO, 1.8 * factor),
      consumption("SUB", "NORMAL", "IDLE", fuelIds.MGO, 1.2 * factor),
      consumption("SUB", "NORMAL", "WORK", fuelIds.MGO, 2.2 * factor),
      consumption("SUB", "ECA", "SEA", fuelIds.MGO, 1.8 * factor),
      consumption("SUB", "ECA", "IDLE", fuelIds.MGO, 1.2 * factor),
      consumption("SUB", "ECA", "WORK", fuelIds.MGO, 2.2 * factor),
    ],
  };
}

function profile(profileName, fuelIds, factor) {
  return {
    profileName,
    effectiveFrom: "2026-08-09",
    isActive: true,
    modes: ["FULL", "ECO", "CUSTOM1", "CUSTOM2", "CUSTOM3"].map((modeName, index) =>
      mode(modeName, fuelIds, factor - index * 0.03),
    ),
  };
}

async function main() {
  const [fuelTypes, vesselKinds, vesselTypes, companies] = await Promise.all([
    lookup("fuel-types"),
    lookup("vessel-kinds"),
    lookup("vessel-types"),
    lookup("companies"),
  ]);

  assert.ok(fuelTypes.length >= 3, "fuel type lookup should return seed rows");
  assert.ok(vesselKinds.length >= 1, "vessel kind lookup should return seed rows");
  assert.ok(vesselTypes.length >= 1, "vessel type lookup should return seed rows");

  const byCode = new Map(fuelTypes.map((item) => [item.code, Number(item.id)]));
  const fuelIds = {
    VLSFO: byCode.get("VLSFO") ?? Number(fuelTypes[0].id),
    ULSFO: byCode.get("ULSFO") ?? Number(fuelTypes[1]?.id ?? fuelTypes[0].id),
    MGO: byCode.get("MGO") ?? Number(fuelTypes[2]?.id ?? fuelTypes[0].id),
  };
  const stamp = Date.now();
  const payload = {
    mvName: `E2E NEW VESSEL ${stamp}`,
    ownership: "OWNED",
    ownerCompanyId: companies[0]?.id ? String(companies[0].id) : undefined,
    vesselKindId: Number(vesselKinds[0].id),
    vesselTypeId: Number(vesselTypes[0].id),
    imoNo: "1234567",
    callSign: "E2E",
    vesselCode: `E2E-${stamp}`,
    builtYear: 2026,
    dwt: 55000,
    draftM: 12.5,
    loaM: 190,
    beamM: 32,
    gears: [{ gearType: "Crane", position: "Midship", capacityMt: 30, qtyEa: 4 }],
    hoHaType: "Single Deck/Folding",
    hoHaGear: "5/5",
    tankTopStrengthUpper: 18,
    tankTopStrengthTween: 12,
    hatchCoverStrength: 3,
    isActive: true,
    bunkerProfiles: [profile("E2E Standard", fuelIds, 1), profile("E2E Eco", fuelIds, 0.9)],
  };

  const created = await request("/master-data/vessels", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  assert.ok(created.id, "created vessel should have id");
  assert.equal(created.mvName, payload.mvName);
  assert.equal(created.gears.length, 1);
  assert.equal(created.bunkerProfiles.length, 2);
  assert.equal(created.bunkerProfiles[0].modes.length, 5);
  assert.equal(created.bunkerProfiles[0].modes[0].consumption.length, 14);

  const updated = await request(`/master-data/vessels/${created.id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...created,
      mvName: `${payload.mvName} UPDATED`,
      gears: [
        ...created.gears,
        { gearType: "Grab", position: "Aft", capacityMt: 12, qtyEa: 2 },
      ],
      bunkerProfiles: created.bunkerProfiles.map((item, index) =>
        index === 0 ? { ...item, profileName: "E2E Standard Updated" } : item,
      ),
    }),
  });

  assert.equal(updated.mvName, `${payload.mvName} UPDATED`);
  assert.equal(updated.gears.length, 2);
  assert.equal(updated.bunkerProfiles[0].profileName, "E2E Standard Updated");

  const loaded = await request(`/master-data/vessels/${created.id}`);
  assert.equal(loaded.mvName, updated.mvName);
  assert.equal(loaded.gears.length, 2);
  assert.equal(loaded.bunkerProfiles.length, 2);
  assert.equal(loaded.bunkerProfiles[0].modes.length, 5);
  assert.equal(loaded.bunkerProfiles[0].modes[0].consumption.length, 14);

  console.log(`New Vessel API E2E passed for vessel ${loaded.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
