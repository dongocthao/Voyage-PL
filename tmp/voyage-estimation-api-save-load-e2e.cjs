const assert = require("node:assert/strict");

const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:3003/api";

async function main() {
  const [vessels, profiles, cargoes, ports] = await Promise.all([
    getJson("/master-data/vessels"),
    getJson("/master-data/bunker-profiles"),
    getJson("/master-data/cargoes"),
    getJson("/master-data/ports"),
  ]);

  assert(vessels.length, "DB seed must include at least one vessel");
  assert(profiles.length, "DB seed must include at least one bunker profile");
  assert(cargoes.length, "DB seed must include at least one cargo");
  assert(ports.length >= 2, "DB seed must include at least two ports");

  const profile = profiles.find((item) => String(item.vesselId) === String(vessels[0].id)) ?? profiles[0];
  const mode = profile.modes?.some((item) => item.mode === "ECO") ? "ECO" : "FULL";
  const loadingPort = ports[0];
  const dischargingPort = ports[1];

  const payload = {
    header: {
      fileName: "Voyage Estimation E2E",
      sheetName: "voyage1",
      estimateTypeCode: "TCOV",
      voyageNo: `E2E-${Date.now()}`,
      vesselId: String(vessels[0].id),
      bunkerProfileId: String(profile.id),
      performanceMode: mode,
      routingSuez: true,
      routingPanama: false,
      routingKiel: true,
      hireDay: 18000,
      hireAddCommPct: 3.75,
      timeDisplayUnit: "DAYS",
      timezoneDisplayMode: "PORT_LOCAL",
    },
    cargoLines: [
      {
        lineNo: 1,
        cargoId: String(cargoes[0].id),
        cargoName: cargoes[0].name,
        loadingPortId: String(loadingPort.id),
        dischargingPortId: String(dischargingPort.id),
        quantity: 1000,
        unit: cargoes[0].defaultUnit ?? "MT",
        freight: {
          freightType: "F",
          freightRate: 20,
          addCommPct: 1,
          brokeragePct: 1,
          freightTaxPct: 0,
          linerCostAmount: 0,
          isFreightFixed: false,
        },
      },
    ],
    portLegs: [
      {
        legNo: 1,
        legType: "LOADING",
        portId: String(loadingPort.id),
        distanceNm: 240,
        ecaNm: 24,
        wfPct: 10,
        speedKn: 10,
        portIdleDays: 1,
        portCharge: 1000,
        cpTerm: { ldRate: 1000, demurrage: 100, despatch: 50 },
      },
      {
        legNo: 2,
        legType: "DISCHARGE",
        portId: String(dischargingPort.id),
        distanceNm: 240,
        ecaNm: 24,
        wfPct: 0,
        speedKn: 10,
        portIdleDays: 1,
        portCharge: 1000,
        cpTerm: { ldRate: 1000, demurrage: 100, despatch: 50 },
      },
    ],
  };

  const saved = await postJson("/estimates/voyage-snapshots", payload);
  assert(saved.estimateId, "save returns estimate id");
  assert(saved.result?.bunkerSummaries?.length, "save calculates bunker summaries");

  const loaded = await getJson(`/estimates/voyage-snapshots/${saved.estimateId}`);
  assert.equal(loaded.header.estimateId, saved.estimateId);
  assert.equal(loaded.header.routingSuez, true);
  assert.equal(loaded.header.routingPanama, false);
  assert.equal(loaded.header.routingKiel, true);
  assert.equal(loaded.header.performanceMode, mode);
  assert.equal(loaded.header.vesselId, String(vessels[0].id));
  assert.equal(loaded.header.bunkerProfileId, String(profile.id));
  assert.equal(loaded.cargoLines.length, 1);
  assert.equal(loaded.portLegs.length, 2);

  const report = await getJson(`/estimates/voyage-snapshots/${saved.estimateId}/report-summary`);
  assert.equal(report.estimateId, saved.estimateId);
  assert(report.bunkerSummaries.length, "report returns bunker summaries");

  console.log(`Voyage Estimation API save/load E2E passed for estimate ${saved.estimateId}`);
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
