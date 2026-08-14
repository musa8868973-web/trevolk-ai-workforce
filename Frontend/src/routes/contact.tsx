import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, CalendarCheck, LifeBuoy } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Trevolk — Talk to the AI Workforce team" },
      {
        name: "description",
        content:
          "Book a demo, ask about Enterprise plans, or get support for your Trevolk AI Workforce workspace.",
      },
      { property: "og:title", content: "Contact Trevolk — Talk to the AI Workforce team" },
      {
        property: "og:description",
        content: "Book a demo or talk to our team about rolling out AI Employees across your business.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid work email"),
  company: z.string().min(2, "Please enter your company name"),
  teamSize: z.string().min(1, "Select a team size"),
  message: z.string().min(20, "Tell us a little more (20 characters minimum)"),
});

type FormValues = z.infer<typeof schema>;

function ContactPage() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", company: "", teamSize: "", message: "" },
  });

  const onSubmit = async (values: FormValues) => {
    await new Promise((r) => setTimeout(r, 700));
    toast.success("Message sent", {
      description: `Thanks ${values.name.split(" ")[0]} — our team replies within one business day.`,
    });
    reset();
  };

  return (
    <PublicLayout>
      <section className="grid-glow border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
          <h1 className="text-display text-foreground">Talk to the team</h1>
          <p className="mx-auto mt-4 max-w-2xl text-body text-muted-foreground">
            Whether you're rolling out your first AI Employee or evaluating an enterprise deployment, we'll help you plan
            it properly.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="surface-panel p-6 sm:p-8">
          <h2 className="text-h2 text-foreground">Send us a message</h2>
          <div className="mt-6 space-y-5">
            <Field id="name" label="Full name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field id="email" label="Work email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            <Field id="company" label="Company" error={errors.company?.message}>
              <Input id="company" autoComplete="organization" aria-invalid={!!errors.company} {...register("company")} />
            </Field>
            <Field id="teamSize" label="Team size" error={errors.teamSize?.message}>
              <Select
                value={watch("teamSize")}
                onValueChange={(v) => setValue("teamSize", v, { shouldValidate: true })}
              >
                <SelectTrigger id="teamSize" aria-invalid={!!errors.teamSize}>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {["1–5", "6–20", "21–100", "100+"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} people
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="message" label="What are you trying to solve?" error={errors.message?.message}>
              <Textarea id="message" rows={5} aria-invalid={!!errors.message} {...register("message")} />
            </Field>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
        </form>

        <div className="space-y-4">
          <InfoCard
            icon={CalendarCheck}
            title="Book a live demo"
            body="See all four AI Employees handling real scenarios in a 30-minute walkthrough tailored to your industry."
          />
          <InfoCard
            icon={Mail}
            title="Enterprise & procurement"
            body="Security reviews, SSO, custom deployment and volume pricing: enterprise@trevolk.com"
          />
          <InfoCard
            icon={LifeBuoy}
            title="Existing customer support"
            body="Already running a workspace? Reach us at support@trevolk.com — median first reply under 2 hours."
          />
        </div>
      </section>
    </PublicLayout>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-panel flex gap-4 p-5">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"
      >
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="text-h3 text-foreground">{title}</h3>
        <p className="mt-1 text-body text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
