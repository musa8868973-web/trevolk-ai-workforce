import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Bot, User } from "lucide-react";
import { useAppointments } from "@/hooks/useTrevolkData";
import type { Appointment } from "@/types";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { ToneBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_TONE: Record<Appointment["status"], "success" | "warning" | "danger"> = {
  confirmed: "success",
  pending: "warning",
  cancelled: "danger",
};

export function AppointmentsView() {
  const { data, isLoading, isError, refetch } = useAppointments();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const list = appointments ?? data ?? [];

  function ensure(): Appointment[] {
    if (appointments) return appointments;
    const base = data ? structuredClone(data) : [];
    setAppointments(base);
    return base;
  }

  function update(id: string, updater: (a: Appointment) => Appointment) {
    const base = ensure();
    setAppointments(base.map((a) => (a.id === id ? updater(structuredClone(a)) : a)));
  }

  function confirmCancel() {
    if (!cancelTarget) return;
    update(cancelTarget.id, (a) => ({ ...a, status: "cancelled" }));
    toast.success("Appointment cancelled");
    setCancelTarget(null);
  }

  function openReschedule(a: Appointment) {
    setRescheduleTarget(a);
    setNewDate(a.date);
    setNewTime(a.time);
  }

  function confirmReschedule() {
    if (!rescheduleTarget) return;
    update(rescheduleTarget.id, (a) => ({ ...a, date: newDate, time: newTime, status: "pending" }));
    toast.success("Appointment rescheduled");
    setRescheduleTarget(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Appointments" description="Everything your AI Receptionist has booked, in one calendar." />
        <SectionCard>
          <TableSkeleton rows={6} />
        </SectionCard>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Appointments" description="Everything your AI Receptionist has booked, in one calendar." />
        <SectionCard>
          <ErrorState onRetry={() => refetch()} />
        </SectionCard>
      </div>
    );
  }

  const upcoming = list.filter((a) => a.status !== "cancelled");

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" description="Everything your AI Receptionist has booked, in one calendar." />

      {list.length === 0 ? (
        <SectionCard>
          <EmptyState icon={CalendarDays} title="No appointments yet" description="Bookings made by your AI Receptionist will appear here." />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[auto_1fr]">
          <SectionCard title="Calendar" className="w-fit">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border border-border" />
          </SectionCard>

          <SectionCard title="Upcoming appointments" bodyClassName="p-0">
            <ul role="list" className="divide-y divide-border">
              {upcoming.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-caption text-muted-foreground">
                      {a.customer} · {a.date} · {a.time} ({a.duration})
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {a.bookedBy === "AI Receptionist" ? <Bot className="size-3" aria-hidden="true" /> : <User className="size-3" aria-hidden="true" />}
                      Booked by {a.bookedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToneBadge tone={STATUS_TONE[a.status]}>{a.status}</ToneBadge>
                    <Button variant="outline" size="sm" onClick={() => openReschedule(a)}>
                      Reschedule
                    </Button>
                    <Button variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setCancelTarget(a)}>
                      Cancel
                    </Button>
                  </div>
                </li>
              ))}
              {upcoming.length === 0 && (
                <li className="px-5 py-8">
                  <EmptyState icon={CalendarDays} title="No upcoming appointments" description="All appointments have been cancelled or completed." />
                </li>
              )}
            </ul>
          </SectionCard>
        </div>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel {cancelTarget?.title} with {cancelTarget?.customer}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep appointment</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-danger text-danger-foreground hover:bg-danger/90">
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rescheduleTarget} onOpenChange={(o) => !o && setRescheduleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resched-date">Date</Label>
              <Input id="resched-date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="resched-time">Time</Label>
              <Input id="resched-time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmReschedule}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
