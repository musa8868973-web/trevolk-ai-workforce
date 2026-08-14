# 🤖 Trevolk AI Workforce Platform

<div align="center">

![Trevolk Banner](https://img.shields.io/badge/Trevolk-AI%20Workforce-6366f1?style=for-the-badge&logo=robot&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Build](https://img.shields.io/badge/build-passing-success?style=for-the-badge)

**The World's First Plug-and-Play AI Employee Platform for SMBs**

*Hire Sales, Support, Receptionist & Follow-up AI Employees that work 24/7 — no salaries, no sick days.*

[🌐 Live Demo](#) · [📖 Docs](#architecture) · [🚀 Quick Start](#-quick-start) · [🐛 Issues](https://github.com/musa8868973-web/trevolk-ai-workforce/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [AI Employees](#-ai-employees)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Development Phases](#-development-phases)
  - [Phase 1 — Project Foundation & Monorepo Setup](#phase-1--project-foundation--monorepo-setup)
  - [Phase 2 — Database Design & Prisma ORM](#phase-2--database-design--prisma-orm)
  - [Phase 3 — Authentication & Multi-Tenancy](#phase-3--authentication--multi-tenancy)
  - [Phase 4 — AI Employee Core Engine](#phase-4--ai-employee-core-engine)
  - [Phase 5 — Sales & Support Employees](#phase-5--sales--support-employees)
  - [Phase 6 — Receptionist Employee & Appointments](#phase-6--receptionist-employee--appointments)
  - [Phase 7 — Follow-up Employee & Lead Lifecycle](#phase-7--follow-up-employee--lead-lifecycle)
  - [Phase 8 — Integrations (WhatsApp, Email, Stripe, Calendar)](#phase-8--integrations-whatsapp-email-stripe-calendar)
  - [Phase 9 — Analytics, Background Jobs & Real-Time Notifications](#phase-9--analytics-background-jobs--real-time-notifications)
  - [Phase 10 — Frontend Dashboard & Live Chat Widget](#phase-10--frontend-dashboard--live-chat-widget)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🌟 Overview

**Trevolk AI Workforce** is an enterprise-grade, multi-tenant SaaS platform that lets businesses deploy intelligent AI Employees that autonomously handle:

- 📞 **Sales conversations** — Qualify leads, pitch products, send proposals
- 💬 **Customer support** — Answer queries, resolve tickets, escalate when needed
- 📅 **Receptionist duties** — Book appointments, manage schedules, greet visitors
- 🔄 **Follow-ups** — Re-engage cold leads, send reminders, close deals automatically

Every AI Employee shares a unified **Knowledge Base**, operates within a **multi-tenant Workspace**, and communicates via **WhatsApp, Email, Web Chat,** and **REST APIs** — all secured with enterprise-grade JWT authentication and RBAC.

---

## 🤖 AI Employees

| Employee | Role | Capabilities |
|---|---|---|
| 🧑‍💼 **Alex — Sales Employee** | Lead Qualification & Conversion | Pitch, qualify, propose, close deals |
| 🎧 **Sam — Support Employee** | Customer Service & Ticketing | Answer questions, resolve issues, escalate |
| 🏢 **Riley — Receptionist Employee** | Scheduling & Visitor Management | Book appointments, greet, direct enquiries |
| 📲 **Jordan — Follow-up Employee** | Lead Nurturing & Re-engagement | Automated follow-up sequences, reminders |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + TypeScript** | Core runtime & type safety |
| **Express.js** | REST API framework |
| **Prisma ORM + SQLite** | Database layer (PostgreSQL-ready) |
| **JWT + bcrypt** | Auth & password hashing |
| **BullMQ + Redis** | Background job queues |
| **Socket.io** | Real-time WebSocket notifications |
| **Zod** | Runtime schema validation |
| **Pino** | Structured JSON logging |
| **Helmet + CORS** | Security middleware |

### Frontend
| Technology | Purpose |
|---|---|
| **Vite + React 19** | Modern frontend build & runtime |
| **TanStack Router** | File-based type-safe routing |
| **TailwindCSS v4** | Utility-first styling |
| **Radix UI** | Accessible component primitives |
| **React Hook Form + Zod** | Form management & validation |
| **Sonner** | Toast notification system |
| **Lucide React** | Icon library |
| **Socket.io Client** | Real-time WebSocket connection |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TREVOLK PLATFORM                       │
├───────────────────────┬─────────────────────────────────┤
│   Frontend (Vite/React)│         Backend (Express)        │
│   localhost:8080       │         localhost:4000            │
│                        │                                  │
│  ┌──────────────────┐  │  ┌──────────────────────────┐   │
│  │ Dashboard UI     │  │  │  REST API (v1)           │   │
│  │ Auth (Sliding)   │◄─┼─►│  /api/v1/auth/*          │   │
│  │ AI Employee Views│  │  │  /api/v1/workspaces/*    │   │
│  │ Analytics Charts │  │  │  /api/v1/ai-employees/*  │   │
│  │ Live Chat Widget │  │  │  /api/v1/conversations/* │   │
│  └──────────────────┘  │  │  /api/v1/analytics/*     │   │
│                        │  │  /api/v1/audit-logs/*    │   │
│  ┌──────────────────┐  │  └──────────────────────────┘   │
│  │ Socket.io Client │◄─┼─►┌──────────────────────────┐   │
│  │ Real-time Notifs │  │  │  Socket.io Gateway        │   │
│  └──────────────────┘  │  │  Workspace rooms          │   │
│                        │  └──────────────────────────┘   │
├───────────────────────┴──────┬──────────────────────────┤
│           Data Layer         │      Job Queue Layer       │
│  ┌─────────────────────────┐ │ ┌────────────────────────┐│
│  │ Prisma ORM              │ │ │ BullMQ Workers          ││
│  │ SQLite (dev)            │ │ │ - Follow-up Scanner     ││
│  │ PostgreSQL (prod-ready) │ │ │ - Digest Processor      ││
│  └─────────────────────────┘ │ │ - WhatsApp Sender       ││
│                              │ │ - Maintenance Jobs      ││
│                              │ └────────────────────────┘│
└──────────────────────────────┴──────────────────────────┘
```

---

## 📅 Development Phases

### Phase 1 — Project Foundation & Monorepo Setup

**Goal:** Establish a clean, production-grade monorepo with consistent tooling across backend and frontend.

**Deliverables:**
- ✅ Monorepo structure with `backend/`, `Frontend/`, and `Documentation/` directories
- ✅ TypeScript configuration with strict mode & path aliases (`@/` for both apps)
- ✅ ESLint + Prettier setup for consistent code style
- ✅ Nodemon for hot-reload backend development
- ✅ Root `.gitignore` excluding `node_modules/`, `.env`, `dist/`, `*.db`
- ✅ GitHub Actions workflow stubs (`.github/`)
- ✅ Backend: Express app factory with middleware pipeline (Helmet, CORS, Compression, Body Parser)
- ✅ Frontend: Vite + React 19 bootstrapped with TanStack Router

**Key Files:**
```
backend/src/app.ts              ← Express app factory
backend/src/server.ts           ← HTTP server entrypoint
backend/tsconfig.json           ← TypeScript strict config
Frontend/vite.config.ts         ← Vite build config
.gitignore                      ← Root ignore rules
```

---

### Phase 2 — Database Design & Prisma ORM

**Goal:** Design a normalized, multi-tenant database schema that supports all AI Employee workflows.

**Deliverables:**
- ✅ **Prisma schema** with 15+ models across the full domain
- ✅ **Multi-tenancy** enforced at DB level via `workspaceId` foreign keys
- ✅ **Core models:** `User`, `Organization`, `Workspace`, `WorkspaceMember`
- ✅ **AI Domain models:** `AIEmployee`, `Conversation`, `Message`, `Lead`, `Customer`, `Appointment`
- ✅ **Operations models:** `AuditLog`, `AnalyticsEvent`, `Integration`, `FollowUp`
- ✅ SQLite for local development; schema is PostgreSQL-compatible
- ✅ Migration history via `prisma/migrations/`
- ✅ Prisma Client auto-generation on `npm install`

**Schema Highlights:**
```prisma
model Workspace {
  id          String            @id @default(cuid())
  name        String
  orgId       String
  members     WorkspaceMember[]
  aiEmployees AIEmployee[]
  leads       Lead[]
  customers   Customer[]
  conversations Conversation[]
}
```

**Commands:**
```bash
npm run db:migrate    # Run all pending migrations
npm run db:generate   # Regenerate Prisma Client
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
```

---

### Phase 3 — Authentication & Multi-Tenancy

**Goal:** Secure JWT-based authentication with workspace-scoped access control.

**Deliverables:**
- ✅ `POST /api/v1/auth/register` — Creates User + Organization + Workspace atomically
- ✅ `POST /api/v1/auth/login` — Returns signed `accessToken` + `refreshToken`
- ✅ `GET /api/v1/auth/me` — Returns authenticated user profile + workspace memberships
- ✅ `POST /api/v1/auth/refresh` — Silent token refresh
- ✅ `POST /api/v1/auth/logout` — Token revocation
- ✅ **JWT middleware** — Validates Bearer tokens on all protected routes
- ✅ **RBAC middleware** — Role-based permission enforcement (`owner`, `admin`, `member`)
- ✅ **Rate limiting** — Redis-backed with 500ms timeout fallback for local dev
- ✅ **Zod validators** — Full request body validation for all auth endpoints

**Auth Flow:**
```
Register → User + Org + Workspace created
         → JWT accessToken (15min) + refreshToken (7d) issued
         → Stored in localStorage by Frontend

Protected Route → Bearer token extracted
              → JWT verified → workspaceId attached to req
              → RBAC permission check → proceed or 403
```

---

### Phase 4 — AI Employee Core Engine

**Goal:** Build the foundational AI Employee configuration system and conversation engine.

**Deliverables:**
- ✅ **AI Employee CRUD** — Create, read, update, delete AI Employees per workspace
- ✅ **Employee Types:** `sales`, `support`, `receptionist`, `follow_up`
- ✅ **Configuration model** — Personality, tone, knowledge base links, escalation rules
- ✅ **Conversation Engine** — Turn-based message processing with latency tracking (avg 11ms)
- ✅ **Knowledge Base integration** — Employees reference workspace-scoped knowledge items
- ✅ **Status management** — `active`, `inactive`, `training` states
- ✅ **Multi-employee routing** — Incoming messages routed to correct employee by type

**API Routes:**
```
GET    /api/v1/workspaces/:id/ai-employees
POST   /api/v1/workspaces/:id/ai-employees
GET    /api/v1/workspaces/:id/ai-employees/:employeeId
PUT    /api/v1/workspaces/:id/ai-employees/:employeeId
DELETE /api/v1/workspaces/:id/ai-employees/:employeeId
POST   /api/v1/workspaces/:id/ai-employees/:employeeId/query
```

---

### Phase 5 — Sales & Support Employees

**Goal:** Implement specialized business logic for the Sales and Support AI Employees.

**Deliverables:**
- ✅ **Sales Employee (Alex):**
  - Lead intake from web chat, WhatsApp, or API
  - Lead scoring and qualification logic
  - Automatic `Lead` record creation with status tracking
  - Proposal generation hooks
  - Handoff to human sales rep on high-score leads
- ✅ **Support Employee (Sam):**
  - FAQ-based response generation from Knowledge Base
  - Ticket creation on unresolved issues
  - Escalation rules — forwards to human agent after N failed turns
  - Customer satisfaction tracking per conversation
- ✅ **Conversation mappers** — Clean DTO transformation for API responses
- ✅ **Integration tests** for both employees (`tests/integration/`)

**Lead Status Lifecycle:**
```
new → contacted → qualified → proposal_sent → negotiation → closed_won / closed_lost
```

---

### Phase 6 — Receptionist Employee & Appointments

**Goal:** Build the Receptionist AI Employee with full appointment scheduling capabilities.

**Deliverables:**
- ✅ **Receptionist Employee (Riley):**
  - Natural language appointment request parsing
  - Availability checking against workspace calendar
  - Automatic `Appointment` record creation
  - Confirmation and reminder scheduling
  - Visitor greeting and routing logic
- ✅ **Appointment Module:**
  - `POST /api/v1/workspaces/:id/appointments` — Book new appointment
  - `GET /api/v1/workspaces/:id/appointments` — List with filters (date, status, employee)
  - `PATCH /api/v1/workspaces/:id/appointments/:id` — Update / reschedule
  - `DELETE /api/v1/workspaces/:id/appointments/:id` — Cancel
- ✅ **Appointment statuses:** `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`
- ✅ **Appointment mappers** — Clean API response formatting

---

### Phase 7 — Follow-up Employee & Lead Lifecycle

**Goal:** Build the Follow-up AI Employee to automate lead nurturing sequences.

**Deliverables:**
- ✅ **Follow-up Employee (Jordan):**
  - Automatic follow-up sequence creation per Lead
  - Configurable follow-up intervals (1 day, 3 days, 7 days, 14 days)
  - Sequence step types: `email`, `whatsapp`, `sms`, `call_reminder`
  - Sequence pause/resume on Lead status change
  - Smart re-engagement detection (prevents spam if lead replies)
- ✅ **FollowUp model** — Linked to Leads with step tracking
- ✅ **BullMQ follow-up scanner** — Cron job scans due follow-ups every 15 minutes
- ✅ **Lead lifecycle automation** — Status transitions trigger follow-up sequence updates
- ✅ **Integration tests** (`tests/integration/followup-employee.spec.ts`)

**Follow-up Sequence:**
```
Lead Created → Day 0: Initial contact
             → Day 1: Follow-up #1
             → Day 3: Follow-up #2 (different channel)
             → Day 7: Follow-up #3 (value-add content)
             → Day 14: Final follow-up before archive
```

---

### Phase 8 — Integrations (WhatsApp, Email, Stripe, Calendar)

**Goal:** Connect Trevolk to real-world communication and payment channels.

**Deliverables:**
- ✅ **WhatsApp Integration** — Webhook receiver for incoming messages, outgoing message queue
- ✅ **Email Integration** — Send transactional emails via configurable SMTP provider
- ✅ **Stripe Integration** — Payment webhook processing, subscription management hooks
- ✅ **Calendar Integration** — Google Calendar / Outlook sync for appointment slots
- ✅ **Generic Webhook Provider** — Connect any HTTP-based service
- ✅ **Integration Credential Store** — Encrypted storage of API keys and tokens
- ✅ **Token refresh service** — Auto-refresh OAuth tokens before expiry
- ✅ **Webhook event service** — Idempotent event processing with deduplication
- ✅ **BullMQ integration workers** — Reliable message delivery with retry logic

**API Routes:**
```
GET    /api/v1/workspaces/:id/integrations
POST   /api/v1/workspaces/:id/integrations
POST   /api/v1/workspaces/:id/integrations/webhook/:provider
DELETE /api/v1/workspaces/:id/integrations/:integrationId
```

**Supported Providers:**
| Provider | Type | Direction |
|---|---|---|
| WhatsApp (Meta Cloud API) | Messaging | Inbound + Outbound |
| Email (SMTP/SendGrid) | Messaging | Outbound |
| Stripe | Payments | Inbound Webhooks |
| Google Calendar | Scheduling | Bidirectional |
| Generic Webhook | Custom | Inbound |

---

### Phase 9 — Analytics, Background Jobs & Real-Time Notifications

**Goal:** Provide workspace owners with live insights, and enable real-time event streaming.

**Deliverables:**
- ✅ **Analytics Module:**
  - `GET /api/v1/workspaces/:id/analytics/overview` — KPI dashboard (leads, conversations, conversions, CSAT)
  - Analytics event recording on every significant action
  - Time-series aggregation for charts (7d, 30d, 90d windows)
  - Channel volume breakdown (WhatsApp, Email, Web Chat)
- ✅ **Audit Log Module:**
  - `GET /api/v1/workspaces/:id/audit-logs` — Paginated, filterable event history
  - Automatic audit trail on all write operations
  - Actor, action, resource, timestamp tracking
- ✅ **BullMQ Workers (5 workers):**
  - `whatsapp-send` — Outbound WhatsApp message delivery
  - `email-send` — Outbound email delivery
  - `follow-up-scan` — Due follow-up detection (15 min cron)
  - `digest` — Daily workspace activity digest
  - `maintenance` — DB cleanup and index optimization
- ✅ **Socket.io Notification Gateway:**
  - Workspace-scoped rooms (`workspace_${workspaceId}`)
  - Real-time events: `new_lead`, `new_message`, `appointment_booked`, `follow_up_sent`
  - Frontend socket client connects and joins workspace room on auth

**Analytics Overview Response:**
```json
{
  "totalLeads": 142,
  "openConversations": 23,
  "conversionRate": 18.3,
  "avgResponseTimeMs": 11,
  "csatScore": 4.7,
  "channelVolume": {
    "whatsapp": 64,
    "email": 45,
    "webChat": 33
  }
}
```

---

### Phase 10 — Frontend Dashboard & Live Chat Widget

**Goal:** Build a premium React dashboard for workspace management and an embeddable live chat widget.

**Deliverables:**
- ✅ **Sliding Animated Auth Component (`SlidingAuthCard`):**
  - State-driven view toggle (`'login' | 'register'`) with smooth 0.65s CSS sliding animation
  - Login Form: Email, Password, "Forgot Password?" link
  - Register Form: Name, Email, Password (with strength indicator), Organization, Terms checkbox
  - Overlay hero panel slides left ↔ right with gradient glassmorphism design
  - Connected to `POST /api/v1/auth/login` and `POST /api/v1/auth/register`
  - Token persistence in `localStorage` + Sonner toast notifications
- ✅ **Frontend Auth API Service (`src/services/auth.api.ts`):**
  - `loginUser()`, `registerUser()`, `getCurrentUser()`
  - Automatic `accessToken` + `workspaceId` localStorage management
  - Full TypeScript types for all API responses
- ✅ **CORS fix** — Backend allows all local dev origins (ports 3000, 5173, 8080)
- ✅ **E2E Test Suite — 7/7 Core Backend Tests Passed:**
  - ✅ Health liveness (`/health`)
  - ✅ Health readiness (`/health/ready`)
  - ✅ Auth register (`/auth/register`)
  - ✅ Unauthenticated route protection
  - ✅ Protected analytics (`/analytics/overview`)
  - ✅ Protected audit logs (`/audit-logs`)
  - ✅ Security headers (Helmet)
- ✅ **E2E Test Suite — 7/7 Frontend & Widget Tests Passed:**
  - ✅ REST API authentication
  - ✅ Dashboard data fetching
  - ✅ Socket.io connection
  - ✅ Workspace room join
  - ✅ AI Agent query (11ms latency)
  - ✅ Real-time event receive
  - ✅ Session cleanup

**Frontend Routes:**
```
/login          → SlidingAuthCard (initialView="login")
/signup         → SlidingAuthCard (initialView="register")
/forgot-password → Password reset flow
/dashboard      → Main workspace dashboard
/workspace-setup → Post-registration onboarding
/ai-employees   → Employee management
/conversations  → Live chat & history
/leads          → Lead pipeline view
/customers      → Customer CRM
/appointments   → Calendar & scheduling
/analytics      → Charts & KPIs
/integrations   → Channel connections
/settings       → Workspace settings
```

---

## 📁 Project Structure

```
Trevolk_Official/
├── 📁 backend/                          # Node.js + Express API
│   ├── 📁 prisma/
│   │   ├── schema.prisma                # Database schema (15+ models)
│   │   └── migrations/                  # Migration history
│   ├── 📁 scripts/
│   │   ├── e2e-test.js                  # Core backend E2E tests (7/7)
│   │   └── test-frontend-widget.js      # Frontend widget tests (7/7)
│   ├── 📁 src/
│   │   ├── app.ts                       # Express app factory
│   │   ├── server.ts                    # HTTP + Socket.io server
│   │   ├── 📁 config/
│   │   │   ├── app.config.ts            # App configuration object
│   │   │   └── env.schema.ts            # Zod env validation
│   │   ├── 📁 common/
│   │   │   ├── 📁 middlewares/          # JWT, RBAC, rate-limit, HMAC
│   │   │   ├── 📁 queues/               # BullMQ queue factory
│   │   │   ├── 📁 constants/            # Permissions, roles
│   │   │   └── 📁 crypto/               # Encryption utilities
│   │   ├── 📁 modules/
│   │   │   ├── 📁 auth/                 # Register, login, refresh, me
│   │   │   ├── 📁 workspaces/           # Workspace CRUD
│   │   │   ├── 📁 organizations/        # Organization management
│   │   │   ├── 📁 ai-employees/         # AI Employee CRUD + config
│   │   │   ├── 📁 conversations/        # Chat session management
│   │   │   ├── 📁 leads/                # Lead pipeline + lifecycle
│   │   │   ├── 📁 customers/            # Customer CRM records
│   │   │   ├── 📁 appointments/         # Scheduling & calendar
│   │   │   ├── 📁 sales-employee/       # Alex — Sales AI logic
│   │   │   ├── 📁 support-employee/     # Sam — Support AI logic
│   │   │   ├── 📁 receptionist-employee/# Riley — Receptionist AI logic
│   │   │   ├── 📁 followup-employee/    # Jordan — Follow-up AI logic
│   │   │   ├── 📁 integrations/         # WhatsApp, Email, Stripe, Calendar
│   │   │   ├── 📁 analytics/            # KPI recording & aggregation
│   │   │   ├── 📁 audit/                # Audit log trail
│   │   │   ├── 📁 notifications/        # Socket.io gateway
│   │   │   ├── 📁 jobs/                 # BullMQ worker processors
│   │   │   └── 📁 health/               # Liveness & readiness probes
│   │   ├── 📁 routes/v1/
│   │   │   └── index.ts                 # API v1 router
│   │   └── 📁 shared/logger/            # Pino structured logging
│   ├── 📁 tests/
│   │   ├── 📁 integration/              # Integration test specs
│   │   └── 📁 helpers/                  # Prisma mock helpers
│   ├── .env.example                     # Environment variable template
│   ├── Dockerfile                       # Container build
│   ├── docker-compose.prod.yml          # Production stack
│   └── package.json
│
├── 📁 Frontend/                         # Vite + React 19 Dashboard
│   ├── 📁 src/
│   │   ├── 📁 routes/                   # TanStack Router file-based routes
│   │   │   ├── login.tsx                # /login → SlidingAuthCard
│   │   │   ├── signup.tsx               # /signup → SlidingAuthCard
│   │   │   └── dashboard.tsx            # /dashboard (protected)
│   │   ├── 📁 components/
│   │   │   ├── 📁 auth/
│   │   │   │   └── SlidingAuthCard.tsx  # ✨ Animated auth component
│   │   │   ├── 📁 ui/                   # Radix UI primitives
│   │   │   └── 📁 navigation/           # TopBar, Sidebar
│   │   ├── 📁 services/
│   │   │   ├── auth.api.ts              # Auth API client (login/register)
│   │   │   └── index.ts                 # Mock service layer
│   │   ├── 📁 features/                 # Feature-specific components
│   │   ├── 📁 layouts/                  # AuthLayout, DashboardLayout
│   │   ├── 📁 types/                    # Shared TypeScript types
│   │   └── 📁 lib/                      # Utility functions (cn, etc.)
│   ├── .env                             # Frontend env vars
│   └── package.json
│
├── 📁 Documentation/
│   └── 📁 03_Development_Specifications/
│       ├── 01_Frontend_Specification.md
│       ├── 02_Backend_Specification.md
│       ├── 03_Database_Design.md
│       └── 04_AI_Employee_Specification.md
│
├── 📁 .github/                          # GitHub Actions workflows
├── .gitignore                           # Root gitignore
└── README.md                            # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **npm** v9+
- **Git**

> **Note:** Redis is optional for local development. The backend gracefully falls back to in-memory rate limiting if Redis is unavailable.

### 1. Clone the Repository

```bash
git clone https://github.com/musa8868973-web/trevolk-ai-workforce.git
cd trevolk-ai-workforce
```

### 2. Setup & Start the Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed

# Start development server
npm run dev
# → Backend running at http://localhost:4000
```

### 3. Setup & Start the Frontend

```bash
# Open a new terminal
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
# → Frontend running at http://localhost:8080
```

### 4. Open the App

| URL | Description |
|---|---|
| `http://localhost:8080/signup` | Create your account |
| `http://localhost:8080/login` | Log in to your workspace |
| `http://localhost:8080/dashboard` | Main dashboard (after login) |
| `http://localhost:4000/api/v1/health` | Backend health check |

---

## 📡 API Reference

### Health

```
GET /api/v1/health           → { status: "ok" }
GET /api/v1/health/ready     → DB + Redis connectivity status
```

### Authentication

```
POST /api/v1/auth/register   → Create account + workspace
POST /api/v1/auth/login      → Get accessToken + refreshToken
GET  /api/v1/auth/me         → Get current user (🔒 protected)
POST /api/v1/auth/refresh    → Refresh access token
POST /api/v1/auth/logout     → Revoke tokens
```

### Workspaces & AI Employees

```
GET    /api/v1/workspaces/:workspaceId/ai-employees
POST   /api/v1/workspaces/:workspaceId/ai-employees
POST   /api/v1/workspaces/:workspaceId/ai-employees/:id/query
GET    /api/v1/workspaces/:workspaceId/conversations
GET    /api/v1/workspaces/:workspaceId/leads
GET    /api/v1/workspaces/:workspaceId/customers
GET    /api/v1/workspaces/:workspaceId/appointments
```

### Analytics & Audit

```
GET /api/v1/workspaces/:workspaceId/analytics/overview   🔒
GET /api/v1/workspaces/:workspaceId/audit-logs            🔒
```

> All protected routes (`🔒`) require `Authorization: Bearer <accessToken>` header.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# App
PORT=4000
NODE_ENV=development
APP_NAME=trevolk-ai-workforce-backend
API_PREFIX=/api/v1

# CORS — add all frontend dev origins
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Database
DATABASE_URL=file:./dev.db

# Redis (optional for local dev — falls back to in-memory)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=7d

# Auth Provider
AUTH_PROVIDER=local
AUTH_PROVIDER_API_KEY=
```

### Frontend (`Frontend/.env`)

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_WS_URL=http://localhost:4000
```

---

## 🧪 Testing

### Run Core Backend E2E Tests (7/7)

```bash
cd backend
node scripts/e2e-test.js
```

Expected output:
```
✅ [1/7] Health Liveness          — 200 OK
✅ [2/7] Health Readiness         — DB connected
✅ [3/7] Auth Register            — User + workspace created
✅ [4/7] Unauthenticated Guard    — 401 Unauthorized
✅ [5/7] Protected Analytics      — 200 with KPI data
✅ [6/7] Protected Audit Logs     — 200 with event history
✅ [7/7] Security Headers         — Helmet headers present

All 7/7 tests passed ✅
```

### Run Frontend & Widget E2E Tests (7/7)

```bash
cd backend
node scripts/test-frontend-widget.js
```

### Run Integration Tests

```bash
cd backend
npm run test
```

---

## 🐳 Deployment

### Docker (Recommended)

```bash
cd backend
docker build -t trevolk-backend .
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production Build

```bash
# Backend
cd backend
npm run build
NODE_ENV=production node dist/server.js

# Frontend
cd Frontend
npm run build
# Serve dist/ with nginx or any static host
```

### Environment Checklist for Production

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (min 64 chars, randomly generated)
- [ ] Switch `DATABASE_URL` to PostgreSQL connection string
- [ ] Configure real Redis URL for BullMQ
- [ ] Set `CORS_ORIGIN` to production frontend domain
- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Configure WhatsApp Business API credentials
- [ ] Set up email SMTP credentials

---

## 🗺 Roadmap

### ✅ Completed (Phases 1–10)
- [x] Monorepo setup & TypeScript configuration
- [x] Database design & Prisma ORM
- [x] JWT authentication & multi-tenancy
- [x] AI Employee core engine (4 employees)
- [x] Sales & Support employee logic
- [x] Receptionist & appointment scheduling
- [x] Follow-up sequences & lead lifecycle
- [x] WhatsApp, Email, Stripe & Calendar integrations
- [x] Analytics, BullMQ jobs & Socket.io notifications
- [x] React dashboard & sliding animated auth component

### 🔮 Upcoming
- [ ] **GPT-4 / Gemini AI** — Replace mock AI with real LLM responses
- [ ] **Voice AI Employee** — Phone call handling via Twilio/ElevenLabs
- [ ] **Mobile App** — React Native companion app
- [ ] **White-label mode** — Custom branding for resellers
- [ ] **Marketplace** — Buy/sell AI Employee configurations
- [ ] **Advanced Analytics** — Predictive lead scoring, churn detection
- [ ] **Multi-language support** — i18n for 10+ languages

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Muhammad Musa** — [@musa8868973-web](https://github.com/musa8868973-web)

*Built with ❤️ and a lot of ☕*

---

<div align="center">

**⭐ Star this repo if Trevolk AI helped you!**

[![GitHub stars](https://img.shields.io/github/stars/musa8868973-web/trevolk-ai-workforce?style=social)](https://github.com/musa8868973-web/trevolk-ai-workforce)

</div>
