import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const CharterPartyApp = lazy(() => import("@/components/voyage-estimator/CharterPartyApps"));

export const Route = createFileRoute("/voyage-charter-party")({
  head: () => ({
    meta: [{ title: "Voyage Charter Party | Voyage P&L" }],
  }),
  component: VoyageCharterPartyPage,
});

function VoyageCharterPartyPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Voyage Charter Party...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Voyage Charter Party...</div>}>
        <div className="min-h-screen bg-[#F0F3F6] p-2">
          <CharterPartyApp type="voyage" />
        </div>
      </Suspense>
    </ClientOnly>
  );
}
