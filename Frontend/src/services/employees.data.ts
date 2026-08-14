import type { AIEmployeeConfig, EmployeeType } from "@/types";

const trend = (a: number[], b: number[]): { label: string; primary: number; secondary: number }[] =>
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({
    label,
    primary: a[i] ?? 0,
    secondary: b[i] ?? 0,
  }));

export const AI_EMPLOYEES: Record<EmployeeType, AIEmployeeConfig> = {
  sales: {
    type: "sales",
    name: "AI Sales Employee",
    role: "Lead qualification & meeting booking",
    purpose:
      "Respond to every incoming lead immediately, qualify it against your criteria, and move qualified leads to a booked meeting.",
    status: "active",
    lastActive: "2 minutes ago",
    keyStatLabel: "Leads qualified this week",
    keyStatValue: "128",
    responsibilities: [
      "Handle incoming leads from forms, chat and WhatsApp",
      "Ask qualification questions (budget, need, timeline, authority)",
      "Recommend the right next action for each lead",
      "Schedule meetings inside approved calendar availability",
      "Update owned CRM fields after every conversation",
      "Notify the sales team when a lead turns hot",
    ],
    workflow: [
      { title: "New Lead", description: "Lead arrives from a form, chat or WhatsApp thread." },
      { title: "Conversation", description: "Opens an on-brand conversation within seconds." },
      { title: "Qualification", description: "Asks budget, need, timeline and authority questions." },
      { title: "Lead Score", description: "Scores the lead Hot, Warm or Cold against your rules." },
      { title: "CRM Update", description: "Writes qualification data back to owned CRM fields." },
      { title: "Meeting Booking", description: "Books into approved calendar availability." },
      { title: "Follow-up Handoff", description: "Hands quiet leads to the AI Follow-up Employee." },
    ],
    canDo: [
      "Qualify leads against your configured criteria",
      "Answer standard pricing and pre-sales questions",
      "Book meetings within approved calendar availability",
      "Update the CRM fields it owns",
      "Notify the sales team of hot leads",
    ],
    cannotDo: [
      "Offer custom discounts outside approved ranges",
      "Make final sales commitments or agree contract terms",
      "Access data outside its permitted scope",
    ],
    escalateWhen: [
      "The lead asks to speak with a human representative",
      "Negotiation or custom pricing is requested",
      "Deal size exceeds the configured threshold",
      "Frustration or confusion remains unresolved",
    ],
    metrics: [
      { id: "conv", label: "Lead → meeting rate", value: "34.2%", trend: 5.1, hint: "vs. last week" },
      { id: "qual", label: "Avg. qualification time", value: "3m 12s", trend: -8.4, hint: "faster than last week" },
      { id: "resp", label: "Avg. response time", value: "11s", trend: -2.2, hint: "first reply to a new lead" },
      { id: "notify", label: "Notifications sent", value: "46", trend: 12.0, hint: "hot-lead alerts to sales" },
    ],
    trend: trend([18, 24, 21, 30, 28, 12, 9], [6, 9, 8, 12, 11, 4, 3]),
    trendLabels: { primary: "Leads qualified", secondary: "Meetings booked" },
    rateMetric: { label: "Lead-to-meeting conversion", value: 34 },
    configSections: [
      {
        id: "qualification",
        title: "Qualification questions",
        description: "The questions the AI Sales Employee asks before scoring a lead.",
        fields: [
          { id: "q1", label: "Budget question", kind: "text", value: "What budget range are you working with?", required: true },
          { id: "q2", label: "Timeline question", kind: "text", value: "When are you looking to get started?", required: true },
          { id: "q3", label: "Authority question", kind: "text", value: "Who else is involved in this decision?" },
          { id: "q4", label: "Auto-score leads", kind: "toggle", value: true, help: "Score Hot/Warm/Cold automatically after qualification." },
        ],
      },
      {
        id: "calendar",
        title: "Calendar availability rules",
        description: "When the AI Sales Employee may book meetings.",
        fields: [
          { id: "hours", label: "Booking window", kind: "time-range", value: "09:00 – 17:00" },
          { id: "buffer", label: "Buffer between meetings (min)", kind: "number", value: 15 },
          { id: "notice", label: "Minimum notice (hours)", kind: "number", value: 4 },
        ],
      },
      {
        id: "crm",
        title: "CRM field mapping",
        description: "Fields the AI Sales Employee is allowed to write to.",
        fields: [
          { id: "crm-system", label: "CRM system", kind: "select", options: ["HubSpot", "Pipedrive", "Salesforce"], value: "HubSpot" },
          { id: "crm-stage", label: "Stage on qualification", kind: "select", options: ["Qualified", "SQL", "Discovery"], value: "Qualified" },
          { id: "crm-owner", label: "Assign to owner", kind: "toggle", value: true },
        ],
      },
      {
        id: "escalation",
        title: "Escalation thresholds",
        description: "Editable thresholds that trigger a human handoff.",
        fields: [
          { id: "deal", label: "Escalate deals above (USD)", kind: "number", value: 25000 },
          { id: "tone", label: "Escalate on detected frustration", kind: "toggle", value: true },
        ],
      },
    ],
    activity: [
      { id: "a1", timestamp: "Today, 14:22", channel: "chat", summary: "Qualified Nadia Rahman as Hot — budget confirmed", outcome: "qualified", contact: "Nadia Rahman" },
      { id: "a2", timestamp: "Today, 13:04", channel: "whatsapp", summary: "Booked discovery call for Thursday 11:00", outcome: "booked", contact: "Imran Sethi" },
      { id: "a3", timestamp: "Today, 11:47", channel: "form", summary: "Escalated — custom pricing requested", outcome: "escalated", contact: "Laura Beck" },
      { id: "a4", timestamp: "Yesterday, 17:31", channel: "email", summary: "Answered pre-sales questions on integrations", outcome: "resolved", contact: "Tom Whitaker" },
      { id: "a5", timestamp: "Yesterday, 15:12", channel: "chat", summary: "Qualified Zara Khan as Warm — revisit in 30 days", outcome: "qualified", contact: "Zara Khan" },
    ],
  },

  support: {
    type: "support",
    name: "AI Customer Support Employee",
    role: "Instant, consistent issue resolution",
    purpose:
      "Resolve common support issues instantly and consistently, and escalate cleanly whenever policy requires a human.",
    status: "active",
    lastActive: "just now",
    keyStatLabel: "Resolution rate",
    keyStatValue: "82%",
    responsibilities: [
      "Answer FAQs grounded in your knowledge base",
      "Resolve account, product and service questions",
      "Track order and delivery status",
      "Handle complaints empathetically and on-brand",
      "Assist with returns and refunds within policy",
    ],
    workflow: [
      { title: "Customer Question", description: "Question arrives on any connected channel." },
      { title: "Knowledge Search", description: "Searches the knowledge base for grounded answers." },
      { title: "Response", description: "Replies on-brand with the policy-safe answer." },
      { title: "Action", description: "Looks up an order or initiates a return where allowed." },
      { title: "Resolution or Escalation", description: "Closes the issue or hands off with full context." },
    ],
    canDo: [
      "Answer questions covered by the knowledge base",
      "Look up order and delivery status",
      "Initiate returns and refunds within defined limits",
      "Log and tag complaints for review",
    ],
    cannotDo: [
      "Approve policy exceptions",
      "Make promises outside published policy",
      "Access sensitive payment details",
      "Close a disputed complaint as resolved",
    ],
    escalateWhen: [
      "The customer requests a human agent",
      "The issue is not covered by the knowledge base or policy",
      "A complaint needs a policy exception or goodwill gesture",
      "High frustration or escalation risk is detected",
    ],
    metrics: [
      { id: "res", label: "Resolution rate", value: "82%", trend: 3.4, hint: "resolved without a human" },
      { id: "csat", label: "CSAT", value: "4.6 / 5", trend: 1.8, hint: "from 214 responses" },
      { id: "speed", label: "Avg. response speed", value: "8s", trend: -14.0, hint: "first reply" },
      { id: "esc", label: "Escalation rate", value: "18%", trend: -3.4, hint: "handed to a human" },
    ],
    trend: trend([120, 142, 138, 156, 149, 88, 61], [22, 26, 24, 29, 27, 15, 11]),
    trendLabels: { primary: "Conversations handled", secondary: "Escalations" },
    rateMetric: { label: "Resolution rate", value: 82 },
    configSections: [
      {
        id: "knowledge",
        title: "Knowledge base linkage",
        description: "Sources this employee is grounded in.",
        fields: [
          { id: "sources", label: "Primary source collection", kind: "select", options: ["All published docs", "Support policies only", "Product FAQs"], value: "All published docs" },
          { id: "fallback", label: "Answer only from knowledge base", kind: "toggle", value: true, help: "Prevents unsupported answers." },
        ],
      },
      {
        id: "returns",
        title: "Return & complaint workflow",
        description: "Boundaries for refunds, returns and complaint handling.",
        fields: [
          { id: "refund", label: "Auto-approve refunds up to (USD)", kind: "number", value: 120 },
          { id: "window", label: "Return window (days)", kind: "number", value: 30 },
          { id: "tone", label: "Complaint tone", kind: "select", options: ["Empathetic", "Concise", "Formal"], value: "Empathetic" },
        ],
      },
      {
        id: "escalation",
        title: "Escalation trigger thresholds",
        description: "When support hands over to a human.",
        fields: [
          { id: "sentiment", label: "Escalate below sentiment score", kind: "number", value: 35 },
          { id: "turns", label: "Escalate after unresolved turns", kind: "number", value: 4 },
          { id: "hours", label: "Human coverage hours", kind: "time-range", value: "08:00 – 20:00" },
        ],
      },
    ],
    activity: [
      { id: "b1", timestamp: "Today, 15:02", channel: "chat", summary: "Resolved delivery delay question for order #48219", outcome: "resolved", contact: "Ayesha Malik" },
      { id: "b2", timestamp: "Today, 14:40", channel: "email", summary: "Initiated return within policy — size exchange", outcome: "resolved", contact: "Daniel Ortiz" },
      { id: "b3", timestamp: "Today, 12:18", channel: "whatsapp", summary: "Escalated — goodwill refund requested", outcome: "escalated", contact: "Priya Nair" },
      { id: "b4", timestamp: "Yesterday, 18:55", channel: "chat", summary: "Answered warranty coverage question", outcome: "resolved", contact: "Sofia Lindqvist" },
    ],
  },

  receptionist: {
    type: "receptionist",
    name: "AI Receptionist",
    role: "Always-on scheduling",
    purpose: "Manage scheduling end to end, always available, always inside your booking rules.",
    status: "needs-setup",
    lastActive: "never",
    keyStatLabel: "Appointments booked this week",
    keyStatValue: "0",
    responsibilities: [
      "Book appointments against real-time availability",
      "Manage the connected calendar",
      "Check availability before confirming anything",
      "Reschedule and cancel on request",
      "Send confirmations and reminders automatically",
    ],
    workflow: [
      { title: "Customer Request", description: "Someone asks for a time on any channel." },
      { title: "Availability Check", description: "Checks the connected calendar in real time." },
      { title: "Booking", description: "Books inside configured working hours and rules." },
      { title: "Confirmation", description: "Sends an instant confirmation with details." },
      { title: "Reminder", description: "Sends timed reminders to reduce no-shows." },
    ],
    canDo: [
      "Book inside configured working hours and rules",
      "Reschedule and cancel on customer request",
      "Send automatic confirmations and reminders",
      "Check and communicate real-time availability",
    ],
    cannotDo: [
      "Book outside approved hours or blocked time",
      "Override double-booking or capacity limits",
      "Modify appointment types or pricing",
      "Guarantee a specific staff member unless configured",
    ],
    escalateWhen: [
      "No suitable slot exists and the customer needs flexibility",
      "A booking-rule exception is requested",
      "Repeated rescheduling suggests a service issue",
      "The customer explicitly asks for a staff member",
    ],
    metrics: [
      { id: "book", label: "Bookings made", value: "0", trend: 0, hint: "connect a calendar to start" },
      { id: "noshow", label: "No-show reduction", value: "—", trend: 0, hint: "available after 30 bookings" },
      { id: "resp", label: "Avg. response time", value: "—", trend: 0, hint: "no activity yet" },
      { id: "rebook", label: "Rebooking rate", value: "—", trend: 0, hint: "no activity yet" },
    ],
    trend: trend([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]),
    trendLabels: { primary: "Bookings", secondary: "Reschedules" },
    rateMetric: { label: "Calendar coverage", value: 0 },
    configSections: [
      {
        id: "calendar",
        title: "Calendar integration",
        description: "Connect a calendar before this employee can go live.",
        fields: [
          { id: "provider", label: "Calendar provider", kind: "select", options: ["Not connected", "Google Calendar", "Outlook"], value: "Not connected", required: true },
          { id: "double", label: "Prevent double booking", kind: "toggle", value: true },
        ],
      },
      {
        id: "hours",
        title: "Working hours & availability",
        description: "The only window in which bookings may be made.",
        fields: [
          { id: "weekday", label: "Weekday hours", kind: "time-range", value: "09:00 – 18:00" },
          { id: "weekend", label: "Weekend bookings", kind: "toggle", value: false },
          { id: "slot", label: "Slot length (min)", kind: "number", value: 30 },
        ],
      },
      {
        id: "reminders",
        title: "Reminder templates",
        description: "What customers receive before an appointment.",
        fields: [
          { id: "lead", label: "Reminder lead time (hours)", kind: "number", value: 24 },
          { id: "template", label: "Reminder message", kind: "textarea", value: "Hi {{name}}, this is a reminder about your appointment on {{date}} at {{time}}." },
        ],
      },
    ],
    activity: [],
  },

  "follow-up": {
    type: "follow-up",
    name: "AI Follow-up Employee",
    role: "Re-engagement & recovery",
    purpose:
      "Keep leads, prospects and customers engaged at the right moments — without anyone manually tracking them.",
    status: "needs-attention",
    lastActive: "38 minutes ago",
    keyStatLabel: "Active follow-up sequences",
    keyStatValue: "7",
    responsibilities: [
      "Follow up with leads that went quiet",
      "Send proposal and quote reminders",
      "Re-engage inactive or at-risk customers",
      "Recover abandoned carts",
      "Run email and WhatsApp campaigns",
    ],
    workflow: [
      { title: "Event Trigger", description: "A cart is abandoned or a lead goes quiet." },
      { title: "Analyze Situation", description: "Reviews history, stage and prior messages." },
      { title: "Generate Message", description: "Writes a personalised, on-brand message." },
      { title: "Send", description: "Delivers on the customer's preferred channel." },
      { title: "Track Result", description: "Stops the sequence on reply or conversion." },
    ],
    canDo: [
      "Send follow-ups on configured triggers and timing",
      "Personalise using known customer context",
      "Run multi-step sequences within limits",
      "Stop a sequence on response or conversion",
    ],
    cannotDo: [
      "Exceed configured frequency or contact limits",
      "Contact opted-out customers",
      "Offer discounts that were not pre-approved",
      "Continue after an explicit stop request",
    ],
    escalateWhen: [
      "A complex out-of-scope question is asked",
      "The customer expresses frustration about being contacted",
      "A high-value deal shows renewed interest",
    ],
    metrics: [
      { id: "reply", label: "Reply rate", value: "27.5%", trend: 4.2, hint: "across all sequences" },
      { id: "recovery", label: "Cart recovery rate", value: "19.1%", trend: -1.6, hint: "vs. last week" },
      { id: "revenue", label: "Revenue recovered", value: "$18,420", trend: 9.8, hint: "last 7 days" },
      { id: "seq", label: "Active sequences", value: "7", trend: 0, hint: "2 paused for review" },
    ],
    trend: trend([320, 410, 388, 452, 431, 210, 160], [88, 104, 96, 121, 118, 52, 41]),
    trendLabels: { primary: "Messages sent", secondary: "Replies" },
    rateMetric: { label: "Reply rate", value: 28 },
    configSections: [
      {
        id: "sequence",
        title: "Sequence builder",
        description: "Steps, timing and channel for each follow-up sequence.",
        fields: [
          { id: "steps", label: "Steps per sequence", kind: "number", value: 3 },
          { id: "gap", label: "Gap between steps (days)", kind: "number", value: 2 },
          { id: "channel", label: "Primary channel", kind: "select", options: ["Email", "WhatsApp", "Email then WhatsApp"], value: "Email then WhatsApp" },
        ],
      },
      {
        id: "triggers",
        title: "Trigger events",
        description: "What starts a follow-up sequence.",
        fields: [
          { id: "cart", label: "Abandoned cart", kind: "toggle", value: true },
          { id: "quiet", label: "Lead quiet for (days)", kind: "number", value: 5 },
          { id: "proposal", label: "Proposal reminder", kind: "toggle", value: true },
        ],
      },
      {
        id: "limits",
        title: "Contact limits",
        description: "Hard guardrails on outbound frequency.",
        fields: [
          { id: "max", label: "Max messages per customer / month", kind: "number", value: 6 },
          { id: "window", label: "Sending window", kind: "time-range", value: "09:00 – 19:00" },
          { id: "optout", label: "Respect opt-out instantly", kind: "toggle", value: true },
        ],
      },
    ],
    activity: [
      { id: "c1", timestamp: "Today, 14:58", channel: "email", summary: "Cart recovery step 2 sent — $240 basket", outcome: "sent", contact: "Hira Aslam" },
      { id: "c2", timestamp: "Today, 12:11", channel: "whatsapp", summary: "Proposal reminder sent to Bilal Ahmed", outcome: "sent", contact: "Bilal Ahmed" },
      { id: "c3", timestamp: "Today, 09:36", channel: "email", summary: "Escalated — renewed interest on $40k deal", outcome: "escalated", contact: "Grace Miller" },
      { id: "c4", timestamp: "Yesterday, 16:02", channel: "email", summary: "Sequence stopped — customer converted", outcome: "resolved", contact: "Yusuf Karim" },
    ],
  },
};

export const EMPLOYEE_ORDER: EmployeeType[] = ["sales", "support", "receptionist", "follow-up"];
