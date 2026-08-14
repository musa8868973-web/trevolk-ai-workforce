import { Plug, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { INTEGRATIONS, type WorkspaceSetupState } from "./types";
import { cn } from "@/lib/utils";

export function StepIntegrations({
  state,
  onChange,
}: {
  state: WorkspaceSetupState;
  onChange: (patch: Partial<WorkspaceSetupState>) => void;
}) {
  const toggle = (id: string) => {
    onChange({ integrations: { ...state.integrations, [id]: !state.integrations[id] } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-foreground">Connect your integrations</h2>
        <p className="mt-1 text-body text-muted-foreground">
          Connect the channels and tools your AI Employees will work in. You can add more later.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const connected = !!state.integrations[integration.id];
          return (
            <div
              key={integration.id}
              className={cn(
                "surface-panel flex flex-col gap-3 p-5 transition-colors",
                connected && "border-success/30 bg-success/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border",
                      connected ? "border-success/25 bg-success/10 text-success" : "border-primary/25 bg-primary/10 text-primary",
                    )}
                  >
                    {connected ? <PlugZap className="size-5" /> : <Plug className="size-5" />}
                  </span>
                  <div>
                    <p className="text-h3 text-foreground">{integration.name}</p>
                    {connected && <ToneBadge tone="success" withDot>Healthy</ToneBadge>}
                  </div>
                </div>
              </div>
              <p className="text-caption text-muted-foreground">{integration.description}</p>
              <Button
                type="button"
                variant={connected ? "outline" : "default"}
                size="sm"
                className="mt-auto w-full"
                onClick={() => toggle(integration.id)}
              >
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
