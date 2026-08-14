import { createFileRoute } from "@tanstack/react-router";
import { SlidingAuthCard } from "@/components/auth/SlidingAuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Trevolk AI Workforce" },
      { name: "description", content: "Log in to manage your AI Sales, Support, Receptionist and Follow-up employees." },
      { property: "og:title", content: "Log in — Trevolk AI Workforce" },
      { property: "og:description", content: "Access your Trevolk workspace and AI Employees." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4 md:p-8">
      <SlidingAuthCard initialView="login" />
    </div>
  );
}
