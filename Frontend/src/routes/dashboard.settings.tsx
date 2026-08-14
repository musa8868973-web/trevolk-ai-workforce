import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/features/settings/SettingsView";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Trevolk AI Workforce" },
      { name: "description", content: "Manage your workspace profile, team members and notification preferences." },
      { property: "og:title", content: "Settings | Trevolk AI Workforce" },
      { property: "og:description", content: "Manage your workspace profile, team members and notification preferences." },
    ],
  }),
  component: SettingsView,
});
