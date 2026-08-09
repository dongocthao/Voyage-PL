import { createFileRoute } from "@tanstack/react-router";
import MainWorkspace from "@/components/workspace/MainWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voyage P&L Workspace" },
      {
        name: "description",
        content: "Main workspace for voyage estimation and operation workflows.",
      },
    ],
  }),
  component: MainWorkspace,
});
