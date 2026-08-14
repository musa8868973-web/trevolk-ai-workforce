import { PartyPopper } from "lucide-react";
import { EmployeeAvatar } from "@/components/ui/EmployeeAvatar";
import { EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { INTEGRATIONS, type WorkspaceSetupState } from "./types";

export function StepGoLive({ state }: { state: WorkspaceSetupState }) {
  const connectedIntegrations = INTEGRATIONS.filter((i) => state.integrations[i.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-success/25 bg-success/10 text-success"
        >
          <PartyPopper className="size-7" />
        </span>
        <h2 className="text-h2 text-foreground">You're ready to go live</h2>
        <p className="mt-1 max-w-md text-body text-muted-foreground">
          Here's a summary of your workspace. You can adjust any of this later from Settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-panel p-5">
          <p className="text-caption font-medium text-muted-foreground">Business profile</p>
          <p className="mt-2 text-body text-foreground">{state.businessName || "Untitled business"}</p>
          <p className="text-caption text-muted-foreground">
            {state.industry || "Industry not set"} · {state.tone || "Tone not set"}
          </p>
        </div>

        <div className="surface-panel p-5">
          <p className="text-caption font-medium text-muted-foreground">Working hours</p>
          <p className="mt-2 text-body text-foreground">
            {state.workingHoursStart} – {state.workingHoursEnd}
          </p>
          <p className="text-caption text-muted-foreground">Escalation: {state.escalationEmail || "Not set"}</p>
        </div>

        <div className="surface-panel p-5 sm:col-span-2">
          <p className="text-caption font-medium text-muted-foreground">Active AI Employees</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {state.employees.length === 0 && <p className="text-caption text-muted-foreground">None selected</p>}
            {state.employees.map((type) => (
              <div key={type} className="flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1.5">
                <EmployeeAvatar type={type} size="sm" />
                <span className="text-caption text-foreground">{EMPLOYEE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-5 sm:col-span-2">
          <p className="text-caption font-medium text-muted-foreground">Connected integrations</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {connectedIntegrations.length === 0 && (
              <p className="text-caption text-muted-foreground">None connected yet</p>
            )}
            {connectedIntegrations.map((i) => (
              <span key={i.id} className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-caption text-success">
                {i.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
