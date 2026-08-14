import { createFileRoute } from "@tanstack/react-router";
import { AutomationsView } from "@/features/automations/AutomationsView";

export const Route = createFileRoute("/dashboard/automations")({
  head: () => ({
    meta: [
      { title: "Automations | Trevolk AI Workforce" },
      { name: "description", content: "Trigger-and-action rules that let your AI Employees work without prompting." },
      { property: "og:title", content: "Automations | Trevolk AI Workforce" },
      { property: "og:description", content: "Trigger-and-action rules that let your AI Employees work without prompting." },
    ],
  }),
  component: AutomationsView,
});
