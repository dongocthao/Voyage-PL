const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:3004/api";

async function main() {
  const payload = {
    header: {
      fileName: "Cargo Relet E2E",
      sheetName: "cargo-relet1",
      estimateTypeCode: "RELT",
      routingSuez: true,
      routingPanama: false,
      routingKiel: true,
      marginSeaDays: 1.25,
      marginPortIdleDays: 0.5,
      timeDisplayUnit: "DAYS",
      timezoneDisplayMode: "PORT_LOCAL",
    },
    cargoLines: [
      {
        lineNo: 1,
        cargoName: "steel coil",
        quantityMt: 25000,
        quantityUnit: "MT",
        head: {
          freightRate: 35,
          freightType: "F",
          addCommPct: 3.8,
          brokeragePct: 1.3,
          netFreight: 830375,
          linerCostAmount: 0,
        },
        sub: {
          freightRate: 38,
          freightType: "F",
          addCommPct: 2.5,
          brokeragePct: 1,
          netFreight: 916750,
          linerCostAmount: 0,
        },
      },
      {
        lineNo: 2,
        cargoName: "general",
        quantityMt: 15000,
        quantityUnit: "MT",
        head: {
          freightRate: 28,
          freightType: "F",
          addCommPct: 3.8,
          brokeragePct: 1.3,
          netFreight: 398580,
          linerCostAmount: 0,
        },
        sub: {
          freightRate: 31,
          freightType: "F",
          addCommPct: 2.5,
          brokeragePct: 1,
          netFreight: 448725,
          linerCostAmount: 0,
        },
      },
    ],
    portLegs: [
      { legNo: 1, legType: "BALLAST", departureAt: "2026-08-09T01:00:00.000Z", head: {}, sub: {} },
      {
        legNo: 2,
        legType: "LOADING",
        distanceNm: 463,
        ecaNm: 0,
        wfPct: 5,
        speedKn: 14,
        seaDays: 1.45,
        portIdleDays: 0.5,
        portWorkingDays: 2.5,
        portCharge: 35000,
        arrivalAt: "2026-08-10T11:48:00.000Z",
        departureAt: "2026-08-13T11:48:00.000Z",
        head: { ldRate: 10000, demurrage: 0, despatch: 3000 },
        sub: { ldRate: 12000, demurrage: 0, despatch: 3500 },
      },
      {
        legNo: 3,
        legType: "DISCHARGE",
        distanceNm: 1356,
        ecaNm: 0,
        wfPct: 5,
        speedKn: 14,
        seaDays: 4.24,
        portIdleDays: 0.5,
        portWorkingDays: 5,
        portCharge: 40000,
        arrivalAt: "2026-08-17T17:34:00.000Z",
        departureAt: "2026-08-23T05:34:00.000Z",
        head: { ldRate: 8000, demurrage: 0, despatch: 3000 },
        sub: { ldRate: 8500, demurrage: 0, despatch: 3200 },
      },
    ],
  };

  const saveResponse = await fetch(`${API_BASE}/estimates/cargo-relet-snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!saveResponse.ok) {
    throw new Error(`Save failed ${saveResponse.status}: ${await saveResponse.text()}`);
  }
  const saved = await saveResponse.json();
  if (!saved.estimateId || saved.result.profitUsd <= 0) {
    throw new Error(`Unexpected save response: ${JSON.stringify(saved)}`);
  }

  const loadResponse = await fetch(`${API_BASE}/estimates/cargo-relet-snapshots/${saved.estimateId}`);
  if (!loadResponse.ok) {
    throw new Error(`Load failed ${loadResponse.status}: ${await loadResponse.text()}`);
  }
  const loaded = await loadResponse.json();
  if (loaded.header.estimateTypeCode !== "RELT") throw new Error("Wrong loaded estimate type");
  if (loaded.header.routingPanama !== false || loaded.header.routingKiel !== true) {
    throw new Error("Routing flags were not persisted");
  }
  if (loaded.cargoLines.length !== 2) throw new Error("Expected 2 cargo lines");
  if (loaded.cargoLines[0].head.netFreight !== 830375) {
    throw new Error("Head net freight was not persisted");
  }
  if (loaded.portLegs.length !== 3 || loaded.portLegs[1].head.ldRate !== 10000) {
    throw new Error("Port CP terms were not persisted");
  }

  console.log(`Cargo Relet API E2E passed for estimate ${saved.estimateId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
