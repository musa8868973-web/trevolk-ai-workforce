import { createFileRoute } from "@tanstack/react-router";
import { SlidingAuthCard } from "@/components/auth/SlidingAuthCard";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Trevolk AI Workforce" },
      { name: "description", content: "Create a Trevolk account and start setting up your AI Employees in minutes." },
      { property: "og:title", content: "Create your account — Trevolk AI Workforce" },
      { property: "og:description", content: "Hire AI Sales, Support, Reception and Follow-up employees for your business." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4 md:p-8">
      <SlidingAuthCard initialView="register" />
    </div>
  );
}
