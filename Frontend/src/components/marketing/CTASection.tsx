import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/marketing/Sections";

export function CTASection({
  title = "Ready to hire your first AI Employee?",
  description = "Start a free trial in minutes. No credit card, no bot-building required.",
  primaryLabel = "Start free trial",
  primaryTo = "/signup",
  secondaryLabel = "Talk to sales",
  secondaryTo = "/contact",
}: {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}) {
  return (
    <Section>
      <div className="surface-panel grid-glow flex flex-col items-center gap-6 rounded-2xl border border-border px-6 py-14 text-center sm:px-12">
        <h2 className="max-w-2xl text-h1 text-foreground">{title}</h2>
        <p className="max-w-xl text-body text-muted-foreground">{description}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to={primaryTo}>{primaryLabel}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to={secondaryTo}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
