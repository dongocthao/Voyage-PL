const API_BASE = process.env.API_BASE ?? "http://localhost:3001/api";

async function main() {
  const response = await fetch(`${API_BASE}/estimates/time-charter-snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      header: {
        fileName: "Invalid TC",
        sheetName: "time-charter1",
        estimateTypeCode: "TCOV",
      },
      charterTerms: [
        {
          cpSide: "HEAD",
          durationDays: 0,
          dailyHire: 0,
          useMultiDuration: false,
          durationPeriods: [],
        },
      ],
      portLegs: [],
    }),
  });

  const body = await response.json().catch(() => undefined);
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}: ${JSON.stringify(body)}`);
  }
  if (!body?.details?.some((detail) => String(detail.path).includes("SUB"))) {
    throw new Error(`Expected missing Sub CP detail: ${JSON.stringify(body)}`);
  }

  console.log("Time Charter validation E2E passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
