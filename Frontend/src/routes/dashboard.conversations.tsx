import { createFileRoute } from "@tanstack/react-router";
import { ConversationsView } from "@/features/conversations/ConversationsView";

export const Route = createFileRoute("/dashboard/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations | Trevolk AI Workforce" },
      { name: "description", content: "Every customer conversation your AI Employees handle across chat, email and WhatsApp." },
      { property: "og:title", content: "Conversations | Trevolk AI Workforce" },
      { property: "og:description", content: "Every customer conversation your AI Employees handle across chat, email and WhatsApp." },
    ],
  }),
  component: ConversationsView,
});
