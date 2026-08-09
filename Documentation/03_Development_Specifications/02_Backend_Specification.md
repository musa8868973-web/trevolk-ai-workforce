# Trevolk AI Workforce — Backend Development Specification

**Document Type:** Backend Development Specification
**Source of Truth:** Trevolk AI Workforce PRD (Sections 1–5)
**Reference:** Frontend Development Specification (frontend-backend interaction patterns)
**Audience:** Backend developers, AI coding tools, software architects
**Scope:** Backend only — no frontend code, UI design, full SQL schema, deployment scripts, or marketing content

---

## Table of Contents

1. Backend Overview
2. Recommended Backend Technology Stack
3. Backend Architecture
4. Backend Folder Structure
5. Core Backend Modules
6. API Architecture Overview
7. AI Employee Backend Architecture
8. Business Workflow Examples
9. Security Requirements
10. Scalability Guidelines
11. Backend Development Principles

---

## 1. Backend Overview

### 1.1 Purpose of the Backend System

The backend is the operational core of Trevolk AI Workforce. It is the only part of the system allowed to talk to the database, invoke AI models, and call external integrations. Everything the frontend displays, and everything an AI Employee does, is mediated by the backend. Its job is to turn a business's configuration (which employees are active, what rules they follow, what knowledge they have) into safe, auditable, real-world actions: answering a customer, qualifying a lead, booking a meeting, or sending a follow-up.

### 1.2 Backend Responsibilities

- Authenticate users and resolve which workspace (business) a request belongs to.
- Enforce authorization and workspace-level data isolation on every request.
- Own all business logic: lead qualification rules, appointment rules, escalation thresholds, plan limits.
- Orchestrate AI Employees — assembling context, calling the AI Agent Layer, and applying the result.
- Persist and retrieve all workspace data through the database layer.
- Connect to external channels and tools (WhatsApp, Gmail, Calendar, Stripe, Shopify, HubSpot) through the integration layer.
- Run background jobs for follow-ups, reminders, and scheduled work.
- Expose a single, versioned REST API that the frontend (and no one else) consumes.

### 1.3 How the Backend Supports the AI Workforce Platform

Per the PRD's "one platform, many agents" model, every AI Employee (Sales, Support, Receptionist, Follow-up) runs on the same backend, the same database, and the same AI engine. The backend is what makes an AI Employee a *configuration* rather than a separate application: role, prompt, tools, and business rules are data the backend loads and applies, not code that gets duplicated per employee. This is what lets Trevolk add a fifth or sixth AI Employee type later as a data and prompt change, not a rebuild.

### 1.4 How the Frontend Communicates with the Backend

The frontend never talks to the database, the AI providers, or external integrations directly. Every dashboard action — configuring an employee, opening a conversation, viewing analytics — goes through the backend's REST API, authenticated and scoped to the caller's workspace. This gives the platform a single, auditable entry point and matches the frontend spec's assumption that all dashboard data is fetched through `services/` API client modules backed by React Query/SWR-style hooks.

Two additional communication patterns matter for the frontend experience described in the Frontend Specification:

- **Optimistic UI actions** (e.g., toggling an AI Employee active/inactive from a status card) require the backend to return fast, unambiguous success/failure so the frontend can confirm or roll back the optimistic update.
- **Live conversation and status updates** (typing indicators, new messages arriving in the unified inbox, status badges changing from "Needs Setup" to "Active") require either polling-friendly endpoints or a push mechanism (WebSocket/SSE) — see Section 6.7.

### 1.5 Role of Each Layer

| Layer | Role |
|---|---|
| **API Layer** | The single entry point for all frontend requests. Handles routing, request validation, and response shaping. Talks to Business Logic — never directly to the database or AI providers. |
| **Business Logic Layer** | Owns the rules of the product: what counts as a qualified lead, when an appointment can be booked, when an AI Employee must escalate, what a plan allows. Framework-agnostic and independently testable. |
| **AI Agent Layer** | The shared reasoning core. Assembles context, calls the configured LLM provider, executes tools, and returns a structured result to the Business Logic Layer. One engine, many employee configurations. |
| **Database Layer** | The system of record. All reads and writes are scoped by workspace ID and go through the ORM (Prisma). No other layer touches the database directly. |
| **Integration Layer** | One connector module per external service (WhatsApp, Gmail, Calendar, Stripe, etc.), exposing a consistent interface so the Business Logic and AI Agent layers don't need to know provider-specific details. |

---

## 2. Recommended Backend Technology Stack

### 2.1 Runtime — Node.js

Node.js keeps the entire stack (frontend and backend) in one language, TypeScript, which matters for a small, early-stage team where the same engineers often work across both. Its non-blocking I/O model also fits a platform whose backend spends much of its time waiting on external calls — LLM completions, WhatsApp/Gmail APIs, calendar lookups — rather than doing heavy CPU work.

### 2.2 Framework — Express.js (MVP) with a NestJS Migration Path

**Recommendation: start with Express.js, structure the codebase so a move to NestJS is mechanical, not a rewrite.**

| Consideration | Express.js | NestJS |
|---|---|---|
| Time to first working API | Fast — minimal boilerplate, ships an MVP quickly | Slower initial setup — more structure to learn |
| Structure | Unopinionated; discipline must be enforced by the team | Opinionated modules/providers/DI out of the box |
| Fit for MVP team size (2–4 people) | Good — less ceremony while requirements are still shifting | Can feel heavy before the domain has stabilized |
| Fit as the codebase grows (more AI Employees, more integrations) | Requires manual discipline to avoid a tangled `routes/controllers/services` structure | Naturally enforces the modular boundaries the PRD's "one platform, many agents" model needs |

For the MVP, Express.js is the pragmatic choice: it gets the four core modules (Auth, Workspace, AI Employee, Conversation) shipped fast without fighting a framework's opinions while the data model and agent architecture are still settling. The folder structure in Section 4 is deliberately Nest-compatible (clear `routes/controllers/services/agents` boundaries) so that if the team outgrows Express — typically once there are 3+ AI Employee types and several integrations live — migrating to NestJS's module system is a structural lift, not a redesign.

### 2.3 Language — TypeScript

TypeScript is non-negotiable for this product. AI Employee configurations, API request/response contracts, and database models are all structurally similar-but-distinct (a Lead, a Customer, an Appointment share fields but aren't interchangeable). Strong typing catches an entire class of bugs — sending a Lead where a Customer is expected, forgetting a required config field on a new AI Employee type — before they reach production, and it keeps the backend's types shareable with the frontend's `types/` directory as described in the Frontend Specification.

### 2.4 Database Communication — Prisma ORM

Prisma is used as the sole data-access layer. Its schema file acts as living documentation of the data model (matching the entity overview in PRD Section 4.6), it generates fully-typed query functions that align with the TypeScript-first stack, and its migration tooling keeps schema changes versioned and reviewable — important when a workspace-scoping mistake in a migration could leak tenant data. No other layer of the backend queries the database directly; all reads/writes go through Prisma inside the Database Layer.

### 2.5 Authentication — JWT / Session-Based with Role-Based Access Control

- **User authentication** is delegated to a managed provider (Clerk or Supabase Auth, per the PRD's technical architecture), which issues a JWT or session token after login/signup.
- **Every authenticated request** carries this token; backend middleware verifies it, resolves the user, and resolves which **workspace** the request applies to (a user may belong to more than one workspace).
- **Role-based access control (RBAC)** is enforced at the workspace level with three roles at MVP scope: **Owner**, **Admin**, **Team Member**. Sensitive actions (billing, integrations, deleting an AI Employee, inviting/removing team members) are restricted to Owner/Admin. Team Members get scoped access matching the frontend's "Team Member" persona — Conversations and Leads, not Settings or Billing.

### 2.6 Background Jobs

A queue-based background job system (e.g., BullMQ on Redis) handles anything that must not block the request/response cycle:

- **Follow-ups** — the AI Follow-up Employee's triggers (no response after X days, abandoned cart, unpaid proposal) are evaluated on a schedule, not inline with a user request.
- **Notifications** — email/dashboard notifications (new lead assigned, escalation, appointment conflict) are dispatched asynchronously.
- **Scheduled tasks** — appointment reminders, daily/weekly summaries, knowledge base re-sync jobs.

Jobs are defined in a dedicated `jobs/` module (Section 4) and triggered either on a schedule (cron-style) or by domain events emitted from the Business Logic Layer (e.g., "lead qualified" → enqueue a notification job).

### 2.7 AI Integration

The backend supports multiple LLM providers behind one interface: **OpenAI, Gemini, Claude, and Groq**. This is provider-agnostic by design:

- The Business Logic Layer never calls a provider SDK directly. It calls the **AI Agent Engine** with a task ("respond to this message as the Support Employee for Workspace X").
- The AI Agent Engine resolves which provider and model to use based on the AI Employee's configuration (allowing cost/performance tuning per employee, and a fallback provider if one has an outage).
- Provider-specific request/response formats are normalized inside `agents/` or a dedicated provider adapter, so switching or adding a provider does not touch business logic, controllers, or routes.

---

## 3. Backend Architecture

### 3.1 Layered Flow

```
API Gateway Layer
        ↓
Authentication Layer
        ↓
Business Logic Layer
        ↓
AI Employee Services (AI Agent Layer)
        ↓
Database Layer
        ↓
External Integrations
```

### 3.2 Responsibilities per Layer

**API Gateway Layer**
Receives every HTTP request from the frontend. Responsible for routing to the correct controller, applying global middleware (CORS, rate limiting, request logging, body parsing), and returning a consistently shaped response (success payload or structured error). This is the only layer the frontend ever talks to.

**Authentication Layer**
Verifies the caller's identity token, attaches the resolved user to the request, resolves the active workspace (from a header, subdomain, or route parameter, depending on final routing decision), and checks the user's role against the requested action before the request is allowed to proceed. Requests that fail authentication or authorization are rejected here — they never reach business logic.

**Business Logic Layer**
Contains all product rules: lead qualification logic, appointment/calendar rules, escalation thresholds, plan/usage limits, workspace management rules. This layer is deliberately framework-agnostic (no `req`/`res` objects) so it can be unit tested in isolation and reused whether it's called from an HTTP controller or a background job.

**AI Employee Services (AI Agent Layer)**
Given a task from the Business Logic Layer, this layer assembles the right prompt and context (employee role, business rules, conversation history, relevant customer/lead data, knowledge base content), calls the configured LLM provider, optionally invokes tools (CRM update, calendar check, order lookup), and returns a structured result. It never talks to the database or integrations directly — it calls back into the Business Logic Layer's services or the Integration Layer through defined tool interfaces, keeping AI actions predictable and auditable.

**Database Layer**
Owns all persistence. Every query is scoped by `workspaceId`. This is the only layer with a Prisma client instance; all other layers request data through service functions, never raw queries.

**External Integrations**
One connector per external service. Called only by the Business Logic Layer or, via the tool-calling interface, by the AI Agent Layer. Handles provider-specific auth, request formatting, and error normalization so the rest of the backend sees a consistent interface regardless of which WhatsApp provider or calendar API is behind it.

---

## 4. Backend Folder Structure

```
src/
├── config/           # Environment config, provider keys, feature flags, constants
├── routes/           # Express route definitions, grouped by domain
├── controllers/      # HTTP request/response handling — validation in, response out
├── services/         # Business logic — framework-agnostic, reusable across controllers/jobs
├── middleware/        # Auth, workspace resolution, RBAC checks, rate limiting, error handling
├── models/           # Shared TypeScript types/interfaces (also informs Prisma schema shape)
├── agents/           # AI Employee configurations: one module per employee type
├── integrations/     # One connector per external service (WhatsApp, Gmail, Calendar, Stripe...)
├── database/         # Prisma schema, migrations, seed scripts, data-access utilities
├── utils/            # Formatting, validation helpers, logging, error classes
├── jobs/             # Background job definitions and schedulers
└── app.ts            # Application entry point — wires middleware, routes, error handling
```

### Purpose of Each Folder

- **`config/`** — Centralizes environment variables and provider configuration (LLM API keys, database URL, Redis URL, integration credentials) so nothing is hardcoded and secrets are loaded from environment, not source.
- **`routes/`** — Maps URL paths and HTTP verbs to controllers. Organized by domain to mirror the API categories in Section 6 (`auth.routes.ts`, `employees.routes.ts`, `conversations.routes.ts`, etc.). Contains no logic beyond wiring.
- **`controllers/`** — Parses and validates incoming requests, calls the appropriate service, and formats the response. Contains no business logic — a controller should be readable as "validate → call service → respond."
- **`services/`** — The Business Logic Layer described in Section 3. Each domain (auth, workspace, leads, appointments, conversations) has its own service module, independently testable without an HTTP context.
- **`middleware/`** — Cross-cutting request handling: JWT verification, workspace resolution, RBAC enforcement, rate limiting, request logging, and centralized error formatting.
- **`models/`** — Shared TypeScript types and interfaces used across controllers, services, and agents (e.g., `AIEmployeeConfig`, `LeadStatus`, `WorkspaceRole`), keeping contracts consistent with what Prisma generates and what the frontend expects.
- **`agents/`** — One module per AI Employee type (`sales/`, `support/`, `receptionist/`, `follow-up/`), each defining its role prompt template, permitted tools, and behavior on top of a shared AI Agent Engine module also living here (`engine.ts`). Adding a new employee type means adding a new folder here, not touching the rest of the backend.
- **`integrations/`** — One connector per external service (`whatsapp/`, `gmail/`, `googleCalendar/`, `stripe/`, `slack/`, `shopify/`, `hubspot/`), each exposing a consistent interface (e.g., `sendMessage`, `checkAvailability`, `createBooking`) regardless of the underlying provider's API shape.
- **`database/`** — Prisma schema file, generated client, migrations, and any seed/fixture scripts for local development.
- **`utils/`** — Shared, stateless helper functions: date/time formatting, input validation helpers, structured logging wrapper, custom error classes.
- **`jobs/`** — Background job definitions (follow-up triggers, reminder dispatch, daily summaries) and the scheduler/queue wiring described in Section 2.6.
- **`app.ts`** — Bootstraps the Express app: applies global middleware, mounts routes, registers the centralized error handler, and starts the server.

---

## 5. Core Backend Modules

### 5.1 Authentication Module

**Responsibilities**
- Signup and login (delegating credential handling to the managed auth provider).
- Session/token verification on every authenticated request.
- Password security (handled by the managed provider — the backend never stores raw credentials).
- Role assignment and role checks (Owner / Admin / Team Member) at the workspace level.

### 5.2 Workspace Module

**Responsibilities**
- Business account creation and profile management (name, industry, branding).
- Team member management — inviting, removing, and assigning roles within a workspace.
- Workspace settings (business hours, default tone/voice, general configuration referenced by AI Employees).
- Workspace resolution for every incoming request — this module is what makes multi-tenancy enforceable.

### 5.3 AI Employee Module

**Responsibilities**
- Create/activate an AI Employee instance for a workspace (from the four MVP types: Sales, Support, Receptionist, Follow-up).
- Activate/deactivate (pause/resume) an employee, reflected immediately in status badges across the dashboard.
- Manage per-employee configuration: business rules, tone, working hours, escalation thresholds, connected knowledge base, qualification/scheduling rules specific to the employee type.
- Track and expose performance data (the metrics defined per employee in PRD Section 3) for the frontend's Overview and Performance tabs.

### 5.4 Conversation Module

**Responsibilities**
- Store conversation threads and individual messages, tagged by channel (chat widget, WhatsApp, email) and by which AI Employee (or human) is participating.
- Provide the unified inbox data the frontend's Conversations screen consumes: filtering by channel/employee/status, message history, escalation flags.
- Track handoffs — when a conversation moves from AI to human, and back.
- Support internal notes attached to a conversation, visible only to the business's team.

### 5.5 Customer Module

**Responsibilities**
- Maintain the central customer record referenced by conversations, orders, and support interactions.
- Link a customer to their conversation history, appointments, and (where applicable) order data pulled through an integration.
- Provide the data backing the frontend's Customer profile panel.

### 5.6 Lead Module

**Responsibilities**
- Capture leads from connected channels (website form, chat widget, WhatsApp).
- Store qualification responses and compute/store a lead score (Hot / Warm / Cold) per the AI Sales Employee's business-defined criteria.
- Track lead status through the pipeline (New → Qualifying → Qualified → Meeting Booked → Lost/Won) for the frontend's kanban/list view.
- Expose lead data for CRM sync (one-way at MVP, per PRD Section 5).

### 5.7 Appointment Module

**Responsibilities**
- Create, reschedule, and cancel appointments, always checking real-time availability first.
- Sync with the connected calendar integration (Google Calendar, one-way at MVP).
- Trigger reminder jobs ahead of an appointment (via the Background Jobs system).
- Enforce booking rules: working hours, blocked-off time, no double-booking.

### 5.8 Knowledge Base Module

**Responsibilities**
- Store business information, FAQs, and uploaded documents that ground AI Employee responses.
- Track sync status per source (so the frontend's sync-status badges — synced / syncing / failed — are accurate).
- Provide the retrieval interface the AI Agent Layer uses to pull relevant context into a prompt (structured lookup at MVP; a vector database is a planned future addition per the PRD, not an MVP requirement).

### 5.9 Integration Module

**Responsibilities**
- Manage connection state (connected/disconnected, health status) per external service, per workspace.
- Handle OAuth flows or API-key based connections for WhatsApp, Gmail, Google Calendar, and (post-MVP) Stripe, Slack, Shopify, HubSpot.
- Store integration credentials encrypted at rest, and expose only connection status — never raw credentials — to the frontend.
- Route outbound calls (send a WhatsApp message, check calendar availability) through the relevant connector in `integrations/`.

---

## 6. API Architecture Overview

All endpoints are grouped by domain and versioned (`/api/v1/...`). This section defines the purpose of each category — not full route contracts, which belong in a separate API reference generated alongside implementation.

### 6.1 Authentication APIs
Purpose: register a user, log in, refresh/verify a session, and resolve the workspace(s) a user belongs to.

### 6.2 Workspace APIs
Purpose: create and update a workspace/business profile, manage team members and roles, retrieve workspace settings.

### 6.3 AI Employee APIs
Purpose: list available and active AI Employees for a workspace, activate/deactivate an employee, read and update an employee's configuration, retrieve an employee's performance metrics.

### 6.4 Conversation APIs
Purpose: list conversations (with filters for channel/employee/status), retrieve a conversation's message history, send a message (human reply), escalate/reassign a conversation, attach an internal note.

### 6.5 Lead APIs
Purpose: create a lead (typically triggered by an AI Employee, sometimes manually), update lead status/score, list leads for the pipeline view, retrieve a single lead's detail.

### 6.6 Customer APIs
Purpose: create/look up a customer record, update customer details, retrieve a customer's linked conversations, orders, and appointments.

### 6.7 Appointment APIs
Purpose: create a booking, check availability, reschedule or cancel an appointment, list upcoming appointments for the calendar view.

### 6.8 Analytics APIs
Purpose: retrieve aggregated dashboard metrics — response time, resolution rate, conversion rate, bookings, revenue impact — scoped to the workspace and optionally filtered by AI Employee.

### 6.9 Integration APIs
Purpose: initiate a connection (OAuth or key entry) to an external service, retrieve connection status, disconnect a service.

### 6.10 Real-Time Considerations

The frontend spec calls for typing indicators, live-updating status badges, and a real-time unified inbox. At MVP scale, this can be satisfied with **short-interval polling** on conversation and status endpoints, which keeps the backend simple. If conversation volume or the "feels live" requirement demands better responsiveness, a **WebSocket or Server-Sent Events channel** (scoped to a workspace, authenticated the same way as REST calls) should be added specifically for conversation updates and status changes — this is flagged as a Should-Have enhancement, not a blocker for MVP.

---

## 7. AI Employee Backend Architecture

The AI Agent Layer is the shared reasoning core every AI Employee runs on. Rather than one AI system per employee, an AI Employee is a **configuration on top of one engine**.

### 7.1 Agent Management
Each AI Employee type (Sales, Support, Receptionist, Follow-up) is defined by a role definition, a prompt template, a set of permitted tools, and its business rules — all stored in the `agents/` module and, for the tunable parts (prompts, thresholds), in the database so they can be edited per workspace without a code deploy. Adding a new employee type is adding a new configuration, not a new engine.

### 7.2 Prompt Management
Prompts are centralized and versioned per AI Employee type rather than scattered through the codebase. Versioning matters because prompt behavior will be tuned frequently post-launch, and a bad prompt change needs to be safely rollback-able without a code deploy.

### 7.3 Context Handling
Before every AI response, the engine assembles: the employee's role and business rules, recent conversation history, relevant customer/lead data, and applicable knowledge base content, into the prompt sent to the LLM provider. This ensures responses are grounded in the specific workspace and conversation, not generic knowledge — directly supporting the PRD's "Business Knowledge Understanding" and "Context Awareness" requirements.

### 7.4 Tool Calling
AI Employees act on the world through a defined, limited set of tools (e.g., `updateCRM`, `checkCalendarAvailability`, `lookupOrderStatus`, `createAppointment`, `notifyTeam`) rather than free-form database or integration access. Each tool is a thin wrapper around a Business Logic service or an Integration connector. This keeps AI actions predictable, auditable, and scoped to exactly what that employee type is responsible for — an AI Support Employee should not have access to the `bookMeeting` tool, for example.

### 7.5 Memory Management
Two layers of memory, per the PRD's MVP scope:

- **Conversation-level memory** — recent message history for a given conversation, stored in PostgreSQL, so a reply stays coherent within a session.
- **Workspace-level context** — business rules, FAQs, and known facts about a given customer, also in PostgreSQL, so a returning customer doesn't have to repeat themselves across sessions.

A vector database for long-term semantic recall is explicitly a **future** addition (per PRD Section 5.1) — the MVP is intentionally scoped to structured, relational memory to avoid premature infrastructure investment.

### 7.6 Business Rules Enforcement
Each employee's "Can Do / Cannot Do / Escalate When" rules (defined per employee type in PRD Section 3) are enforced in the Business Logic Layer, not left to the LLM to self-police. The AI Agent Layer proposes an action; the Business Logic Layer validates it against the employee's configured permissions before it is executed (e.g., before a discount is applied, before a booking outside working hours is confirmed).

### 7.7 Human Escalation
Escalation is a first-class outcome, not an error path. When the AI Agent Layer's confidence is low, a business rule blocks an action, or the conversation matches a configured escalation trigger (customer explicitly asks for a human, sentiment indicates frustration, a deal exceeds a threshold), the Business Logic Layer marks the conversation as escalated, notifies the relevant team member (via the notification job), and hands off full conversation context — so a human never has to ask the customer to repeat themselves.

---

## 8. Business Workflow Examples

### 8.1 AI Sales Employee

```
Customer message
        ↓
Backend receives request (API Gateway → Auth → Conversation service)
        ↓
AI Agent Layer assembles context (business rules, prior messages, lead data)
        ↓
Lead qualification (AI proposes a score; Business Logic validates against rules)
        ↓
Database update (lead record created/updated, score and status persisted)
        ↓
Response sent to customer; team notified if qualified/high-value
```

### 8.2 AI Support Employee

```
Customer issue
        ↓
Knowledge Base search (Business Logic queries Knowledge Base module)
        ↓
AI response generated using retrieved context
        ↓
Resolution marked, or escalation triggered with full context handed to a human
```

### 8.3 AI Receptionist

```
Booking request
        ↓
Calendar availability check (Integration Layer → Google Calendar connector)
        ↓
Appointment created (Database Layer) and confirmed to the customer
        ↓
Reminder job scheduled (Background Jobs) ahead of the appointment time
```

### 8.4 AI Follow-up

```
Trigger event (no response after X days, abandoned cart, unpaid proposal)
        ↓
Background job picks up the trigger on schedule
        ↓
AI Agent Layer generates an on-brand follow-up message using customer history
        ↓
Message sent via the appropriate channel (email/WhatsApp integration)
        ↓
Notification/result tracked; sequence continues, ends, or escalates to sales
```

---

## 9. Security Requirements

- **Authentication security** — All credential handling is delegated to the managed auth provider (Clerk/Supabase Auth); the backend never stores raw passwords. Tokens are short-lived and verified on every request.
- **Authorization** — Every request resolves the caller's user, workspace, and role before touching business logic. Role checks (Owner/Admin/Team Member) gate sensitive actions (billing, integrations, deleting an AI Employee, team management).
- **Data protection** — Workspace scoping is enforced at the query layer (every Prisma query includes `workspaceId`), not just in route middleware, so a bug in one layer can't leak another workspace's data. Integration credentials and tokens are encrypted at rest and never returned to the frontend.
- **API validation** — All incoming request bodies are validated against a schema (e.g., Zod) at the controller layer before reaching business logic, rejecting malformed or unexpected payloads early.
- **Rate limiting** — Applied globally, with stricter limits on authentication endpoints and public-facing endpoints (e.g., a public chat widget endpoint) to prevent abuse.
- **Secure environment variables** — All secrets (database URL, LLM API keys, integration credentials, JWT signing keys) are loaded from environment variables via the `config/` module, never committed to source.
- **Logging** — Structured, centralized logging for requests, errors, and AI Agent Layer actions (which tool was called, what decision was made) — both for debugging and for the "trust through transparency" requirement the PRD places on AI actions being explainable.

---

## 10. Scalability Guidelines

The MVP architecture stays intentionally simple, but is built so the following don't require a rewrite:

- **Multiple businesses** — A single, workspace-scoped multi-tenant database is sufficient at MVP scale; heavier tenants can be moved to dedicated resources later without changing the data model, since every table already carries a `workspaceId`.
- **Multiple AI Employees** — Because employees are configurations on a shared AI Agent Engine, adding new types (HR, Marketing, Finance, Operations — per PRD Section 3.8) is additive: a new `agents/` module and configuration, not new infrastructure.
- **More users** — The API layer is stateless and can be scaled horizontally behind a load balancer; the database can move to read replicas if read load (analytics, conversation history) becomes a bottleneck before write load does.
- **More integrations** — The `integrations/` module pattern means each new connector (Slack, Shopify, HubSpot, deeper Stripe usage) is added independently with a consistent interface, without touching unrelated backend code.
- **Increased conversations** — Background job processing (reminders, follow-ups, notifications) is already decoupled from the request/response cycle, so conversation volume growth doesn't slow down live chat responses. Conversation and message tables should be indexed on `workspaceId` + timestamp from day one to keep the unified inbox fast as history accumulates.

None of these require premature investment for MVP — they are extension points the architecture in Section 3 and Section 4 already supports.

---

## 11. Backend Development Principles

- **Clean architecture** — Strict separation between HTTP handling (`controllers/`), business rules (`services/`), and AI/agent logic (`agents/`), so each can change independently without ripple effects.
- **Reusable services** — Business logic shared across AI Employees (e.g., notification dispatch, workspace resolution, escalation handling) is built once in `services/` and reused, not duplicated per employee.
- **Modular code** — Each AI Employee, each integration, and each major feature lives in its own module with a clear boundary, matching the folder structure in Section 4.
- **Error handling** — Centralized error handling middleware returns consistent, plain-language-friendly error responses (matching the frontend's requirement to never surface raw technical errors to end users); all async operations (especially AI provider and integration calls) are wrapped with explicit timeout and failure handling, since the product depends on third-party API reliability.
- **Testing** — Core business logic (lead qualification, appointment rules, permission checks) is covered by automated unit tests; integration connectors have contract-level tests against mocked provider responses; AI agent outputs are validated with structured checks (e.g., expected tool calls, required fields) in addition to manual review.
- **Documentation** — API contracts, the Prisma schema, and each AI Employee's prompt/behavior configuration are kept as living documentation, reviewed whenever business rules or employee behavior changes.
- **Maintainability** — A new engineer should be able to trace a request from route → controller → service → agent → database without hidden coupling, so the platform can keep adding AI Employees, integrations, and dashboard features without accumulating technical debt.

---

*End of Backend Development Specification. This document is derived from the Trevolk AI Workforce PRD (Sections 1–5) and the Frontend Development Specification, and is scoped to backend implementation only.*
