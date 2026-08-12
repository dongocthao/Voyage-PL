import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { loadVoyageSnapshot, type VoyageSnapshotPayload } from "@/lib/api/voyageSnapshots";

const AnalyzerApp = lazy(() => import("@/components/voyage-estimator/AnalyzerApp"));

export const Route = createFileRoute("/analyzer")({
  validateSearch: (search) => ({
    estimateId: typeof search.estimateId === "string" ? search.estimateId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Estimation Analyzer | Freight Sensitivity" },
      {
        name: "description",
        content:
          "Sensitivity analyzer for freight, hire, quantity and bunker with profit/loss per step.",
      },
      { property: "og:title", content: "Estimation Analyzer | Freight Sensitivity" },
      {
        property: "og:description",
        content: "Freight/hire/quantity/bunker sensitivity table with break even point.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyzerRoute,
});

function AnalyzerRoute() {
  const search = Route.useSearch();
  const [snapshot, setSnapshot] = useState<VoyageSnapshotPayload>();
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    if (!search.estimateId) return;
    setStatus("Loading snapshot...");
    loadVoyageSnapshot(search.estimateId)
      .then((loaded) => {
        setSnapshot(loaded);
        setStatus(`Loaded estimate ${search.estimateId}`);
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "Unable to load snapshot"));
  }, [search.estimateId]);

  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Analyzer...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Analyzer...</div>}>
        <div className="space-y-1">
          <div className="px-1 text-xs text-muted-foreground">{status}</div>
          <AnalyzerApp snapshot={snapshot} onApply={() => setStatus("Applied analyzer result")} />
        </div>
      </Suspense>
    </ClientOnly>
  );
}
