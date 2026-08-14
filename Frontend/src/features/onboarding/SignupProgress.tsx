import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Sign up", "Workspace", "Go live"];

export function SignupProgress({ activeStep = 0 }: { activeStep?: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Onboarding progress">
      {STEPS.map((step, i) => {
        const isDone = i < activeStep;
        const isActive = i === activeStep;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                isDone && "border-primary bg-primary text-primary-foreground",
                isActive && !isDone && "border-primary text-primary",
                !isActive && !isDone && "border-border text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("text-caption", isActive ? "font-medium text-foreground" : "text-muted-foreground")}>
              {step}
            </span>
            {i < STEPS.length - 1 && <span className="ml-1 h-px flex-1 bg-border" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
