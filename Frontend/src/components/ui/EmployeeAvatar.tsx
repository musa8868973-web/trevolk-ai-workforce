import { Bot, Headset, CalendarClock, Send, type LucideIcon } from "lucide-react";
import type { EmployeeType } from "@/types";
import { cn } from "@/lib/utils";

export const EMPLOYEE_ICONS: Record<EmployeeType, LucideIcon> = {
  sales: Bot,
  support: Headset,
  receptionist: CalendarClock,
  "follow-up": Send,
};

export const EMPLOYEE_LABELS: Record<EmployeeType, string> = {
  sales: "AI Sales Employee",
  support: "AI Customer Support Employee",
  receptionist: "AI Receptionist",
  "follow-up": "AI Follow-up Employee",
};

export const EMPLOYEE_ROUTES: Record<EmployeeType, string> = {
  sales: "/dashboard/ai-employees/sales",
  support: "/dashboard/ai-employees/support",
  receptionist: "/dashboard/ai-employees/receptionist",
  "follow-up": "/dashboard/ai-employees/follow-up",
};

export function EmployeeAvatar({
  type,
  className,
  size = "md",
}: {
  type: EmployeeType;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = EMPLOYEE_ICONS[type];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary",
        size === "sm" && "size-8",
        size === "md" && "size-10",
        size === "lg" && "size-12",
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6")} />
    </span>
  );
}
