import { useMemo, useState } from "react";
import { Plug, Search } from "lucide-react";
import { useIntegrations } from "@/hooks/useTrevolkData";
import type { Integration } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const HEALTH_TONE: Record<Integration["health"], "success" | "warning" | "neutral"> = {
  healthy: "success",
  degraded: "warning",
  disconnected: "neutral",
};

export function IntegrationsView() {
  const { data, isLoading, isError, refetch } = useIntegrations();
  const [query, setQuery] = useState("");

  const list = data ?? [];
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      : list;
    return filtered.reduce<Record<string, Integration[]>>((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {});
  }, [list, query]);

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description="Connect the tools your AI Employees work with every day." />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search integrations"
          className="pl-9"
          aria-label="Search integrations"
        />
      </div>

      {isLoading ? (
        <SectionCard>
          <TableSkeleton rows={6} />
        </SectionCard>
      ) : isError ? (
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      ) : categories.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Plug} title="No integrations found" description="Try a different search term." />
        </SectionCard>
      ) : (
        categories.map((category) => (
          <SectionCard key={category} title={category}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(grouped[category] ?? []).map((integration) => (
                <div key={integration.id} className="flex flex-col rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{integration.name}</p>
                      <p className="mt-1 text-caption text-muted-foreground">{integration.description}</p>
                    </div>
                    <ToneBadge tone={HEALTH_TONE[integration.health]} className="shrink-0">
                      {integration.health}
                    </ToneBadge>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-caption text-muted-foreground">
                      {integration.connected ? "Connected" : "Not connected"}
                    </span>
                    <Button
                      size="sm"
                      variant={integration.connected ? "outline" : "default"}
                      onClick={() =>
                        toast.success(
                          integration.connected
                            ? `${integration.name} disconnected`
                            : `${integration.name} connected`,
                        )
                      }
                    >
                      {integration.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))
      )}
    </div>
  );
}
