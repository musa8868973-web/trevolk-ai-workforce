import { createFileRoute } from "@tanstack/react-router";
import { LeadsView } from "@/features/leads/LeadsView";

export const Route = createFileRoute("/dashboard/leads")({
  head: () => ({
    meta: [
      { title: "Leads | Trevolk AI Workforce" },
      { name: "description", content: "Track and qualify every lead your AI Sales Employee captures." },
      { property: "og:title", content: "Leads | Trevolk AI Workforce" },
      { property: "og:description", content: "Track and qualify every lead your AI Sales Employee captures." },
    ],
  }),
  component: LeadsView,
});
