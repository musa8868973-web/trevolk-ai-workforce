import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsView } from "@/features/integrations/IntegrationsView";

export const Route = createFileRoute("/dashboard/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations | Trevolk AI Workforce" },
      { name: "description", content: "Connect your CRM, calendar, inbox and messaging tools to your AI workforce." },
      { property: "og:title", content: "Integrations | Trevolk AI Workforce" },
      { property: "og:description", content: "Connect your CRM, calendar, inbox and messaging tools to your AI workforce." },
    ],
  }),
  component: IntegrationsView,
});
