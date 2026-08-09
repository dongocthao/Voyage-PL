import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const FreightSimulatorApp = lazy(() => import("@/components/voyage-estimator/FreightSimulatorApp"));

export const Route = createFileRoute("/freight-simulator")({
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
  component: () => (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Freight Simulator…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Freight Simulator…</div>}>
        <FreightSimulatorApp />
      </Suspense>
    </ClientOnly>
  ),
});
