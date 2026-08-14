import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsView } from "@/features/analytics/AnalyticsView";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | Trevolk AI Workforce" },
      { name: "description", content: "Response times, resolution rates and revenue impact across every channel." },
      { property: "og:title", content: "Analytics | Trevolk AI Workforce" },
      { property: "og:description", content: "Response times, resolution rates and revenue impact across every channel." },
    ],
  }),
  component: AnalyticsView,
});
