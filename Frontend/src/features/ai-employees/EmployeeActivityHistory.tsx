import { useMemo, useState } from "react";
import { History } from "lucide-react";
import { SectionCard } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { ToneBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { ActivityRecord } from "@/types";

const OUTCOME_TONE: Record<ActivityRecord["outcome"], "success" | "warning" | "info" | "neutral"> = {
  resolved: "success",
  escalated: "warning",
  booked: "info",
  qualified: "info",
  sent: "neutral",
};

type SortKey = "timestamp" | "channel" | "outcome";

export function EmployeeActivityHistory({ activity }: { activity: ActivityRecord[] }) {
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [selected, setSelected] = useState<ActivityRecord | null>(null);

  const channels = useMemo(() => Array.from(new Set(activity.map((a) => a.channel))), [activity]);

  const rows = useMemo(() => {
    const filtered = channelFilter === "all" ? activity : activity.filter((a) => a.channel === channelFilter);
    return [...filtered].sort((a, b) => {
      if (sortKey === "channel") return a.channel.localeCompare(b.channel);
      if (sortKey === "outcome") return a.outcome.localeCompare(b.outcome);
      return a.timestamp.localeCompare(b.timestamp);
    });
  }, [activity, channelFilter, sortKey]);

  if (activity.length === 0) {
    return (
      <SectionCard title="Activity History">
        <EmptyState
          icon={History}
          title="No activity yet"
          description="This employee hasn't logged any activity records so far."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Activity History"
      actions={
        <div className="flex items-center gap-2">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-36" aria-label="Filter by channel">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {channels.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-36" aria-label="Sort by">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Sort: Time</SelectItem>
              <SelectItem value="channel">Sort: Channel</SelectItem>
              <SelectItem value="outcome">Sort: Outcome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((record) => (
              <TableRow
                key={record.id}
                className="cursor-pointer"
                onClick={() => setSelected(record)}
              >
                <TableCell className="tabular whitespace-nowrap text-muted-foreground">{record.timestamp}</TableCell>
                <TableCell className="whitespace-nowrap text-foreground">{record.contact}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{record.channel}</TableCell>
                <TableCell className="max-w-xs truncate text-foreground">{record.summary}</TableCell>
                <TableCell>
                  <ToneBadge tone={OUTCOME_TONE[record.outcome]}>{record.outcome}</ToneBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.summary}</SheetTitle>
                <SheetDescription>{selected.timestamp}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-body">
                <div>
                  <p className="text-caption text-muted-foreground">Contact</p>
                  <p className="text-foreground">{selected.contact}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Channel</p>
                  <p className="capitalize text-foreground">{selected.channel}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Outcome</p>
                  <ToneBadge tone={OUTCOME_TONE[selected.outcome]}>{selected.outcome}</ToneBadge>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}
