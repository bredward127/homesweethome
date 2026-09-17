# Product Decisions

The reasoning behind the funnel, the lead scoring model, the pipeline, and the
contract workflow. Written so the next person can tell which choices are
load-bearing and which are adjustable.

---

## Positioning

Home Sweet Home is deliberately **not** built like a typical cash-buyer site.
Countdown timers, "we buy ugly houses" styling, and guaranteed-offer language
were all rejected — not only because they are non-compliant risks, but because
the people who fill in this form are usually in the middle of something
difficult. A calm, plainly worded site converts a different and better-qualified
kind of lead, and it is the only defensible way to treat someone who is
inheriting, divorcing, or falling behind on payments.

Concretely, that means:

- **No guaranteed offer, closing, price, or timeline** anywhere in the copy.
- **No foreclosure-rescue framing.** We explicitly disclaim it.
- **The FAQ answers "will I definitely get an offer?" with "no."** Saying the
  uncomfortable thing up front is what makes the rest credible.
- **The Disclosures page explains how we make money**, including that an offer
  will typically sit below a fully marketed agent sale. Homeowners work that out
  anyway; being first to say it is worth more than the leads it costs.

---

## The funnel

### One question per screen, ten screens

A single long form converts worse on mobile and reads as an interrogation. Ten
short screens (intro, address, basics, condition, situation, timeline, contact,
review, booking decision, thank-you) each ask one thing, show `Step N of 8`
progress, and allow going back.

The eight numbered steps sit on seven routes: address and basics share
`/sell-my-house/property`, distinguished by a `?stage=basics` parameter. That
keeps the agreed URL structure while still giving each question its own screen,
and using a query parameter rather than component state means the browser Back
button does what a homeowner expects.

### Almost everything is optional

Only contact details and enough location information to tell whether the
property is in a service area are required. Optional questions are visibly
labelled "Optional". The situation screen — the most personal one — carries
explicit permission to share less: *"You can share only what you're comfortable
sharing."*

The trade is deliberate. Fewer required fields means thinner data on some leads,
and a caller can ask the rest by phone. Forcing someone to disclose a divorce to
a web form to reach a phone number is not a trade worth making.

### Autosave before contact capture, persist after

Answers are kept in local storage up to the contact screen, so a refresh or an
interruption does not lose progress. Nothing touches the server until the
homeowner has given contact details and consent — before that, we have not been
invited to keep anything.

### "I don't have the exact address"

A real case: someone inherits a property and knows the city but not the house
number. That checkbox swaps the address fields for city, ZIP, and a free-text
description, so the funnel does not dead-end on a detail people legitimately
lack.

### Booking is never gated on score alone

A score above the configurable threshold surfaces the booking step. Below it,
the homeowner sees a warm confirmation *and* a "Request a Call" action. There is
always a path to a human. Blocking someone from reaching a person because a
heuristic scored them low is both bad service and a bad filter — the model is
wrong often enough to matter.

### The score is never shown

The homeowner sees a next step, never a score, a tier, or the logic. Publishing
it would invite gaming and, worse, would tell someone their circumstances scored
them poorly.

This is enforced, not just intended: the submit action returns a `bookable`
boolean and nothing else, and the browser e2e check fails if any scoring
vocabulary appears in the rendered page or the session handoff.

### Photos are asked for after submission, not during

Uploading files is the slowest step in any mobile form and the easiest place to
lose someone. The condition screen says photos are welcome and that we will ask
later; the thank-you screen actually invites them. Nobody has to go hunting
through their camera roll while a half-finished form waits.

### Validation runs on submit, not on every keystroke

Correcting someone's phone number while they are still typing it is hostile,
and error text that appears and vanishes is worse than none. Errors appear when
a step is submitted, focus moves to the first field that needs attention, and
the message clears as soon as that field changes.

Every required field also carries its own wording for the case where it was
never touched at all. Zod's default there is "Invalid input: expected string,
received undefined", which is unacceptable on a form asking about a divorce —
a regression test asserts no schema can produce developer language.

### Nothing is stored server-side before consent

The draft lives in `localStorage` until the contact step. Before someone has
given us their details and agreed to be contacted, we have not been invited to
keep anything, so we do not. It also means a refresh or an interruption does
not lose their progress — which matters, because the people filling in this
form are frequently distracted.

Once the lead is submitted, the local draft is deleted.

### Post-submission actions use a capability token, not a lead ID

The booking and request-a-call actions need to name a lead. Putting the lead ID
in the browser would let anyone enumerate UUIDs and attach appointment requests
to other people's leads, and a public "read this lead" endpoint would be worse.

So the submit action issues a short-lived HMAC-signed token binding the lead ID
to an expiry, and the follow-up actions accept only that. There is no public
endpoint that reads a lead.

### Bot mitigation, but no CAPTCHA

A honeypot field and a minimum time-on-form check, both invisible. No CAPTCHA:
someone in the middle of a foreclosure should not have to solve a puzzle to
reach us, and a CAPTCHA would exclude some people entirely. The time check is
deliberately forgiving — a missing or future-dated start time is allowed
through rather than blocking a real person whose clock is wrong.

---

## Lead scoring

### Explainable and stored as data, not code

Rules live in the `scoring_rules` table as JSON, versioned, with exactly one
active ruleset enforced by a partial unique index. Every score stores its total,
tier, the per-signal reason breakdown, when it was scored, and **which rule
version produced it**. That last field is what makes a score from three months
ago interpretable after the rules have changed.

Admins tune weights and thresholds in Settings without a deploy. Every change is
audit logged.

### Starting weights

Positive: ASAP timeline +20 · vacant +15 · inherited +15 · financial pressure
+15 · major repairs +12 · 1–3 month timeline +12 · tired landlord +10 · in
service area +10 · relocation +8 · sole decision-maker +8 · valid phone and
email +5.

Negative: outside service area −20 · just exploring −10 · 6+ month timeline −8 ·
missing usable address −8 · multiple decision-makers −3.

Tiers: **Hot** 70–100 · **Warm** 45–69 · **Nurture/Review** 0–44.

### What scoring deliberately excludes

**No protected characteristic is collected or scored — ever.** Not race, colour,
religion, sex, familial status, national origin, or disability, and no proxy for
any of them. This is a hard constraint on the schema, not a preference. Scoring
inputs are limited to property attributes, timeline, decision-making structure,
and service-area coverage.

### Overlapping signals score once

Someone who ticks "financial pressure", "behind on payments", and "avoiding
foreclosure" is describing one situation, not three, so those three motivations
award their points once. Similarly, a vacant occupancy and a "property is
vacant" motivation are the same fact arriving twice.

"Just exploring" is only held against a lead when it is not paired with a
concrete timeline — someone exploring options *and* needing to move within 30
days is not a low-intent lead.

### Scoring starts at 50, not 0

A lead with no strong signal either way should land in Warm and get worked, not
sink to the bottom of the pipeline because it failed to trigger anything. The
baseline is 50, signals move it from there, and the total is clamped to 0–100.

### Signals that flag rather than disqualify

- **Tenant occupied** flags for review but costs no points. It complicates a
  deal; it does not make it a bad one.
- **Multiple decision-makers** costs only −3. It slows things down; it is not
  disqualifying, and treating it as such would lose good inherited-property
  leads where siblings share title.

### Automations by tier

- **Hot** — queue for immediate call, task due within 15 minutes, notify the
  assigned closer.
- **Warm** — same-day or next-business-day follow-up task.
- **Nurture** — nurture queue with a configurable follow-up interval.

All intervals are admin-configurable in `funnel_settings`.

---

## Lead pipeline

Fifteen statuses: New → Attempting Contact → Contacted → Qualified →
Appointment Booked → Appointment Completed → Offer Preparation → Offer Sent →
Negotiating → Under Contract → Closed/Assigned or Closed/Purchased, with
Dead/Disqualified, Nurture, and Lost as exits.

Two design notes:

- **Attempting Contact is distinct from Contacted.** Most leads sit in the gap
  between "we called" and "we spoke", and collapsing the two hides the single
  biggest operational leak in wholesaling — speed to actual contact.
- **Closed/Assigned and Closed/Purchased are separate.** They are different
  businesses with different economics, and merging them makes conversion
  reporting meaningless.

**Nurture is a status, not a graveyard.** A homeowner who says "not for six
months" is a real lead on a longer clock.

---

## Contract workflow

Twelve statuses: Draft → Internal Review → Sent for Signature → Partially Signed
→ Fully Executed → Inspection/Due Diligence → Title/Escrow → Assignment
Marketing → Assigned → Closed, with Cancelled and Expired as exits.

### This module tracks documents; it does not generate them

A visible internal banner sits across the module:

> Use approved state- and transaction-specific documents reviewed by qualified
> legal counsel. This application does not provide legal advice or create legal
> agreements.

No contract templates are generated, and none will be without an explicit
instruction and legal sign-off. The module's job is tracking: parties, dates,
deadlines, money, responsibility, and where the signed PDF lives.

### Deadlines are first-class

`contract_deadlines` is a table, not a set of columns, with alerting at 7 days,
3 days, and overdue. A missed inspection deadline is one of the few genuinely
expensive failures in this business, so deadlines get their own model, their own
calendar view, and their own alerts.

### Both responsible parties are named

Every contract carries a responsible acquisition manager *and* a responsible
disposition manager. Deals stall in the handoff between them; naming both makes
the handoff a record rather than a conversation.

---

## Architecture decisions

### Three authorization layers, only one of which is the boundary

Edge proxy, server-side checks, and Row Level Security. The proxy is a redirect
convenience, server checks stop pages rendering, and **RLS is the actual
boundary**. Any of the first two could be bypassed by a request path that does
not go through them; the database cannot be.

### New accounts get no role

A created-but-not-configured account has zero access and lands on a page
explaining that an admin must grant a role. The alternative — a default role —
fails open, which is the wrong direction for a system holding this data.

### Settings live in the database, defaults live in config

Service areas, funnel settings, and scoring rules are database-backed so admins
can change them without a deploy. `src/config/` holds the seed values and the
fallback, so the public site renders even if the database is unreachable.

### Everything degrades without credentials

No Supabase, GA4, email, SMS, booking, or fal.ai key? The site still builds and
runs, and each feature reports itself unavailable. This keeps local development
frictionless and means a missing production variable degrades one feature rather
than taking down the funnel.

### Google Drive is not the system of record

Documents live in private Supabase Storage with signed URLs and audit logging.
A Drive export/sync adapter is an explicitly deferred, server-side, authorized
addition. Making a consumer file-sharing product the home for signed purchase
agreements is a permissions accident waiting to happen.

### fal.ai is opt-in and quarantined

Marketing imagery only, disabled without a key, admin-initiated, and
approval-gated before anything appears publicly. Seller PII, addresses,
contracts, and documents are never sent to it. The site's usability never
depends on a generated image — `ImagePlaceholder` renders a CSS-drawn fallback
so no layout depends on an asset existing.

---

## Deliberate non-goals

- **Not a consumer property search site.** No listings, no browsing, no map
  search.
- **No automatic SMS.** Not without explicit, separately recorded consent and a
  TCPA compliance review.
- **No legal document generation.** See above.
- **No dark patterns.** No fake scarcity, no countdown timers, no expiring
  offers, no pre-checked consent boxes, no hiding the unsubscribe path.
