import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const LaytimeCalculatorApp = lazy(
  () => import("@/components/voyage-estimator/LaytimeCalculatorApp"),
);

export const Route = createFileRoute("/laytime")({
  head: () => ({
    meta: [
      { title: "Laytime Calculator | Demurrage & Despatch" },
      {
        name: "description",
        content:
          "Estimate laytime, demurrage and despatch per port with CP terms and holiday rules.",
      },
      { property: "og:title", content: "Laytime Calculator | Demurrage & Despatch" },
      {
        property: "og:description",
        content: "Charter party laytime estimator with SHEX/SHINC terms and port stay totals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Laytime…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Laytime…</div>}>
        <LaytimeCalculatorApp />
      </Suspense>
    </ClientOnly>
  ),
});
