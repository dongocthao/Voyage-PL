import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const MasterDataForm = lazy(() => import("@/components/voyage-estimator/MasterDataForms"));

export const Route = createFileRoute("/address-book")({
  component: AddressBookPage,
});

function AddressBookPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Address Book...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Address Book...</div>}>
        <div className="min-h-screen bg-[#F0F3F6] p-2">
          <MasterDataForm type="address-book" />
        </div>
      </Suspense>
    </ClientOnly>
  );
}
