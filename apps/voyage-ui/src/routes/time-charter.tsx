import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const TimeCharterApp = lazy(() => import("@/components/voyage-estimator/TimeCharterApp"));

export const Route = createFileRoute("/time-charter")({
  head: () => ({
    meta: [
      { title: "Time Charter | Estimation W5" },
      {
        name: "description",
        content: "Time charter estimation with Head CP / Sub CP hire, port rotation and result.",
      },
      { property: "og:title", content: "Time Charter | Estimation W5" },
      {
        property: "og:description",
        content: "Time charter estimation workbench: hire, port rotation, bunker and result.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimeCharterPage,
});

function TimeCharterPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Time Charter…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Time Charter…</div>}>
        <TimeCharterApp />
      </Suspense>
    </ClientOnly>
  );
}
