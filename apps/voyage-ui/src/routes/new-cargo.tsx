import { createFileRoute } from "@tanstack/react-router";
import { NewCargoForm } from "@/components/new-cargo-form";

export const Route = createFileRoute("/new-cargo")({
  head: () => ({
    meta: [
      { title: "New Cargo - IMOS Cargo Name Setup" },
      {
        name: "description",
        content:
          "Create a cargo record with short name, cargo group, stowage factor, UN number and handling flags.",
      },
      { property: "og:title", content: "New Cargo - IMOS Cargo Name Setup" },
      {
        property: "og:description",
        content:
          "Create a cargo record with short name, cargo group, stowage factor, UN number and handling flags.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewCargoPage,
});

function NewCargoPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <NewCargoForm />
    </div>
  );
}
