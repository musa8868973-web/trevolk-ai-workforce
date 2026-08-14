import { Check } from "lucide-react";
import { EmployeeAvatar } from "@/components/ui/EmployeeAvatar";
import { AI_EMPLOYEES, EMPLOYEE_ORDER } from "@/services/employees.data";
import { cn } from "@/lib/utils";
import type { EmployeeType } from "@/types";
import type { WorkspaceSetupState } from "./types";

export function StepSelectEmployees({
  state,
  onChange,
}: {
  state: WorkspaceSetupState;
  onChange: (patch: Partial<WorkspaceSetupState>) => void;
}) {
  const toggle = (type: EmployeeType) => {
    const selected = state.employees.includes(type)
      ? state.employees.filter((t) => t !== type)
      : [...state.employees, type];
    onChange({ employees: selected });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-foreground">Select the AI Employees to activate</h2>
        <p className="mt-1 text-body text-muted-foreground">
          Choose one or more. You can hire more AI Employees later from your dashboard.
        </p>
      </div>

      <div
        role="group"
        aria-label="AI Employees"
        className="grid gap-4 sm:grid-cols-2"
      >
        {EMPLOYEE_ORDER.map((type) => {
          const employee = AI_EMPLOYEES[type];
          const selected = state.employees.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(type)}
              className={cn(
                "surface-panel relative flex flex-col gap-3 p-5 text-left transition-colors",
                selected ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-elevated",
              )}
            >
              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="size-3.5" />
                </span>
              )}
              <EmployeeAvatar type={type} size="lg" />
              <div>
                <p className="text-h3 text-foreground">{employee.name}</p>
                <p className="mt-0.5 text-caption text-muted-foreground">{employee.role}</p>
              </div>
              <ul className="space-y-1.5">
                {employee.responsibilities.slice(0, 3).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-caption text-muted-foreground">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
