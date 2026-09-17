# Home Sweet Home

A local real-estate wholesaling CRM and motivated-seller lead funnel for the
Royal Oak / Metro Detroit, Michigan market.

The product is two experiences in one codebase:

- **A public seller funnel** — a calm, trustworthy homeowner-facing site whose
  job is to start a conversation, not to pressure anyone into one.
- **A locked-down internal CRM** — the operations workspace where the team works
  leads, properties, contracts, and dispositions. Nothing under it is reachable
  without an authenticated, role-bearing account.

> **Status: Phase 2 complete.** The foundation (design system, Supabase,
> authentication, role-based authorization, RLS, public pages) plus the full
> ten-screen seller funnel, lead capture, attribution, explainable lead
> scoring, and the booking decision flow. The CRM modules — lead pipeline,
> properties, contracts, documents, dispositions, reports — are built in the
> phases that follow. See [PRODUCT_DECISIONS.md](./PRODUCT_DECISIONS.md) for
> what is decided and [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) for what
> must happen before this goes live.

---

## Table of contents

- [Stack](#stack)
- [Local installation](#local-installation)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Running migrations](#running-migrations)
- [Seed data](#seed-data)
- [Deploying to Vercel](#deploying-to-vercel)
- [GA4 setup](#ga4-setup)
- [Booking integration setup](#booking-integration-setup)
- [Security architecture overview](#security-architecture-overview)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [What remains before launch](#what-remains-before-launch)

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4, design tokens in `src/app/globals.css` |
| Components | Hand-built primitives in `src/components/ui` (shadcn-style: `cva` + `tailwind-merge`) |
| Auth & data | Supabase (Auth, Postgres, Row Level Security, Storage) |
| Validation | Zod, shared between client forms and server actions |
| Forms | Server actions with `useActionState`; React Hook Form is available for the multi-step funnel |
| Analytics | GA4 (PII-filtered), Vercel Analytics, Vercel Speed Insights |
| Tests | Vitest |

Everything degrades gracefully. With no Supabase, GA4, email, SMS, booking, or
fal.ai credentials configured, the public site still builds and runs — the
features that need those credentials report themselves as unavailable instead of
crashing.

---

## Local installation

Requires **Node.js 22+**.

```bash
git clone <this-repo>
cd homesweethome
npm install
cp .env.example .env.local   # fill in what you have; blanks are fine to start
npm run dev
```

Open <http://localhost:3000>. The public site works immediately. Sign-in at
`/login` needs Supabase (below).

---

## Environment variables

Full annotated list in [`.env.example`](./.env.example). The two rules that
matter:

1. **`NEXT_PUBLIC_*` is public.** Next.js inlines these into the browser bundle.
   Only put things there that you would print on a billboard. The Supabase anon
   key belongs there; the service-role key absolutely does not.
2. **Everything else is server-only.** Server secrets are read exclusively
   through `src/lib/env.server.ts`, which imports `server-only` — so importing
   it from a client component is a *build error*, not a production leak.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical origin for metadata, sitemap, and reset links |
| `NEXT_PUBLIC_SUPABASE_URL` | For auth/CRM | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth/CRM | Public key; constrained by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | For audit log, public lead insert, seeding | **Secret.** Bypasses RLS |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | GA4 measurement ID; analytics is off when blank |
| `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` | No | Email sending; logged-not-sent when blank |
| `TWILIO_ACCOUNT_SID` / `_AUTH_TOKEN` / `_PHONE_NUMBER` | No | SMS; disabled unless all three are set |
| `CALENDLY_URL` | No | Booking provider; falls back to an in-app request |
| `FAL_KEY` | No | Optional marketing image generation |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Address autocomplete; restrict by HTTP referrer |

---

## Supabase setup

1. Create a project at <https://supabase.com/dashboard>. Choose a region close to
   Michigan (`us-east-1` is a reasonable default).
2. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (treat as a password)
3. Under **Authentication → Providers**, keep **Email** enabled and turn
   **"Enable sign-ups"** *off*. This is an internal tool: accounts are created by
   an administrator, never self-served.
4. Under **Authentication → URL Configuration**, set the Site URL to your
   `NEXT_PUBLIC_APP_URL` and add `<APP_URL>/reset-password` as a redirect URL, so
   password-reset links land in the right place.
5. Run the migrations (below).

### Creating the first administrator

The schema deliberately grants **no role** to a new account, so a freshly
created user can sign in and sees only the "your account is not set up yet"
screen. Bootstrap the first admin once, from the Supabase SQL editor:

```sql
-- 1. Create the user in Authentication → Users (set a strong password).
-- 2. Then, with that user's email:
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where lower(email) = lower('you@example.com');
```

After that, all further role changes happen through the app and are audit
logged.

---

## Running migrations

Migrations live in [`supabase/migrations`](./supabase/migrations), numbered and
applied in order.

**Option A — Supabase CLI (recommended):**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B — SQL editor:** paste the contents of each file in
`supabase/migrations`, in filename order, into the Supabase SQL editor and run
them.

After applying, regenerate the TypeScript types so the data layer matches the
database:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
```

### Verifying RLS is on

Row Level Security is the real access boundary, so it is verified against a
real database rather than reviewed by eye:

```bash
npm run test:rls
```

That spins up a throwaway Postgres, stubs the objects Supabase provides (the
`auth` schema, `auth.uid()`, and the `anon` / `authenticated` / `service_role`
roles), applies every migration in order, and asserts what each role can and
cannot see — including that a closing specialist cannot reach another
specialist's lead, that the analyst cannot write, that nobody can forge or
rewrite an audit entry, and that `anon` is refused outright. It needs
`postgresql-16` on the machine.

Against your actual project, confirm the same thing directly:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every row must show `rowsecurity = true`. Also check **Database → Advisors** in
the Supabase dashboard, which flags tables exposed without policies.

---

## Seed data

Demo data is introduced in Phase 5, alongside the remaining CRM tables it
populates. It will be a script run with `npm run seed`, using the service-role
key, and it will only ever be pointed at a development project — the entries
are fictional and clearly labelled as demo content.

In the meantime the funnel itself generates realistic records: submitting it
against a configured Supabase project creates a property, a lead with its
score and reason breakdown, consent records, a funnel session, and a
tier-appropriate follow-up task.

---

## Deploying to Vercel

1. Import the repository at <https://vercel.com/new>. The framework preset is
   detected automatically; no build-command override is needed.
2. Add every variable from `.env.example` under **Settings → Environment
   Variables**. Set `SUPABASE_SERVICE_ROLE_KEY` as a **sensitive** variable, and
   scope it to Production and Preview only — never expose it to a local
   `.env.example` committed anywhere.
3. Set `NEXT_PUBLIC_APP_URL` per environment to the correct origin. Getting this
   wrong sends password-reset links to the wrong host.
4. Leave `NEXT_PUBLIC_GA_MEASUREMENT_ID` blank in Preview so preview traffic does
   not pollute production analytics.
5. Add your domain under **Settings → Domains** and update the Supabase Site URL
   and redirect URLs to match.
6. Vercel Analytics and Speed Insights are already wired into the root layout;
   enable them in the Vercel dashboard for data to flow.

---

## GA4 setup

1. In Google Analytics, create a GA4 property and a **Web** data stream for your
   domain. Copy the Measurement ID (`G-XXXXXXXXXX`) into
   `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
2. That is the whole setup. The loader in
   `src/components/analytics/google-analytics.tsx` renders nothing when the
   variable is blank, and is configured with `anonymize_ip`, Google Signals off,
   and ad personalisation off.
3. Send events through `trackEvent()` in `src/lib/analytics/ga.ts` — never
   `gtag()` directly. That helper runs every parameter through `sanitizeParams`,
   which drops anything resembling a name, email, phone, address, ZIP, financial
   figure, internal note, or lead score. There are tests asserting this in
   `tests/analytics.test.ts`.
4. Verify with GA4 **DebugView** plus the browser network tab: confirm that a
   funnel submission produces events and that no request payload contains
   seller details.

---

## The seller funnel

Ten screens across seven routes under `/sell-my-house`, entered from
`/sell-my-house/start`. One question per screen, `Step N of 8` progress, Back
and Continue throughout, and validation on submit rather than on every
keystroke.

A few behaviours worth knowing about:

- **Nothing is sent to the server until the contact step.** Answers live in
  `localStorage` on the homeowner's own device until they provide contact
  details and consent. Refreshing, losing signal, or taking a phone call
  mid-form does not lose progress.
- **"I don't have the exact address"** swaps the street field for a
  description, so an inherited-property enquiry does not dead-end.
- **The score is never shown, and never leaves the server** beyond a single
  `bookable` boolean. `scripts/funnel-e2e.mjs` asserts that no score, tier, or
  scoring vocabulary appears in the page or in the session handoff.
- **Booking is never gated on score alone.** A "Request a Call" action is
  available on every path.
- **Post-submission actions use a signed capability token**, not a lead ID, so
  an appointment request cannot be pointed at somebody else's lead.

The public submission endpoint is the only internet-facing write path, so it
carries a honeypot field, a minimum time-on-form check, per-IP rate limiting,
strict server-side validation, and a fully server-constructed insert.

> **Rate limiting is in-process.** That holds for a single instance but not
> across serverless instances. Swap `src/lib/security/rate-limit.ts` for a
> shared store (Upstash Redis, Vercel KV, or a Postgres table with a TTL)
> before launch — the interface is deliberately narrow so the change touches
> that file only.

## Lead scoring

Rules live in the `scoring_rules` table as versioned JSON, so an admin can tune
weights and thresholds without a deploy, and every score records the rule
version that produced it. Scoring starts from a neutral baseline of 50 and is
clamped to 0–100; each point awarded carries its own reason, so a score can
always be shown back to the team as "here is why".

`src/lib/leads/scoring.ts` holds the model and `tests/scoring.test.ts` covers
it, including the fair-housing constraint: the permitted input list is asserted
explicitly, so adding a demographic field to `ScoringInput` fails the suite.

## Booking integration setup

Booking sits behind an abstraction so the provider can change without touching
the funnel.

- **With a provider:** set `CALENDLY_URL` (or another scheduling URL) and the
  booking step renders the provider's scheduler.
- **Without one:** the funnel falls back to an in-app appointment request that
  creates a task in the CRM, so no lead is ever dropped because an integration
  is missing.

A "request a call" fallback is always available regardless of provider or lead
score — a homeowner is never blocked from reaching a person.

---

## Security architecture overview

Full detail in [SECURITY.md](./SECURITY.md). In brief:

- **Authentication** is Supabase Auth, email and password, sign-ups disabled.
  Sessions are validated with `getUser()` (which revalidates the JWT against the
  auth server), never with an unverified cookie read.
- **Authorization runs in three independent layers**, and the first two are
  conveniences:
  1. *Edge proxy* (`src/proxy.ts`) — turns away unauthenticated `/app/*`
     requests early and sets `noindex` and no-store headers.
  2. *Server-side checks* (`src/lib/auth/session.ts`) — `requireUser()` and
     `requirePermission()` run on every protected route and server action.
  3. *Row Level Security* — Postgres policies decide what any given session can
     actually read or write. Changing a URL or hand-crafting an API request
     gains nothing, because the database itself refuses.
- **The service-role key is server-only**, guarded by `server-only` so an
  accidental client import fails the build. It is used for exactly three things:
  public lead inserts, audit-log writes, and seeding.
- **The audit log is append-only.** `audit_logs` has a read policy for admins and
  *no* insert, update, or delete policy for any authenticated role — entries can
  only be written by the service role and can never be edited or removed through
  the API.
- **Internal routes are never indexed**: `robots.txt` disallows them, the proxy
  sets `X-Robots-Tag: noindex`, and each route sets `robots: { index: false }`.
- **No PII reaches GA4** — enforced in code and covered by tests.

---

## Project structure

```
src/
  app/
    (marketing)/       Public, indexable pages and their shared chrome
    (auth)/            Sign-in, forgot password, reset password + auth actions
    app/               Internal CRM. Every route requires an authenticated role
    forbidden/         Shown when a signed-in user lacks permission
    robots.ts          Keeps crawlers out of internal routes
    sitemap.ts         Public pages only
  components/
    ui/                Design-system primitives (Button, Card, Field, ...)
    marketing/         Public site components
    app/               CRM shell, navigation, dashboard pieces
    analytics/         GA4 loader
  config/              Brand, disclosures, service areas, content, CRM nav
  lib/
    auth/              Roles and permissions, session helpers, audit logging
    supabase/          Browser / server / service-role clients, DB types
    analytics/         GA4 event helper with the PII filter
    validation/        Zod schemas shared by client and server
  proxy.ts             Edge auth gate and security headers
supabase/migrations/   Numbered SQL migrations, including all RLS policies
tests/                 Vitest suites
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (also typechecks) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests, once |
| `npm run test:watch` | Vitest, watching |
| `npm run test:rls` | Apply every migration to a throwaway Postgres and assert the RLS policies |
| `npm run test:e2e` | Build, serve, and walk the seller funnel in a real browser |

---

## What remains before launch

The full list is in [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md). The items that
block a real launch hardest:

- **Every legal page is an unreviewed draft.** Privacy, Terms, and Disclosures
  say so on the page itself. They need counsel review for Michigan and for this
  business before any real traffic arrives.
- **TCPA / SMS compliance review** must happen before a single text is sent.
- **All contact details are placeholders** — phone, email, and address in
  `src/config/site.ts`.
- **Testimonials are labelled demo content** and must be replaced with genuine,
  permissioned reviews or removed.
- **Production RLS verification** against the live project, not just the
  migration files.
- **Supabase sign-ups must be disabled** and the first admin bootstrapped
  deliberately.
