import { useNavigate } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { EmployeeAvatar, EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { useActivityFeed } from "@/hooks/useTrevolkData";

export function ActivityFeedPanel() {
  const { data, isLoading, isError, refetch } = useActivityFeed();
  const navigate = useNavigate();

  return (
    <SectionCard title="Today's Activity" description="Live feed of what your AI workforce just did">
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Once your AI employees start handling work, it will show up here." />
      ) : (
        <ul className="divide-y divide-border">
          {data.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => navigate({ to: item.href })}
                className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-elevated/60"
              >
                <EmployeeAvatar type={item.employee} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-foreground">{item.description}</span>
                  <span className="block text-caption text-muted-foreground">
                    {EMPLOYEE_LABELS[item.employee]} · {item.timestamp}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
