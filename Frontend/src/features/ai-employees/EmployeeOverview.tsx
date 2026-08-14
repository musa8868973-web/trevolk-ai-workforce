import { CheckCircle2, MessageSquare, BookOpen, Brain, Compass, Gavel, Wrench, Users } from "lucide-react";
import { SectionCard } from "@/components/ui/PageHeader";
import type { AIEmployeeConfig } from "@/types";

const SHARED_CAPABILITIES = [
  { icon: MessageSquare, label: "On-brand conversation", description: "Speaks in your tone across every channel." },
  { icon: BookOpen, label: "Business-knowledge grounding", description: "Answers from your connected knowledge base." },
  { icon: Brain, label: "Persistent memory", description: "Remembers prior context for every contact." },
  { icon: Compass, label: "Journey-stage awareness", description: "Adapts behaviour to where the contact is." },
  { icon: Gavel, label: "Autonomous decisions within rules", description: "Acts independently inside your guardrails." },
  { icon: Wrench, label: "Tool usage", description: "Uses connected tools to complete tasks." },
  { icon: Users, label: "Human handoff with context", description: "Escalates to a person with full history." },
];

export function EmployeeOverview({ employee }: { employee: AIEmployeeConfig }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Purpose">
        <p className="text-body text-muted-foreground">{employee.purpose}</p>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Responsibilities">
          <ul className="space-y-2.5">
            {employee.responsibilities.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-body text-foreground">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Workflow">
          <ol className="space-y-4">
            {employee.workflow.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-caption font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-body font-medium text-foreground">{step.title}</p>
                  <p className="text-caption text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <SectionCard title="Shared capabilities" description="Every Trevolk AI Employee ships with these by default">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SHARED_CAPABILITIES.map((cap) => (
            <div key={cap.label} className="flex items-start gap-3 rounded-lg border border-border bg-elevated/40 p-3">
              <cap.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-secondary" />
              <div>
                <p className="text-caption font-medium text-foreground">{cap.label}</p>
                <p className="text-caption text-muted-foreground">{cap.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
