# Trevolk AI Workforce — Database Design

**Document Type:** Database Architecture & Design Specification
**Source of Truth:** Trevolk AI Workforce PRD (Sections 1–5)
**Reference:** Frontend Development Specification, Backend Development Specification
**Audience:** Backend developers, database engineers, AI coding tools
**Scope:** Database planning and architecture only — no SQL, no Prisma models, no migrations

---

## Table of Contents

1. Database Overview
2. Database Design Principles
3. High-Level Data Model
4. Entity Relationships
5. Core Table Definitions
6. Multi-Tenant Architecture
7. AI Employee Data Storage
8. Conversation & Customer Data Model
9. Knowledge Base Storage
10. Integration Data
11. Performance Strategy
12. Security & Data Integrity
13. Future Expansion

---

## 1. Database Overview

### 1.1 Purpose of the Database

The database is the single system of record for Trevolk AI Workforce. Per the Backend Specification, it is the only layer that persists data, and it is touched exclusively through the Database Layer (Prisma) — no other backend layer, and never the frontend, reads or writes to it directly. Everything the platform depends on lives here: which businesses exist, which AI Employees they've activated, every conversation an AI Employee or human has had, every lead, customer, appointment, and piece of knowledge base content, plus the configuration and audit trail that make AI actions explainable.

Concretely, the database must support three things simultaneously:

- **Operational correctness** — every AI Employee action (a booked appointment, a qualified lead, a CRM update) must be persisted reliably and consistently, since these are real business outcomes, not disposable chat logs.
- **Multi-tenant isolation** — dozens or eventually thousands of businesses share the same schema and infrastructure, and one workspace must never be able to read or affect another's data.
- **Trust and auditability** — the PRD's "trust through transparency" principle means the database must be able to answer "what did this AI Employee do, and why" after the fact, not just "what is true right now."

### 1.2 Why PostgreSQL

PostgreSQL is the right fit for Trevolk for reasons that map directly to the product, not just general popularity:

- **Strong relational integrity.** The core entities — Businesses, Workspaces, AI Employees, Customers, Leads, Conversations, Appointments — are deeply interrelated (a Lead becomes a Customer, an Appointment belongs to a Customer and is created by an AI Employee, a Conversation spans multiple Messages). Foreign keys and constraints let the database itself enforce these relationships, rather than relying on application code alone.
- **ACID transactions.** Actions like "qualify a lead and update the CRM record" or "book an appointment and mark the time slot unavailable" must succeed or fail as a unit. PostgreSQL's transactional guarantees prevent partial writes that would leave the platform's data (and the business's trust in it) in an inconsistent state.
- **Mature JSON support.** AI Employee configuration, prompt parameters, and flexible knowledge base content don't always fit a rigid column-per-field model. PostgreSQL's `jsonb` type allows semi-structured data (e.g., an employee's business rules, a lead's qualification answers) to live alongside strictly relational data, without needing a second database engine.
- **Proven multi-tenant SaaS fit.** Row-level, workspace-scoped multi-tenancy on a single PostgreSQL instance is a well-established pattern (used by comparable SaaS platforms) that balances operational simplicity against tenant isolation — appropriate for an MVP-stage team without the overhead of per-tenant databases.
- **Ecosystem alignment.** PostgreSQL is the database explicitly specified in the PRD's technical architecture and is fully supported by Prisma, the ORM already chosen for the backend, ensuring schema, migrations, and type generation stay tightly coupled.
- **Extensibility path.** Future needs — full-text search on knowledge base content, a `pgvector` extension for semantic memory — are native or near-native extensions to PostgreSQL, avoiding a second data store until it's genuinely justified.

### 1.3 Why a Relational Database Fits This Platform

Trevolk is not a document-per-user or event-stream-first product — it is a structured operations platform where entities have well-defined relationships and where correctness matters more than schema flexibility. A lead must belong to exactly one workspace and (once converted) link to exactly one customer. An appointment must reference a real customer and a real AI Employee. A conversation's messages must stay strictly ordered and attributable. These are exactly the guarantees a relational model is built to enforce. A NoSQL/document store would push this integrity logic into application code, increasing the risk of the very inconsistencies the PRD explicitly warns against ("AI actions are always visible and explainable").

### 1.4 Supporting Multiple Businesses (Multi-Tenancy)

Trevolk uses a **shared database, shared schema, workspace-scoped rows** model:

- All tenants (businesses) share one PostgreSQL database and one set of tables.
- Every tenant-owned table carries a `workspace_id` foreign key.
- Every query — without exception — is scoped by `workspace_id`, enforced at the Database/service layer (per the Backend Specification's rule that all Prisma queries include `workspaceId`).
- This model is simpler to operate and far cheaper than per-tenant databases at MVP scale, while still giving strict logical isolation between businesses.

Section 6 covers this in depth.

---

## 2. Database Design Principles

The schema follows a small set of consistent principles so the database stays predictable as more AI Employees, integrations, and features are added.

### 2.1 Normalization

Core entities are normalized to at least Third Normal Form (3NF) to avoid duplicated, drift-prone data — e.g., customer contact details are stored once on the `Customer` record and referenced by `Conversations`, `Leads`, and `Appointments`, not copied into each. Controlled denormalization is acceptable in specific, justified cases (see 2.7) where read performance matters more than strict normalization — for example, caching a `lastMessageAt` timestamp on `Conversation` to avoid re-aggregating messages on every inbox load.

### 2.2 Data Consistency

- Foreign key constraints are enforced at the database level, not only in application code, so referential integrity holds even if a bug bypasses a service function.
- Status fields (lead status, appointment status, AI Employee status, integration connection status) use constrained enumerations rather than free-text strings, preventing invalid states from ever being persisted.
- Cross-entity actions that must succeed or fail together (e.g., lead qualification + CRM field update) are wrapped in database transactions at the service layer.

### 2.3 Scalability

- Every tenant-scoped table is indexed on `workspace_id` (and typically `workspace_id` + a secondary sort column, such as `created_at`) from day one, since almost every query in the system filters by workspace first.
- High-volume tables (Messages, Analytics Events, Activity Logs) are designed with future partitioning or archiving in mind (Section 11), even if partitioning isn't implemented at MVP scale.
- The schema avoids designs that would require a full-table rewrite to scale — e.g., using a proper `Message` table rather than storing conversation history as a single JSON blob on `Conversation`.

### 2.4 Maintainability

- One AI Employee "type" is represented as data (a value on the `AIEmployee` entity), not as a separate table per employee type. Adding a fifth or sixth AI Employee type (HR, Marketing, etc., per PRD Section 3.8) is a data change, not a schema change — directly mirroring the backend's "configuration, not new engine" principle.
- Shared concerns (status, timestamps, soft-delete flags, workspace scoping) follow the same field naming and behavior across every table, so engineers and AI coding tools can predict a table's shape without reading its full definition.
- Configuration that changes frequently (employee business rules, prompt parameters, qualification criteria) is stored as structured JSON on a dedicated configuration field/table rather than as rigid columns, so behavior can be tuned without a migration.

### 2.5 Soft Deletes

Most tenant-owned entities (Customers, Leads, Conversations, Appointments, Knowledge Base entries, AI Employees) use a soft-delete pattern (`deleted_at` timestamp, nullable) rather than hard deletes:

- Preserves historical/audit data (a deleted lead's conversation history should still be reconstructable for support or compliance purposes).
- Prevents accidental, unrecoverable data loss from a bad request or bug.
- Keeps foreign key relationships intact even if a parent record is "removed" from the UI.

Hard deletes are reserved for genuinely transient or non-business-critical data (e.g., expired sessions, stale notification records) and for explicit data-deletion/privacy requests, which are handled as a deliberate, logged operation rather than routine soft-delete cleanup.

### 2.6 Auditability

Per the PRD's "trust through transparency" requirement, the database is designed so any AI action can be explained after the fact:

- An **Activity Log** entity records significant actions (who/what performed it — a specific AI Employee or a human user — what changed, and when) across Conversations, Leads, Appointments, and AI Employee configuration changes.
- Key entities carry `created_at`, `updated_at`, and, where relevant, `created_by` / `performed_by` references so every record's provenance is traceable.
- AI-generated actions (a booked appointment, a CRM update, a sent follow-up) are always attributable to the specific `AIEmployee` instance that performed them, not just "the system."

### 2.7 Performance Considerations

- Indexes are planned around actual query patterns from the Frontend Specification (filtered conversation lists, kanban-style lead boards, paginated activity history) rather than indexing every column indiscriminately.
- Read-heavy, rarely-changing data (e.g., aggregated analytics) is separated conceptually from write-heavy operational data (e.g., live conversations), so future read replicas or caching can target the right tables.
- Pagination is a first-class assumption for every list-producing table (Messages, Conversations, Leads, Activity Logs) — the schema avoids patterns (like unbounded JSON arrays of history) that would make pagination impossible later.

---

## 3. High-Level Data Model

The platform's data model is organized around a central tenancy hierarchy — **Business → Workspace → everything else** — with AI Employees, Conversations, Customers, and Leads as the operational core, and Knowledge Base and Integrations as supporting data that AI Employees draw on to do their work.

| Entity | Purpose |
|---|---|
| **User** | A person who can log in — a business owner, admin, or team member. Can belong to more than one workspace. |
| **Business** | The top-level account/organization that owns one or more workspaces and holds the subscription/billing relationship. |
| **Workspace** | The tenant boundary. Represents a single business's operating environment; almost every other entity is scoped to a workspace. |
| **WorkspaceMember** | Join entity linking a User to a Workspace with a specific role (Owner, Admin, Team Member). |
| **AIEmployee** | An activated instance of an AI Employee type (Sales, Support, Receptionist, Follow-up) within a workspace, holding its configuration and status. |
| **Customer** | An end customer of the business — the central record referenced by conversations, leads, and appointments. |
| **Lead** | A prospective customer captured and qualified by the AI Sales Employee, tracked through a pipeline. |
| **Conversation** | A message thread between an AI Employee (or human) and a customer/lead, on a specific channel. |
| **Message** | An individual message within a conversation, attributable to the AI Employee, the customer, or a human team member. |
| **Appointment** | A scheduled meeting managed by the AI Receptionist, linked to a customer/lead and (optionally) a calendar integration. |
| **KnowledgeBaseEntry** | A single unit of business knowledge (FAQ, policy, product info) an AI Employee can draw on. |
| **Document** | An uploaded file (PDF, doc, etc.) backing one or more knowledge base entries. |
| **Integration** | A connected external service (WhatsApp, Gmail, Google Calendar, Stripe, Slack, Shopify, HubSpot) for a workspace, with encrypted credentials and connection status. |
| **Notification** | A dashboard/email notification generated for a user (new lead, escalation, appointment conflict). |
| **ActivityLog** | An auditable record of a significant action taken by an AI Employee or a human user. |
| **AnalyticsEvent / AnalyticsSnapshot** | Event-level and aggregated data powering the dashboard's performance and outcome metrics. |
| **FollowUpSequence** | A configured, multi-step follow-up campaign run by the AI Follow-up Employee. |
| **Subscription / Plan** | The billing plan a business is on and the entitlements (active employee count, usage limits) it grants. *(MVP-light; detailed in Section 13.)* |

---

## 4. Entity Relationships

Relationships below describe cardinality (One-to-One, One-to-Many, Many-to-Many) and are grouped by area of the product.

### 4.1 Tenancy & Access

- **Business → Workspace**: One-to-Many. A Business can operate one or more Workspaces; at MVP scale most businesses have exactly one Workspace, but the model supports more (per PRD's future "multiple workspaces per business/agency" direction).
- **User → Workspace** (via **WorkspaceMember**): Many-to-Many. A single User (e.g., an agency operator) can belong to multiple Workspaces, and a Workspace has multiple Users, each with a specific role.
- **WorkspaceMember → Role**: Each WorkspaceMember row carries one role (Owner, Admin, Team Member) — modeled as an enum on the join entity rather than a separate join table, since MVP roles are fixed and simple.

### 4.2 AI Employees

- **Workspace → AIEmployee**: One-to-Many. A Workspace can activate up to four AI Employee instances at MVP (Sales, Support, Receptionist, Follow-up), each a distinct row with its own configuration and status.
- **AIEmployee → Conversation**: One-to-Many. An AI Employee instance participates in many conversations over time.
- **AIEmployee → Lead**: One-to-Many. Leads are typically created/owned by the AI Sales Employee instance that qualified them.
- **AIEmployee → Appointment**: One-to-Many. Appointments are typically created by the AI Receptionist instance.
- **AIEmployee → FollowUpSequence**: One-to-Many. Follow-up campaigns are run by the AI Follow-up Employee instance.
- **AIEmployee → ActivityLog**: One-to-Many. Every significant action an employee takes produces an activity log row.

### 4.3 Customers, Leads & Conversations

- **Workspace → Customer**: One-to-Many. Customers belong to exactly one workspace (a customer of Business A is a distinct record from a customer of Business B, even with the same email).
- **Customer → Lead**: One-to-One (optional). A Lead may or may not yet be a full Customer record; once qualified/converted, a Lead links to a Customer. Some leads never convert and remain lead-only.
- **Customer → Conversation**: One-to-Many. A customer can have many conversations over time, across channels and AI Employees.
- **Conversation → Message**: One-to-Many. A conversation contains an ordered sequence of messages.
- **Customer → Appointment**: One-to-Many. A customer can have multiple past/future appointments.
- **Lead → Conversation**: One-to-Many (optional, pre-conversion). Early-stage conversations may be linked directly to a Lead before a Customer record exists.

### 4.4 Knowledge Base

- **Workspace → KnowledgeBaseEntry**: One-to-Many. Each workspace maintains its own set of FAQs, policies, and reference content.
- **KnowledgeBaseEntry → Document**: One-to-One or One-to-Many (a KB entry may be backed by an uploaded document, or be pure text; a Document may back multiple derived KB entries, e.g., a policy PDF split into several FAQ-style entries).
- **AIEmployee ↔ KnowledgeBaseEntry**: Many-to-Many (conceptual, via retrieval at query time rather than a hard join table at MVP) — any AI Employee in the workspace can draw on any relevant KB entry; scoping which entries are relevant to which employee type is a retrieval-time/business-logic concern, not a strict relational constraint.

### 4.5 Integrations

- **Workspace → Integration**: One-to-Many. A workspace can connect multiple external services (WhatsApp, Gmail, Calendar, Stripe, etc.), each represented as one Integration row per service type.
- **Integration → Appointment**: One-to-Many (optional). Appointments created through a connected calendar reference the Integration used.
- **Integration → Conversation**: One-to-Many (optional). Conversations originating from a channel integration (WhatsApp) reference that Integration/channel.

### 4.6 Notifications & Analytics

- **User → Notification**: One-to-Many. Notifications are generated per user, scoped to their workspace(s).
- **Workspace → AnalyticsEvent**: One-to-Many. Every trackable event (message sent, lead qualified, appointment booked) can emit an analytics event.
- **AnalyticsSnapshot → Workspace / AIEmployee**: Many-to-One each. Aggregated snapshots roll up to a workspace and, where relevant, to a specific AI Employee, for dashboard charts.

### 4.7 Billing (MVP-light)

- **Business → Subscription**: One-to-One (at MVP). A Business has one active subscription determining its Plan and entitlements.
- **Subscription → Plan**: Many-to-One. Many subscriptions can reference the same Plan definition (Starter, Growth, Enterprise).

---

## 5. Core Table Definitions

Only the fields material to relationships, business logic, or frontend requirements are listed. Each table also implicitly carries `id` (primary key), `created_at`, `updated_at`, and, where applicable per Section 2.5, `deleted_at`.

### 5.1 User
- **Purpose**: A person who can authenticate into the platform.
- **Key fields**: `email`, `name`, `auth_provider_id` (reference to the Clerk/Supabase identity), `avatar_url`.
- **Primary Key**: `id`
- **Relationships**: Many-to-Many with Workspace via WorkspaceMember; One-to-Many to Notification.

### 5.2 Business
- **Purpose**: The top-level account entity that owns billing and one or more workspaces.
- **Key fields**: `name`, `owner_user_id`, `industry`.
- **Primary Key**: `id`
- **Foreign Keys**: `owner_user_id` → User
- **Relationships**: One-to-Many to Workspace; One-to-One to Subscription (MVP).

### 5.3 Workspace
- **Purpose**: The tenant boundary — represents one operating business environment. Nearly every other table scopes to this.
- **Key fields**: `business_id`, `name`, `industry`, `branding` (jsonb: logo, colors, disclosure preference), `default_working_hours`, `timezone`.
- **Primary Key**: `id`
- **Foreign Keys**: `business_id` → Business
- **Relationships**: One-to-Many to WorkspaceMember, AIEmployee, Customer, Lead, Conversation, Appointment, KnowledgeBaseEntry, Integration, AnalyticsEvent.

### 5.4 WorkspaceMember
- **Purpose**: Join entity granting a User access to a Workspace with a role.
- **Key fields**: `user_id`, `workspace_id`, `role` (enum: Owner, Admin, TeamMember), `invited_at`, `accepted_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `user_id` → User, `workspace_id` → Workspace
- **Constraints**: Unique on (`user_id`, `workspace_id`).

### 5.5 AIEmployee
- **Purpose**: One activated AI Employee instance within a workspace.
- **Key fields**: `workspace_id`, `employee_type` (enum: Sales, Support, Receptionist, FollowUp), `status` (enum: Active, Paused, NeedsSetup, NeedsAttention), `configuration` (jsonb — business rules, tone, working hours, escalation thresholds, qualification criteria, etc., per employee type), `last_active_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace
- **Relationships**: One-to-Many to Conversation, Lead, Appointment, FollowUpSequence, ActivityLog.
- **Constraints**: Unique on (`workspace_id`, `employee_type`) — one instance of each type per workspace at MVP.

### 5.6 Customer
- **Purpose**: The central end-customer record referenced across support, sales, and scheduling.
- **Key fields**: `workspace_id`, `name`, `email`, `phone`, `source_channel`, `first_contact_at`, `tags` (array/jsonb).
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace
- **Relationships**: One-to-Many to Conversation, Appointment; One-to-One (optional) to Lead.

### 5.7 Lead
- **Purpose**: A prospective customer captured and qualified by the AI Sales Employee, tracked through the pipeline.
- **Key fields**: `workspace_id`, `ai_employee_id`, `customer_id` (nullable until conversion), `status` (enum: New, Qualifying, Qualified, MeetingBooked, Lost, Won), `score` (enum: Hot, Warm, Cold), `qualification_answers` (jsonb), `source`, `assigned_user_id` (nullable — human sales rep assignment).
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `ai_employee_id` → AIEmployee, `customer_id` → Customer (nullable), `assigned_user_id` → User (nullable)

### 5.8 Conversation
- **Purpose**: A message thread between an AI Employee/human and a customer/lead, on a specific channel.
- **Key fields**: `workspace_id`, `customer_id` (nullable pre-conversion), `lead_id` (nullable), `ai_employee_id` (nullable if fully human-handled), `channel` (enum: WebChat, WhatsApp, Email), `status` (enum: Open, Escalated, Resolved, Closed), `assigned_user_id` (nullable — human handling it), `last_message_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `customer_id` → Customer (nullable), `lead_id` → Lead (nullable), `ai_employee_id` → AIEmployee (nullable), `assigned_user_id` → User (nullable)

### 5.9 Message
- **Purpose**: An individual message within a conversation.
- **Key fields**: `conversation_id`, `sender_type` (enum: AIEmployee, Customer, HumanTeamMember), `sender_id` (polymorphic reference resolved by `sender_type`), `content`, `is_internal_note` (boolean), `sent_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `conversation_id` → Conversation

### 5.10 Appointment
- **Purpose**: A scheduled meeting managed by the AI Receptionist.
- **Key fields**: `workspace_id`, `customer_id`, `lead_id` (nullable), `ai_employee_id`, `integration_id` (nullable — connected calendar used), `start_time`, `end_time`, `status` (enum: Scheduled, Rescheduled, Cancelled, Completed, NoShow), `reminder_sent_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `customer_id` → Customer, `lead_id` → Lead (nullable), `ai_employee_id` → AIEmployee, `integration_id` → Integration (nullable)

### 5.11 KnowledgeBaseEntry
- **Purpose**: A single unit of business knowledge AI Employees draw on to answer questions.
- **Key fields**: `workspace_id`, `type` (enum: FAQ, Policy, ProductInfo, General), `title`, `content` (text), `document_id` (nullable — source document), `sync_status` (enum: Synced, Syncing, Failed), `is_active`.
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `document_id` → Document (nullable)

### 5.12 Document
- **Purpose**: An uploaded file backing one or more knowledge base entries.
- **Key fields**: `workspace_id`, `file_name`, `file_url` (object storage reference), `file_type`, `uploaded_by_user_id`, `processing_status` (enum: Pending, Processed, Failed).
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `uploaded_by_user_id` → User

### 5.13 Integration
- **Purpose**: A connected external service for a workspace.
- **Key fields**: `workspace_id`, `provider` (enum: WhatsApp, Gmail, GoogleCalendar, Stripe, Slack, Shopify, HubSpot), `status` (enum: Connected, Disconnected, Error), `credentials_encrypted` (encrypted blob, never exposed to frontend), `connected_by_user_id`, `last_synced_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `connected_by_user_id` → User
- **Constraints**: Unique on (`workspace_id`, `provider`) — one connection per provider per workspace at MVP.

### 5.14 Notification
- **Purpose**: A dashboard/email notification for a user.
- **Key fields**: `workspace_id`, `user_id`, `type` (enum: NewLead, Escalation, AppointmentConflict, SystemAlert), `payload` (jsonb — reference IDs, message), `read_at` (nullable), `sent_via` (enum: InApp, Email, Both).
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `user_id` → User

### 5.15 ActivityLog
- **Purpose**: Auditable record of a significant action, satisfying the PRD's "trust through transparency" requirement.
- **Key fields**: `workspace_id`, `actor_type` (enum: AIEmployee, User, System), `actor_id`, `action` (e.g., `lead.qualified`, `appointment.booked`, `employee.config_updated`), `entity_type`, `entity_id`, `metadata` (jsonb — before/after values, reasoning summary).
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace

### 5.16 FollowUpSequence
- **Purpose**: A configured, multi-step follow-up campaign run by the AI Follow-up Employee.
- **Key fields**: `workspace_id`, `ai_employee_id`, `customer_id` or `lead_id`, `trigger_type` (enum: NoResponse, AbandonedCart, UnpaidProposal, Manual), `status` (enum: Active, Paused, Completed, StoppedByCustomer), `current_step`, `next_run_at`.
- **Primary Key**: `id`
- **Foreign Keys**: `workspace_id` → Workspace, `ai_employee_id` → AIEmployee, `customer_id` → Customer (nullable), `lead_id` → Lead (nullable)

### 5.17 AnalyticsEvent / AnalyticsSnapshot
- **Purpose**: Event-level (`AnalyticsEvent`) and pre-aggregated (`AnalyticsSnapshot`) data powering dashboard metrics.
- **Key fields (Event)**: `workspace_id`, `ai_employee_id` (nullable), `event_type` (e.g., `message_sent`, `lead_qualified`, `appointment_booked`), `occurred_at`, `metadata` (jsonb).
- **Key fields (Snapshot)**: `workspace_id`, `ai_employee_id` (nullable), `period` (day/week/month), `metric_type`, `value`.
- **Primary Key**: `id` (each)
- **Foreign Keys**: `workspace_id` → Workspace, `ai_employee_id` → AIEmployee (nullable)

### 5.18 Subscription & Plan (MVP-light)
- **Purpose**: Tracks the business's billing plan and entitlements.
- **Key fields (Subscription)**: `business_id`, `plan_id`, `status` (enum: Trialing, Active, PastDue, Cancelled), `current_period_end`, `stripe_customer_id`, `stripe_subscription_id`.
- **Key fields (Plan)**: `name` (Starter, Growth, Enterprise), `max_active_employees`, `max_monthly_conversations`, `price`.
- **Primary Key**: `id` (each)
- **Foreign Keys**: `business_id` → Business, `plan_id` → Plan

---

## 6. Multi-Tenant Architecture

### 6.1 Shared Database, Workspace-Scoped Rows

Trevolk uses a single PostgreSQL database shared by all tenants, with logical isolation enforced through a `workspace_id` column present on every tenant-owned table (Customer, Lead, Conversation, Message [via its parent Conversation], Appointment, KnowledgeBaseEntry, Document, Integration, Notification, ActivityLog, AnalyticsEvent, AIEmployee). This matches both the PRD's technical architecture and the Backend Specification's explicit rule that "every Prisma query includes `workspaceId`."

This model is preferred over per-tenant databases or schemas at MVP stage because:
- It is dramatically simpler to operate, migrate, and back up with a small team.
- It allows shared indexes and query planning across the whole dataset, which is more efficient at low-to-moderate scale than managing dozens/hundreds of separate schemas.
- It leaves a clear upgrade path: a specific high-volume or high-sensitivity tenant can later be migrated to dedicated infrastructure without changing the data model itself, since the workspace boundary is already explicit.

### 6.2 Workspace Isolation

- **Application-level enforcement**: Every service function that reads or writes tenant data requires a `workspaceId` parameter, resolved from the authenticated request (per the Backend Specification's Authentication Layer) before any query executes.
- **Database-level enforcement**: Foreign keys tie every tenant-owned row back to a `Workspace`, so it is structurally impossible to create an orphaned or cross-tenant-referencing record. Composite indexes lead with `workspace_id`, making workspace-scoped queries both correct and fast by default.
- **Defense in depth**: Because isolation is enforced at both the service layer and the schema/query layer, a bug in one layer (e.g., a missing `workspaceId` filter in one query) does not automatically result in cross-tenant data exposure, satisfying the PRD's security requirement that isolation not depend solely on the UI or a single code path.

### 6.3 Data Ownership

- A **Business** is the ultimate owner of its data and billing relationship.
- A **Workspace** is the operational owner of day-to-day data (customers, conversations, leads).
- Individual **Users** never "own" workspace data personally — they act on behalf of a workspace within their granted role, meaning offboarding a team member never risks losing business data.

### 6.4 Security Boundaries

- No table, view, or query is designed to span multiple workspaces except platform-internal reporting (e.g., aggregate usage across all tenants for Anthropic-style internal ops dashboards, which is explicitly outside the tenant-facing API surface).
- Integration credentials, though stored in the same shared database, are additionally encrypted at rest (Section 12) so that even a workspace-scoping bug could not expose a usable credential.
- Role-based access control (Owner/Admin/Team Member) is layered on top of workspace scoping: a Team Member's queries are further restricted to the modules relevant to their role (e.g., Conversations and Leads, not Billing or Integrations), per the Frontend and Backend Specifications.

---

## 7. AI Employee Data Storage

AI Employees are the product's core differentiator, and the database models each one as **a configured instance of a shared concept**, not a bespoke entity per type — directly mirroring the "one platform, many agents" architecture from the PRD and Backend Specification.

### 7.1 Employee Configuration

Each row in `AIEmployee` represents one activated employee within one workspace. The `employee_type` field determines which behavior/prompt template the AI Agent Engine applies, while the `configuration` jsonb field holds everything tunable without a schema change:
- Business rules (working hours, escalation thresholds, qualification criteria, tone of voice)
- Employee-specific settings (e.g., Sales: qualification questions and CRM field mapping; Receptionist: reminder timing; Follow-up: sequence timing and channel preference)

This keeps the schema stable as employee behavior is iterated on post-launch, and keeps adding a new employee type (HR, Marketing, etc.) a matter of a new `employee_type` enum value and configuration shape, not a new table.

### 7.2 Status

The `status` field (`Active`, `Paused`, `NeedsSetup`, `NeedsAttention`) is the single source of truth for every status badge shown across Dashboard Home, the AI Employees index, and each employee's detail page (per the Frontend Specification's shared status badge component). Status transitions are written through the AI Employee service and logged to `ActivityLog` so status changes are themselves auditable (e.g., "why did this employee move to Needs Attention?").

### 7.3 Memory References

Per the Backend Specification's two-tier MVP memory model, the database does not store a separate "memory" entity — memory is derived from existing relational data:
- **Conversation-level memory** = the ordered `Message` rows for a given `Conversation`, queried by `conversation_id`.
- **Workspace-level context** = the workspace's `KnowledgeBaseEntry` records, the `Customer` record's history (linked Conversations, Leads, Appointments), and the `AIEmployee.configuration` business rules.

This avoids a premature, separate "memory store" and keeps memory queryable, auditable, and consistent with the rest of the relational model. A vector database for long-term semantic recall is explicitly deferred (Section 13) and would sit alongside, not replace, this structure.

### 7.4 Conversation References

Every `Conversation` and `Message` created by an AI Employee carries `ai_employee_id`, so the full interaction history for a given employee instance is a straightforward, indexed query — this backs the "Activity History" tab on every AI Employee detail screen described in the Frontend Specification.

### 7.5 Performance Metrics

Rather than computing every metric live from raw tables on each dashboard load, two complementary storage strategies are used:
- **AnalyticsEvent** rows are written as things happen (a message sent, a lead qualified, an appointment booked), each tagged with `ai_employee_id` where relevant.
- **AnalyticsSnapshot** rows are periodically aggregated (e.g., nightly or on-demand) into pre-computed values (resolution rate, conversion rate, response time) keyed by `workspace_id` + `ai_employee_id` + `period`, so the Performance tab and Analytics dashboard load quickly without recomputation on every request.

---

## 8. Conversation & Customer Data Model

### 8.1 Conversation Lifecycle

A conversation moves through a defined set of states, stored on `Conversation.status`:

1. **Open** — actively being handled, by an AI Employee, a human, or both.
2. **Escalated** — the AI Employee has handed off to a human per its escalation rules (PRD Section 3); `assigned_user_id` is set.
3. **Resolved** — the underlying issue/request is complete.
4. **Closed** — the thread is archived (either resolved or abandoned by the customer).

Every transition, especially AI-to-human handoffs, is written to `ActivityLog` so the "why was this escalated" question (a first-class UX requirement per the Frontend Specification) is always answerable, and so the Frontend's escalation flags and AI/human indicators have a reliable source of truth.

### 8.2 Messages

Messages are stored as individual rows, never as a blob on the conversation, so that:
- The unified inbox can paginate/virtualize long histories (per the Frontend Specification's performance guidance).
- Each message is independently attributable (`sender_type` + `sender_id`) to the AI Employee, the customer, or a specific human team member — essential for both trust/transparency and for internal notes (`is_internal_note`), which must never be visible to the customer.
- Typing-indicator and "new message" real-time features (Section 6.10 of the Backend Specification) can be built on top of simple, indexed inserts rather than reprocessing a large JSON document.

### 8.3 Customer Profiles

`Customer` is the durable identity record a business builds up over time. It intentionally exists independently of any single conversation or lead, so that:
- A returning customer's full history (past conversations, appointments, and — once linked — order data from an integration) is available to any AI Employee via a single `customer_id` lookup, supporting the PRD's "Context Awareness" and "Memory" capabilities.
- Multiple leads, conversations, and appointments can all reference the same customer over their lifecycle with the business.

### 8.4 Interaction History

The combination of `Conversation`, `Message`, `Appointment`, and `ActivityLog`, all filterable by `customer_id`, forms the complete interaction history shown in the Frontend Specification's Customer profile panel. No separate "interaction history" table is needed — it is a query across existing, properly-indexed relational data, which keeps the model simpler and avoids duplicating data that already exists elsewhere.

---

## 9. Knowledge Base Storage

The knowledge base is the grounding source for every AI Employee's responses (PRD's "Business Knowledge Understanding") and must support both structured FAQs and uploaded documents.

### 9.1 FAQs and Structured Content

Short-form knowledge (FAQ question/answer pairs, policy snippets) is stored directly as `KnowledgeBaseEntry` rows with `type = FAQ` or `Policy`, with `content` holding the text. This keeps common lookups fast and simple, matching the Frontend's Knowledge Base screen (a flat list/table of entries with sync status).

### 9.2 Documents

Larger uploaded files (PDFs, docs) are represented by a `Document` row referencing object storage (per the PRD's infrastructure recommendation of managed object storage for attachments — binary content is never stored directly in PostgreSQL). A `Document` can back one or more derived `KnowledgeBaseEntry` rows once processed (e.g., a single policy PDF split into several retrievable entries), tracked via `document_id` on the entry and `processing_status` on the document.

### 9.3 Website Content & Business Information

Business profile fields (name, industry, tone, general business rules) live on `Workspace` and `AIEmployee.configuration` rather than in the knowledge base, since they are structured configuration, not retrievable "content." Broader website/marketing content a business wants an AI Employee to draw on (e.g., pasted "About Us" copy) is stored as a `KnowledgeBaseEntry` with `type = General`, keeping a single retrieval path for the AI Agent Layer regardless of content origin.

### 9.4 AI Knowledge References

Every `KnowledgeBaseEntry` carries `sync_status` (`Synced`, `Syncing`, `Failed`) so the Frontend's sync-status badges are backed by real state, and `is_active` so outdated content can be excluded from AI retrieval without being deleted (supporting soft-delete/versioning workflows — e.g., an admin disabling an FAQ pending review). At MVP, retrieval is a structured lookup (filtered by workspace and relevance keywords/category) rather than semantic/embedding search; the schema is intentionally compatible with adding a `pgvector`-backed embedding column later (Section 13) without restructuring existing entries.

---

## 10. Integration Data

### 10.1 Representation Model

Each connected external service is one `Integration` row per `(workspace_id, provider)` pair. This uniform shape — rather than a separate table per integration type (WhatsApp, Gmail, Calendar, Stripe, Slack, Shopify, HubSpot) — matches the Backend Specification's `integrations/` connector pattern: the database doesn't need to know provider-specific details, only connection state and encrypted credentials, while provider-specific logic lives entirely in backend connector code.

### 10.2 What Is Stored

- **Connection status** (`Connected`, `Disconnected`, `Error`) — drives the Frontend's Integration cards and health badges.
- **Encrypted credentials** (`credentials_encrypted`) — OAuth tokens or API keys, stored only in encrypted form (Section 12); the plaintext value is never persisted, logged, or returned to the frontend.
- **Metadata needed for operation** — e.g., which calendar ID is connected, which WhatsApp business number, last successful sync timestamp — stored in a `metadata` jsonb field scoped per provider, since each provider's operational metadata differs.
- **Ownership/audit fields** — `connected_by_user_id` and timestamps, so it's clear who connected or last modified an integration.

### 10.3 What Is Deliberately Not Stored

- Raw customer messages or calendar data from the external service are not duplicated wholesale into Trevolk's database beyond what's needed operationally (e.g., a WhatsApp message becomes a `Message` row once received; the platform doesn't separately mirror WhatsApp's own message store).
- Full third-party account data (e.g., a business's entire Shopify catalog) is out of MVP scope per the PRD, and would be modeled as its own set of read-through or cached entities only if/when deep integrations are built (Section 13).

### 10.4 Relationship to Operational Data

`Appointment.integration_id` and `Conversation`'s channel metadata reference `Integration` rows so the platform always knows which external connection produced or should act on a given record — e.g., which calendar to check before confirming a booking, which WhatsApp connection to send a follow-up through.

---

## 11. Performance Strategy

### 11.1 Indexing

- Every tenant-scoped table is indexed on `workspace_id` at minimum; high-traffic tables add composite indexes matching real query patterns:
  - `Conversation`: (`workspace_id`, `status`, `last_message_at`) for the unified inbox's default sort/filter.
  - `Message`: (`conversation_id`, `sent_at`) for ordered history retrieval.
  - `Lead`: (`workspace_id`, `status`) for the kanban/pipeline view.
  - `Appointment`: (`workspace_id`, `start_time`) for the calendar view.
  - `ActivityLog` and `AnalyticsEvent`: (`workspace_id`, `occurred_at`/`created_at`) for chronological, paginated access.
- Foreign key columns are indexed by default to keep join performance predictable as tables grow.

### 11.2 Pagination

Every list-producing query (conversations, messages, leads, activity history, notifications) is designed for cursor- or offset-based pagination from day one, matching the Frontend Specification's explicit requirement to paginate/virtualize long lists rather than load full datasets. No table is designed in a way that would force loading an entire history into memory (e.g., no single-row "all messages as JSON" pattern).

### 11.3 Query Optimization

- Frequently-joined lookups (e.g., a conversation's customer name and status shown together in a list) favor including the minimum needed foreign-key-joined fields rather than over-fetching full related records.
- Dashboard summary data (status counts, today's activity) is served from targeted, indexed aggregate queries at MVP scale; if these become a bottleneck, they migrate to the `AnalyticsSnapshot` pre-aggregation pattern already defined in Section 7.5.

### 11.4 Archiving

- `Message` and `ActivityLog` are the fastest-growing tables. The design anticipates (without implementing at MVP) time-based partitioning or a rolling archive strategy (e.g., moving conversations closed/resolved more than N months ago into an archive table or cold storage) so the live tables stay fast as history accumulates.
- Soft-deleted records (Section 2.5) are excluded from default query scopes via a `deleted_at IS NULL` filter, and can be periodically purged from live tables into an archive after a defined retention window, once such a policy is defined.

### 11.5 Caching Considerations

- Read-heavy, slow-changing data — workspace settings, AI Employee configuration, knowledge base entries used for retrieval — are good candidates for an application-level cache (e.g., Redis, already part of the stack for background jobs) to reduce repeated database load on every AI response.
- Live, fast-changing data (open conversations, new messages) is deliberately not cached at the database layer, to avoid staleness in a context where "trust through transparency" depends on accurate, current status.
- Caching is treated as an optimization layered on top of the relational model, not a substitute for correct indexing — the schema should perform acceptably without cache at MVP scale.

---

## 12. Security & Data Integrity

### 12.1 Foreign Key Integrity

Every relationship described in Section 4 is enforced with a real foreign key constraint at the database level (not just application-level checks), so it is structurally impossible to create a `Lead` without a valid `Workspace`, an `Appointment` without a valid `Customer`, or a `Message` without a valid `Conversation`. This is the last line of defense against the kind of orphaned or cross-tenant data the PRD's security requirements explicitly guard against.

### 12.2 Data Validation

- Enumerated fields (status, role, employee type, channel, provider) are constrained at the schema level so invalid values can never be persisted, complementing the request-level validation (e.g., Zod schemas) the Backend Specification defines at the controller layer.
- Required relationships (e.g., every `Conversation` must belong to a `Workspace`) are non-nullable foreign keys; optional relationships (e.g., a `Conversation` may not yet have a `Customer`) are explicitly nullable, so the schema itself documents which links are guaranteed versus in-progress.

### 12.3 Encryption Considerations

- **Integration credentials** (`Integration.credentials_encrypted`) are encrypted at rest using an application-managed encryption key (e.g., via a KMS), never stored or logged in plaintext, and never returned to the frontend — matching the Backend Specification's explicit rule that only connection status, not raw credentials, is exposed to the client.
- **Sensitive customer data** (if any payment-adjacent details are ever stored, though full payment handling is delegated to Stripe) follows the same at-rest encryption approach; the platform avoids storing raw payment details entirely by relying on Stripe as the system of record for billing/payment data.
- **Transport security** is a backend/infrastructure concern (HTTPS everywhere) rather than a database-level one, but is noted here as a dependency of the overall security model.

### 12.4 Audit Logs

`ActivityLog` (Section 5.15) is the platform's dedicated audit trail, distinct from ordinary operational tables:
- Captures actor (AI Employee, User, or System), action, affected entity, and relevant metadata (e.g., before/after values for a configuration change, or the reasoning summary behind an AI decision).
- Is append-only in practice — rows are never updated or deleted through normal application flows — so it remains a trustworthy record even if other data is later corrected.
- Directly supports the PRD's requirement that every AI action be "visible, logged, and explainable."

### 12.5 Backup Strategy

- Regular automated backups (daily full backups plus continuous point-in-time recovery via PostgreSQL's write-ahead log) are treated as a baseline operational requirement given the platform stores business-critical operational data (leads, appointments, conversations) that businesses depend on.
- Backups are encrypted at rest and access-restricted, consistent with the encryption posture applied to integration credentials.
- A defined retention window (e.g., 30 days of point-in-time recovery, longer for periodic full backups) balances recovery flexibility against storage cost at MVP scale, and should be revisited as data volume and customer contractual requirements grow.

---

## 13. Future Expansion

The schema is deliberately shaped so the following are additive changes, not redesigns — directly mirroring the PRD's and Backend Specification's "extension points, not premature investment" philosophy.

### 13.1 Additional AI Employees

New employee types (HR, Marketing, Finance, Operations, Recruitment — PRD Section 3.8) require only a new `employee_type` enum value and a corresponding `configuration` shape. No new tables, and no changes to `Conversation`, `Message`, `ActivityLog`, or any other entity that already references `AIEmployee` generically via `ai_employee_id`.

### 13.2 AI Marketplace

A future marketplace of third-party or specialized AI Employees fits naturally by extending `AIEmployee` with an origin/source reference (platform-built vs. marketplace-sourced) and adding a `MarketplaceListing` entity (name, publisher, pricing model) that an `AIEmployee` instance can optionally reference — without altering how the rest of the platform interacts with an employee instance.

### 13.3 Billing / Subscription Plans

The MVP-light `Subscription`/`Plan` model (Section 5.18) is intentionally minimal but structured to expand into usage-based billing (tracking conversation volume against `AnalyticsEvent` counts), add-on purchases (premium integrations, extra AI Employee seats), and multi-tier enterprise contracts, without changing the core tenancy model — `Business` remains the billing owner regardless of plan complexity.

### 13.4 Organizations / Multi-Workspace Agencies

Because `Business → Workspace` is already modeled as One-to-Many rather than One-to-One, supporting agencies or larger organizations that manage multiple client workspaces from one account requires no structural change — only relaxing MVP-stage assumptions (e.g., UI limits of one workspace per business) and adding organization-level reporting views across a Business's Workspaces.

### 13.5 More Integrations

Each new integration (Slack, Shopify, HubSpot, deeper Stripe usage, voice/phone channels) is simply a new `provider` enum value on the existing `Integration` table, with provider-specific operational data captured in its `metadata` jsonb field — consistent with the Backend Specification's one-connector-per-service pattern, requiring no schema redesign as the integration roster grows.

### 13.6 Vector-Based Semantic Memory

When long-term semantic recall is prioritized (explicitly deferred per PRD Section 5.1), the natural extension is adding a `pgvector`-backed `embedding` column (or a companion table) to `KnowledgeBaseEntry` and/or `Message`, enabling similarity search alongside the existing structured retrieval — without disturbing the relational structure already in place, since `pgvector` runs inside the same PostgreSQL instance.

### 13.7 Cross-Employee Workflow Orchestration

The PRD's long-term vision of AI Employees handing off work to one another (Sales → Receptionist → Follow-up) is already supported at the data level: `Lead`, `Customer`, `Conversation`, and `Appointment` all carry `ai_employee_id` references and are workspace-shared, so one employee's output (a qualified lead) is immediately visible and actionable by another. Formalizing this into explicit workflow/handoff tracking would mean adding a lightweight `WorkflowHandoff` entity (from-employee, to-employee, entity reference, reason) layered on top of this already-shared data, not restructuring it.

---

*End of Database Design Specification. This document is derived from the Trevolk AI Workforce PRD (Sections 1–5), the Frontend Development Specification, and the Backend Development Specification, and is scoped to database architecture and planning only — implementation (SQL, Prisma schema, migrations) is a subsequent step.*
