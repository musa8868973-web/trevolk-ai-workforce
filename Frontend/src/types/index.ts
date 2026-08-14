export type EmployeeStatus = "active" | "paused" | "needs-setup" | "needs-attention";

export type EmployeeType = "sales" | "support" | "receptionist" | "follow-up";

export interface WorkflowStep {
  title: string;
  description: string;
}

export interface ConfigField {
  id: string;
  label: string;
  help?: string;
  kind: "text" | "textarea" | "toggle" | "select" | "time-range" | "number";
  options?: string[];
  value: string | boolean | number;
  required?: boolean;
}

export interface ConfigSection {
  id: string;
  title: string;
  description: string;
  fields: ConfigField[];
}

export interface MetricPoint {
  label: string;
  primary: number;
  secondary: number;
}

export interface EmployeeMetric {
  id: string;
  label: string;
  value: string;
  trend: number;
  hint: string;
}

export interface ActivityRecord {
  id: string;
  timestamp: string;
  channel: Channel;
  summary: string;
  outcome: "resolved" | "escalated" | "booked" | "qualified" | "sent";
  contact: string;
}

export interface AIEmployeeConfig {
  type: EmployeeType;
  name: string;
  role: string;
  purpose: string;
  status: EmployeeStatus;
  lastActive: string;
  keyStatLabel: string;
  keyStatValue: string;
  responsibilities: string[];
  workflow: WorkflowStep[];
  canDo: string[];
  cannotDo: string[];
  escalateWhen: string[];
  metrics: EmployeeMetric[];
  trend: MetricPoint[];
  trendLabels: { primary: string; secondary: string };
  rateMetric: { label: string; value: number };
  configSections: ConfigSection[];
  activity: ActivityRecord[];
}

export type Channel = "chat" | "whatsapp" | "email" | "form" | "phone";

export type ConversationStatus = "open" | "escalated" | "resolved";

export interface Message {
  id: string;
  author: "ai" | "human" | "customer";
  authorName: string;
  body: string;
  timestamp: string;
  pending?: boolean;
  failed?: boolean;
}

export interface Conversation {
  id: string;
  customer: string;
  company?: string;
  email: string;
  channel: Channel;
  employee: EmployeeType;
  status: ConversationStatus;
  unread: boolean;
  handledBy: "ai" | "human";
  updatedAt: string;
  preview: string;
  notes: string[];
  messages: Message[];
}

export type LeadStatus = "new" | "contacted" | "qualified" | "meeting-booked" | "lost";
export type LeadScore = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  source: Channel;
  status: LeadStatus;
  score: LeadScore;
  value: number;
  owner: string;
  createdAt: string;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  lifetimeValue: number;
  orders: number;
  status: "active" | "at-risk" | "churned";
  joinedAt: string;
  lastInteraction: string;
  history: { id: string; type: "conversation" | "order" | "appointment"; label: string; date: string }[];
}

export interface Appointment {
  id: string;
  title: string;
  customer: string;
  date: string;
  time: string;
  duration: string;
  status: "confirmed" | "pending" | "cancelled";
  bookedBy: "AI Receptionist" | "Human";
}

export type SyncStatus = "synced" | "syncing" | "failed";

export interface KnowledgeItem {
  id: string;
  name: string;
  type: "PDF" | "FAQ" | "Webpage" | "Doc";
  updatedAt: string;
  sync: SyncStatus;
  usedBy: EmployeeType[];
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  employee: EmployeeType;
  active: boolean;
  runs: number;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  health: "healthy" | "degraded" | "disconnected";
}

export interface AlertItem {
  id: string;
  severity: "warning" | "danger";
  title: string;
  description: string;
  href: string;
}

export interface ActivityFeedItem {
  id: string;
  employee: EmployeeType;
  description: string;
  timestamp: string;
  href: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Sales" | "Support" | "Viewer";
  status: "active" | "invited";
}
