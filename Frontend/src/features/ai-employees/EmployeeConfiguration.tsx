import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AIEmployeeConfig, ConfigField } from "@/types";

type FieldValues = Record<string, string | boolean | number>;

function buildInitialValues(employee: AIEmployeeConfig): FieldValues {
  const values: FieldValues = {};
  for (const section of employee.configSections) {
    for (const field of section.fields) {
      values[field.id] = field.value;
    }
  }
  return values;
}

function isEmpty(value: string | boolean | number) {
  return typeof value === "string" && value.trim().length === 0;
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: ConfigField;
  value: string | boolean | number;
  error?: string | undefined;
  onChange: (value: string | boolean | number) => void;
}) {
  const inputId = `field-${field.id}`;

  if (field.kind === "toggle") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-elevated/40 px-4 py-3">
        <div>
          <Label htmlFor={inputId} className="text-body text-foreground">
            {field.label}
          </Label>
          {field.help && <p className="mt-0.5 text-caption text-muted-foreground">{field.help}</p>}
        </div>
        <Switch id={inputId} checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-body text-foreground">
        {field.label}
        {field.required && <span className="ml-1 text-danger">*</span>}
      </Label>
      {field.help && <p className="text-caption text-muted-foreground">{field.help}</p>}

      {field.kind === "textarea" && (
        <Textarea
          id={inputId}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(error && "border-danger focus-visible:ring-danger")}
        />
      )}

      {(field.kind === "text" || field.kind === "time-range") && (
        <Input
          id={inputId}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(error && "border-danger focus-visible:ring-danger")}
        />
      )}

      {field.kind === "number" && (
        <Input
          id={inputId}
          type="number"
          value={String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          aria-invalid={Boolean(error)}
          className={cn(error && "border-danger focus-visible:ring-danger")}
        />
      )}

      {field.kind === "select" && (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger id={inputId} aria-invalid={Boolean(error)} className={cn(error && "border-danger")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}

function GuardrailPanel({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: typeof ShieldCheck;
  tone: "success" | "danger" | "warning";
  items: string[];
}) {
  return (
    <div className="surface-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon
          aria-hidden="true"
          className={cn(
            "size-4",
            tone === "success" && "text-success",
            tone === "danger" && "text-danger",
            tone === "warning" && "text-warning",
          )}
        />
        <h3 className="text-body font-medium text-foreground">{title}</h3>
      </div>
      <ul className="space-y-2 text-caption text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function EmployeeConfiguration({ employee }: { employee: AIEmployeeConfig }) {
  const [values, setValues] = useState<FieldValues>(() => buildInitialValues(employee));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedVisible, setSavedVisible] = useState(false);

  useEffect(() => {
    setValues(buildInitialValues(employee));
    setErrors({});
    setSavedVisible(false);
  }, [employee]);

  const updateField = (id: string, value: string | boolean | number) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    for (const section of employee.configSections) {
      for (const field of section.fields) {
        if (field.required && isEmpty(values[field.id] ?? "")) {
          nextErrors[field.id] = `${field.label} is required.`;
        }
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    setSavedVisible(true);
    toast.success("Configuration saved");
    window.setTimeout(() => setSavedVisible(false), 4000);
  };

  return (
    <div className="space-y-6">
      {employee.configSections.map((section) => (
        <SectionCard key={section.id} title={section.title} description={section.description}>
          <div className="grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.id} className={cn(field.kind === "textarea" && "sm:col-span-2")}>
                <FieldControl
                  field={field}
                  value={values[field.id] ?? ""}
                  error={errors[field.id]}
                  onChange={(value) => updateField(field.id, value)}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      <div className="grid gap-4 lg:grid-cols-3">
        <GuardrailPanel title="Can do" icon={ShieldCheck} tone="success" items={employee.canDo} />
        <GuardrailPanel title="Cannot do" icon={ShieldX} tone="danger" items={employee.cannotDo} />
        <GuardrailPanel title="Escalates when" icon={ShieldAlert} tone="warning" items={employee.escalateWhen} />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>Save changes</Button>
        {savedVisible && (
          <span className="flex items-center gap-1.5 text-caption text-success" role="status">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Changes saved
          </span>
        )}
      </div>
    </div>
  );
}
