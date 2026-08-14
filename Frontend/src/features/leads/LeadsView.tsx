import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, List as ListIcon, Users } from "lucide-react";
import { useLeads } from "@/hooks/useTrevolkData";
import type { Lead, LeadStatus } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STATUS_COLUMNS: LeadStatus[] = ["new", "contacted", "qualified", "meeting-booked", "lost"];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  "meeting-booked": "Meeting Booked",
  lost: "Lost",
};

const SCORE_TONE: Record<Lead["score"], "danger" | "warning" | "info"> = {
  hot: "danger",
  warm: "warning",
  cold: "info",
};

export function LeadsView() {
  const { data, isLoading, isError, refetch } = useLeads();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const list = leads ?? data ?? [];

  function ensure(): Lead[] {
    if (leads) return leads;
    const base = data ? structuredClone(data) : [];
    setLeads(base);
    return base;
  }

  function updateLead(id: string, updater: (l: Lead) => Lead) {
    const base = ensure();
    const next = base.map((l) => (l.id === id ? updater(structuredClone(l)) : l));
    setLeads(next);
    if (selected?.id === id) setSelected(next.find((l) => l.id === id) ?? null);
  }

  function openLead(lead: Lead) {
    setSelected(lead);
    setNotesDraft(lead.notes);
  }

  function changeStatus(id: string, status: LeadStatus) {
    updateLead(id, (l) => ({ ...l, status }));
    toast.success(`Lead moved to ${STATUS_LABELS[status]}`);
  }

  function assignOwner(id: string, owner: string) {
    updateLead(id, (l) => ({ ...l, owner }));
    toast.success(`Assigned to ${owner}`);
  }

  function saveNotes() {
    if (!selected) return;
    updateLead(selected.id, (l) => ({ ...l, notes: notesDraft }));
    toast.success("Notes saved");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leads" description="Track and qualify every lead your AI Sales Employee brings in." />
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leads" description="Track and qualify every lead your AI Sales Employee brings in." />
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Track and qualify every lead your AI Sales Employee brings in."
        actions={
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "kanban" | "table")}>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <LayoutGrid className="mr-1.5 size-4" /> Board
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <ListIcon className="mr-1.5 size-4" /> Table
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Users} title="No leads yet" description="Leads captured by your AI Employees will show up here." />
        </SectionCard>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 xl:grid-cols-5">
          {STATUS_COLUMNS.map((status) => {
            const items = list.filter((l) => l.status === status);
            return (
              <div key={status} className="surface-panel flex min-w-[220px] flex-col p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h3 className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                    {STATUS_LABELS[status]}
                  </h3>
                  <span className="tabular text-caption text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex-1 space-y-2">
                  {items.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => openLead(lead)}
                      className="w-full rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-primary/40 hover:bg-elevated"
                    >
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="truncate text-caption text-muted-foreground">{lead.company}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <ToneBadge tone={SCORE_TONE[lead.score]} className="px-1.5 py-0.5 text-[10px]">
                          {lead.score}
                        </ToneBadge>
                        <span className="tabular text-caption text-foreground">${lead.value.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                  {items.length === 0 && <p className="px-1 text-caption text-muted-foreground">No leads</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard bodyClassName="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => openLead(lead)}
                    >
                      <TableCell>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-caption text-muted-foreground">{lead.company}</p>
                      </TableCell>
                      <TableCell>
                        <ToneBadge tone="neutral">{STATUS_LABELS[lead.status]}</ToneBadge>
                      </TableCell>
                      <TableCell>
                        <ToneBadge tone={SCORE_TONE[lead.score]}>{lead.score}</ToneBadge>
                      </TableCell>
                      <TableCell className="tabular">${lead.value.toLocaleString()}</TableCell>
                      <TableCell>{lead.owner}</TableCell>
                      <TableCell className="capitalize">{lead.source}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="flex flex-col overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 px-1">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-caption text-muted-foreground">Company</p>
                    <p className="text-foreground">{selected.company}</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Value</p>
                    <p className="tabular text-foreground">${selected.value.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Score</p>
                    <ToneBadge tone={SCORE_TONE[selected.score]}>{selected.score}</ToneBadge>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Source</p>
                    <p className="capitalize text-foreground">{selected.source}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="lead-status" className="mb-1.5 block text-caption font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select value={selected.status} onValueChange={(v) => changeStatus(selected.id, v as LeadStatus)}>
                    <SelectTrigger id="lead-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_COLUMNS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="lead-owner" className="mb-1.5 block text-caption font-medium text-muted-foreground">
                    Owner
                  </label>
                  <Select value={selected.owner} onValueChange={(v) => assignOwner(selected.id, v)}>
                    <SelectTrigger id="lead-owner" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Ayesha Siddiqui", "Sana Khalid", "Ali Raza", "Omar Farooq"].map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="lead-notes" className="mb-1.5 block text-caption font-medium text-muted-foreground">
                    Notes
                  </label>
                  <Textarea
                    id="lead-notes"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                  />
                  <Button size="sm" className="mt-2" onClick={saveNotes}>
                    Save notes
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
