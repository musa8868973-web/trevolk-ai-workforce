import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WizardProgress({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <nav aria-label="Setup progress">
      <ol className="flex items-center gap-1.5 sm:gap-3">
        {steps.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li key={step} className="flex flex-1 items-center gap-1.5 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isActive && !isDone && "border-primary text-primary",
                    !isActive && !isDone && "border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-caption sm:inline",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span className={cn("h-px flex-1", isDone ? "bg-primary" : "bg-border")} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
