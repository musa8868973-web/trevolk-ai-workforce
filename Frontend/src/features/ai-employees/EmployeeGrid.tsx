import { useNavigate } from "@tanstack/react-router";
import { CardGridSkeleton, ErrorState } from "@/components/ui/States";
import { EmployeeAvatar, EMPLOYEE_ROUTES } from "@/components/ui/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/hooks/useTrevolkData";
import { EmployeeEmptyState } from "@/features/dashboard/EmployeeStatusCards";
import { cn } from "@/lib/utils";
import type { AIEmployeeConfig } from "@/types";

function EmployeeGridCard({ employee }: { employee: AIEmployeeConfig }) {
  const navigate = useNavigate();
  const isPaused = employee.status === "paused";

  return (
    <div
      className={cn(
        "surface-panel flex flex-col gap-4 p-5 transition-colors",
        isPaused && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <EmployeeAvatar type={employee.type} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-foreground">{employee.name}</p>
            <p className="truncate text-caption text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <EmployeeStatusBadge status={employee.status} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <p className="tabular text-h3 font-semibold text-foreground">{employee.keyStatValue}</p>
          <p className="text-caption text-muted-foreground">{employee.keyStatLabel}</p>
        </div>
        <div>
          <p className="tabular text-h3 font-semibold text-foreground">{employee.metrics[0]?.value ?? "—"}</p>
          <p className="text-caption text-muted-foreground">{employee.metrics[0]?.label ?? "Metric"}</p>
        </div>
      </div>

      <Button
        variant={employee.status === "active" ? "outline" : "default"}
        className="mt-auto w-full"
        onClick={() => navigate({ to: EMPLOYEE_ROUTES[employee.type] })}
      >
        {employee.status === "active" || employee.status === "needs-attention" ? "Configure" : "Activate"}
      </Button>
    </div>
  );
}

export function EmployeeGrid() {
  const { data, isLoading, isError, refetch } = useEmployees();

  if (isLoading) return <CardGridSkeleton count={4} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <EmployeeEmptyState />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((employee) => (
        <EmployeeGridCard key={employee.type} employee={employee} />
      ))}
    </div>
  );
}
