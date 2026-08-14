import { createFileRoute } from "@tanstack/react-router";
import {
  AlarmClockOff,
  CalendarX2,
  MessageSquareWarning,
  ShieldAlert,
  TimerReset,
  UserX,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Section, SectionHeading } from "@/components/marketing/Sections";
import { CTASection } from "@/components/marketing/CTASection";
import { Card } from "@/components/ui/card";

const PAIRS = [
  {
    icon: UserX,
    problem: "Lost leads",
    problemDetail: "Inbound leads sit unanswered while your team is busy, in meetings, or offline — and they go to a competitor instead.",
    solution: "Your AI Sales Employee greets and qualifies every lead the moment it arrives, on every channel.",
    metric: "+34% lead-to-meeting conversion",
  },
  {
    icon: TimerReset,
    problem: "Missed follow-ups",
    problemDetail: "Warm prospects go quiet because nobody has time to check back in — deals stall and quietly die.",
    solution: "Your AI Follow-up Employee re-engages every stalled conversation on a schedule you set, automatically.",
    metric: "3.1x more re-engaged leads per month",
  },
  {
    icon: AlarmClockOff,
    problem: "Slow response times",
    problemDetail: "Customers expect answers in seconds. A slow first reply erodes trust before a conversation even starts.",
    solution: "AI Employees reply within seconds, day or night, with answers grounded in your playbook.",
    metric: "First response in under 15 seconds",
  },
  {
    icon: CalendarX2,
    problem: "No after-hours coverage",
    problemDetail: "Nights, weekends and holidays are when a lot of buying decisions happen — and when your team is offline.",
    solution: "Your AI Receptionist and Sales Employees stay on duty around the clock, every day of the year.",
    metric: "24/7 coverage, zero extra headcount",
  },
  {
    icon: ShieldAlert,
    problem: "Manual scheduling",
    problemDetail: "Back-and-forth emails to find a meeting time waste hours and lose momentum with an interested buyer.",
    solution: "AI Employees book directly into your approved calendar availability, no human touch required.",
    metric: "68% fewer scheduling emails",
  },
  {
    icon: MessageSquareWarning,
    problem: "Inconsistent answers",
    problemDetail: "Different team members give different answers to the same question, confusing customers and hurting trust.",
    solution: "Every AI Employee follows the same approved playbook, so answers stay accurate and on-brand.",
    metric: "98% answer consistency across channels",
  },
];

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — Fix Lost Leads, Slow Replies & Missed Follow-ups | Trevolk" },
      {
        name: "description",
        content:
          "See how Trevolk's AI Employees solve the operational gaps costing you revenue: lost leads, missed follow-ups, slow responses and more.",
      },
      { property: "og:title", content: "Solutions — Fix the Gaps Costing You Revenue | Trevolk" },
      {
        property: "og:description",
        content: "AI Employees for the problems every growing business runs into: lost leads, slow replies, no after-hours coverage and more.",
      },
    ],
  }),
  component: SolutionsPage,
});

function SolutionsPage() {
  return (
    <PublicLayout>
      <Section glow className="pb-8 pt-16">
        <SectionHeading
          eyebrow="Solutions"
          title="The gaps in your operations, closed by an AI Workforce"
          level="h1"
          description="These aren't chatbot features. They're jobs your AI Employees take full ownership of, every day."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-5 md:grid-cols-2">
          {PAIRS.map((pair) => (
            <Card key={pair.problem} className="flex h-full flex-col gap-4 border-border bg-surface p-6 shadow-none">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-danger/10 text-danger">
                  <pair.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-h3 text-foreground">{pair.problem}</h3>
              </div>
              <p className="text-body text-muted-foreground">{pair.problemDetail}</p>
              <div className="mt-1 rounded-lg border border-primary/25 bg-primary/10 p-4">
                <p className="text-caption font-semibold uppercase tracking-wide text-primary">The AI Workforce fix</p>
                <p className="mt-1 text-body text-foreground">{pair.solution}</p>
              </div>
              <p className="mt-auto text-caption font-semibold text-success">{pair.metric}</p>
            </Card>
          ))}
        </div>
      </Section>

      <CTASection
        title="Stop patching gaps manually"
        description="Put an AI Employee on each of these jobs and get measurable results in the first week."
      />
    </PublicLayout>
  );
}
