import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetail } from "@/features/ai-employees/EmployeeDetail";

export const Route = createFileRoute("/dashboard/ai-employees/sales")({
  head: () => ({
    meta: [
      { title: "AI Sales Employee | Trevolk AI Workforce" },
      { name: "description", content: "Configure, monitor and review the AI Sales Employee." },
      { property: "og:title", content: "AI Sales Employee | Trevolk AI Workforce" },
      { property: "og:description", content: "Configure, monitor and review the AI Sales Employee." },
    ],
  }),
  component: () => <EmployeeDetail type="sales" />,
});
