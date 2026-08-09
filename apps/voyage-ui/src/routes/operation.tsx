import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const OperationApp = lazy(() => import("@/components/voyage-estimator/OperationApp"));

export const Route = createFileRoute("/operation")({
  head: () => ({
    meta: [
      { title: "Operation | Netpas Prosperity Voyage Operation" },
      {
        name: "description",
        content:
          "Voyage operation workbench: vessel particular, cargo, port rotation, arrival & departure records, expenses and result.",
      },
      { property: "og:title", content: "Operation | Netpas Prosperity Voyage Operation" },
      {
        property: "og:description",
        content: "Voyage operation workbench with arrival/departure reports and financial result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ClientOnly>
      <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
        <OperationApp />
      </Suspense>
    </ClientOnly>
  ),
});
