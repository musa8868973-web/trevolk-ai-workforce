import { useMemo, useState } from "react";
import { Search, UserCircle, MessageSquare, ShoppingBag, CalendarClock } from "lucide-react";
import { useCustomers } from "@/hooks/useTrevolkData";
import type { Customer } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { Input } from "@/components/ui/input";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<Customer["status"], "success" | "warning" | "danger"> = {
  active: "success",
  "at-risk": "warning",
  churned: "danger",
};

const HISTORY_ICON = {
  conversation: MessageSquare,
  order: ShoppingBag,
  appointment: CalendarClock,
};

export function CustomersView() {
  const { data, isLoading, isError, refetch } = useCustomers();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [list, query]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Customers" description="Every customer relationship your AI Employees help manage." />
        <SectionCard>
          <TableSkeleton rows={8} />
        </SectionCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Customers" description="Every customer relationship your AI Employees help manage." />
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Every customer relationship your AI Employees help manage." />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company or email"
          className="pl-9"
          aria-label="Search customers"
        />
      </div>

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState icon={UserCircle} title="No customers yet" description="Customers will appear here once your AI Employees start engaging." />
        </SectionCard>
      ) : filtered.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Search} title="No matches" description="Try a different search term." />
        </SectionCard>
      ) : (
        <div className="surface-panel grid grid-cols-1 overflow-hidden lg:grid-cols-[340px_1fr]">
          <div className="max-h-[70vh] overflow-y-auto border-border lg:border-r">
            <ul role="list">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-elevated",
                      selected?.id === c.id && "bg-elevated",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                      <span className="block truncate text-caption text-muted-foreground">{c.company}</span>
                    </span>
                    <ToneBadge tone={STATUS_TONE[c.status]} className="shrink-0 px-1.5 py-0.5 text-[10px]">
                      {c.status}
                    </ToneBadge>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selected && (
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-h3 text-foreground">{selected.name}</h2>
                  <p className="text-caption text-muted-foreground">{selected.email}</p>
                  <p className="text-caption text-muted-foreground">{selected.company}</p>
                </div>
                <ToneBadge tone={STATUS_TONE[selected.status]}>{selected.status}</ToneBadge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Lifetime value" value={`$${selected.lifetimeValue.toLocaleString()}`} />
                <Stat label="Orders" value={String(selected.orders)} />
                <Stat label="Joined" value={selected.joinedAt} />
                <Stat label="Last interaction" value={selected.lastInteraction} />
              </div>

              <div className="mt-6">
                <h3 className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">History</h3>
                <ol className="mt-3 space-y-2">
                  {selected.history.map((h) => {
                    const Icon = HISTORY_ICON[h.type];
                    return (
                      <li key={h.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{h.label}</span>
                          <span className="block text-caption text-muted-foreground">{h.date}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
