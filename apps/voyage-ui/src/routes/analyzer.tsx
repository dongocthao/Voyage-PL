import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AnalyzerApp = lazy(() => import("@/components/voyage-estimator/AnalyzerApp"));

export const Route = createFileRoute("/analyzer")({
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
  component: () => (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Analyzer…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Analyzer…</div>}>
        <AnalyzerApp />
      </Suspense>
    </ClientOnly>
  ),
});
