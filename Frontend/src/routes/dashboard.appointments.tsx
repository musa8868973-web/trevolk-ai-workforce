import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsView } from "@/features/appointments/AppointmentsView";

export const Route = createFileRoute("/dashboard/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments | Trevolk AI Workforce" },
      { name: "description", content: "Meetings and bookings scheduled by your AI Receptionist." },
      { property: "og:title", content: "Appointments | Trevolk AI Workforce" },
      { property: "og:description", content: "Meetings and bookings scheduled by your AI Receptionist." },
    ],
  }),
  component: AppointmentsView,
});
