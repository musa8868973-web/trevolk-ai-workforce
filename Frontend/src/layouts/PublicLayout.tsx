import { useState, type ReactNode } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/navigation/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Solutions", to: "/solutions" },
  { label: "AI Employees", to: "/ai-employees" },
  { label: "Industries", to: "/industries" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export function PublicLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-body font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Start free trial</Link>
            </Button>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
        <div
          className={cn(
            "overflow-hidden border-t border-border bg-surface transition-[max-height] duration-200 lg:hidden",
            open ? "max-h-[26rem]" : "max-h-0",
          )}
        >
          <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-body font-medium text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/signup">Start free trial</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children ?? <Outlet />}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-caption text-muted-foreground">
              Hire AI Employees that run your sales, support, scheduling and follow-up — as a team, not a chatbot.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { label: "AI Employees", to: "/ai-employees" },
              { label: "Solutions", to: "/solutions" },
              { label: "Industries", to: "/industries" },
              { label: "Pricing", to: "/pricing" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "About", to: "/about" },
              { label: "Contact", to: "/contact" },
            ]}
          />
          <FooterCol
            title="Get started"
            links={[
              { label: "Start free trial", to: "/signup" },
              { label: "Log in", to: "/login" },
              { label: "Open dashboard", to: "/dashboard" },
            ]}
          />
        </div>
        <div className="border-t border-border px-4 py-6 text-center text-caption text-muted-foreground lg:px-8">
          © {new Date().getFullYear()} Trevolk AI Workforce. All rights reserved.
        </div>
      </footer>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 lg:hidden">
        <Button asChild size="lg" className="pointer-events-auto shadow-lift">
          <Link to="/signup">Start free trial</Link>
        </Button>
      </div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h2 className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-body text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
