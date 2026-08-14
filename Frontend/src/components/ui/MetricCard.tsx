import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  trend,
  hint,
  className,
}: {
  label: string;
  value: string;
  trend?: number;
  hint?: string;
  className?: string;
}) {
  const direction = trend === undefined || trend === 0 ? "flat" : trend > 0 ? "up" : "down";
  const Icon = direction === "flat" ? Minus : direction === "up" ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "surface-panel p-5 transition-colors hover:border-primary/40 hover:bg-elevated",
        className,
      )}
    >
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="tabular mt-2 text-h1 font-semibold text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-caption">
        {trend !== undefined && (
          <span
            className={cn(
              "tabular inline-flex items-center gap-1 font-medium",
              direction === "up" && "text-success",
              direction === "down" && "text-warning",
              direction === "flat" && "text-muted-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
            {direction === "flat" ? "No change" : `${Math.abs(trend).toFixed(1)}%`}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
