import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WorkspaceSetupState } from "./types";

export function StepInitialConfig({
  state,
  onChange,
}: {
  state: WorkspaceSetupState;
  onChange: (patch: Partial<WorkspaceSetupState>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-foreground">Initial configuration</h2>
        <p className="mt-1 text-body text-muted-foreground">
          Give your AI Employees the ground rules they'll follow from day one.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="businessRules">Business rules</Label>
          <Textarea
            id="businessRules"
            rows={4}
            placeholder="e.g. Never offer discounts above 10%. Always confirm order numbers before issuing refunds."
            value={state.businessRules}
            onChange={(e) => onChange({ businessRules: e.target.value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hoursStart">Working hours — from</Label>
            <Input
              id="hoursStart"
              type="time"
              value={state.workingHoursStart}
              onChange={(e) => onChange({ workingHoursStart: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hoursEnd">Working hours — to</Label>
            <Input
              id="hoursEnd"
              type="time"
              value={state.workingHoursEnd}
              onChange={(e) => onChange({ workingHoursEnd: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="escalationEmail">Escalation email</Label>
          <Input
            id="escalationEmail"
            type="email"
            placeholder="team@yourcompany.com"
            value={state.escalationEmail}
            onChange={(e) => onChange({ escalationEmail: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="kbSource">Knowledge base source</Label>
          <Input
            id="kbSource"
            placeholder="Link a help center, doc, or upload later"
            value={state.knowledgeBaseSource}
            onChange={(e) => onChange({ knowledgeBaseSource: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
