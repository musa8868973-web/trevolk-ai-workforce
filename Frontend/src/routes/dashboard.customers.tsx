import { createFileRoute } from "@tanstack/react-router";
import { CustomersView } from "@/features/customers/CustomersView";

export const Route = createFileRoute("/dashboard/customers")({
  head: () => ({
    meta: [
      { title: "Customers | Trevolk AI Workforce" },
      { name: "description", content: "Every customer relationship your AI Employees help manage, with full history." },
      { property: "og:title", content: "Customers | Trevolk AI Workforce" },
      { property: "og:description", content: "Every customer relationship your AI Employees help manage, with full history." },
    ],
  }),
  component: CustomersView,
});
