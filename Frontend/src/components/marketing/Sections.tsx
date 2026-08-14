import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  glow = false,
  as: Comp = "section",
  id,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  as?: "section" | "div";
  id?: string;
}) {
  return (
    <Comp id={id} className={cn("relative px-4 py-16 sm:py-20 lg:px-8", glow && "grid-glow", className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </Comp>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  level = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
  level?: "h1" | "h2";
}) {
  const Heading = level;
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-caption font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      )}
      <Heading className={cn(level === "h1" ? "text-display" : "text-h1", "mt-2 text-foreground")}>{title}</Heading>
      {description && <p className="mt-4 text-body text-muted-foreground">{description}</p>}
    </div>
  );
}
