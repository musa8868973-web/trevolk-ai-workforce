import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, MessageSquareText, PhoneCall, Radar, Sparkles } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section, SectionHeading } from "@/components/marketing/Sections";
import { CTASection } from "@/components/marketing/CTASection";
import { EmployeeAvatar, EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import { AI_EMPLOYEES, EMPLOYEE_ORDER } from "@/services/employees.data";

const STEPS = [
  {
    icon: Sparkles,
    title: "Hire your AI Employees",
    description: "Pick Sales, Support, Receptionist and Follow-up from your team roster — no scripts, no flowcharts to build.",
  },
  {
    icon: MessageSquareText,
    title: "Give them your playbook",
    description: "Tell each one how you qualify leads, answer support questions and book meetings, in plain language.",
  },
  {
    icon: Radar,
    title: "They work every channel, 24/7",
    description: "Chat, WhatsApp, email and phone — your AI Employees respond instantly and stay on-brand around the clock.",
  },
  {
    icon: PhoneCall,
    title: "You manage, not micromanage",
    description: "Review performance, adjust responsibilities, and let them escalate the moments that need a human touch.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ayesha Raza",
    role: "Founder, an e-commerce store",
    quote:
      "It feels like I hired a support rep who never sleeps. Our AI Support Employee handles order questions instantly, and my inbox is finally calm.",
  },
  {
    name: "Bilal Chaudhry",
    role: "Founder, a digital marketing agency",
    quote:
      "The AI Sales Employee qualifies every inbound lead before it reaches my team. We stopped losing leads to slow replies overnight.",
  },
  {
    name: "Sarah Whitfield",
    role: "Business coach",
    quote:
      "My AI Follow-up Employee re-engages prospects I would have forgotten about. It's like having a dedicated assistant just for nurturing.",
  },
  {
    name: "Omar Farouk",
    role: "Realtor",
    quote:
      "Buyers message at all hours. My AI Receptionist Employee books viewings while I'm with clients — nothing falls through anymore.",
  },
  {
    name: "Hassan Iqbal",
    role: "Founder, a software house",
    quote:
      "We run four AI Employees across sales and support. It genuinely feels like managing a small team, not tweaking chatbot settings.",
  },
];

const INDUSTRIES = [
  "E-commerce",
  "Digital Agencies",
  "Software Houses",
  "Coaches & Educators",
  "Real Estate",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trevolk AI Workforce — Hire an AI Employee, Not Another Chatbot" },
      {
        name: "description",
        content:
          "Trevolk gives your business a team of AI Employees for sales, support, reception and follow-up — always on, always on-brand.",
      },
      { property: "og:title", content: "Trevolk AI Workforce — Hire an AI Employee, Not Another Chatbot" },
      {
        property: "og:description",
        content:
          "Build a team of AI Employees that qualify leads, resolve support tickets, greet visitors and follow up — so your team can focus on the work only humans can do.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <PublicLayout>
      <Section glow className="pb-12 pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-caption font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            Introducing the AI Workforce platform
          </span>
          <h1 className="mt-6 text-display text-foreground">
            Hire an AI Workforce, <span className="text-gradient-brand">not another chatbot</span>
          </h1>
          <p className="mt-5 text-body text-muted-foreground sm:text-lg">
            Trevolk gives your business real AI Employees — Sales, Support, Receptionist and Follow-up —
            that qualify leads, resolve tickets, greet visitors and stay on top of every conversation. You
            manage a team, not configure a bot.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">
                Start free trial
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/ai-employees">Meet the AI Employees</Link>
            </Button>
          </div>
          <p className="mt-4 text-caption text-muted-foreground">No credit card required · Live in under a day</p>
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeading
          eyebrow="Your team, on demand"
          title="Four AI Employees, one workforce"
          description="Each AI Employee owns a real job with clear responsibilities, workflows and boundaries — reviewed and directed by you."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EMPLOYEE_ORDER.map((type) => {
            const employee = AI_EMPLOYEES[type];
            return (
              <Link key={type} to="/ai-employees" className="group block h-full focus-visible:outline-none">
                <Card className="flex h-full flex-col gap-4 border-border bg-surface p-6 shadow-none transition-colors group-hover:border-primary/40 group-focus-visible:border-primary/40">
                  <EmployeeAvatar type={type} size="lg" />
                  <div>
                    <h3 className="text-h3 text-foreground">{EMPLOYEE_LABELS[type]}</h3>
                    <p className="mt-1 text-caption text-muted-foreground">{employee.role}</p>
                  </div>
                  <p className="text-body text-muted-foreground">{employee.purpose}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-caption font-medium text-primary">
                    See how it works
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section className="bg-surface">
        <SectionHeading
          eyebrow="How it works"
          title="From hire to handled, in four steps"
          description="Onboarding an AI Employee looks like onboarding a person — not filling out a configuration wizard."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="surface-panel flex flex-col gap-3 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-caption font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="text-h3 text-foreground">{step.title}</h3>
              <p className="text-body text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Trusted by growing teams"
          title="Businesses running an AI Workforce today"
          description="From e-commerce to real estate, teams are handing off the repeatable work to AI Employees."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex h-full flex-col gap-4 border-border bg-surface p-6 shadow-none">
              <p className="text-body text-foreground">“{t.quote}”</p>
              <div className="mt-auto">
                <p className="text-body font-medium text-foreground">{t.name}</p>
                <p className="text-caption text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="surface-panel flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-caption font-semibold uppercase tracking-wide text-accent-secondary">Built for your industry</p>
            <h2 className="mt-2 text-h2 text-foreground">Every industry has a different AI Workforce fit</h2>
            <p className="mt-3 text-body text-muted-foreground">
              See which AI Employees make the biggest difference for businesses like yours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((industry) => (
              <span
                key={industry}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-3.5 py-1.5 text-caption font-medium text-foreground"
              >
                <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
                {industry}
              </span>
            ))}
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/industries">
              Explore industries
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Section>

      <CTASection />
    </PublicLayout>
  );
}
