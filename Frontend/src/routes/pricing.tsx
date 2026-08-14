import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Section, SectionHeading } from "@/components/marketing/Sections";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const TIERS = [
  {
    name: "Starter",
    monthly: 79,
    description: "One AI Employee to cover your busiest channel.",
    highlighted: false,
    features: [
      "1 AI Employee of your choice",
      "Up to 500 conversations / month",
      "Chat + email channels",
      "Standard escalation rules",
      "Email support",
    ],
  },
  {
    name: "Growth",
    monthly: 199,
    description: "The full AI Workforce for a growing team.",
    highlighted: true,
    features: [
      "All 4 AI Employees",
      "Up to 3,000 conversations / month",
      "Chat, WhatsApp, email & phone",
      "Custom escalation & CRM sync",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    description: "Custom workforce for multi-location or high-volume teams.",
    highlighted: false,
    features: [
      "Unlimited AI Employees & seats",
      "Unlimited conversations",
      "Dedicated onboarding & SLAs",
      "Custom integrations & security review",
      "Dedicated success manager",
    ],
  },
];

const FAQS = [
  {
    q: "Do I need to build or train the AI Employees myself?",
    a: "No. You give them your playbook — how you qualify leads, answer questions, and schedule meetings — in plain language, and they get to work. No flow builders or scripting required.",
  },
  {
    q: "Can I change which AI Employees I've hired later?",
    a: "Yes. You can add or remove AI Employees from your workforce at any time as your plan allows, without losing your existing configuration.",
  },
  {
    q: "What happens when an AI Employee can't handle something?",
    a: "Every AI Employee follows clear escalation rules and hands the conversation to your team the moment it's out of scope — with full context attached.",
  },
  {
    q: "Is there a contract or can I cancel anytime?",
    a: "Starter and Growth plans are month-to-month, cancel anytime. Enterprise plans include a custom agreement tailored to your rollout.",
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Hire Your AI Workforce | Trevolk" },
      {
        name: "description",
        content: "Simple pricing to hire AI Employees for sales, support, reception and follow-up. Starter, Growth and Enterprise plans.",
      },
      { property: "og:title", content: "Trevolk Pricing — AI Employees for Every Team Size" },
      {
        property: "og:description",
        content: "Choose Starter, Growth or Enterprise and hire the AI Employees your business needs — monthly or annual billing.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <PublicLayout>
      <Section glow className="pb-8 pt-16">
        <SectionHeading
          level="h1"
          eyebrow="Pricing"
          title="Simple plans to hire your AI Workforce"
          description="Pay for the AI Employees you hire, not per-feature add-ons. Switch to annual billing and save roughly 20%."
        />
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-body", !annual && "font-semibold text-foreground", annual && "text-muted-foreground")}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual billing"
            onClick={() => setAnnual((a) => !a)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors",
              annual ? "bg-primary" : "bg-elevated",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-background transition-transform",
                annual ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
          <span className={cn("text-body", annual && "font-semibold text-foreground", !annual && "text-muted-foreground")}>
            Annual <span className="text-caption text-success">Save 20%</span>
          </span>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const price =
              tier.monthly === null
                ? null
                : annual
                  ? Math.round(tier.monthly * 0.8)
                  : tier.monthly;
            return (
              <div
                key={tier.name}
                className={cn(
                  "surface-panel flex flex-col gap-6 p-8",
                  tier.highlighted && "border-primary/50 ring-1 ring-primary/30",
                )}
              >
                {tier.highlighted && (
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-caption font-semibold text-primary">
                    Most popular
                  </span>
                )}
                <div>
                  <h2 className="text-h2 text-foreground">{tier.name}</h2>
                  <p className="mt-1 text-body text-muted-foreground">{tier.description}</p>
                </div>
                <div>
                  {price === null ? (
                    <p className="text-h1 text-foreground">Custom</p>
                  ) : (
                    <p className="flex items-baseline gap-1">
                      <span className="text-display text-foreground">${price}</span>
                      <span className="text-body text-muted-foreground">/mo{annual ? ", billed annually" : ""}</span>
                    </p>
                  )}
                </div>
                <ul className="flex flex-1 flex-col gap-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-body text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" variant={tier.highlighted ? "default" : "outline"}>
                  <Link to={tier.monthly === null ? "/contact" : "/signup"}>
                    {tier.monthly === null ? "Contact sales" : "Start free trial"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="bg-surface pt-0">
        <SectionHeading eyebrow="FAQ" title="Questions about pricing" align="left" className="mx-0" />
        <div className="mt-6 max-w-3xl">
          <Accordion type="single" collapsible>
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger className="text-body text-foreground">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-body text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="surface-panel flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="text-h2 text-foreground">Need a custom AI Workforce rollout?</h2>
          <p className="max-w-xl text-body text-muted-foreground">
            Enterprise plans include dedicated onboarding, custom integrations and a success manager for multi-location or high-volume teams.
          </p>
          <Button asChild size="lg">
            <Link to="/contact">Talk to our team</Link>
          </Button>
        </div>
      </Section>
    </PublicLayout>
  );
}
