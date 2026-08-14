import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Building, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SsoButtons } from "@/features/onboarding/SsoButtons";
import { loginUser, registerUser } from "@/services/auth.api";
import { cn } from "@/lib/utils";

// ──────────────── Validation Schemas ────────────────

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required").min(2, "Enter your full name"),
  email: z.string().min(1, "Work email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Za-z]/, "Must contain at least 1 letter")
    .regex(/[0-9]/, "Must contain at least 1 number"),
  organizationName: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept terms to continue" }) }),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] ?? "Too weak" };
}

interface SlidingAuthCardProps {
  initialView?: "login" | "register";
}

export function SlidingAuthCard({ initialView = "login" }: SlidingAuthCardProps) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"login" | "register">(initialView);
  const [loading, setLoading] = useState(false);

  // Forms
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      organizationName: "",
      terms: false as unknown as true,
    },
  });

  const regPassword = registerForm.watch("password");
  const regTerms = registerForm.watch("terms");
  const strength = useMemo(() => passwordStrength(regPassword ?? ""), [regPassword]);

  // Handle Login Submission
  const onLoginSubmit = async (values: LoginValues) => {
    setLoading(true);
    try {
      const data = await loginUser({
        email: values.email,
        password: values.password,
      });
      toast.success(`Welcome back, ${data.user.name || values.email}!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submission
  const onRegisterSubmit = async (values: RegisterValues) => {
    setLoading(true);
    try {
      const data = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        organizationName: values.organizationName || undefined,
      });
      toast.success("Account created successfully! Welcome to Trevolk.");
      navigate({ to: "/workspace-setup" });
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isRegister = activeView === "register";

  return (
    <div className="relative w-full max-w-4xl min-h-[620px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
      {/* ──────────────── Main Container Grid ──────────────── */}
      <div className="grid h-full min-h-[620px] grid-cols-1 md:grid-cols-2">
        
        {/* ──────────────── Left Panel: Sign In Form ──────────────── */}
        <div
          className={cn(
            "flex flex-col justify-center p-8 sm:p-12 transition-all duration-700 ease-in-out",
            isRegister ? "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto" : "opacity-100"
          )}
        >
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div>
              <h2 className="text-h2 font-bold text-foreground">Welcome Back</h2>
              <p className="mt-1.5 text-caption text-muted-foreground">
                Log in to manage your AI Employees and Workspace.
              </p>
            </div>

            <SsoButtons />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-caption text-muted-foreground">or with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    {...loginForm.register("email")}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-caption text-danger">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link to="/forgot-password" className="text-caption font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...loginForm.register("password")}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-caption text-danger">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
                {!loading && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </form>

            <div className="text-center md:hidden">
              <p className="text-caption text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveView("register")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* ──────────────── Right Panel: Register Form ──────────────── */}
        <div
          className={cn(
            "flex flex-col justify-center p-8 sm:p-12 transition-all duration-700 ease-in-out",
            !isRegister ? "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto" : "opacity-100"
          )}
        >
          <div className="mx-auto w-full max-w-sm space-y-5">
            <div>
              <h2 className="text-h2 font-bold text-foreground">Create Account</h2>
              <p className="mt-1.5 text-caption text-muted-foreground">
                Start hiring your AI Sales & Support employees today.
              </p>
            </div>

            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5" noValidate>
              <div className="space-y-1">
                <Label htmlFor="reg-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input id="reg-name" placeholder="Jordan Lee" className="pl-9" {...registerForm.register("name")} />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="text-caption text-danger">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    {...registerForm.register("email")}
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-caption text-danger">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-org">Organization Name (Optional)</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="reg-org"
                    placeholder="Acme Corp"
                    className="pl-9"
                    {...registerForm.register("organizationName")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="At least 8 characters"
                    className="pl-9"
                    {...registerForm.register("password")}
                  />
                </div>
                {registerForm.formState.errors.password ? (
                  <p className="text-caption text-danger">{registerForm.formState.errors.password.message}</p>
                ) : (
                  regPassword && (
                    <div className="space-y-1 mt-1">
                      <div className="flex gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              i < strength.score
                                ? strength.score <= 1
                                  ? "bg-danger"
                                  : strength.score <= 2
                                    ? "bg-warning"
                                    : "bg-success"
                                : "bg-muted/40"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                    </div>
                  )
                )}
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="reg-terms"
                  checked={regTerms as unknown as boolean}
                  onCheckedChange={(checked) =>
                    registerForm.setValue("terms", (checked === true) as true, { shouldValidate: true })
                  }
                />
                <Label htmlFor="reg-terms" className="text-[12px] font-normal leading-snug text-muted-foreground">
                  I agree to the Terms of Service & Privacy Policy.
                </Label>
              </div>
              {registerForm.formState.errors.terms && (
                <p className="text-caption text-danger">{registerForm.formState.errors.terms.message}</p>
              )}

              <Button type="submit" className="w-full font-medium" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {loading ? "Creating Account…" : "Create Free Account"}
                {!loading && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </form>

            <div className="text-center md:hidden">
              <p className="text-caption text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveView("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Log In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────── Overlay Sliding Hero Panel ──────────────── */}
      <div
        className={cn(
          "hidden md:flex absolute top-0 bottom-0 w-1/2 flex-col justify-between p-10 text-white transition-transform duration-700 ease-in-out z-20 shadow-2xl overflow-hidden",
          "bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-950",
          isRegister ? "translate-x-0 rounded-r-3xl" : "translate-x-full rounded-l-3xl"
        )}
      >
        {/* Background Mesh Overlay Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="font-bold text-lg text-white">T</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">Trevolk AI</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto space-y-6 py-8">
          {isRegister ? (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-3xl font-extrabold tracking-tight leading-tight">
                One Workspace. <br />
                Four AI Employees.
              </h3>
              <p className="text-sm text-white/80 leading-relaxed max-w-sm">
                Sales, Support, Receptionist & Follow-up agents working together seamlessly for your business.
              </p>
              <div className="space-y-2 pt-2 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  <span>Real-time Live Chat & WhatsApp Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  <span>Automated Lead Qualification & Scheduling</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-3xl font-extrabold tracking-tight leading-tight">
                Start Your AI <br />
                Workforce Today.
              </h3>
              <p className="text-sm text-white/80 leading-relaxed max-w-sm">
                Join hundreds of businesses scaling customer support and sales automation effortlessly.
              </p>
              <div className="space-y-2 pt-2 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  <span>Instant 1-Click Setup & No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-300" />
                  <span>Unified Knowledge Base & Multi-Tenancy</span>
                </div>
              </div>
            </div>
          )}

          {/* Toggle Action Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setActiveView(isRegister ? "login" : "register")}
              className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-md px-6 py-2.5 text-sm font-semibold tracking-wide text-white transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              {isRegister ? "LOG IN INSTEAD" : "SIGN UP NOW"}
              <ArrowRight className="ml-2 size-4" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} Trevolk AI Inc. Enterprise AI Workforce Platform.
        </div>
      </div>
    </div>
  );
}
