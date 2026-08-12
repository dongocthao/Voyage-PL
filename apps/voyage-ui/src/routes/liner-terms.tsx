import { createFileRoute } from "@tanstack/react-router";
import { LinerTermsForm } from "@/components/liner-terms-form";

export const Route = createFileRoute("/liner-terms")({
  head: () => ({
    meta: [
      { title: "Liner Term - Port Cargo Rates" },
      {
        name: "description",
        content:
          "Enter liner term rows: port type, port name, account, cargo, lumpsum, quantity, rate per MT and amount.",
      },
      { property: "og:title", content: "Liner Term - Port Cargo Rates" },
      {
        property: "og:description",
        content:
          "Enter liner term rows: port type, port name, account, cargo, lumpsum, quantity, rate per MT and amount.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinerTermsPage,
});

function LinerTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <LinerTermsForm />
    </div>
  );
}
