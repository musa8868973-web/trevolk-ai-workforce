import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Trevolk home">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft"
      >
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 7h16M12 7v13" strokeLinecap="round" />
          <circle cx="18.5" cy="15.5" r="2.5" />
        </svg>
      </span>
      {showWord && (
        <span className="text-h3 font-semibold tracking-tight text-foreground">
          Trevolk
          <span className="ml-1 text-caption font-medium text-muted-foreground">AI Workforce</span>
        </span>
      )}
    </Link>
  );
}
