import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, OctagonAlert, X, BellOff } from "lucide-react";
import { SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts } from "@/hooks/useTrevolkData";
import { cn } from "@/lib/utils";
import type { AlertItem } from "@/types";

function AlertRow({ alert, onDismiss }: { alert: AlertItem; onDismiss: (id: string) => void }) {
  const navigate = useNavigate();
  const Icon = alert.severity === "danger" ? OctagonAlert : AlertTriangle;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3",
        alert.severity === "danger" ? "border-danger/25 bg-danger/10" : "border-warning/25 bg-warning/10",
      )}
    >
      <button
        type="button"
        onClick={() => navigate({ to: alert.href })}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <Icon
          aria-hidden="true"
          className={cn("mt-0.5 size-4 shrink-0", alert.severity === "danger" ? "text-danger" : "text-warning")}
        />
        <span className="min-w-0">
          <span className="block text-body font-medium text-foreground">{alert.title}</span>
          <span className="block text-caption text-muted-foreground">{alert.description}</span>
        </span>
      </button>
      <button
        type="button"
        aria-label={`Dismiss alert: ${alert.title}`}
        onClick={() => onDismiss(alert.id)}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function AlertsPanel() {
  const { data, isLoading, isError, refetch } = useAlerts();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = (data ?? []).filter((a) => !dismissed.includes(a.id));

  return (
    <SectionCard title="Alerts" description="Things that need your attention">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={BellOff} title="All clear" description="No alerts right now. We'll notify you the moment something needs attention." />
      ) : (
        <div className="space-y-2">
          {visible.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onDismiss={(id) => setDismissed((prev) => [...prev, id])} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
