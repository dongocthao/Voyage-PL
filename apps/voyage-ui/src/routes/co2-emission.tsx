import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const MasterDataForm = lazy(() => import("@/components/voyage-estimator/MasterDataForms"));

export const Route = createFileRoute("/co2-emission")({
  component: Co2EmissionPage,
});

function Co2EmissionPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading CO2 Emission...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading CO2 Emission...</div>}>
        <div className="min-h-screen bg-[#F0F3F6] p-2">
          <MasterDataForm type="co2-emission" />
        </div>
      </Suspense>
    </ClientOnly>
  );
}
