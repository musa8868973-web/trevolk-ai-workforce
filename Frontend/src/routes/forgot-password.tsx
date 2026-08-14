import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Trevolk AI Workforce" },
      { name: "description", content: "Request a password reset link for your Trevolk workspace." },
      { property: "og:title", content: "Reset your password — Trevolk AI Workforce" },
      { property: "og:description", content: "We'll email you a link to reset your Trevolk account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type Values = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSentTo(values.email);
  };

  const resend = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    toast.success(`Reset link resent to ${sentTo ?? getValues("email")}.`);
  };

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your inbox"
        description={`We've sent a password reset link to ${sentTo}.`}
        cta={{ label: "Back to log in", to: "/login", prompt: "Remembered your password?" }}
      >
        <div className="surface-panel flex flex-col items-center gap-4 p-8 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"
          >
            <MailCheck className="size-6" />
          </span>
          <p className="text-body text-muted-foreground">
            Didn't get the email? Check your spam folder, or resend it below.
          </p>
          <Button type="button" variant="outline" onClick={resend} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {submitting ? "Resending…" : "Resend email"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your work email and we'll send you a link to reset it."
      cta={{ label: "Back to log in", to: "/login", prompt: "Remembered your password?" }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-caption text-danger">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Sending link…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
