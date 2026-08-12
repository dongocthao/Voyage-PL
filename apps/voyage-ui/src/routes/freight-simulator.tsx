import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { loadCargoReletSnapshot } from "@/lib/api/cargoReletSnapshots";
import { loadVoyageSnapshot, type VoyageSnapshotPayload } from "@/lib/api/voyageSnapshots";

const FreightSimulatorApp = lazy(() => import("@/components/voyage-estimator/FreightSimulatorApp"));

export const Route = createFileRoute("/freight-simulator")({
  validateSearch: (search) => ({
    estimateId: typeof search.estimateId === "string" ? search.estimateId : undefined,
    source: search.source === "cargo-relet" ? "cargo-relet" : "voyage",
  }),
  head: () => ({
    meta: [
      { title: "Freight Simulator | Target Profit" },
      {
        name: "description",
        content: "Back-solve cargo freight rates from a target daily or total voyage profit.",
      },
      { property: "og:title", content: "Freight Simulator | Target Profit" },
      {
        property: "og:description",
        content: "Set target profit and simulate freight and revenue per cargo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FreightSimulatorRoute,
});

function FreightSimulatorRoute() {
  const search = Route.useSearch();
  const [snapshot, setSnapshot] = useState<VoyageSnapshotPayload>();
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    if (!search.estimateId) return;
    setStatus("Loading snapshot...");
    const loader =
      search.source === "cargo-relet"
        ? loadCargoReletSnapshot(search.estimateId).then(cargoReletToVoyageSnapshot)
        : loadVoyageSnapshot(search.estimateId);
    loader
      .then((loaded) => {
        setSnapshot(loaded);
        setStatus(`Loaded estimate ${search.estimateId}`);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Unable to load snapshot"));
  }, [search.estimateId, search.source]);

  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Freight Simulator...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Freight Simulator...</div>}>
        <div className="space-y-1">
          <div className="px-1 text-xs text-muted-foreground">{status}</div>
          <FreightSimulatorApp snapshot={snapshot} onApply={() => setStatus("Applied simulator result")} />
        </div>
      </Suspense>
    </ClientOnly>
  );
}

function cargoReletToVoyageSnapshot(
  snapshot: Awaited<ReturnType<typeof loadCargoReletSnapshot>>,
): VoyageSnapshotPayload {
  return {
    header: { ...snapshot.header, estimateTypeCode: "CARGO_RELET" },
    cargoLines: snapshot.cargoLines.map((line) => ({
      lineNo: line.lineNo,
      accountCompanyId: line.accountCompanyId,
      cargoId: line.cargoId,
      cargoName: line.cargoName,
      loadingPortId: line.loadingPortId,
      dischargingPortId: line.dischargingPortId,
      quantity: line.quantityMt,
      unit: line.quantityUnit ?? "MT",
      freight: {
        freightRate: line.head.freightRate,
        freightType: line.head.freightType === "L" ? "L" : "F",
        freightLumpsum: line.head.freightLumpsum,
        addCommPct: line.head.addCommPct,
        brokeragePct: line.head.brokeragePct,
        linerCostAmount: line.head.linerCostAmount,
      },
    })),
    portLegs: snapshot.portLegs.map((leg) => ({
      ...leg,
      cpTerm: leg.head,
    })),
  };
}
