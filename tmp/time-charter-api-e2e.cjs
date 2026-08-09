const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:3004/api";

async function main() {
  const payload = {
    header: {
      fileName: "Time Charter E2E",
      sheetName: "time-charter1",
      estimateTypeCode: "TCOV",
      routingSuez: true,
      routingPanama: false,
      routingKiel: true,
      marginSeaDays: 1.5,
      marginPortIdleDays: 0.25,
      timeDisplayUnit: "DAYS",
      timezoneDisplayMode: "PORT_LOCAL",
    },
    charterTerms: [
      {
        cpSide: "HEAD",
        durationDays: 10,
        dailyHire: 7000,
        grossHire: 70000,
        addCommPct: 2.5,
        brokeragePct: 1.25,
        useMultiDuration: true,
        durationPeriods: [
          { periodNo: 1, durationDays: 4, dailyHire: 6800 },
          { periodNo: 2, durationDays: 6, dailyHire: 7200 },
        ],
      },
      {
        cpSide: "SUB",
        durationDays: 10,
        dailyHire: 8500,
        grossHire: 85000,
        addCommPct: 1,
        brokeragePct: 1,
        useMultiDuration: false,
        durationPeriods: [],
      },
    ],
    portLegs: [
      { legNo: 1, legType: "DELIVERY", departureAt: "2026-08-09T01:00:00.000Z" },
      {
        legNo: 2,
        legType: "BALLAST",
        distanceNm: 760,
        ecaNm: 63,
        wfPct: 5,
        speedKn: 14,
        seaDays: 2.26,
        arrivalAt: "2026-08-11T07:14:00.000Z",
      },
      { legNo: 3, legType: "REDELIVERY", arrivalAt: "2026-08-19T01:00:00.000Z" },
    ],
  };

  const saveResponse = await fetch(`${API_BASE}/estimates/time-charter-snapshots`, {
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

  const loadResponse = await fetch(`${API_BASE}/estimates/time-charter-snapshots/${saved.estimateId}`);
  if (!loadResponse.ok) {
    throw new Error(`Load failed ${loadResponse.status}: ${await loadResponse.text()}`);
  }
  const loaded = await loadResponse.json();
  if (loaded.header.estimateTypeCode !== "TCOV") throw new Error("Wrong loaded estimate type");
  if (loaded.header.routingPanama !== false || loaded.header.routingKiel !== true) {
    throw new Error("Routing flags were not persisted");
  }
  if (loaded.charterTerms.length !== 2) throw new Error("Expected 2 charter terms");
  const head = loaded.charterTerms.find((term) => term.cpSide === "HEAD");
  if (!head?.useMultiDuration || head.durationPeriods.length !== 2) {
    throw new Error("Head CP duration periods were not persisted");
  }
  if (loaded.portLegs.length !== 3 || loaded.portLegs[0].legType !== "DELIVERY") {
    throw new Error("Port legs were not persisted");
  }

  console.log(`Time Charter API E2E passed for estimate ${saved.estimateId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
