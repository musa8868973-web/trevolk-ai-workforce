# Trevolk AI Workforce — Backend (Phase 1–4: Foundation + Database + Auth + Workspace/Business Management)

Production-grade backend for the Trevolk AI Workforce platform.
**Phase 1** (application skeleton), **Phase 2** (database layer — Prisma
schema, multi-tenant models, migrations, seed data), and **Phase 3**
(authentication & authorization) are implemented. AI agent logic and the
rest of the domain APIs (Workspace, AI Employee, Conversation, Lead,
Customer, Appointment, Knowledge Base, Integration) are intentionally
**not implemented yet** and arrive in later phases, per
`02_Backend_Specification.md` and `03_Database_Design.md`.

## Stack

| Concern | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Database | PostgreSQL via Prisma ORM |
| Validation | Zod |
| Authentication | Local email/password + JWT access/refresh tokens (see below) |
| Logging | Pino (`pino-http` for request logs) |
| Config | dotenv + Zod-validated env schema |
| Security | Helmet, CORS, Compression |

## Getting Started

```bash
cp .env.example .env      # fill in real values — DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install                # also runs `prisma generate` via postinstall
```

### Database setup (Phase 2 + 3)

Requires a running PostgreSQL instance (local, Docker, or hosted). Point
`DATABASE_URL` in `.env` at it, e.g.:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/trevolk_db?schema=public
```

Then:

```bash
npm run db:generate    # generate the Prisma client from schema.prisma
npm run db:migrate     # apply migrations (creates/updates the DB schema)
npm run db:seed        # populate fictional demo data (1 org, 1 workspace, etc.)
```

`npm run db:migrate` runs `prisma migrate dev`, which will detect the
committed migrations — including `prisma/migrations/20260808080000_add_authentication`
(Phase 3: adds `users.password_hash`, `users.last_login_at`, and the
`refresh_tokens` table) — and apply them, or generate a fresh migration if
`schema.prisma` has since changed. Useful extras: `npm run db:studio`
(Prisma Studio GUI), `npm run db:migrate:reset` (drops and rebuilds the
dev database from migrations + seed).

> **Sandbox note:** the Phase 3 migration was hand-authored to mirror
> `schema.prisma` because the environment this work was generated in has
> no network access to download the Prisma engines/CLI (the existing
> Phase 1/2 migration has the same note for the same reason). Running
> `npm run db:generate && npm run db:migrate` locally is the authoritative
> validation step — Prisma will reconcile/regenerate the migration
> automatically if anything doesn't match `schema.prisma`. Until you run
> `db:generate`, `npm run build`/`npm run typecheck` will show ~10 errors
> pointing at `User.passwordHash`, `User.lastLoginAt`, and
> `prisma.refreshToken` — these disappear once the client is regenerated.

### Start the server

```bash
npm run dev                # starts on http://localhost:4000 (nodemon + ts-node)
```

Verify it's alive:

```bash
curl http://localhost:4000/api/v1/health
```

The response includes `data.database: "connected" | "unreachable"` — a
down database does not fail the health check itself (liveness vs.
readiness are kept separate), it's just reported.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` / `test:coverage` | Jest |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Apply/create a dev migration |
| `npm run db:migrate:deploy` | Apply committed migrations (CI/production) |
| `npm run db:migrate:reset` | Drop, recreate, migrate, and reseed the dev DB |
| `npm run db:seed` | Run `prisma/seed.ts` against the current `DATABASE_URL` |
| `npm run db:studio` | Open Prisma Studio |

## Folder Structure

```
prisma/
├── schema.prisma               # Full data model (Phase 2 + 3 auth fields)
├── seed.ts                     # Fictional demo-data seed script
├── tsconfig.seed.json          # Standalone ts-node config for seed.ts
└── migrations/
    ├── migration_lock.toml
    ├── 20260808070256_init/migration.sql
    └── 20260808080000_add_authentication/migration.sql   # Phase 3

src/
├── config/           # Env schema + validated, typed app configuration
├── common/           # Cross-cutting: errors, constants, response helpers, middlewares
│   ├── errors/
│   ├── constants/    # incl. WORKSPACE_ROLES, PERMISSIONS/ROLE_PERMISSIONS (Phase 3)
│   ├── response/
│   └── middlewares/  # incl. requireAuth/resolveWorkspace/requireRole/requirePermission, rateLimit (Phase 3)
├── database/         # Centralized Prisma client/service (Phase 2)
│   ├── prisma.client.ts
│   └── index.ts
├── modules/          # Feature modules
│   ├── health/
│   │   ├── controller/
│   │   └── routes/
│   └── auth/         # Phase 3 — Authentication & Authorization
│       ├── controller/
│       ├── services/    # auth.service.ts (business logic), token.service.ts (JWT issuance/rotation)
│       ├── mappers/      # toSafeUser — never leaks passwordHash
│       ├── validators/
│       └── routes/
├── shared/           # Logger + generic utilities reused across modules
│   ├── logger/
│   ├── security/     # Phase 3 — password hashing (scrypt) + JWT sign/verify (both dependency-free)
│   └── utils/
├── routes/           # Versioned API router (/api/v1)
│   └── v1/
├── types/            # Global/shared TypeScript types (incl. Express augmentation)
├── app.ts            # Express app construction (testable, no listening)
└── server.ts         # Process entry point — binds the port, graceful shutdown

tests/
├── unit/              # security.spec.ts, permissions.spec.ts, auth.middleware.spec.ts, rate-limit.middleware.spec.ts
├── integration/        # health.spec.ts, auth.spec.ts
└── helpers/            # prisma-mock.ts — in-memory Prisma stand-in used to test auth end-to-end without a live DB

logs/                  # Local log output (gitignored)
scripts/                # Reserved for future operational scripts
```

This mirrors the layered architecture from `02_Backend_Specification.md`
§3–4 (API Gateway → Auth → Business Logic → AI Agent → Database →
Integrations), scaffolded so each future module drops into
`modules/<domain>/{controller,service,routes,validators}` without
restructuring what's already here.

## Path Aliases

Configured in `tsconfig.json` and mirrored in `jest.config.js`:

| Alias | Resolves to |
|---|---|
| `@config/*` | `src/config/*` |
| `@common/*` | `src/common/*` |
| `@modules/*` | `src/modules/*` |
| `@shared/*` | `src/shared/*` |
| `@routes/*` | `src/routes/*` |
| `@app-types/*` | `src/types/*` |
| `@database/*` | `src/database/*` |

## Database Layer (Phase 2 + 3)

`prisma/schema.prisma` implements the multi-tenant foundation described in
`03_Database_Design.md`, plus the Phase 3 authentication additions:

- **Tenancy** — `Organization` → `Workspace` → `WorkspaceMember` → `User`,
  with every tenant-owned table carrying a `workspace_id` foreign key.
- **Authentication (Phase 3)** — `User.passwordHash` (nullable — a user
  provisioned through a future managed auth provider isn't required to
  have one) and `User.lastLoginAt`, plus a new `RefreshToken` model (one
  row per issued refresh token, keyed by the JWT's `jti` claim) that makes
  server-side session revocation possible on top of otherwise-stateless
  access tokens.
- **AI Employees** — `AIEmployee` (one row per activated Sales / Support /
  Receptionist / Follow-up instance per workspace), configuration held as
  `jsonb` so behavior can be tuned without a schema change.
- **Customers & Leads** — `Customer` (durable identity) and `Lead`
  (pipeline, optionally linked to a `Customer` once converted).
- **Conversations & Messages** — `Conversation` (thread) and `Message`
  (individual, paginable rows — never a JSON blob).
- **Appointments** — linked to a `Customer`, an `AIEmployee`, and
  optionally an `Integration` (calendar).
- **Knowledge Base** — `KnowledgeBaseEntry` + `Document`, with sync/
  processing status enums backing the frontend's status badges.
- **Integrations** — one `Integration` row per `(workspace, provider)`,
  with a placeholder `credentials_encrypted` column shaped for real
  encryption in a later phase — no OAuth or real secrets here.
- **Notifications** — persisted record only; delivery is a later phase.

All IDs are UUIDs. Enums/constrained strings are used for every
status/type field. Soft deletes (`deleted_at`) are used on primary
business entities per Database Design §2.5; join/audit-light tables
(`WorkspaceMember`, `Notification`, `RefreshToken`) are not soft-deleted —
`RefreshToken` uses hard revocation (`revokedAt`) instead, since a
revoked/expired session has no audit value once it can no longer be used.

## Authentication & Authorization (Phase 3)

### Strategy

- **Password storage** — `crypto.scrypt` (Node's built-in, memory-hard KDF)
  with a random salt per password, stored as `salt:derivedKey` in
  `User.passwordHash`. No third-party hashing dependency was introduced.
- **Tokens** — a stateless **access token** (short-lived JWT, `JWT_SECRET`,
  default 1 day) verified on every authenticated request with no database
  lookup, plus a longer-lived **refresh token** (JWT, `JWT_REFRESH_SECRET`,
  default 30 days) whose `jti` claim maps to a `RefreshToken` row in
  Postgres. This is what makes logout and rotation possible: the JWT alone
  proves *who*, the database row proves *still valid*.
  - `POST /auth/refresh` **rotates** the token: the presented refresh
    token is revoked and a new pair is issued, limiting the blast radius
    of a leaked refresh token.
  - `POST /auth/logout` revokes either the single presented refresh token
    (log out this device) or, if none is presented, every active session
    for the user (log out everywhere).
- Both the JWT implementation (`src/shared/security/jwt.util.ts`) and the
  password hashing (`src/shared/security/password.util.ts`) are built on
  Node's built-in `crypto` module — no `bcrypt`/`jsonwebtoken` dependency
  was added, keeping the dependency surface unchanged from Phase 1/2.

### Authorization

- **Roles** — `OWNER`, `ADMIN`, `TEAM_MEMBER` on `WorkspaceMember.role`
  (`src/common/constants/roles.ts`).
- **Permissions** — a small, extensible set of domain permissions
  (`src/common/constants/permissions.ts`): `workspace:manage`,
  `team:manage`, `ai_employee:manage`, `customer:manage`, `lead:manage`,
  `conversation:manage`, `appointment:manage`, `knowledge_base:manage`,
  `integration:manage`, `analytics:view`. Owner/Admin are granted every
  permission; Team Member is scoped to conversations/leads/customers/
  appointments, matching the Frontend Specification's Team Member persona.
- **Middleware** (`src/common/middlewares/auth.middleware.ts`):
  - `requireAuth` — verifies the `Authorization: Bearer <accessToken>`
    header, attaches `req.auth = { userId, email }`. No DB call.
  - `resolveWorkspace` — reads the workspace id from the `X-Workspace-Id`
    header (or a `:workspaceId` route param), confirms the caller is an
    active member of it via `WorkspaceMember`, and attaches
    `req.workspace = { workspaceId, role }`. **A workspace id is never
    trusted from the client without this membership check** — this is the
    multi-tenant isolation boundary every future workspace-scoped route
    should sit behind.
  - `requireRole(...roles)` / `requirePermission(...permissions)` — gate a
    route by the resolved workspace role. Must run after `resolveWorkspace`.

### Endpoints

All under `API_PREFIX` (default `/api/v1/auth`):

| Method & Path | Auth required | Purpose |
|---|---|---|
| `POST /auth/register` | No | Create a user **and** their first Organization/Workspace (as Owner). Returns the user, workspace, and a token pair. |
| `POST /auth/login` | No | Authenticate by email/password. Returns the user, all workspace memberships, and a token pair. |
| `POST /auth/refresh` | No (refresh token in body) | Rotates a refresh token; returns a new token pair. |
| `POST /auth/logout` | Yes (access token) | Revokes a session (single device, or all if no `refreshToken` given). |
| `GET /auth/me` | Yes (access token) | Returns the caller's profile + workspace memberships/roles. |

### Example requests

```bash
# Register (also provisions an Organization + Workspace, role Owner)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ayesha@example.com","password":"correctHorse9","name":"Ayesha Khan","organizationName":"Ayesha Co"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ayesha@example.com","password":"correctHorse9"}'

# Current user (paste accessToken from register/login response)
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'

# Logout this device
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

Register/login responses look like:

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "id": "...", "email": "ayesha@example.com", "name": "Ayesha Khan", "status": "ACTIVE", "createdAt": "...", "updatedAt": "...", "lastLoginAt": null },
    "workspace": { "workspaceId": "...", "workspaceName": "Ayesha Co — Main Workspace", "organizationId": "...", "role": "OWNER" },
    "tokens": { "accessToken": "...", "refreshToken": "...", "expiresIn": 86400 }
  }
}
```

`passwordHash` is never present in any response — `SafeUser`
(`src/modules/auth/mappers/user.mapper.ts`) explicitly whitelists the
fields returned, rather than blacklisting `passwordHash`, so a future
field added to `User` doesn't leak by default.

### Testing authentication locally

```bash
npm test                      # full suite, incl. Phase 3 auth tests
npx jest tests/unit/security.spec.ts       # password/JWT unit tests
npx jest tests/unit/auth.middleware.spec.ts # requireAuth/resolveWorkspace/RBAC unit tests
npx jest tests/integration/auth.spec.ts     # full HTTP flow: register/login/refresh/logout/me
```

The integration and middleware tests mock `@database/index` with an
in-memory Prisma stand-in (`tests/helpers/prisma-mock.ts`) rather than
requiring a live Postgres connection, so `npm test` is fully self-contained.
`npm run db:migrate` against a real database is still the authoritative
end-to-end check.

### Password & rate-limit policy

- Passwords: 8–72 characters, at least one letter and one number. Not an
  extreme composition policy — long enough plus a basic mix.
- Rate limiting: in-memory, per-IP (`src/common/middlewares/rate-limit.middleware.ts`),
  applied to `/auth/register` (10/hour) and `/auth/login` + `/auth/refresh`
  (20/15min). Automatically disabled under `NODE_ENV=test`. Sufficient for
  MVP/single-instance; should move to a Redis-backed limiter (Redis is
  already provisioned for background jobs) if the API is ever scaled
  horizontally.

## Workspace & Business Management (Phase 4)

Builds the multi-tenant business/workspace foundation on top of Phase 3
auth. No new database models were introduced — `Organization`,
`Workspace`, and `WorkspaceMember` already existed (Phase 2) with every
field this phase needed, including `WorkspaceMember.invitedAt`/
`acceptedAt`, which is reused to represent a pending invitation instead
of a separate `Invitation` table.

### Organizations (`src/modules/organizations/`)

Organization creation itself is **not** a separate endpoint — 
`POST /auth/register` (Phase 3) already provisions the caller's first
Organization + Workspace as Owner in one transaction, which is the only
creation path the Frontend/Backend Specifications call for.

| Method & Path | Auth required | Notes |
|---|---|---|
| `GET /organizations/:id` | Yes | Visible to the org's owner or any member of one of its workspaces; anyone else gets **404** (not 403), so the endpoint never confirms which organization IDs exist to an outsider. |
| `PATCH /organizations/:id` | Yes | Owner-only. A workspace member who isn't the owner gets **403** (existence is already implied by their membership, so 403 is correct here, unlike the 404 above). Body: `{ name?, industry? }`. |

### Workspaces (`src/modules/workspaces/`)

| Method & Path | Auth required | Notes |
|---|---|---|
| `GET /workspaces` | Yes | Lists every workspace the caller belongs to (accepted **or** still-pending), with `role` and `membershipStatus`. |
| `GET /workspaces/invitations` | Yes | Lists the caller's own pending (unaccepted) invitations across all workspaces. |
| `POST /workspaces` | Yes | Creates an **additional** workspace under an existing organization (Database Design §4.1: Business → Workspace is one-to-many). Restricted to that organization's owner; the creator is enrolled as the new workspace's Owner in the same transaction. |
| `GET /workspaces/:workspaceId` | Yes + confirmed (accepted) membership | 404 if the workspace doesn't exist/is deleted; 403 if the caller isn't a member — multi-tenant isolation never trusts a client-supplied id without this check. |
| `PATCH /workspaces/:workspaceId` | Yes + `workspace:manage` (Owner/Admin) | Body: any of `{ name, industry, timezone, branding, defaultWorkingHours }`. |
| `POST /workspaces/:workspaceId/members/accept` | Yes (no membership required yet) | Accepts the caller's own pending invitation. Deliberately bypasses `resolveWorkspace`, since an unaccepted membership doesn't grant access. |
| `GET /workspaces/:workspaceId/members` | Yes + confirmed membership | Lists all members (id, role, `status`, and the linked user's id/name/email/avatar). |
| `POST /workspaces/:workspaceId/members/invite` | Yes + `team:manage` (Owner/Admin) | Body: `{ email, role }`. The invited email **must already have a Trevolk account** — this phase does not send email or provision placeholder accounts (per the Phase 4 brief). Returns 404 if no account exists, 409 if already a member/invited. Only an Owner can invite with `role: OWNER`. |
| `PATCH /workspaces/:workspaceId/members/:memberId` | Yes + `team:manage` (Owner/Admin) | Body: `{ role }`. Extra guards: a caller can never change their **own** role; only an Owner can grant `OWNER` or change another Owner's role; a workspace must always retain at least one Owner. |
| `DELETE /workspaces/:workspaceId/members/:memberId` | Yes + `team:manage` (Owner/Admin) | A caller can never remove **themselves** this way; only an Owner can remove another Owner. |

### Multi-tenant isolation & privilege-escalation guarantees

- Every `/:workspaceId` route re-verifies membership **on the path
  parameter** via `resolveWorkspace` on every request — an id the
  frontend "remembers" is never trusted by itself (Phase 4 §5, §11).
  `resolveWorkspace` now also rejects a membership whose `acceptedAt`
  is still `null`, so a pending invitation doesn't grant access.
- Role/permission checks are centralized in
  `requireRole`/`requirePermission` (Phase 3 middleware, reused
  unchanged) rather than scattered through controllers.
- Privilege-escalation guards specific to member management
  (self-role-change, granting/demoting Owner, last-Owner protection)
  live in `member.service.ts`, run **after** the `team:manage`
  permission gate, and are covered by
  `tests/integration/workspaces.spec.ts`.

### Testing Phase 4 locally

```bash
npx jest tests/integration/organizations.spec.ts
npx jest tests/integration/workspaces.spec.ts
```

Same in-memory Prisma stand-in as Phase 3 (`tests/helpers/prisma-mock.ts`,
extended for `organization`/`workspace`/`workspaceMember` reads, updates,
counts, and deletes) — no live database required for `npm test`.

## What's Deliberately NOT Here (Yet)

The following are placeholders/scaffolding only and are implemented in
later phases:

- **AI Agent Layer** — no `agents/` module yet; `config/app.config.ts`
  already exposes typed config slots for OpenAI, Groq, Gemini, and Claude.
- **Business logic / API routes for AI Employees & operational data** —
  the `AIEmployee`, `Conversation`, `Lead`, `Customer`, `Appointment`,
  `KnowledgeBaseEntry`, and `Integration` **database models** exist
  (Phase 2) and are reachable behind auth/workspace middleware
  (Phase 3), but their `services/`, `controllers/`, and `routes/` are
  not built yet — only `modules/health`, `modules/auth`,
  `modules/organizations`, and `modules/workspaces` exist as built-out
  modules.
- **Integrations** — Gmail, WhatsApp, Google Calendar, Stripe connectors
  (the actual API calls) are not implemented; only the `Integration`
  table and env placeholders exist.
- **Managed auth provider (Clerk/Supabase)** — `AUTH_PROVIDER`/
  `AUTH_PROVIDER_API_KEY` remain reserved, unused env vars; Phase 3
  implements local email/password + JWT directly per the phase brief,
  not a third-party provider.
- **Email delivery for invitations** — Phase 4 invitations are recorded
  in `WorkspaceMember` (`invitedAt`/`acceptedAt`) but no email is sent;
  per the Phase 4 brief, Gmail/SendGrid integration is explicitly out of
  scope for this phase. Inviting an email with no existing Trevolk
  account returns a 404 rather than provisioning a placeholder account.
- **Vector search / embeddings, billing/subscriptions, activity-log &
  analytics tables, follow-up sequence orchestration** — explicitly
  deferred per Database Design §13; kept out of this phase to avoid
  over-building ahead of the phases that need them.

## Environment Variables

See `.env.example` for the full list. All values are validated at boot
via `src/config/env.schema.ts` (Zod) — the process fails fast with a
clear error if configuration is invalid, rather than surfacing obscure
failures later. As of Phase 3, `JWT_SECRET` and `JWT_REFRESH_SECRET` are
**required** (minimum 16 characters each) — the app will refuse to start
without them.
