import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricPoint } from "@/types";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-popover-foreground)",
  fontSize: "13px",
};

export function TrendChart({
  data,
  labels,
  height = 260,
}: {
  data: MetricPoint[];
  labels: { primary: string; secondary: string };
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={48} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--color-border)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
          <Area
            type="monotone"
            dataKey="primary"
            name={labels.primary}
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="url(#fillPrimary)"
          />
          <Area
            type="monotone"
            dataKey="secondary"
            name={labels.secondary}
            stroke="var(--color-chart-2)"
            strokeWidth={2}
            fill="url(#fillSecondary)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VolumeChart({
  data,
  labels,
  height = 260,
}: {
  data: MetricPoint[];
  labels: { primary: string; secondary: string };
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={48} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.35 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }} />
          <Bar dataKey="primary" name={labels.primary} fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="secondary" name={labels.secondary} fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RateDonut({ label, value, height = 220 }: { label: string; value: number; height?: number }) {
  const data = [
    { name: label, value },
    { name: "Remaining", value: Math.max(0, 100 - value) },
  ];
  return (
    <div style={{ height }} className="relative w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="70%" outerRadius="92%" startAngle={90} endAngle={-270} stroke="none">
            <Cell fill="var(--color-chart-1)" />
            <Cell fill="var(--color-muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-h1 font-semibold text-foreground">{value}%</span>
        <span className="mt-1 max-w-[9rem] text-caption text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
