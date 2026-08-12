import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { EstimateListForm } from "@/components/estimate-list-form";

export const Route = createFileRoute("/estimate-list")({
  head: () => ({
    meta: [
      { title: "Estimate List" },
      {
        name: "description",
        content: "Browse, filter, find and open voyage, time charter and cargo relet estimates.",
      },
      { property: "og:title", content: "Estimate List" },
      {
        property: "og:description",
        content: "Estimate list with year, vessel and voyage tree plus filterable estimation grid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EstimateListPage,
});

function EstimateListPage() {
  return (
    <ClientOnly fallback={<div className="p-4 text-sm">Loading Estimate List...</div>}>
      <Suspense fallback={<div className="p-4 text-sm">Loading Estimate List...</div>}>
        <EstimateListForm />
      </Suspense>
    </ClientOnly>
  );
}
