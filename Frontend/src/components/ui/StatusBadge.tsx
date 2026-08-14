import { cn } from "@/lib/utils";
import type { EmployeeStatus } from "@/types";

const STATUS_META: Record<EmployeeStatus, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: "Active", dot: "bg-success", text: "text-success", bg: "bg-success/10 border-success/25" },
  paused: { label: "Paused", dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted/40 border-border" },
  "needs-setup": { label: "Needs Setup", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10 border-warning/25" },
  "needs-attention": { label: "Needs Attention", dot: "bg-danger", text: "text-danger", bg: "bg-danger/10 border-danger/25" },
};

export function EmployeeStatusBadge({
  status,
  className,
  size = "md",
}: {
  status: EmployeeStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        meta.bg,
        meta.text,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function statusLabel(status: EmployeeStatus) {
  return STATUS_META[status].label;
}

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  info: "bg-primary/10 text-primary border-primary/25",
  neutral: "bg-muted/50 text-muted-foreground border-border",
};

export function ToneBadge({
  tone = "neutral",
  children,
  className,
  withDot = false,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
  withDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {withDot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
