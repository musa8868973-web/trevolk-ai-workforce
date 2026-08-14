import type { EmployeeType } from "@/types";

export interface WorkspaceSetupState {
  businessName: string;
  industry: string;
  website: string;
  tone: string;
  employees: EmployeeType[];
  businessRules: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  escalationEmail: string;
  knowledgeBaseSource: string;
  integrations: Record<string, boolean>;
}

export const INDUSTRIES = ["E-commerce", "Digital Agency", "Software House", "Coaching", "Real Estate", "Other"];

export const BRAND_TONES = ["Friendly", "Professional", "Formal", "Playful", "Concise"];

export const INTEGRATIONS: { id: string; name: string; description: string }[] = [
  { id: "whatsapp", name: "WhatsApp", description: "Route customer chats from WhatsApp Business." },
  { id: "gmail", name: "Gmail", description: "Send and receive support and sales emails." },
  { id: "gcal", name: "Google Calendar", description: "Book meetings on approved availability." },
  { id: "shopify", name: "Shopify", description: "Look up orders and delivery status." },
  { id: "slack", name: "Slack", description: "Get notified when a human is needed." },
  { id: "stripe", name: "Stripe", description: "Reference invoices and payment status." },
];

export const INITIAL_STATE: WorkspaceSetupState = {
  businessName: "",
  industry: "",
  website: "",
  tone: "",
  employees: [],
  businessRules: "",
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  escalationEmail: "",
  knowledgeBaseSource: "",
  integrations: {},
};
