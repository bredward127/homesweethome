# Security Architecture

How Home Sweet Home protects homeowner information and internal deal data.

This describes what is built as of **Phase 2**. Sections covering modules not
yet built state the design that later phases must implement, and say so
explicitly.

---

## Threat model in one paragraph

The sensitive assets here are homeowner personal information (name, phone,
email, property address), seller circumstances that people share in confidence
(financial pressure, divorce, inheritance), internal deal economics, and signed
contracts. The realistic adversaries are: an unauthenticated visitor guessing
internal URLs or calling the API directly; a low-privilege staff account trying
to reach records above its role; a scraper or bot hammering the public lead
form; and accidental disclosure through analytics, search indexing, or a
credential leaking into a client bundle. Every control below maps to one of
those.

---

## Authentication

- **Supabase Auth**, email and password, for internal users only.
- **Self-service sign-up is disabled** at the Supabase project level. Accounts
  are created by an administrator. There is no public registration path.
- **Sessions are verified, not assumed.** Every check uses
  `supabase.auth.getUser()`, which revalidates the JWT against the Supabase auth
  server. `getSession()` — which trusts the cookie as-is — is not used for any
  authorization decision.
- **Session refresh** happens in the edge proxy (`src/proxy.ts`) on every
  matched request, so token expiry is enforced predictably and a revoked session
  stops working on the next navigation.
- **Sign-out is a POST** through a server action, so it cannot be triggered by a
  crafted link or a prefetch.
- **Password policy** on reset: minimum 12 characters with upper, lower, and
  numeric characters. Sign-in deliberately does *not* apply the policy, because
  doing so would disclose it to anyone probing the login form.
- **No user enumeration.** A failed sign-in returns one generic message, and
  password reset returns the same confirmation whether or not the address
  exists.
- **Deactivated accounts are locked out immediately.** `getCurrentUser()` treats
  a profile with `is_active = false` or a set `archived_at` as no session at
  all, and `current_user_roles()` in the database returns no roles for such a
  user, so RLS denies them too.

---

## Authorization

Three independent layers. The first two are conveniences; the third is the
boundary.

### 1. Edge proxy — `src/proxy.ts`

Redirects unauthenticated `/app/*` requests to `/login` with a validated return
path, and sets security headers. **This is not a security boundary.** It exists
to avoid rendering a protected page and to give a decent redirect experience.

### 2. Server-side checks — `src/lib/auth/session.ts`

`requireUser()`, `requirePermission()`, and `requireAnyPermission()` run inside
every protected layout, page, and server action. `authorize()` is the
non-redirecting variant for mutations, returning a typed error instead of
throwing a redirect mid-write.

A signed-in user holding **no role** is sent to `/forbidden`. New accounts start
with no roles by design, so a created-but-not-yet-configured account has zero
access rather than default access.

### 3. Row Level Security — `supabase/migrations/`

Postgres policies decide what any session can read or write. Guessing a UUID,
editing a URL, or calling the REST API directly with the anon key gains nothing:
the database refuses.

RLS is enabled on **every** table in the `public` schema, each with explicit
policies, and this is asserted rather than assumed — `npm run test:rls` applies
every migration to a throwaway Postgres and checks both the policy behaviour
and that no table is left unprotected. The `anon` role additionally has all privileges revoked on internal
tables, so an anonymous caller is denied at the grant level before policies are
even evaluated.

Policy decisions consult `SECURITY DEFINER` helper functions
(`current_user_roles()`, `has_role()`, `is_admin()`, `is_staff()`) with
`search_path` pinned to `public, pg_temp`. Two reasons: it lets policies on
`user_roles` consult `user_roles` without recursing through their own policies,
and pinning the search path defeats search-path hijacking. `EXECUTE` on these
functions is revoked from `public` and `anon` and granted only to
`authenticated`.

### Roles

| Role | Scope |
| --- | --- |
| **Admin** | Everything: settings, team, roles, scoring, templates, audit log |
| **Acquisition Manager** | Leads, properties, offers, appointments, contracts. No team or security settings |
| **Closing Specialist** | Only their assigned leads, plus tasks, appointments, contracts they own |
| **Disposition Manager** | Contracted properties, buyer database, disposition pipeline |
| **Analyst** | Read-only across permitted records and dashboards |

The permission matrix lives in `src/lib/auth/roles.ts` and is covered by tests
asserting the invariants that matter: no non-admin holds `settings:write`,
`team:write`, `scoring:write`, or `audit:read`; the analyst holds no write
permission at all; and a closing specialist cannot read the full lead pipeline.

Two role-escalation guards sit in the database itself: only admins may insert or
delete `user_roles`, and the delete policy additionally requires
`user_id <> auth.uid()` — an admin cannot quietly strip roles from their own
account to manipulate the trail.

---

## Data protection

### Secrets

- Server secrets are read only through `src/lib/env.server.ts`, which imports
  `server-only`. Importing it from a client component is a **build failure**, not
  a runtime leak.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely and is used in exactly three
  places: inserting a lead from the public funnel, writing audit entries, and
  the seed script. It is never handed a user-supplied filter, and its results
  are never returned raw to a public caller.
- Only `NEXT_PUBLIC_*` values reach the browser. The Supabase anon key is among
  them and is safe there precisely because RLS constrains it.

### Documents *(design; implemented in Phase 4)*

- Stored in **private** Supabase Storage buckets. No bucket is public.
- Access is exclusively via short-lived signed URLs minted server-side after an
  authorization check.
- Every upload and every download is audit logged.

### Search indexing

Internal surfaces are kept out of indexes three different ways, because a single
missed control is a disclosure:

1. `robots.txt` disallows `/app`, `/login`, `/forgot-password`,
   `/reset-password`, `/forbidden`, and `/api/`.
2. The edge proxy sets `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
   and `Cache-Control: private, no-store` on those routes.
3. Each internal route sets `robots: { index: false, follow: false }` in its
   metadata.

The sitemap lists public pages only.

### Response headers

Set for every matched request in the edge proxy: `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options:
DENY`, and a `Permissions-Policy` denying camera, microphone, and geolocation.

---

## Audit logging

`audit_logs` is **append-only from the application's perspective**: admins have a
`SELECT` policy, and there is deliberately **no** `INSERT`, `UPDATE`, or `DELETE`
policy for any authenticated role. Entries can only be written by the service
role, and can never be edited or deleted through the API by anyone.

Logged today: sign-in, failed sign-in, sign-out, password reset requested,
password changed, lead created from the public funnel, and appointment
requested from the funnel.

Lead audit entries carry the reference, tier, service-area match, and rule
version — identifiers and outcomes, never the seller's name, contact details,
or the free text they wrote.

Logged as the relevant modules land: lead status changes, assignment changes,
contract status changes, document uploads and downloads, data exports, role
grants and revocations, settings and scoring-rule changes, and archive/restore
actions.

Each entry records the actor, the action, the entity, a summary, structured
metadata, a **hashed** IP, and the user agent. The IP is salted and hashed
(never stored raw), so entries remain distinguishable without retaining an
identifier. Entry metadata must never contain seller PII, document contents,
message bodies, or credentials — identifiers and changed field names only.

---

## Sensitive data handling

- **Analytics never receives PII.** All GA4 events go through `trackEvent()`,
  which runs parameters through `sanitizeParams()`. That filter drops any key
  containing a name, email, phone, address, ZIP, financial figure, internal note,
  contract reference, lead score, or IP. `tests/analytics.test.ts` asserts it.
- **The lead score is internal only.** A seller is shown a next step, never a
  score, a tier, or the qualification logic behind it.
- **Consent is recorded, not assumed.** Communication consent, optional SMS
  consent, the timestamp, and the policy version in effect are stored with the
  lead. Consent is never a condition of purchase, and SMS consent is collected
  separately from general contact consent.
- **Fair housing.** No protected characteristic is collected anywhere, and none
  may ever be added to the scoring model. Scoring inputs are restricted to
  property attributes, timeline, decision-making structure, contact
  completeness, and service-area coverage. `tests/scoring.test.ts` asserts the
  permitted input list explicitly, so adding a demographic field to
  `ScoringInput` fails the suite, and separately asserts that no signal key or
  label names a protected characteristic.
- **Soft deletion.** CRM records archive (`archived_at`) rather than hard-delete,
  preserving the trail.

---

## Public endpoint protection

The public lead submission endpoint is the only internet-facing write path, so
it carries every control at once:

- **Rate limiting** per hashed IP (5 submissions per 10 minutes), applied
  before any other work.
- **A honeypot field** (`company_website`) that is off-screen, `aria-hidden`,
  and `tabindex="-1"`, so no person and no screen reader will ever fill it.
- **A minimum time-on-form check** (3 seconds). Deliberately forgiving: a
  missing, unparseable, or future-dated start time is allowed through rather
  than blocking someone whose clock or storage misbehaved.
- **Strict server-side Zod validation** with size caps on every free-text
  field, re-run on the server regardless of what the client checked.
- **A fully server-constructed insert.** No user-supplied column name, table,
  or filter reaches a query; the payload is parsed into a known shape and each
  field is written explicitly.
- **One generic failure message.** A rejected bot is never told which check
  caught it.

It writes through the service-role client because the submitter is anonymous
and `anon` has no privileges on these tables at all.

> **Known limitation.** Rate limiting is in-process
> (`src/lib/security/rate-limit.ts`). On serverless each instance keeps its own
> counters, so the effective limit is higher than configured. Swap it for a
> shared store before launch; the interface is narrow so the change is local.

## Post-submission capability tokens

After submitting, a homeowner can request a call or an appointment. Those
actions need to name their lead — but a raw lead ID in the browser would let
anyone enumerate UUIDs and attach appointments to other people's leads.

So the submit action issues an **HMAC-signed token** binding the lead ID to an
expiry (2 hours), and the follow-up action accepts only that token. Signature
comparison is constant-time and length-checked; expiry is validated after the
signature so nothing is learned from the ordering. The token grants exactly one
narrow capability and reveals nothing about the lead.

There is no public endpoint that reads a lead by ID, deliberately.

## What the browser is never told

The lead score is internal. The submit action returns a **`bookable` boolean
and nothing else** — no score, no tier, no reason breakdown, no thresholds.
`scripts/funnel-e2e.mjs` asserts that no scoring vocabulary appears in the
rendered page or in the sessionStorage handoff, so a future change that leaks
it fails the suite.

The homeowner sees a next step. They never see a number, and they are never
told that a heuristic ranked them.

## Consent as evidence

Consent records are **append-only**. `lead_consents` has a read policy for
users who can read the lead and *no* update or delete policy for anyone, so a
consent record cannot be altered or removed through the API — verified by
`npm run test:rls`.

Each row stores the exact wording agreed to, the policy version in effect, the
timestamp, a hashed IP, and the user agent. Contact consent and SMS consent are
separate rows: bundling them would make the SMS consent worthless for TCPA
purposes. Neither box is ever pre-checked.

---

## Known integration boundaries

| Integration | Boundary |
| --- | --- |
| **GA4** | Aggregate behaviour only. PII filtered in code and tested. `anonymize_ip` on, Google Signals and ad personalisation off |
| **Vercel Analytics / Speed Insights** | Aggregate performance and traffic. No custom PII properties are sent |
| **Email (Resend)** | Disabled without credentials — intended sends are logged, not transmitted |
| **SMS (Twilio)** | Disabled without all three credentials. Never sends without explicit recorded SMS consent |
| **Booking (Calendly)** | The homeowner's name and email may reach the provider when they book. Property details, situation, and lead score never do |
| **fal.ai** | Generic marketing imagery only. Seller PII, property addresses, contracts, and documents are never sent. Admin must initiate generation, and an asset must be approved before it appears publicly. Fully disabled without `FAL_KEY` |
| **Google Drive** | Deliberately **not** the system of record. Documents live in private Supabase Storage. A future export/sync adapter would be server-side and authorized; until then there is no Drive connection at all |

---

## Reporting a vulnerability

Email the address in `src/config/site.ts` (a placeholder until launch) with a
description and reproduction steps. Please do not open a public issue for a
security report.
