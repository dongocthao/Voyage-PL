import { createFileRoute } from "@tanstack/react-router";
import { AddressBookForm } from "@/components/address-book-form";

export const Route = createFileRoute("/address-book")({
  head: () => ({
    meta: [
      { title: "Company Detail - Address Book" },
      {
        name: "description",
        content:
          "Maintain company accounts and contact persons: business type, addresses, phone, fax, e-mail and remarks.",
      },
      { property: "og:title", content: "Company Detail - Address Book" },
      {
        property: "og:description",
        content:
          "Maintain company accounts and contact persons: business type, addresses, phone, fax, e-mail and remarks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddressBookPage,
});

function AddressBookPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <AddressBookForm />
    </div>
  );
}
