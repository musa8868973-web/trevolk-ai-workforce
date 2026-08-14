import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/navigation/Logo";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "@/features/onboarding/WizardProgress";
import { StepBusinessProfile } from "@/features/onboarding/StepBusinessProfile";
import { StepSelectEmployees } from "@/features/onboarding/StepSelectEmployees";
import { StepInitialConfig } from "@/features/onboarding/StepInitialConfig";
import { StepIntegrations } from "@/features/onboarding/StepIntegrations";
import { StepGoLive } from "@/features/onboarding/StepGoLive";
import { INITIAL_STATE, type WorkspaceSetupState } from "@/features/onboarding/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace-setup")({
  head: () => ({
    meta: [
      { title: "Set up your workspace — Trevolk AI Workforce" },
      { name: "description", content: "Configure your business profile, AI Employees, integrations and go live." },
      { property: "og:title", content: "Set up your workspace — Trevolk AI Workforce" },
      { property: "og:description", content: "A guided setup to activate your AI Workforce in minutes." },
    ],
  }),
  component: WorkspaceSetupPage,
});

const STEPS = ["Business profile", "AI Employees", "Configuration", "Integrations", "Go live"];

function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WorkspaceSetupState>(INITIAL_STATE);
  const [transitioning, setTransitioning] = useState(false);

  const patch = (p: Partial<WorkspaceSetupState>) => setState((prev) => ({ ...prev, ...p }));

  const goTo = (next: number) => {
    setTransitioning(true);
    window.setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 180);
  };

  const validateStep = () => {
    if (step === 1 && state.employees.length === 0) {
      toast.error("Select at least one AI Employee to continue.");
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) {
      goTo(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) goTo(step - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <Logo />
        <Link to="/dashboard" className="text-caption font-medium text-muted-foreground hover:text-foreground">
          Save &amp; exit
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <WizardProgress steps={STEPS} activeIndex={step} />

        <div
          className={cn(
            "surface-panel mt-8 p-6 transition-all duration-200 ease-out sm:p-8",
            transitioning ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
          )}
        >
          {step === 0 && <StepBusinessProfile state={state} onChange={patch} />}
          {step === 1 && <StepSelectEmployees state={state} onChange={patch} />}
          {step === 2 && <StepInitialConfig state={state} onChange={patch} />}
          {step === 3 && <StepIntegrations state={state} onChange={patch} />}
          {step === 4 && <StepGoLive state={state} />}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0 || transitioning}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleContinue} disabled={transitioning}>
              Continue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                toast.success("Your workspace is live.");
                navigate({ to: "/dashboard" });
              }}
            >
              Open your dashboard
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
