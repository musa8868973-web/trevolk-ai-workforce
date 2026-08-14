import { useState } from "react";
import { useTeam } from "@/hooks/useTrevolkData";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ErrorState, TableSkeleton } from "@/components/ui/States";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export function SettingsView() {
  const { data, isLoading, isError, refetch } = useTeam();
  const [workspace, setWorkspace] = useState("Trevolk AI");
  const [website, setWebsite] = useState("https://trevolk.ai");
  const [notifications, setNotifications] = useState({
    escalations: true,
    dailyDigest: true,
    weeklyReport: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your workspace, team and notification preferences." />

      <Tabs defaultValue="workspace">
        <TabsList>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-6">
          <SectionCard title="Workspace profile" description="Shown to customers in AI Employee conversations.">
            <form
              className="max-w-md space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Workspace settings saved");
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <Input id="workspace-name" value={workspace} onChange={(e) => setWorkspace(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-website">Website</Label>
                <Input id="workspace-website" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </SectionCard>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <SectionCard
            title="Team members"
            description="People who can access this workspace."
            actions={<Button size="sm" onClick={() => toast.success("Invite sent")}>Invite member</Button>}
          >
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : isError || !data ? (
              <ErrorState onRetry={() => refetch()} />
            ) : (
              <ul role="list" className="divide-y divide-border">
                {data.map((member) => (
                  <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                      <p className="truncate text-caption text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ToneBadge tone="neutral">{member.role}</ToneBadge>
                      <ToneBadge tone={member.status === "active" ? "success" : "warning"}>{member.status}</ToneBadge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <SectionCard title="Notifications" description="Choose what lands in your inbox.">
            <div className="divide-y divide-border">
              {(
                [
                  { key: "escalations", label: "Escalation alerts", hint: "When an AI Employee hands off to a human." },
                  { key: "dailyDigest", label: "Daily digest", hint: "A summary of yesterday's activity." },
                  { key: "weeklyReport", label: "Weekly performance report", hint: "Trends across every channel." },
                ] as const
              ).map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{row.label}</p>
                    <p className="text-caption text-muted-foreground">{row.hint}</p>
                  </div>
                  <Switch
                    checked={notifications[row.key]}
                    onCheckedChange={(checked) => {
                      setNotifications((prev) => ({ ...prev, [row.key]: checked }));
                      toast.success(`${row.label} ${checked ? "enabled" : "disabled"}`);
                    }}
                    aria-label={row.label}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
