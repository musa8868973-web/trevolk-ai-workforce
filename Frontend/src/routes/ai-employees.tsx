import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Section, SectionHeading } from "@/components/marketing/Sections";
import { CTASection } from "@/components/marketing/CTASection";
import { EmployeeAvatar, EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { AI_EMPLOYEES, EMPLOYEE_ORDER } from "@/services/employees.data";
import { cn } from "@/lib/utils";

const EXAMPLES: Record<string, string> = {
  sales:
    "A visitor asks about pricing on your website chat at 11pm. The AI Sales Employee answers, asks qualifying questions, scores the lead Hot, and books a discovery call for 9am the next morning.",
  support:
    "A customer messages on WhatsApp asking where their order is. The AI Support Employee looks up the order status, replies with tracking details, and closes the conversation as resolved.",
  receptionist:
    "A prospective client calls after hours asking about availability. The AI Receptionist greets them, answers common questions, and books them into the next open appointment slot.",
  "follow-up":
    "A lead went quiet after a demo three days ago. The AI Follow-up Employee sends a friendly check-in, and when the lead replies with interest, hands them back to the AI Sales Employee.",
};

export const Route = createFileRoute("/ai-employees")({
  head: () => ({
    meta: [
      { title: "AI Employees — Sales, Support, Receptionist & Follow-up | Trevolk" },
      {
        name: "description",
        content:
          "Meet the four AI Employees you can hire on Trevolk: their purpose, responsibilities, workflows and boundaries — explained in detail.",
      },
      { property: "og:title", content: "Meet Your AI Employees | Trevolk" },
      {
        property: "og:description",
        content: "Four AI Employees with real responsibilities, workflows and escalation rules — not a chatbot script.",
      },
    ],
  }),
  component: AIEmployeesPage,
});

function AIEmployeesPage() {
  return (
    <PublicLayout>
      <Section glow className="pb-8 pt-16">
        <SectionHeading
          eyebrow="AI Employees"
          title="A workforce with real jobs, not a bot with a script"
          level="h1"
          description="Each AI Employee has a defined purpose, a set of responsibilities it owns, a workflow it follows, and clear rules for when to bring in a human. Explore each one below."
        />
        <nav
          aria-label="Jump to an AI Employee"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {EMPLOYEE_ORDER.map((type) => (
            <a
              key={type}
              href={`#${type}`}
              className="rounded-full border border-border bg-surface px-4 py-2 text-caption font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {EMPLOYEE_LABELS[type]}
            </a>
          ))}
        </nav>
      </Section>

      {EMPLOYEE_ORDER.map((type, index) => {
        const employee = AI_EMPLOYEES[type];
        return (
          <Section key={type} id={type} as="section" className={cn("scroll-mt-24 pt-0", index % 2 === 1 && "bg-surface")}>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <div className="flex items-center gap-4">
                  <EmployeeAvatar type={type} size="lg" />
                  <div>
                    <h2 className="text-h1 text-foreground">{employee.name}</h2>
                    <p className="text-caption text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-body text-muted-foreground">{employee.purpose}</p>

                <h3 className="mt-6 text-h3 text-foreground">Responsibilities</h3>
                <ul className="mt-3 space-y-2">
                  {employee.responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-body text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-lg border border-border bg-elevated p-4">
                  <p className="text-caption font-semibold uppercase tracking-wide text-accent-secondary">Example scenario</p>
                  <p className="mt-1 text-body text-foreground">{EXAMPLES[type]}</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-h3 text-foreground">Workflow</h3>
                  <ol className="mt-3 space-y-3">
                    {employee.workflow.map((step, i) => (
                      <li key={step.title} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption font-semibold text-primary">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-body font-medium text-foreground">{step.title}</p>
                          <p className="text-caption text-muted-foreground">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-success/25 bg-success/10 p-4">
                    <p className="flex items-center gap-1.5 text-caption font-semibold text-success">
                      <CheckCircle2 className="size-4" aria-hidden="true" /> Can do
                    </p>
                    <ul className="mt-2 space-y-1.5 text-caption text-foreground">
                      {employee.canDo.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-danger/25 bg-danger/10 p-4">
                    <p className="flex items-center gap-1.5 text-caption font-semibold text-danger">
                      <XCircle className="size-4" aria-hidden="true" /> Cannot do
                    </p>
                    <ul className="mt-2 space-y-1.5 text-caption text-foreground">
                      {employee.cannotDo.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        );
      })}

      <Section className="pt-0">
        <SectionHeading eyebrow="Compare" title="Which AI Employee handles what" align="left" className="mx-0" />
        <div className="mt-8 overflow-x-auto surface-panel">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-caption font-semibold text-muted-foreground">AI Employee</th>
                <th className="p-4 text-caption font-semibold text-muted-foreground">Primary channel focus</th>
                <th className="p-4 text-caption font-semibold text-muted-foreground">Key metric</th>
                <th className="p-4 text-caption font-semibold text-muted-foreground">Escalates when</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEE_ORDER.map((type) => {
                const employee = AI_EMPLOYEES[type];
                return (
                  <tr key={type} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar type={type} size="sm" />
                        <span className="text-body font-medium text-foreground">{employee.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-body text-muted-foreground">{employee.metrics[0]?.hint ?? "All channels"}</td>
                    <td className="p-4 text-body text-muted-foreground">{employee.keyStatLabel}: {employee.keyStatValue}</td>
                    <td className="p-4 text-body text-muted-foreground">{employee.escalateWhen[0]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <CTASection
        title="Build your AI Workforce today"
        description="Start with one AI Employee or hire the full team — you're always in control of what they can do."
        secondaryLabel="See pricing"
        secondaryTo="/pricing"
      />
    </PublicLayout>
  );
}
