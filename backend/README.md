# Trevolk AI Workforce — Backend

Backend API for Trevolk AI Workforce: Express + TypeScript + Prisma, per
`docs/02_Backend_Specification.md` and `docs/03_Database_Design.md`.

## Status

- **Phase 1–2** — App skeleton, health check, config/logging/error-handling foundation.
- **Phase 3** — Authentication (register/login/refresh/logout, JWT access + refresh tokens).
- **Phase 4** — Organizations (Business), Workspaces, team management (invite/accept/roles), multi-tenant workspace isolation.
- **Phase 5A** — AI Employee core architecture (this phase): the reusable foundation every AI Employee type builds on. See [AI Employee architecture](#ai-employee-architecture-phase-5a) below.

> Phase 5B/5C (employee-specific business logic — Sales/Support/Receptionist/Follow-up, integrations, RAG, tool calling) are **not** implemented yet; see [Scope limits](#scope-limits-not-implemented-in-phase-5a).

## Getting started

```bash
npm install
cp .env.example .env      # fill in real values; never commit .env
npm run db:generate       # generate the Prisma client
npm run db:migrate        # apply migrations to prisma/dev.db (dev)
npm run db:seed           # optional: seed a sample workspace + users
npm run dev                # start the API on http://localhost:4000
```

Other useful scripts:

```bash
npm run build      # compile TypeScript -> dist/ (tsc + tsc-alias)
npm start           # run the compiled build (dist/server.js)
npm test             # run the Jest suite (in-memory Prisma mock, no live DB needed)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

All endpoints are mounted under `/api/v1`.

### A note on this environment's Prisma engine

The Prisma Client checked into `node_modules` in this environment was generated
for Windows. Running `npm run db:migrate` / `npm run db:generate` in a
Linux/CI environment requires network access to Prisma's binary CDN once, to
fetch the `debian-openssl-3.0.x` (or your platform's) query engine — already
declared in `prisma/schema.prisma`'s `binaryTargets`. Until then, requests
that touch the database (outside of the fully-mocked Jest suite) will report
`database: "unreachable"` from `/api/v1/health` — the API itself still boots
and serves requests; see `src/modules/health/controller/health.controller.ts`
for why liveness and DB readiness are deliberately not conflated.

## Project layout

```
src/
├── config/        # env schema, app config
├── common/        # constants, errors, middleware, response envelope
├── database/      # Prisma client singleton, connectivity check
├── shared/        # logger, security (JWT/password), generic utils
├── modules/       # one folder per domain (routes/controller/services/validators/mappers)
│   ├── auth/
│   ├── organizations/
│   ├── workspaces/
│   └── ai-employees/   # Phase 5A — see below
├── routes/v1/     # mounts each module's router under /api/v1
├── app.ts         # Express app wiring
└── server.ts       # process entry point

prisma/            # schema, migrations, seed script
tests/             # integration (supertest + in-memory Prisma mock) and unit tests
```

Every domain module follows the same shape: `routes/` (wiring + middleware only) →
`controller/` (validate → call service → respond) → `services/` (framework-agnostic
business logic) → `validators/` (Zod schemas) → `mappers/` (whitelist DB rows into
API-safe shapes).

## Authentication & multi-tenancy

- `Authorization: Bearer <accessToken>` on every authenticated request.
- Workspace context is resolved server-side by `resolveWorkspace` — via an
  `X-Workspace-Id` header, or a `:workspaceId` route param where the route is
  nested under `/workspaces/:workspaceId/...` — and is **always** re-verified
  against real membership in the database; a workspace ID is never trusted
  from the client.
- Roles: `OWNER`, `ADMIN`, `TEAM_MEMBER`. Sensitive actions (billing,
  integrations, team management, AI Employee create/update) require
  `requirePermission(...)`, checked via `common/constants/permissions.ts`.
- A record outside the caller's workspace returns `404 Not Found`, not `403`,
  so cross-tenant existence is never leaked.

## AI Employee architecture (Phase 5A)

Phase 5A adds the **reusable foundation** every AI Employee type (Sales,
Support, Receptionist, Follow-up — and any future type) is built on, per
`docs/02_Backend_Specification.md` §5.3/§7 and the Phase 5A brief. It does
**not** implement any employee's business logic yet.

### Domain model

`AIEmployee` (`prisma/schema.prisma`) — one row per activated employee
instance, always scoped to a `workspaceId`:

| Field | Notes |
|---|---|
| `id`, `workspaceId` | Workspace-scoped, indexed. |
| `employeeType` | `SALES \| SUPPORT \| RECEPTIONIST \| FOLLOW_UP` (see `src/modules/ai-employees/constants/employee-type.constants.ts`). One instance per type per workspace (`@@unique([workspaceId, employeeType])`). |
| `name`, `description` | Free text. |
| `status` | `NEEDS_SETUP \| ACTIVE \| PAUSED \| NEEDS_ATTENTION` — the single source of truth for status badges (Database Design §5.5, §7.2). |
| `configuration` | JSON (stored as text), parsed/serialized at the service layer — see [Configuration](#configuration). |
| `lastActiveAt`, `createdAt`, `updatedAt`, `deletedAt` | Standard audit/soft-delete fields, consistent with every other tenant-owned table. |

### API endpoints

All under `/api/v1/ai-employees`. Workspace is resolved from the
`X-Workspace-Id` header (these routes carry no workspace segment in the
path). Read endpoints require confirmed workspace membership; write
endpoints additionally require the `ai_employee:manage` permission
(Owner/Admin only).

| Method | Path | Permission | Notes |
|---|---|---|---|
| `GET` | `/ai-employees` | any workspace member | List, optional `?employeeType=` / `?status=` filters. |
| `POST` | `/ai-employees` | `ai_employee:manage` | Create. Defaults to `NEEDS_SETUP`. Rejects a duplicate `employeeType` for the workspace (`409`). |
| `GET` | `/ai-employees/:id` | any workspace member | `404` if the employee doesn't exist or belongs to another workspace. |
| `PATCH` | `/ai-employees/:id` | `ai_employee:manage` | Updates `name`/`description`/`configuration`, and/or transitions `status` — this **is** the activate/deactivate mechanism (`{"status":"ACTIVE"}` / `{"status":"PAUSED"}`), rather than separate endpoints. |

### Configuration

`AIEmployeeConfiguration` (`src/modules/ai-employees/types/`) is a generic,
employee-type-agnostic shape (`aiProvider`, `aiModel`, `systemInstructions`,
`behaviorSettings`, `enabledCapabilities`, plus an open extension bag).
**It never accepts API keys or provider credentials** — those live only in
environment variables (`config/env.ts`); this is architectural (there is no
field for it), not a content filter on the JSON body.

### AI provider abstraction (foundation only)

`src/modules/ai-employees/providers/`:

- `ai-provider.types.ts` — the `AIProvider` interface every future adapter
  (OpenAI, Gemini, Claude, Groq) implements, plus provider-agnostic
  request/response shapes.
- `provider.registry.ts` — an empty-by-default registry
  (`registerAIProvider` / `getAIProvider`) a later phase populates with real
  adapters, without this module needing to change.

No concrete provider is implemented in this phase.

### Execution abstraction (foundation only)

`src/modules/ai-employees/execution/employee-execution.types.ts` defines the
conceptual `User Request → AI Employee → Configuration → AI Provider →
Response` flow as types (`AIEmployeeExecutionContext`,
`AIEmployeeExecutionResult`, the `AIEmployeeEngine` interface) plus a
`NotImplementedAIEmployeeEngine` placeholder that throws. No conversation
memory, RAG, tool calling, or business-rule enforcement is implemented —
that's Phase 5B/5C.

### Scope limits (not implemented in Phase 5A)

Per the Phase 5A brief, the following are explicitly **out of scope** and
not present in this codebase:

- Sales / Support / Receptionist / Follow-up business logic.
- WhatsApp, Google Calendar, Shopify, Slack, Stripe, HubSpot integrations.
- RAG / knowledge base retrieval, tool calling, conversation memory.
- Analytics, billing, deployment configuration.

## Database changes (Phase 5A)

No schema change was required — `AIEmployee` already existed in
`prisma/schema.prisma` (workspace-scoped, unique per `(workspaceId,
employeeType)`, indexed on `workspaceId`) from prior work on this codebase.
Phase 5A's database-layer work was:

- Verifying the existing model matches the Backend/Database Design docs.
- Reconstructing `prisma/migrations/` into a single, consistent baseline
  (`20260808070256_init`) by introspecting the actual applied schema in
  `prisma/dev.db` — the original per-phase migration files were not present
  in the Phase 4 archive supplied for this phase (only
  `migration_lock.toml` and the applied-migration bookkeeping survived).
  This captures the schema exactly as it already existed; no data model
  changed as a result. See the comment at the top of that migration's
  `migration.sql` for details.

## Testing

`npm test` runs the full Jest suite against an in-memory Prisma mock
(`tests/helpers/prisma-mock.ts`) via `jest.mock('@database/index', ...)` —
no live database is required. AI Employee tests live in
`tests/integration/ai-employees.spec.ts` and cover: creation (incl.
duplicate-type conflict, invalid type), listing with filters, get-by-id,
update/activate/deactivate, workspace isolation (`404` on cross-tenant
access), and permission enforcement (`403` for a Team Member on
create/update).

## Environment variables

See `.env.example` for the full list (app/CORS/database/JWT/logging). No new
environment variables were introduced by Phase 5A — AI provider credentials
are intentionally **not yet configured**, since no provider adapter is
implemented yet (see [AI provider abstraction](#ai-provider-abstraction-foundation-only)).
