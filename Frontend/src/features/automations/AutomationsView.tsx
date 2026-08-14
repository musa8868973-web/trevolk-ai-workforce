import { useState } from "react";
import { toast } from "sonner";
import { Workflow, Plus } from "lucide-react";
import { useAutomations } from "@/hooks/useTrevolkData";
import type { Automation } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { EmployeeAvatar, EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EmployeeType } from "@/types";

export function AutomationsView() {
  const { data, isLoading, isError, refetch } = useAutomations();
  const [automations, setAutomations] = useState<Automation[] | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [employee, setEmployee] = useState<EmployeeType>("sales");

  const list = automations ?? data ?? [];

  function ensure(): Automation[] {
    if (automations) return automations;
    const base = data ? structuredClone(data) : [];
    setAutomations(base);
    return base;
  }

  function toggle(id: string) {
    const base = ensure();
    const next = base.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    setAutomations(next);
    const item = next.find((a) => a.id === id);
    toast.success(item?.active ? "Automation activated" : "Automation paused");
  }

  function createAutomation() {
    if (!trigger.trim() || !action.trim()) return;
    const base = ensure();
    setAutomations([
      { id: `au-${Date.now()}`, name: `${trigger} → ${action}`, trigger, action, employee, active: true, runs: 0 },
      ...base,
    ]);
    toast.success("Automation created");
    setBuilderOpen(false);
    setTrigger("");
    setAction("");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Automations" description="Rules that let your AI Employees act automatically." />
        <SectionCard>
          <TableSkeleton rows={5} />
        </SectionCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Automations" description="Rules that let your AI Employees act automatically." />
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automations"
        description="Rules that let your AI Employees act automatically."
        actions={
          <Button onClick={() => setBuilderOpen(true)}>
            <Plus className="mr-1.5 size-4" /> New automation
          </Button>
        }
      />

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Workflow} title="No automations yet" description="Create trigger and action rules to save your team time." />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <SectionCard key={a.id} className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <EmployeeAvatar type={a.employee} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {a.trigger} → {a.action}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{EMPLOYEE_LABELS[a.employee]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="tabular text-caption text-muted-foreground">{a.runs.toLocaleString()} runs</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.active} onCheckedChange={() => toggle(a.id)} aria-label={`Toggle ${a.name}`} />
                    <span className="text-caption text-muted-foreground">{a.active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Build an automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="au-trigger">When this happens (trigger)</Label>
              <Input id="au-trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="e.g. Lead qualified" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="au-action">Do this (action)</Label>
              <Input id="au-action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Notify sales rep" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="au-employee">AI Employee</Label>
              <Select value={employee} onValueChange={(v) => setEmployee(v as EmployeeType)}>
                <SelectTrigger id="au-employee" className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYEE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuilderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createAutomation} disabled={!trigger.trim() || !action.trim()}>
              Create automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
