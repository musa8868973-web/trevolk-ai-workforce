import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeStatusCards } from "@/features/dashboard/EmployeeStatusCards";
import { AlertsPanel } from "@/features/dashboard/AlertsPanel";
import { ActivityFeedPanel } from "@/features/dashboard/ActivityFeedPanel";
import { QuickActions } from "@/features/dashboard/QuickActions";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Trevolk AI Workforce" },
      { name: "description", content: "Command center overview of your AI Employees, alerts and today's activity." },
      { property: "og:title", content: "Dashboard | Trevolk AI Workforce" },
      { property: "og:description", content: "Command center overview of your AI Employees, alerts and today's activity." },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your AI workforce at a glance" />
      <EmployeeStatusCards />
      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsPanel />
        <ActivityFeedPanel />
      </div>
      <QuickActions />
    </div>
  );
}
