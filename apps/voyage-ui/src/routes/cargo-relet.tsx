import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const CargoReletApp = lazy(() => import("@/components/voyage-estimator/CargoReletApp"));

export const Route = createFileRoute("/cargo-relet")({
  head: () => ({
    meta: [
      { title: "Cargo Relet | Estimation W3" },
      {
        name: "description",
        content: "Cargo relet estimation with Head CP and Sub CP freight and laytime comparison.",
      },
      { property: "og:title", content: "Cargo Relet | Estimation W3" },
      {
        property: "og:description",
        content: "Head CP vs Sub CP cargo relet estimation workbench.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CargoReletPage,
});

function CargoReletPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Cargo Relet…</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Cargo Relet…</div>}>
        <CargoReletApp />
      </Suspense>
    </ClientOnly>
  );
}
