import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Megaphone, Code2, GraduationCap, Building2 } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Section, SectionHeading } from "@/components/marketing/Sections";
import { CTASection } from "@/components/marketing/CTASection";
import { Card } from "@/components/ui/card";
import { EMPLOYEE_LABELS } from "@/components/ui/EmployeeAvatar";
import type { EmployeeType } from "@/types";

const INDUSTRIES: {
  icon: typeof ShoppingBag;
  name: string;
  need: string;
  fit: EmployeeType[];
}[] = [
  {
    icon: ShoppingBag,
    name: "E-commerce",
    need: "Shoppers expect instant answers about orders, returns and product fit — and abandon carts when replies are slow.",
    fit: ["support", "sales"],
  },
  {
    icon: Megaphone,
    name: "Digital Agencies",
    need: "Inbound leads from campaigns need immediate qualification before they cool off, and client updates need consistent follow-up.",
    fit: ["sales", "follow-up"],
  },
  {
    icon: Code2,
    name: "Software Houses",
    need: "Technical prospects ask detailed questions at odd hours, and support tickets pile up without a dedicated first line of response.",
    fit: ["sales", "support"],
  },
  {
    icon: GraduationCap,
    name: "Coaches & Educators",
    need: "Discovery calls and enrollments depend on fast, personal replies — but one-person teams can't answer every DM instantly.",
    fit: ["sales", "receptionist", "follow-up"],
  },
  {
    icon: Building2,
    name: "Real Estate",
    need: "Buyers message at all hours wanting viewings booked immediately, and leads go cold fast without a quick follow-up.",
    fit: ["receptionist", "follow-up"],
  },
];

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Industries — AI Employees for E-commerce, Agencies & More | Trevolk" },
      {
        name: "description",
        content:
          "See why e-commerce brands, agencies, software houses, coaches and realtors are hiring AI Employees, and which ones fit each industry best.",
      },
      { property: "og:title", content: "Industry Fit for the Trevolk AI Workforce" },
      {
        property: "og:description",
        content: "Which AI Employees fit your industry, and why the business problems are the same everywhere: speed, consistency, coverage.",
      },
    ],
  }),
  component: IndustriesPage,
});

function IndustriesPage() {
  return (
    <PublicLayout>
      <Section glow className="pb-8 pt-16">
        <SectionHeading
          level="h1"
          eyebrow="Industries"
          title="Built for the businesses that can't afford a slow reply"
          description="The channels differ, but the need is the same: instant, consistent, always-on responses. Here's how the AI Workforce fits your industry."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Card key={industry.name} className="flex h-full flex-col gap-4 border-border bg-surface p-6 shadow-none">
              <span className="flex size-11 items-center justify-center rounded-lg bg-accent-secondary/10 text-accent-secondary">
                <industry.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-h3 text-foreground">{industry.name}</h2>
              <p className="text-body text-muted-foreground">{industry.need}</p>
              <div className="mt-auto">
                <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">Best-fit AI Employees</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {industry.fit.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-caption font-medium text-primary"
                    >
                      {EMPLOYEE_LABELS[type]}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <CTASection
        title="See your industry's AI Workforce in action"
        description="Start a free trial and hire the AI Employees that fit your business best."
      />
    </PublicLayout>
  );
}
