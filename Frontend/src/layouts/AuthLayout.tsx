import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/navigation/Logo";

export function AuthLayout({
  title,
  description,
  children,
  cta,
  aside,
}: {
  title: string;
  description: string;
  children: ReactNode;
  cta?: { label: string; to: string; prompt: string };
  aside?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
      <div className="hidden flex-col justify-between border-r border-border bg-sidebar p-10 lg:flex">
        <Logo />
        <div className="max-w-md">
          <h2 className="text-h1 text-foreground">Your AI Workforce, running quietly in the background.</h2>
          <p className="mt-4 text-body text-muted-foreground">
            Sales, Support, Reception and Follow-up — four AI Employees sharing one workspace, one knowledge base and one
            set of business rules.
          </p>
          {aside}
        </div>
        <p className="text-caption text-muted-foreground">Trusted by e-commerce teams, agencies and coaches.</p>
      </div>

      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-h1 text-foreground">{title}</h1>
          <p className="mt-2 text-body text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          {cta && (
            <p className="mt-8 text-caption text-muted-foreground">
              {cta.prompt}{" "}
              <Link to={cta.to} className="font-medium text-primary hover:underline">
                {cta.label}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
