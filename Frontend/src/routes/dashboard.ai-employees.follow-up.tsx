import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetail } from "@/features/ai-employees/EmployeeDetail";

export const Route = createFileRoute("/dashboard/ai-employees/follow-up")({
  head: () => ({
    meta: [
      { title: "AI Follow Up Employee | Trevolk AI Workforce" },
      { name: "description", content: "Configure, monitor and review the AI Follow Up Employee." },
      { property: "og:title", content: "AI Follow Up Employee | Trevolk AI Workforce" },
      { property: "og:description", content: "Configure, monitor and review the AI Follow Up Employee." },
    ],
  }),
  component: () => <EmployeeDetail type="follow-up" />,
});
