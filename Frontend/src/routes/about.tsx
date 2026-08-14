import { createFileRoute } from "@tanstack/react-router";
import { Compass, Target, ShieldCheck, Users } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Section, SectionHeading } from "@/components/marketing/Sections";
import { CTASection } from "@/components/marketing/CTASection";
import { Card } from "@/components/ui/card";

const PRINCIPLES = [
  { icon: Users, title: "AI Employees, not bots", body: "Every AI Employee has a real job, real responsibilities, and clear limits — the same way you'd onboard a person." },
  { icon: ShieldCheck, title: "Human oversight, always", body: "You set the boundaries and see every escalation. AI Employees never operate outside what you approve." },
  { icon: Target, title: "Outcomes over configuration", body: "We measure success by leads qualified, tickets resolved and meetings booked — not by settings toggled." },
  { icon: Compass, title: "Built for how businesses actually run", body: "No flowcharts or prompt engineering. You describe your playbook and your AI Employees follow it." },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Trevolk — Building the AI Workforce Platform" },
      {
        name: "description",
        content: "Trevolk's mission is to give every business an AI Workforce — real AI Employees with jobs, not chatbots with scripts.",
      },
      { property: "og:title", content: "About Trevolk" },
      {
        property: "og:description",
        content: "Our vision, mission and principles for building the AI Workforce platform businesses actually trust.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <Section glow className="pb-8 pt-16">
        <SectionHeading
          level="h1"
          eyebrow="About Trevolk"
          title="We believe every business deserves a workforce, not a widget"
          description="Trevolk was built on a simple idea: businesses don't need another chatbot to configure. They need employees who show up, do the job, and know when to ask for help."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-surface p-6 shadow-none">
            <h2 className="text-h3 text-foreground">Our vision</h2>
            <p className="mt-2 text-body text-muted-foreground">
              A world where any business, regardless of size, can staff a reliable, always-on AI Workforce that handles
              sales, support, reception and follow-up as well as a well-trained human team.
            </p>
          </Card>
          <Card className="border-border bg-surface p-6 shadow-none">
            <h2 className="text-h3 text-foreground">Our mission</h2>
            <p className="mt-2 text-body text-muted-foreground">
              Give growing teams AI Employees with clear jobs, transparent workflows and honest boundaries — so owners
              can manage outcomes instead of maintaining automation.
            </p>
          </Card>
          <Card className="border-border bg-surface p-6 shadow-none">
            <h2 className="text-h3 text-foreground">Our story</h2>
            <p className="mt-2 text-body text-muted-foreground">
              We started Trevolk after watching small teams lose leads and burn out on repetitive conversations.
              Chatbot tools promised automation but delivered more configuration work. We built AI Employees instead.
            </p>
          </Card>
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading eyebrow="How we operate" title="The principles behind every AI Employee" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="surface-panel flex flex-col gap-3 p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <p.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-h3 text-foreground">{p.title}</h3>
              <p className="text-body text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTASection title="Meet your first AI Employee" description="Start a free trial and see how it feels to manage a team, not a tool." />
    </PublicLayout>
  );
}
