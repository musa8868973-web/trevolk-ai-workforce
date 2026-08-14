import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetail } from "@/features/ai-employees/EmployeeDetail";

export const Route = createFileRoute("/dashboard/ai-employees/receptionist")({
  head: () => ({
    meta: [
      { title: "AI Receptionist Employee | Trevolk AI Workforce" },
      { name: "description", content: "Configure, monitor and review the AI Receptionist Employee." },
      { property: "og:title", content: "AI Receptionist Employee | Trevolk AI Workforce" },
      { property: "og:description", content: "Configure, monitor and review the AI Receptionist Employee." },
    ],
  }),
  component: () => <EmployeeDetail type="receptionist" />,
});
