# Trevolk AI Workforce — Frontend Development Specification

**Document Type:** Frontend Development Specification
**Source of Truth:** Trevolk AI Workforce PRD (Sections 1–5)
**Audience:** Frontend developers, UI engineers, AI coding tools
**Scope:** Frontend only — no backend, database, API, or AI model implementation details

---

## Table of Contents

1. Frontend Overview
2. Application Structure
3. Complete Page Architecture
4. Detailed Screen Requirements
5. Design System
6. Dashboard Design System
7. AI Employee Interface Design
8. Responsive Design Requirements
9. Animation & Interaction Guidelines
10. Frontend Folder Structure
11. Frontend Development Rules

---

## 1. Frontend Overview

### 1.1 Frontend Goals

The frontend must deliver a premium, enterprise-grade SaaS experience that positions Trevolk as a **digital workforce management platform**, not a chatbot tool. Concretely, the frontend must:

- Communicate the "AI Employee" mental model within seconds of landing on the site.
- Give business owners a command-center view of their entire AI Workforce.
- Make every AI action visible, traceable, and explainable — trust is a first-class UI requirement, not an afterthought.
- Support a fast, guided path from signup to a live AI Employee within a single session.
- Scale cleanly as new AI Employee types, integrations, and dashboard modules are added post-MVP.

### 1.2 User Experience Objectives

| Objective | Frontend Implication |
|---|---|
| Clarity over cleverness | One primary action per screen; no competing CTAs |
| Status-driven design | Persistent status badges/indicators for every AI Employee, everywhere it's referenced |
| Low cognitive load | Progressive disclosure — advanced configuration hidden behind clear entry points |
| Trust through transparency | Activity logs, audit trails, and "why did the AI do this" surfaces are core UI, not edge cases |
| Fast to value | Onboarding wizard must be completable in minutes, with visible progress |

### 1.3 Application Structure (Summary)

The frontend is a single Next.js application with three logically distinct zones sharing one design system and one component library:

1. **Public Website** — marketing/acquisition pages, statically optimized.
2. **Authentication Area** — signup, login, password reset, workspace creation.
3. **Dashboard Application** — the authenticated, workspace-scoped product experience, including all AI Employee modules.

These zones share layouts, auth state, and design tokens but have distinct navigation shells (see Section 2).

### 1.4 Technology Recommendations

| Layer | Technology | Rationale |
|---|---|---|
| Framework | **Next.js (React, App Router)** | Server-side rendering and static generation give fast first loads for the marketing site and SEO-friendly public pages, while supporting a rich, client-heavy dashboard in the same codebase. File-based routing keeps the large page surface (public + dashboard + AI Employee modules) organized without custom routing infrastructure. |
| Language | **TypeScript** | The product has many structurally similar-but-distinct entities (AI Employee configs, conversations, leads, appointments). Strong typing across shared components and API contracts prevents an entire class of bugs as more AI Employee types and dashboard modules are added. |
| Styling | **Tailwind CSS** | Utility-first styling maps directly onto the PRD's defined design tokens (dark charcoal background, blue accents, soft rounded corners, minimal glass effects). It enforces visual consistency across a large component surface without a growing custom CSS layer, and keeps styling colocated with markup for faster iteration by both developers and AI coding tools. |
| React | **React 18+ (Server & Client Components)** | Server Components reduce client bundle size for data-heavy dashboard views; Client Components handle interactive surfaces (live conversation panels, forms, real-time status). |
| Data fetching | **React Query / SWR pattern** (via custom hooks in `hooks/`) | Standardizes loading, caching, and revalidation for dashboard data (conversations, metrics, employee status) without prescribing a specific backend implementation. |

**Why this stack fits the product:** Trevolk's frontend has to do two different jobs well in one codebase — a fast, SEO-friendly public marketing site, and a dense, real-time, data-heavy dashboard. Next.js is the only stack in this shortlist that serves both without splitting into two separate applications. TypeScript and Tailwind are what keep a growing page and component surface (four AI Employees today, more roles and dashboard modules later) consistent and safe to extend, which directly matches the "one platform, many agents" principle from the PRD's technical architecture.

---

## 2. Application Structure

### 2.1 Public Website

Unauthenticated, marketing-focused. Optimized for SEO and conversion. No workspace context. Uses a lightweight top navigation + footer layout, distinct from the dashboard shell.

### 2.2 Authentication Area

Transitional zone between the public site and the dashboard. Minimal chrome (logo + single CTA), no sidebar, no marketing navigation. Handles: signup, login, password reset, workspace creation wizard.

### 2.3 Dashboard Application

Authenticated, workspace-scoped. Uses the persistent sidebar + top bar shell defined in Section 6. Every route inside this zone resolves against an active workspace context (workspace switcher lives in the top bar).

### 2.4 AI Employee Modules

Nested within the Dashboard Application. Each AI Employee (Sales, Support, Receptionist, Follow-up) is a routed module under `/dashboard/ai-employees/[employee-type]`, sharing a common screen template (Section 7) while rendering employee-specific configuration and metrics.

### 2.5 Organization Logic

```
Public Website (marketing, unauthenticated)
        │
        ▼
Authentication Area (signup / login / workspace creation)
        │
        ▼
Dashboard Application (authenticated, workspace-scoped)
        ├── Dashboard Home
        ├── AI Employees (index + per-employee detail modules)
        ├── Conversations
        ├── Leads / Customers
        ├── Appointments
        ├── Knowledge Base
        ├── Automations
        ├── Analytics
        ├── Integrations
        └── Settings
```

Navigation only moves downward through this hierarchy for unauthenticated users; authenticated users can move freely within the Dashboard Application and back out to the public site (e.g., "View Pricing").

---

## 3. Complete Page Architecture

### 3.1 Public Pages

#### Landing Page (`/`)
| Field | Detail |
|---|---|
| Purpose | Communicate the AI Workforce concept and convert visitors into trial signups |
| Target User | First-time visitor, any persona (Ayesha, Bilal, Sarah, Omar, Hassan) |
| Main Sections | Hero (value prop + CTA), AI Employee overview grid, how-it-works steps, social proof/testimonials, industry fit teaser, final CTA band |
| Key Components | Hero component, AI Employee summary cards, step indicator, testimonial cards, sticky CTA button |
| User Actions | Click "Start Free Trial" (→ Signup), click an AI Employee card (→ AI Employees page), navigate to Pricing |

#### AI Employees Page (`/ai-employees`)
| Field | Detail |
|---|---|
| Purpose | Introduce each AI Employee as a distinct product offering |
| Target User | Evaluator comparing what each employee does |
| Main Sections | Intro/positioning block, one detailed section per employee (Sales, Support, Receptionist, Follow-up) with responsibilities and example scenario |
| Key Components | Employee detail cards, tabbed or anchor-linked sub-navigation, comparison table (optional) |
| User Actions | Jump to a specific employee section, click "Explore AI Employees" CTA → Signup |

#### Pricing Page (`/pricing`)
| Field | Detail |
|---|---|
| Purpose | Enable self-serve plan comparison and conversion |
| Target User | Owner ready to evaluate cost |
| Main Sections | Monthly/Annual toggle, three-tier plan comparison (Starter, Growth/Business, Enterprise), FAQ accordion, Enterprise contact block |
| Key Components | Pricing toggle, plan comparison cards/table, accordion, contact form trigger |
| User Actions | Toggle billing period, select a plan (→ Signup with plan pre-selected), contact sales (Enterprise) |

#### Login (`/login`)
| Field | Detail |
|---|---|
| Purpose | Return access for existing users |
| Target User | Existing account holder |
| Main Sections | Email/password fields, SSO buttons, forgot-password link |
| Key Components | Auth form, SSO buttons, inline validation states |
| User Actions | Submit login, trigger password reset, navigate to Signup |

#### Signup (`/signup`)
| Field | Detail |
|---|---|
| Purpose | Convert visitors into workspaces |
| Target User | New business owner |
| Main Sections | Minimal signup form (email/password or SSO), terms acknowledgment |
| Key Components | Auth form, SSO buttons, progress indicator (feeds into workspace creation flow) |
| User Actions | Submit signup → redirected into Workspace Creation wizard |

### 3.2 Dashboard Pages

#### Dashboard Home (`/dashboard`)
| Field | Detail |
|---|---|
| Purpose | At-a-glance health of the whole AI Workforce |
| Target User | Business Owner (primary), Team Member (scoped view) |
| Main Sections | AI Employee status summary, today's activity feed, alerts needing attention, quick actions |
| Key Components | Status cards, activity feed list, alert banner/list, quick-action buttons |
| User Actions | Toggle an employee active/inactive, jump into a flagged conversation, dismiss an alert |

#### AI Employees (`/dashboard/ai-employees`)
| Field | Detail |
|---|---|
| Purpose | Manage and compare all AI Employees in the workspace |
| Target User | Business Owner |
| Main Sections | Grid of employee cards (Sales, Support, Receptionist, Follow-up), each with status, quick stats, configure/activate button |
| Key Components | Employee card, status badge, activate/deactivate toggle |
| User Actions | Activate an inactive employee, open an employee's detail page, pause an active employee |

#### AI Sales Employee Detail (`/dashboard/ai-employees/sales`)
| Field | Detail |
|---|---|
| Purpose | Configure and monitor the AI Sales Employee specifically |
| Target User | Business Owner, Sales Team Member |
| Main Sections | Overview (leads qualified, meetings scheduled, CRM sync status), Configuration (qualification criteria, scheduling rules, CRM mapping), Performance metrics, Activity history |
| Key Components | Status badge, metric cards, configuration form panels, activity/history table, pause/resume control |
| User Actions | Edit qualification questions, pause outreach, review the manual lead queue, drill into a specific conversation |

*(Applies the shared AI Employee template — see Section 7 — to the remaining three employees: Support, Receptionist, Follow-up, each at their own route.)*

#### Conversations (`/dashboard/conversations`)
| Field | Detail |
|---|---|
| Purpose | Unified inbox across all channels and AI Employees |
| Target User | Team Member (primary), Business Owner |
| Main Sections | Channel/employee filters, conversation list, active conversation panel, escalation flags |
| Key Components | Filter bar, conversation list item, chat panel, AI/human indicator, reply box, internal notes panel |
| User Actions | Filter by channel/employee/status, open a conversation, reply inline, escalate/reassign, add an internal note |

#### Leads / Customers (`/dashboard/leads`, `/dashboard/customers`)
| Field | Detail |
|---|---|
| Purpose | Sales pipeline visibility and central customer record |
| Target User | Sales Team Member, Business Owner |
| Main Sections | Leads: list/kanban by qualification status; Customers: profile with interaction/order/appointment history |
| Key Components | Kanban board or sortable table, lead detail drawer, customer profile panel, status badges |
| User Actions | Change lead status, assign a lead, open customer profile, view linked conversations/appointments |

#### Knowledge Base (`/dashboard/knowledge-base`)
| Field | Detail |
|---|---|
| Purpose | Source of truth AI Employees draw from |
| Target User | Business Owner, Team Member with content permissions |
| Main Sections | Document/FAQ list, upload area, sync status per source |
| Key Components | File list table, drag-and-drop upload zone, sync status badge, edit/delete row actions |
| User Actions | Upload a document, edit an FAQ entry, remove outdated content, trigger re-sync |

#### Integrations (`/dashboard/integrations`)
| Field | Detail |
|---|---|
| Purpose | Manage connected external tools |
| Target User | Business Owner, Admin |
| Main Sections | Grid of integration cards (WhatsApp, Calendar, Stripe, Slack, Shopify, HubSpot, Gmail) |
| Key Components | Integration card, connect/disconnect button, connection status badge |
| User Actions | Connect an integration (OAuth or key entry), disconnect, view connection health |

#### Settings (`/dashboard/settings`)
| Field | Detail |
|---|---|
| Purpose | Workspace and account configuration |
| Target User | Business Owner, Admin |
| Main Sections | Business profile, team & roles, billing/subscription, notification preferences |
| Key Components | Profile form, team member table with role dropdowns, billing summary card, notification toggle list |
| User Actions | Update business info, invite a team member, change a role, update plan, adjust notification settings |

---

## 4. Detailed Screen Requirements

This section defines layout, components, and interaction behavior for the platform's highest-traffic and highest-complexity screens.

### 4.1 Dashboard Home

**Layout**
- Persistent sidebar (left) + top bar (workspace switcher, search, notifications, avatar menu)
- Main content: 2–3 column grid on desktop, collapsing to single column on mobile
- Sections stacked top to bottom: Status summary row → Alerts (if any) → Activity feed → Quick actions

**Components**
- Status summary cards (one per active AI Employee, showing status badge + one key metric)
- Alert banner list (dismissible, severity-coded by color: warning orange / danger red)
- Activity feed (chronological list with icons per action type)
- Quick action buttons (e.g., "Activate an AI Employee", "Invite a teammate")

**User Interactions**
- Clicking a status card navigates to that employee's detail page.
- Clicking an alert opens the relevant conversation/record in context.
- Toggling employee status from a card shows an inline confirmation and updates the badge optimistically, with rollback + error toast on failure.
- Empty state (no employees active yet): friendly illustration + "Activate your first AI Employee" CTA.

### 4.2 AI Employee Detail (Shared Template)

**Layout**
- Header: employee name/icon, status badge, pause/resume control, "last active" timestamp
- Tabbed or sectioned layout: Overview | Configuration | Performance | Activity History
- Overview: metric cards row + quick-glance summary text
- Configuration: form panels grouped by concern (business rules, tone, working hours, escalation)
- Performance: chart(s) + metric cards matching the employee's defined success metrics
- Activity History: reverse-chronological table/list of actions and conversations

**Components**
- Status badge (Active / Paused / Needs Setup / Needs Attention — color-coded)
- Metric cards (large number + label + trend indicator)
- Configuration form fields (text inputs, toggles, multi-select, time-range pickers)
- Charts (line for trends, donut/progress for rates)
- History table (sortable, filterable by date/type)

**User Interactions**
- Pause/resume shows an immediate status change with a confirmation toast; paused state visually dims the employee's cards elsewhere in the app.
- Saving configuration shows inline field-level validation and a persistent (non-blocking) save confirmation.
- Clicking a history row opens the underlying conversation or record in a side panel or new route.
- "Needs Setup" status routes directly into the relevant configuration tab when clicked.

### 4.3 Conversations (Unified Inbox)

**Layout**
- Three-panel layout on desktop: filter/list column (left), active conversation (center), context panel (right — customer info, internal notes)
- Tablet: two-panel (list + conversation), context panel becomes a slide-over
- Mobile: single panel, stack-based navigation (list → conversation → context, each full-screen)

**Components**
- Filter bar (channel, AI Employee, status: open/escalated/resolved)
- Conversation list item (avatar/channel icon, preview text, unread indicator, AI/human badge)
- Chat panel (message bubbles, typing indicator when AI is composing, reply box)
- Context panel (customer profile summary, linked lead/appointment, internal notes thread)

**User Interactions**
- Selecting a conversation loads it into the center panel without a full page reload.
- Escalating a conversation shows a role/assignee picker and updates the status badge immediately.
- Sending a reply shows optimistic UI (message appears immediately, marked "sending" until confirmed).
- Empty/error states: no conversations match filter → friendly empty state with "clear filters" action; failed send → inline retry affordance on the message.

### 4.4 Knowledge Base

**Layout**
- Header with "Add Content" primary button
- Table/list of documents and FAQ entries with sync status column
- Upload zone (drag-and-drop or modal-based)

**Components**
- File/FAQ table (name, type, last updated, sync status badge, row actions menu)
- Upload modal with progress indicator
- Inline FAQ editor (modal or side panel)

**User Interactions**
- Drag-and-drop upload shows a progress bar per file, then a success/failure badge.
- Sync status uses color coding (green = synced, orange = syncing/pending, red = failed) with a tooltip explaining state.
- Deleting content requires a confirmation modal (destructive action pattern).

---

## 5. Design System

### 5.1 Colors

Per the PRD's Master Context Document — this palette is fixed; no new colors should be introduced without a design review.

| Role | Color | Usage |
|---|---|---|
| Primary Background | Dark Charcoal | App shell, sidebar, headers |
| Primary Accent | Blue | Primary buttons, active states, links |
| Secondary Accent | Sky Blue | Secondary highlights, chart accents |
| Text | White / Light Gray | Body and heading text on dark surfaces |
| Success | Green | Positive status, completed actions |
| Warning | Orange | Needs-attention states |
| Danger | Red | Errors, failed actions, critical alerts |

Implementation note: define these as Tailwind theme tokens (e.g., `bg-surface`, `text-primary`, `accent-primary`, `status-success`, `status-warning`, `status-danger`) rather than hardcoded hex values, so the palette stays centrally controlled.

### 5.2 Typography

- Typeface: a clean, modern sans-serif (Inter, Satoshi, or system-equivalent).
- Type scale: distinct, clearly named sizes for page titles, section headings, card titles, body text, and captions (e.g., `text-display`, `text-h1`, `text-h2`, `text-body`, `text-caption`).
- Line height: generous (1.5–1.6) for dense dashboard text; tighter for large display headings.
- Numeric data (metrics, tables): use tabular figures so numbers align in columns.

### 5.3 Components Style

| Component | Style Notes |
|---|---|
| **Buttons** | Primary (filled blue, white text), Secondary (outline, blue border/text), Ghost/Text (no border, blue text). Consistent height and border-radius across all variants. Disabled state uses reduced opacity, not a color change. |
| **Cards** | Rounded corners (consistent radius token, e.g. `rounded-lg`), subtle border or soft shadow, dark surface slightly elevated from the background. Used for status, metrics, and list items. |
| **Inputs** | Single-column form layout, clear labels above fields, inline validation messages below the field, visible focus ring in accent blue, required-field indicator. |
| **Tables** | Zebra-striped rows, sticky header on scroll, inline row actions (icon buttons, revealed on hover on desktop), sortable column headers where relevant. |
| **Navigation** | Persistent collapsible sidebar + top bar; active nav item highlighted with accent blue (background tint or left-border indicator). |
| **Badges** | Small, pill-shaped, color-coded by status role (success/warning/danger/neutral), always paired with a text label — never color alone. |
| **Status indicators** | Consistent iconography + color pairing across the app: Active (green dot), Paused (gray dot), Needs Setup (orange dot), Needs Attention (red dot). |

---

## 6. Dashboard Design System

### 6.1 Sidebar

**Menu Items** (in order):
1. Dashboard
2. AI Employees
3. Conversations
4. Customers
5. Leads
6. Appointments
7. Knowledge Base
8. Automations
9. Analytics
10. Integrations
11. Settings

**Active States:** Active route highlighted using the Primary Accent Blue — either a filled background tint on the nav item or a left-edge accent bar plus icon/text color change. Only one item active at a time.

**Collapse Behavior:** Sidebar is user-collapsible on desktop (icon-only mode, labels hidden, tooltips on hover). Collapse state persists per user (stored in local component/user preference state). A collapse toggle sits at the bottom of the sidebar.

**Mobile Behavior:** Sidebar is hidden by default and opens as a full-height overlay drawer triggered by a hamburger icon in the top bar. Selecting a nav item closes the drawer and navigates.

### 6.2 Dashboard Cards

| Card Type | Contents |
|---|---|
| **Metrics Cards** | Large numeric value, label, trend indicator (↑/↓ with percentage), optional sparkline |
| **Activity Cards** | Icon, short description, timestamp, optional link to source (conversation, lead, appointment) |
| **Employee Cards** | Employee icon/name, status badge, 1–2 key metrics, primary action button (Configure / Activate) |

All cards share a common base component (consistent padding, radius, elevation) with content slots for the variant-specific data above.

### 6.3 Data Visualization

| Element | Use Case |
|---|---|
| **Line charts** | Trends over time (response time, volume, conversion rate) |
| **Bar charts** | Comparative volume (conversations per employee, leads by source) |
| **Donut / progress indicators** | Rate-based metrics (resolution rate, escalation rate) |
| **Performance indicator badges** | Quick pass/fail or threshold-based signals (e.g., SLA met/missed) |

Chart color usage is restricted to the accent palette (Primary Blue, Secondary Sky Blue) for data series, with Success/Warning/Danger reserved strictly for status meaning, not decorative variety.

---

## 7. AI Employee Interface Design

All four AI Employees share one interface template (Section 4.2) but differ in configuration fields, metrics, and overview content, as defined below.

### 7.1 AI Sales Employee

| Aspect | Definition |
|---|---|
| **Card Design** | Icon representing "sales," status badge, key stat: leads qualified this period |
| **Detail Page Layout** | Overview → Configuration (qualification criteria, meeting rules, CRM field mapping) → Performance (conversion rate, avg. qualification time) → Activity History |
| **Status Display** | Active / Paused / Needs Setup / Needs Attention, shown in header and on the summary card |
| **Configuration Sections** | Qualification questions builder, calendar availability rules, CRM field mapping panel |
| **Performance Sections** | Lead-to-meeting conversion rate, response time, notifications sent — chart + metric cards |

### 7.2 AI Support Employee

| Aspect | Definition |
|---|---|
| **Card Design** | Icon representing "support," status badge, key stat: resolution rate |
| **Detail Page Layout** | Overview → Configuration (FAQ/knowledge source, order tracking connection, escalation rules) → Performance (resolution rate, CSAT, response speed) → Activity History |
| **Status Display** | Same four-state badge system as above |
| **Configuration Sections** | Knowledge base linkage, return/complaint workflow rules, escalation trigger thresholds |
| **Performance Sections** | Resolution rate, CSAT (if collected), escalation rate — chart + metric cards |

### 7.3 AI Receptionist

| Aspect | Definition |
|---|---|
| **Card Design** | Icon representing "scheduling," status badge, key stat: appointments booked this period |
| **Detail Page Layout** | Overview → Configuration (calendar connection, availability rules, reminder timing) → Performance (bookings, no-show rate, rebooking rate) → Activity History |
| **Status Display** | Same four-state badge system |
| **Configuration Sections** | Calendar integration status, working-hours/availability editor, reminder template settings |
| **Performance Sections** | Bookings made, no-show reduction, reschedule/rebooking rate — chart + metric cards |

### 7.4 AI Follow-up Employee

| Aspect | Definition |
|---|---|
| **Card Design** | Icon representing "re-engagement," status badge, key stat: active sequences |
| **Detail Page Layout** | Overview → Configuration (sequence timing, channel selection, trigger events) → Performance (response/reply rate, recovery rate) → Activity History (per-customer follow-up timeline) |
| **Status Display** | Same four-state badge system |
| **Configuration Sections** | Sequence builder (steps, timing, channel), trigger event settings |
| **Performance Sections** | Response rate, recovery rate, revenue recovered — chart + metric cards |

---

## 8. Responsive Design Requirements

| Breakpoint | Sidebar | Dashboard Adaptation | Navigation |
|---|---|---|---|
| **Desktop (≥1200px)** | Persistent, expanded (labels visible) | Full multi-column layout; all widgets visible simultaneously | Sidebar + top bar |
| **Tablet (768–1199px)** | Collapsible to icon-only | Widgets reflow to fewer columns; tables scroll horizontally within their container | Collapsible sidebar + top bar |
| **Mobile (<768px)** | Hidden by default; opens as full-height overlay drawer | Single-column, stacked cards; tables convert to condensed list/card views (no horizontal table scroll) | Hamburger menu (opens drawer) or bottom nav for primary sections |

**Component Resizing Notes**
- Metric card grids: 4-column (desktop) → 2-column (tablet) → 1-column (mobile).
- Conversation view: 3-panel (desktop) → 2-panel with slide-over context (tablet) → single stacked panel with back navigation (mobile).
- Charts: full-width, fixed-aspect containers that scale down proportionally; legends stack below the chart on mobile instead of beside it.
- Modals: centered dialogs on desktop/tablet become full-screen sheets on mobile.

The public marketing site follows standard fluid-grid, mobile-first responsive practices and is not bound to the dashboard breakpoint table above, per the PRD.

---

## 9. Animation & Interaction Guidelines

Animation exists to support usability and communicate system status — never purely decorative. If an animation cannot be justified by clarity, feedback, or perceived performance, it should not be built.

| Interaction | Guideline |
|---|---|
| **Page Transitions** | Smooth, brief fade/slide between views (150–250ms); no jarring cuts |
| **Loading Animations** | Skeleton screens for dashboard data loads; spinners reserved for short, blocking actions only |
| **Skeleton Screens** | Match the shape of the content being loaded (card skeletons, table-row skeletons, chart-area skeletons) |
| **Hover Effects** | Subtle elevation or color shift on cards and buttons to signal interactivity; no scale/bounce effects |
| **Button Interactions** | Clear pressed/active state feedback; loading buttons show an inline spinner and disable re-submission |
| **Sidebar Behavior** | Smooth expand/collapse transition; active item highlight transitions rather than snaps |
| **Typing Indicators** | Used in live conversation views to show an AI Employee composing a response |
| **Empty States** | Friendly icon/illustration + short explanation + one clear next-action button (e.g., "Connect your first integration") |
| **Error States** | Plain-language error message + clear next step; never a raw technical/error-code message surfaced to the user |

---

## 10. Frontend Folder Structure

```
app/                        # Next.js App Router — route-level entry points
  (public)/                 # Public marketing site route group
    page.tsx                # Landing page
    ai-employees/
    pricing/
    about/
    contact/
  (auth)/                   # Authentication route group
    login/
    signup/
    workspace-setup/
  (dashboard)/              # Authenticated dashboard route group
    dashboard/
    ai-employees/
      sales/
      support/
      receptionist/
      follow-up/
    conversations/
    customers/
    leads/
    appointments/
    knowledge-base/
    automations/
    analytics/
    integrations/
    settings/

components/                 # Shared, reusable UI primitives
  ui/                        # Buttons, cards, inputs, badges, modals, tables
  charts/                    # Chart wrapper components
  navigation/                # Sidebar, top bar, breadcrumbs

features/                   # Domain/feature-specific modules
  ai-employees/
  conversations/
  leads/
  customers/
  appointments/
  knowledge-base/
  integrations/
  billing/

layouts/                    # Layout shells (public, auth, dashboard)

hooks/                      # Reusable hooks (data fetching, auth state, workspace context)

utils/                      # Formatting, validation, constants, API client wrappers

styles/                     # Tailwind config, design tokens, global styles

types/                      # Shared TypeScript types/interfaces

services/                   # Frontend-side API client modules (one per domain)
```

**Organization principles:**
- `app/` stays thin — route wiring only, delegating rendering to `features/`.
- `components/` holds only generic, reusable primitives with no domain knowledge (a `Card` doesn't know what a "lead" is).
- `features/` holds domain logic and composes `components/` into the actual screens.
- Each AI Employee's screen-specific logic lives inside `features/ai-employees/[employee-type]/`, mirroring the shared template while allowing per-employee customization without duplicating the template itself.

---

## 11. Frontend Development Rules

### 11.1 Component Reusability
- Every UI primitive (button, card, badge, table, modal, form field) is built once in `components/ui/` and reused everywhere — no per-page one-off variants.
- The four AI Employee detail screens must be built from **one shared template component** parameterized by employee-type configuration, not four separate implementations.
- Status badges, metric cards, and activity history lists are single shared components used across Dashboard Home, AI Employee pages, and Analytics.

### 11.2 Code Organization
- Route files (`app/`) contain no business logic — they compose feature components and pass data down.
- Domain logic and state management live in `features/`, not in shared `components/`.
- API calls are isolated in `services/`, never called directly from within UI components.

### 11.3 Naming Conventions
- Components: PascalCase (`EmployeeStatusBadge.tsx`).
- Hooks: camelCase, prefixed with `use` (`useWorkspaceContext.ts`).
- Route folders: kebab-case, matching URL segments (`ai-employees/`, `knowledge-base/`).
- Types/interfaces: PascalCase, suffixed for clarity where useful (`LeadStatus`, `AIEmployeeConfig`).

### 11.4 Performance Considerations
- Use Server Components by default for data-heavy, mostly-static views (e.g., Analytics summaries); reserve Client Components for interactive surfaces (conversation panel, forms, toggles).
- Paginate or virtualize long lists (conversations, leads, activity history) rather than rendering full datasets.
- Lazy-load charts and heavy visualization libraries so they don't block initial dashboard paint.
- Use skeleton states (Section 9) to maintain perceived performance during data fetches.

### 11.5 Accessibility Standards
- Maintain sufficient color contrast for all text and status indicators against the Dark Charcoal background (meet WCAG AA at minimum).
- All interactive elements must be keyboard-navigable with a visible focus state.
- Status must never be communicated by color alone — always pair color with text/label or icon.
- All icons and illustrations require descriptive `alt` text or `aria-label`s.
- Forms must have properly associated labels and inline, programmatically-announced validation messages.

---

*End of Frontend Development Specification. This document is derived entirely from the Trevolk AI Workforce PRD (Sections 1–5) and is scoped to frontend implementation only.*
