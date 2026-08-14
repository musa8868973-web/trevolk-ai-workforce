import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useAnalytics } from "@/hooks/useTrevolkData";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { CardGridSkeleton, ChartSkeleton, ErrorState } from "@/components/ui/States";
import { MetricCard } from "@/components/ui/MetricCard";
import { TrendChart, VolumeChart, RateDonut } from "@/components/charts/Charts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const METRICS = [
  { label: "Avg. response time", value: "48s", trend: -12.4, hint: "vs previous period" },
  { label: "Resolution rate", value: "91%", trend: 3.1, hint: "vs previous period" },
  { label: "Conversion rate", value: "27%", trend: 5.8, hint: "vs previous period" },
  { label: "Revenue impact", value: "$68.4k", trend: 9.2, hint: "attributed to AI Employees" },
];

export function AnalyticsView() {
  const { data, isLoading, isError, refetch } = useAnalytics();
  const [range, setRange] = useState("30d");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="How your AI Employees are performing across every channel."
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <CardGridSkeleton count={4} />
          <SectionCard>
            <ChartSkeleton />
          </SectionCard>
        </div>
      ) : isError || !data ? (
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SectionCard title="Conversation trend" description="Handled vs escalated over time" className="xl:col-span-2">
              <TrendChart data={data.series} labels={{ primary: "Handled", secondary: "Escalated" }} />
            </SectionCard>
            <SectionCard title="Resolution rate">
              <RateDonut label="Resolved without escalation" value={91} />
            </SectionCard>
          </div>

          <SectionCard title="Channel volume" description="Conversations by channel this period">
            <VolumeChart data={data.channels} labels={{ primary: "Total", secondary: "AI-handled" }} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
