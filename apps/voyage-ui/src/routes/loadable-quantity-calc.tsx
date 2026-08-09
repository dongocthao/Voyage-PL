import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const LoadableQuantityApp = lazy(() => import("@/components/voyage-estimator/LoadableQuantityApp"));

export const Route = createFileRoute("/loadable-quantity-calc")({
  head: () => ({
    meta: [
      { title: "Loadable Quantity Calculator | Draft & DWT" },
      {
        name: "description",
        content:
          "Calculate loadable quantity by grain/bale capacity or DWT with draft restriction losses.",
      },
      { property: "og:title", content: "Loadable Quantity Calculator | Draft & DWT" },
      {
        property: "og:description",
        content:
          "Volume and DWT based loadable quantity with loading/discharging draft consideration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Loadable Quantity…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Loadable Quantity…</div>}>
        <LoadableQuantityApp />
      </Suspense>
    </ClientOnly>
  ),
});
