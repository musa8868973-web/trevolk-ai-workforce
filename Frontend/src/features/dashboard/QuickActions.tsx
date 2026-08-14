import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { BookPlus, Cable, PlayCircle, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/PageHeader";

const ACTIONS = [
  {
    id: "activate",
    label: "Activate an employee",
    description: "Turn on a new AI Employee",
    icon: PlayCircle,
  },
  {
    id: "knowledge",
    label: "Add knowledge",
    description: "Ground responses in your docs",
    icon: BookPlus,
  },
  {
    id: "escalations",
    label: "Review escalations",
    description: "Handle conversations needing you",
    icon: ShieldAlert,
  },
  {
    id: "integrations",
    label: "Connect an integration",
    description: "Sync CRM, calendar & more",
    icon: Cable,
  },
] as const;

export function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (id: (typeof ACTIONS)[number]["id"]) => {
    if (id === "activate") {
      navigate({ to: "/dashboard/ai-employees" });
      return;
    }
    toast(`${ACTIONS.find((a) => a.id === id)?.label} is coming soon`);
  };

  return (
    <SectionCard title="Quick Actions">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.id)}
            className="surface-panel flex flex-col items-start gap-2 p-4 text-left transition-colors hover:border-primary/40 hover:bg-elevated"
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <action.icon aria-hidden="true" className="size-4.5" />
            </span>
            <span className="text-body font-medium text-foreground">{action.label}</span>
            <span className="text-caption text-muted-foreground">{action.description}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
