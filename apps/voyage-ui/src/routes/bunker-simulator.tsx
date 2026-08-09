import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const BunkerSimulatorApp = lazy(() => import("@/components/voyage-estimator/BunkerSimulatorApp"));

export const Route = createFileRoute("/bunker-simulator")({
  head: () => ({
    meta: [
      { title: "Bunker Simulator | Voyage Estimation" },
      {
        name: "description",
        content: "Simulate bunker ROB, supply, consumption and full vs eco speed price comparison.",
      },
      { property: "og:title", content: "Bunker Simulator | Voyage Estimation" },
      {
        property: "og:description",
        content: "ROB & supply, bunker price and full/eco speed comparison workbench.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Bunker Simulator…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Bunker Simulator…</div>}>
        <BunkerSimulatorApp />
      </Suspense>
    </ClientOnly>
  ),
});
