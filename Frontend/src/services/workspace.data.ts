import type {
  ActivityFeedItem,
  AlertItem,
  Appointment,
  Automation,
  Conversation,
  Customer,
  Integration,
  KnowledgeItem,
  Lead,
  TeamMember,
} from "@/types";

export const ALERTS: AlertItem[] = [
  {
    id: "al1",
    severity: "danger",
    title: "AI Follow-up Employee hit its contact limit",
    description: "3 sequences paused because the monthly contact cap was reached for 42 customers.",
    href: "/dashboard/ai-employees/follow-up",
  },
  {
    id: "al2",
    severity: "warning",
    title: "AI Receptionist needs a calendar",
    description: "Connect Google Calendar to let the receptionist start booking appointments.",
    href: "/dashboard/ai-employees/receptionist",
  },
  {
    id: "al3",
    severity: "warning",
    title: "2 knowledge base documents failed to sync",
    description: "Returns Policy v4 and Shipping FAQ could not be indexed.",
    href: "/dashboard/knowledge-base",
  },
];

export const ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: "f1", employee: "sales", description: "Qualified Nadia Rahman as a Hot lead and booked a discovery call", timestamp: "2 min ago", href: "/dashboard/leads" },
  { id: "f2", employee: "support", description: "Resolved a delivery delay question for order #48219", timestamp: "9 min ago", href: "/dashboard/conversations" },
  { id: "f3", employee: "follow-up", description: "Recovered an abandoned cart worth $240", timestamp: "26 min ago", href: "/dashboard/customers" },
  { id: "f4", employee: "support", description: "Escalated a refund exception to the support team", timestamp: "48 min ago", href: "/dashboard/conversations" },
  { id: "f5", employee: "sales", description: "Updated 12 CRM records after qualification", timestamp: "1 hr ago", href: "/dashboard/leads" },
  { id: "f6", employee: "follow-up", description: "Sent proposal reminders to 8 quiet prospects", timestamp: "2 hrs ago", href: "/dashboard/automations" },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "cv1",
    customer: "Nadia Rahman",
    company: "Rahman Studio",
    email: "nadia@rahmanstudio.com",
    channel: "chat",
    employee: "sales",
    status: "open",
    unread: true,
    handledBy: "ai",
    updatedAt: "2 min ago",
    preview: "Perfect — Thursday at 11:00 works for us.",
    notes: ["Budget confirmed at $18k/yr.", "Decision maker is on the call."],
    messages: [
      { id: "m1", author: "customer", authorName: "Nadia Rahman", body: "Hi, we're comparing AI support tools for our store. What does onboarding look like?", timestamp: "14:02" },
      { id: "m2", author: "ai", authorName: "AI Sales Employee", body: "Happy to help. Most e-commerce teams go live in a single session — you connect your store, upload policies, and activate a Support Employee. Can I ask what volume of tickets you handle weekly?", timestamp: "14:02" },
      { id: "m3", author: "customer", authorName: "Nadia Rahman", body: "Around 400 a week, mostly order status.", timestamp: "14:05" },
      { id: "m4", author: "ai", authorName: "AI Sales Employee", body: "That's a strong fit — order-status questions are usually fully automated. Would Thursday at 11:00 suit a 30-minute walkthrough?", timestamp: "14:06" },
      { id: "m5", author: "customer", authorName: "Nadia Rahman", body: "Perfect — Thursday at 11:00 works for us.", timestamp: "14:08" },
    ],
  },
  {
    id: "cv2",
    customer: "Priya Nair",
    email: "priya.nair@gmail.com",
    channel: "whatsapp",
    employee: "support",
    status: "escalated",
    unread: true,
    handledBy: "human",
    updatedAt: "18 min ago",
    preview: "I'd like a refund even though it's past 30 days.",
    notes: ["Loyal customer — 14 orders.", "Requires policy exception approval."],
    messages: [
      { id: "m1", author: "customer", authorName: "Priya Nair", body: "My order arrived damaged but I only opened it now — it's day 34.", timestamp: "12:10" },
      { id: "m2", author: "ai", authorName: "AI Support Employee", body: "I'm sorry about the damage. Our standard return window is 30 days, so I'm bringing in a colleague who can review a goodwill exception for you.", timestamp: "12:11" },
      { id: "m3", author: "human", authorName: "Sana (Support)", body: "Hi Priya — I've reviewed your order history and we'll make an exception here. A replacement ships today.", timestamp: "12:18" },
    ],
  },
  {
    id: "cv3",
    customer: "Ayesha Malik",
    email: "ayesha@luxeliving.pk",
    channel: "email",
    employee: "support",
    status: "resolved",
    unread: false,
    handledBy: "ai",
    updatedAt: "1 hr ago",
    preview: "Thanks, that answers it!",
    notes: [],
    messages: [
      { id: "m1", author: "customer", authorName: "Ayesha Malik", body: "Where is order #48219?", timestamp: "10:41" },
      { id: "m2", author: "ai", authorName: "AI Support Employee", body: "Order #48219 left the warehouse yesterday and is due Friday. Here's your tracking link.", timestamp: "10:41" },
      { id: "m3", author: "customer", authorName: "Ayesha Malik", body: "Thanks, that answers it!", timestamp: "10:44" },
    ],
  },
  {
    id: "cv4",
    customer: "Bilal Ahmed",
    company: "Northline Agency",
    email: "bilal@northline.co",
    channel: "whatsapp",
    employee: "follow-up",
    status: "open",
    unread: false,
    handledBy: "ai",
    updatedAt: "3 hrs ago",
    preview: "Let me look at the proposal again this week.",
    notes: ["Proposal sent 9 days ago — $12k retainer."],
    messages: [
      { id: "m1", author: "ai", authorName: "AI Follow-up Employee", body: "Hi Bilal — checking in on the proposal we sent last week. Anything you'd like clarified?", timestamp: "09:20" },
      { id: "m2", author: "customer", authorName: "Bilal Ahmed", body: "Let me look at the proposal again this week.", timestamp: "11:02" },
    ],
  },
  {
    id: "cv5",
    customer: "Tom Whitaker",
    company: "Whitaker Software",
    email: "tom@whitaker.dev",
    channel: "form",
    employee: "sales",
    status: "open",
    unread: false,
    handledBy: "ai",
    updatedAt: "Yesterday",
    preview: "Do you support on-prem deployment?",
    notes: [],
    messages: [
      { id: "m1", author: "customer", authorName: "Tom Whitaker", body: "Do you support on-prem deployment?", timestamp: "17:28" },
      { id: "m2", author: "ai", authorName: "AI Sales Employee", body: "On-prem is available on Enterprise plans. I can arrange a short technical call to walk through the requirements — would that help?", timestamp: "17:29" },
    ],
  },
];

export const LEADS: Lead[] = [
  { id: "l1", name: "Nadia Rahman", company: "Rahman Studio", email: "nadia@rahmanstudio.com", source: "chat", status: "meeting-booked", score: "hot", value: 18000, owner: "Sana K.", createdAt: "Today", notes: "Budget confirmed, decision maker engaged." },
  { id: "l2", name: "Tom Whitaker", company: "Whitaker Software", email: "tom@whitaker.dev", source: "form", status: "qualified", score: "warm", value: 32000, owner: "Unassigned", createdAt: "Yesterday", notes: "Needs on-prem — Enterprise conversation." },
  { id: "l3", name: "Laura Beck", company: "Beck Interiors", email: "laura@beckinteriors.com", source: "chat", status: "contacted", score: "warm", value: 9000, owner: "Ali R.", createdAt: "2 days ago", notes: "Requested custom pricing — escalated." },
  { id: "l4", name: "Imran Sethi", company: "Sethi Realty", email: "imran@sethirealty.pk", source: "whatsapp", status: "meeting-booked", score: "hot", value: 14500, owner: "Sana K.", createdAt: "2 days ago", notes: "Viewing scheduling is the main driver." },
  { id: "l5", name: "Grace Miller", company: "Miller Coaching", email: "grace@millercoaching.com", source: "email", status: "new", score: "cold", value: 4200, owner: "Unassigned", createdAt: "3 days ago", notes: "Solo coach, price sensitive." },
  { id: "l6", name: "Zara Khan", company: "Khan & Co", email: "zara@khanco.com", source: "chat", status: "qualified", score: "warm", value: 7600, owner: "Ali R.", createdAt: "4 days ago", notes: "Revisit in 30 days." },
  { id: "l7", name: "Hassan Raza", company: "Devforge", email: "hassan@devforge.io", source: "form", status: "lost", score: "cold", value: 11000, owner: "Ali R.", createdAt: "1 week ago", notes: "Went with an in-house build." },
];

export const CUSTOMERS: Customer[] = [
  {
    id: "c1", name: "Ayesha Malik", email: "ayesha@luxeliving.pk", company: "Luxe Living", lifetimeValue: 8420, orders: 14, status: "active", joinedAt: "Mar 2024", lastInteraction: "1 hr ago",
    history: [
      { id: "h1", type: "conversation", label: "Order status question resolved by AI Support", date: "Today" },
      { id: "h2", type: "order", label: "Order #48219 — $312", date: "3 days ago" },
      { id: "h3", type: "appointment", label: "Styling consultation", date: "2 weeks ago" },
    ],
  },
  {
    id: "c2", name: "Daniel Ortiz", email: "daniel.ortiz@mail.com", company: "—", lifetimeValue: 1290, orders: 4, status: "active", joinedAt: "Nov 2024", lastInteraction: "Today",
    history: [
      { id: "h1", type: "conversation", label: "Return initiated within policy", date: "Today" },
      { id: "h2", type: "order", label: "Order #48102 — $189", date: "1 week ago" },
    ],
  },
  {
    id: "c3", name: "Priya Nair", email: "priya.nair@gmail.com", company: "—", lifetimeValue: 3110, orders: 9, status: "at-risk", joinedAt: "Jan 2024", lastInteraction: "18 min ago",
    history: [
      { id: "h1", type: "conversation", label: "Complaint escalated to human support", date: "Today" },
      { id: "h2", type: "order", label: "Order #47788 — $402", date: "5 weeks ago" },
    ],
  },
  {
    id: "c4", name: "Hira Aslam", email: "hira@aslamhome.com", company: "Aslam Home", lifetimeValue: 640, orders: 2, status: "at-risk", joinedAt: "Feb 2026", lastInteraction: "Today",
    history: [
      { id: "h1", type: "conversation", label: "Cart recovery follow-up sent", date: "Today" },
    ],
  },
  {
    id: "c5", name: "Yusuf Karim", email: "yusuf@karimtrading.com", company: "Karim Trading", lifetimeValue: 15230, orders: 31, status: "active", joinedAt: "Jun 2023", lastInteraction: "Yesterday",
    history: [
      { id: "h1", type: "order", label: "Order #48260 — $1,120", date: "Yesterday" },
      { id: "h2", type: "conversation", label: "Follow-up sequence stopped — converted", date: "Yesterday" },
    ],
  },
];

export const APPOINTMENTS: Appointment[] = [
  { id: "ap1", title: "Discovery call", customer: "Nadia Rahman", date: "Thu, 13 Aug", time: "11:00", duration: "30 min", status: "confirmed", bookedBy: "AI Receptionist" },
  { id: "ap2", title: "Property viewing", customer: "Imran Sethi", date: "Thu, 13 Aug", time: "15:30", duration: "45 min", status: "confirmed", bookedBy: "AI Receptionist" },
  { id: "ap3", title: "Coaching intro session", customer: "Grace Miller", date: "Fri, 14 Aug", time: "09:00", duration: "30 min", status: "pending", bookedBy: "AI Receptionist" },
  { id: "ap4", title: "Technical deep dive", customer: "Tom Whitaker", date: "Fri, 14 Aug", time: "16:00", duration: "60 min", status: "confirmed", bookedBy: "Human" },
  { id: "ap5", title: "Onboarding walkthrough", customer: "Ayesha Malik", date: "Mon, 17 Aug", time: "10:30", duration: "45 min", status: "cancelled", bookedBy: "AI Receptionist" },
];

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  { id: "k1", name: "Shipping & Delivery FAQ", type: "FAQ", updatedAt: "Today", sync: "synced", usedBy: ["support", "sales"] },
  { id: "k2", name: "Returns Policy v4", type: "PDF", updatedAt: "Today", sync: "failed", usedBy: ["support"] },
  { id: "k3", name: "Pricing & Plans", type: "Webpage", updatedAt: "Yesterday", sync: "synced", usedBy: ["sales", "follow-up"] },
  { id: "k4", name: "Product Catalogue 2026", type: "Doc", updatedAt: "2 days ago", sync: "syncing", usedBy: ["sales", "support"] },
  { id: "k5", name: "Booking & Cancellation Rules", type: "Doc", updatedAt: "5 days ago", sync: "synced", usedBy: ["receptionist"] },
  { id: "k6", name: "Shipping FAQ (legacy)", type: "PDF", updatedAt: "3 weeks ago", sync: "failed", usedBy: ["support"] },
];

export const AUTOMATIONS: Automation[] = [
  { id: "au1", name: "Abandoned cart recovery", trigger: "Cart abandoned for 2 hours", action: "Start 3-step follow-up sequence", employee: "follow-up", active: true, runs: 412 },
  { id: "au2", name: "Hot lead alert", trigger: "Lead scored Hot", action: "Notify #sales on Slack", employee: "sales", active: true, runs: 128 },
  { id: "au3", name: "Refund escalation", trigger: "Refund above $120 requested", action: "Escalate to support team", employee: "support", active: true, runs: 63 },
  { id: "au4", name: "Appointment reminder", trigger: "24 hours before appointment", action: "Send WhatsApp reminder", employee: "receptionist", active: false, runs: 0 },
  { id: "au5", name: "Quiet lead nudge", trigger: "No reply for 5 days", action: "Send re-engagement email", employee: "follow-up", active: true, runs: 289 },
];

export const INTEGRATIONS: Integration[] = [
  { id: "i1", name: "WhatsApp Business", category: "Messaging", description: "Let AI Employees handle WhatsApp conversations.", connected: true, health: "healthy" },
  { id: "i2", name: "Gmail", category: "Email", description: "Send and receive customer email from your domain.", connected: true, health: "healthy" },
  { id: "i3", name: "Google Calendar", category: "Scheduling", description: "Real-time availability for the AI Receptionist.", connected: false, health: "disconnected" },
  { id: "i4", name: "Stripe", category: "Payments", description: "Order and payment context for support answers.", connected: true, health: "degraded" },
  { id: "i5", name: "Slack", category: "Notifications", description: "Alert your team when the AI escalates.", connected: true, health: "healthy" },
  { id: "i6", name: "Shopify", category: "E-commerce", description: "Order lookup, delivery status and cart events.", connected: true, health: "healthy" },
  { id: "i7", name: "HubSpot", category: "CRM", description: "Write qualification data back to your CRM.", connected: false, health: "disconnected" },
];

export const TEAM: TeamMember[] = [
  { id: "t1", name: "Ayesha Siddiqui", email: "ayesha@company.com", role: "Owner", status: "active" },
  { id: "t2", name: "Sana Khalid", email: "sana@company.com", role: "Sales", status: "active" },
  { id: "t3", name: "Ali Raza", email: "ali@company.com", role: "Support", status: "active" },
  { id: "t4", name: "Omar Farooq", email: "omar@company.com", role: "Viewer", status: "invited" },
];

export const ANALYTICS_SERIES = [
  { label: "Week 1", primary: 62, secondary: 41 },
  { label: "Week 2", primary: 78, secondary: 52 },
  { label: "Week 3", primary: 71, secondary: 49 },
  { label: "Week 4", primary: 94, secondary: 66 },
  { label: "Week 5", primary: 88, secondary: 61 },
  { label: "Week 6", primary: 108, secondary: 79 },
];

export const CHANNEL_VOLUME = [
  { label: "Chat", primary: 412, secondary: 318 },
  { label: "WhatsApp", primary: 288, secondary: 240 },
  { label: "Email", primary: 196, secondary: 151 },
  { label: "Forms", primary: 104, secondary: 88 },
];
