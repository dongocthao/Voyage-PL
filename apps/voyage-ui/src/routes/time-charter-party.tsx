import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const CharterPartyApp = lazy(() => import("@/components/voyage-estimator/CharterPartyApps"));

export const Route = createFileRoute("/time-charter-party")({
  head: () => ({
    meta: [{ title: "Time Charter Party | Voyage P&L" }],
  }),
  component: TimeCharterPartyPage,
});

function TimeCharterPartyPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Time Charter Party...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Time Charter Party...</div>}>
        <div className="min-h-screen bg-[#F0F3F6] p-2">
          <CharterPartyApp type="time-charter" />
        </div>
      </Suspense>
    </ClientOnly>
  );
}
