import { useState } from "react";
import { toast } from "sonner";
import { CardGridSkeleton, ErrorState } from "@/components/ui/States";
import { EmployeeAvatar, EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEmployee } from "@/hooks/useTrevolkData";
import { useToggleEmployeeStatus } from "@/features/dashboard/useToggleEmployeeStatus";
import { EmployeeOverview } from "./EmployeeOverview";
import { EmployeeConfiguration } from "./EmployeeConfiguration";
import { EmployeePerformance } from "./EmployeePerformance";
import { EmployeeActivityHistory } from "./EmployeeActivityHistory";
import type { EmployeeType } from "@/types";

export function EmployeeDetail({ type }: { type: EmployeeType }) {
  const { data: employee, isLoading, isError, refetch } = useEmployee(type);
  const toggle = useToggleEmployeeStatus();
  const [tab, setTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={EMPLOYEE_LABELS[type]} />
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="space-y-6">
        <PageHeader title={EMPLOYEE_LABELS[type]} />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const isPaused = employee.status === "paused";
  const nextStatus = isPaused ? "active" : "paused";

  const handleToggle = () => {
    const label = isPaused ? "resume" : "pause";
    toast(`${employee.name} will ${label}`, {
      description: `Confirm to ${label} this employee.`,
      action: {
        label: "Confirm",
        onClick: () => toggle.mutate({ type, next: nextStatus }),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <EmployeeAvatar type={type} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h1 text-foreground">{employee.name}</h1>
              <button type="button" onClick={() => setTab("configuration")}>
                <EmployeeStatusBadge status={employee.status} />
              </button>
            </div>
            <p className="text-body text-muted-foreground">{employee.role}</p>
            <p className="mt-1 text-caption text-muted-foreground">Last active {employee.lastActive}</p>
          </div>
        </div>
        <Button variant={isPaused ? "default" : "outline"} onClick={handleToggle} disabled={toggle.isPending}>
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EmployeeOverview employee={employee} />
        </TabsContent>
        <TabsContent value="configuration">
          <EmployeeConfiguration employee={employee} />
        </TabsContent>
        <TabsContent value="performance">
          <EmployeePerformance employee={employee} />
        </TabsContent>
        <TabsContent value="activity">
          <EmployeeActivityHistory activity={employee.activity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
