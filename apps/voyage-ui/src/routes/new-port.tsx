import { createFileRoute } from "@tanstack/react-router";
import { NewPortForm } from "@/components/new-port-form";

export const Route = createFileRoute("/new-port")({
  head: () => ({
    meta: [
      { title: "New Port - Port General Information" },
      {
        name: "description",
        content:
          "Register a port with name, type, country, UN code, coordinates, region and time zone offsets.",
      },
      { property: "og:title", content: "New Port - Port General Information" },
      {
        property: "og:description",
        content:
          "Register a port with name, type, country, UN code, coordinates, region and time zone offsets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewPortPage,
});

function NewPortPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <NewPortForm />
    </div>
  );
}
