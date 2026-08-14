import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetail } from "@/features/ai-employees/EmployeeDetail";

export const Route = createFileRoute("/dashboard/ai-employees/support")({
  head: () => ({
    meta: [
      { title: "AI Support Employee | Trevolk AI Workforce" },
      { name: "description", content: "Configure, monitor and review the AI Support Employee." },
      { property: "og:title", content: "AI Support Employee | Trevolk AI Workforce" },
      { property: "og:description", content: "Configure, monitor and review the AI Support Employee." },
    ],
  }),
  component: () => <EmployeeDetail type="support" />,
});
