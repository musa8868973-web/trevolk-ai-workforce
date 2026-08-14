import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBaseView } from "@/features/knowledge-base/KnowledgeBaseView";

export const Route = createFileRoute("/dashboard/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Knowledge Base | Trevolk AI Workforce" },
      { name: "description", content: "The documents and FAQs that teach your AI Employees about your business." },
      { property: "og:title", content: "Knowledge Base | Trevolk AI Workforce" },
      { property: "og:description", content: "The documents and FAQs that teach your AI Employees about your business." },
    ],
  }),
  component: KnowledgeBaseView,
});
