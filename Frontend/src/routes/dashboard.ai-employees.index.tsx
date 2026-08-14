import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeGrid } from "@/features/ai-employees/EmployeeGrid";

export const Route = createFileRoute("/dashboard/ai-employees/")({
  head: () => ({
    meta: [
      { title: "AI Employees | Trevolk AI Workforce" },
      { name: "description", content: "Browse and manage every AI Employee working for your business." },
      { property: "og:title", content: "AI Employees | Trevolk AI Workforce" },
      { property: "og:description", content: "Browse and manage every AI Employee working for your business." },
    ],
  }),
  component: AiEmployeesIndex,
});

function AiEmployeesIndex() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Employees" description="Configure, activate and monitor your AI workforce" />
      <EmployeeGrid />
    </div>
  );
}
