import { SectionCard } from "@/components/ui/PageHeader";
import { TrendChart, RateDonut } from "@/components/charts/Charts";
import type { AIEmployeeConfig } from "@/types";

export function EmployeePerformance({ employee }: { employee: AIEmployeeConfig }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {employee.metrics.map((metric) => (
          <div key={metric.id} className="surface-panel p-5">
            <p className="text-caption text-muted-foreground">{metric.label}</p>
            <p className="tabular mt-2 text-h1 font-semibold text-foreground">{metric.value}</p>
            <p className="mt-2 text-caption text-muted-foreground">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Weekly trend" className="lg:col-span-2">
          <TrendChart data={employee.trend} labels={employee.trendLabels} />
        </SectionCard>
        <SectionCard title={employee.rateMetric.label}>
          <RateDonut label={employee.rateMetric.label} value={employee.rateMetric.value} />
        </SectionCard>
      </div>
    </div>
  );
}
