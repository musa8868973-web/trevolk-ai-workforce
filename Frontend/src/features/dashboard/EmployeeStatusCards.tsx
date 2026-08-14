import { useNavigate } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { EmployeeAvatar, EMPLOYEE_ROUTES } from "@/components/ui/EmployeeAvatar";
import { EmployeeStatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/hooks/useTrevolkData";
import { useToggleEmployeeStatus } from "./useToggleEmployeeStatus";
import type { AIEmployeeConfig } from "@/types";
import { cn } from "@/lib/utils";

function EmployeeCard({ employee }: { employee: AIEmployeeConfig }) {
  const navigate = useNavigate();
  const toggle = useToggleEmployeeStatus();
  const isPaused = employee.status === "paused";
  const isChecked = employee.status === "active" || employee.status === "needs-attention";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate({ to: EMPLOYEE_ROUTES[employee.type] })}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate({ to: EMPLOYEE_ROUTES[employee.type] });
      }}
      className={cn(
        "surface-panel flex cursor-pointer flex-col gap-4 p-5 transition-colors hover:border-primary/40 hover:bg-elevated",
        isPaused && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <EmployeeAvatar type={employee.type} />
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-foreground">{employee.name}</p>
            <p className="truncate text-caption text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <EmployeeStatusBadge status={employee.status} size="sm" />
      </div>

      <div>
        <p className="tabular text-h2 font-semibold text-foreground">{employee.keyStatValue}</p>
        <p className="text-caption text-muted-foreground">{employee.keyStatLabel}</p>
      </div>

      <div
        className="flex items-center justify-between border-t border-border pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-caption text-muted-foreground">{isChecked ? "Active" : "Paused"}</span>
        <Switch
          checked={isChecked}
          disabled={toggle.isPending}
          aria-label={`Toggle ${employee.name} status`}
          onCheckedChange={(checked) =>
            toggle.mutate({ type: employee.type, next: checked ? "active" : "paused" })
          }
        />
      </div>
    </div>
  );
}

export function EmployeeEmptyState() {
  return (
    <EmptyState
      icon={Zap}
      title="Activate your first AI Employee"
      description="Turn on an AI Sales, Support, Receptionist or Follow-up employee to start automating conversations for your business."
      action={<Button>Browse AI Employees</Button>}
    />
  );
}

export function EmployeeStatusCards() {
  const { data, isLoading, isError, refetch } = useEmployees();

  return (
    <SectionCard title="Your AI Workforce" description="Status and key stat for every employee">
      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmployeeEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((employee) => (
            <EmployeeCard key={employee.type} employee={employee} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
