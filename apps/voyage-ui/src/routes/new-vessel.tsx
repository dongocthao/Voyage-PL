import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const MasterDataForm = lazy(() => import("@/components/voyage-estimator/MasterDataForms"));

export const Route = createFileRoute("/new-vessel")({
  component: NewVesselPage,
});

function NewVesselPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading New Vessel...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading New Vessel...</div>}>
        <div className="min-h-screen bg-[#F0F3F6] p-2">
          <MasterDataForm type="new-vessel" />
        </div>
      </Suspense>
    </ClientOnly>
  );
}
