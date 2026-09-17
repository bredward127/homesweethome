-- =====================================================================
-- Home Sweet Home — Phase 2: seller funnel and lead capture
--
-- Properties, leads, scores, funnel sessions, consent records,
-- assignments, tasks, and appointments.
--
-- Access model, in one line: the public funnel writes through the
-- SERVICE ROLE only (server-side, never the browser), and every read is
-- gated by the role helpers from migration 0001. No table here grants
-- anything to `anon`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums — these mirror src/lib/leads/types.ts exactly.
-- ---------------------------------------------------------------------

create type public.property_type as enum (
  'single_family', 'duplex', 'multi_family', 'condo_townhome',
  'mobile_manufactured', 'land', 'other'
);

create type public.occupancy_status as enum (
  'owner_occupied', 'tenant_occupied', 'vacant', 'unknown'
);

create type public.property_condition as enum (
  'move_in_ready', 'minor_updates', 'major_repairs', 'full_renovation', 'not_sure'
);

create type public.timeline_bucket as enum (
  'asap', '1_3_months', '3_6_months', 'over_6_months', 'researching'
);

create type public.decision_maker_status as enum ('sole', 'shared', 'unsure');

create type public.mortgage_status as enum ('yes', 'no', 'unsure', 'prefer_not_to_say');

create type public.contact_method as enum ('phone', 'text', 'email');

create type public.contact_time as enum ('morning', 'afternoon', 'evening', 'anytime');

create type public.lead_tier as enum ('hot', 'warm', 'nurture');

create type public.lead_status as enum (
  'new', 'attempting_contact', 'contacted', 'qualified',
  'appointment_booked', 'appointment_completed', 'offer_preparation',
  'offer_sent', 'negotiating', 'under_contract', 'dead_disqualified',
  'nurture', 'closed_assigned', 'closed_purchased', 'lost'
);

create type public.task_type as enum (
  'call', 'text', 'email', 'appointment', 'document', 'offer', 'title', 'follow_up', 'other'
);

create type public.task_priority as enum ('low', 'medium', 'high');

create type public.appointment_status as enum (
  'requested', 'scheduled', 'completed', 'cancelled', 'no_show'
);

-- ---------------------------------------------------------------------
-- properties
--
-- Created from the funnel alongside the lead. Address components are
-- stored separately so ZIP can drive service-area matching and so the
-- record is still useful when the exact street address is unknown.
-- ---------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  street text,
  city text not null,
  state text not null default 'MI',
  postal_code text not null,
  county text,
  -- Set when the seller could not supply an exact address.
  address_unknown boolean not null default false,
  property_description text,

  property_type public.property_type,
  bedrooms integer check (bedrooms >= 0 and bedrooms <= 50),
  bathrooms numeric(4, 1) check (bathrooms >= 0 and bathrooms <= 50),
  square_feet integer check (square_feet > 0 and square_feet <= 100000),
  occupancy public.occupancy_status,
  is_primary_residence text check (is_primary_residence in ('yes', 'no', 'unsure')),
  condition public.property_condition,
  repair_areas text[] not null default '{}',
  condition_notes text,

  -- Analysis fields, filled in by the team rather than the funnel.
  estimated_value numeric(12, 2),
  estimated_repair_cost numeric(12, 2),
  mortgage_balance numeric(12, 2),
  parcel_number text,
  internal_notes text,

  -- Resolved at insert time from the active service areas.
  service_area_id uuid references public.service_areas (id) on delete set null,
  in_service_area boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz
);

create index properties_postal_code_idx on public.properties (postal_code);
create index properties_city_idx on public.properties (lower(city));
create index properties_created_at_idx on public.properties (created_at desc);
create index properties_service_area_idx on public.properties (service_area_id);
create index properties_active_idx on public.properties (created_at desc) where archived_at is null;

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- leads
--
-- Commonly filtered funnel answers are normalised into columns; the full
-- raw answer set is kept on lead_funnel_sessions for auditability.
-- ---------------------------------------------------------------------

-- Human-facing reference numbers. Created before the table because the
-- `reference` column default calls nextval() on it.
create sequence if not exists public.lead_reference_seq start with 1000;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  -- Short human reference for phone conversations, e.g. HSH-000123.
  reference text not null unique
    default 'HSH-' || lpad(nextval('public.lead_reference_seq')::text, 6, '0'),

  property_id uuid references public.properties (id) on delete set null,

  first_name text not null,
  last_name text not null,
  -- Normalised to 10 digits on insert.
  phone text not null,
  email text not null,
  preferred_contact_method public.contact_method not null default 'phone',
  best_time_to_contact public.contact_time not null default 'anytime',

  motivations text[] not null default '{}',
  situation_notes text,
  timeline public.timeline_bucket,
  decision_maker public.decision_maker_status,
  mortgage_status public.mortgage_status,
  payoff_range text,

  status public.lead_status not null default 'new',
  tier public.lead_tier,
  score integer check (score between 0 and 100),

  assigned_to uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz,

  -- Marketing attribution. Untrusted text from the query string.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text,
  first_touch_at timestamptz,
  last_touch_at timestamptz,

  source text not null default 'website_funnel',
  first_contacted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz
);


create index leads_status_idx on public.leads (status, created_at desc) where archived_at is null;
create index leads_tier_idx on public.leads (tier, created_at desc) where archived_at is null;
create index leads_assigned_to_idx on public.leads (assigned_to, status) where archived_at is null;
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_property_id_idx on public.leads (property_id);
create index leads_email_idx on public.leads (lower(email));
create index leads_phone_idx on public.leads (phone);
create index leads_utm_campaign_idx on public.leads (utm_campaign) where utm_campaign is not null;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- lead_scores
--
-- One row per scoring run. Keeping history (rather than overwriting)
-- means a score from before a rule change stays interpretable, because
-- each row records the ruleset version that produced it.
-- ---------------------------------------------------------------------

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  total integer not null check (total between 0 and 100),
  tier public.lead_tier not null,
  -- [{ key, label, points }]
  reasons jsonb not null default '[]'::jsonb,
  -- Non-scoring observations for the team.
  flags jsonb not null default '[]'::jsonb,
  rules_version integer not null,
  scored_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index lead_scores_lead_id_idx on public.lead_scores (lead_id, scored_at desc);

-- ---------------------------------------------------------------------
-- lead_funnel_sessions — one row per funnel journey
-- ---------------------------------------------------------------------

create table public.lead_funnel_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  last_step text,
  completed boolean not null default false,
  -- The complete answer set exactly as submitted, for auditability.
  raw_answers jsonb not null default '{}'::jsonb,
  landing_page text,
  referrer text,
  user_agent text,
  -- Salted hash; never a raw IP address.
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_funnel_sessions_lead_id_idx on public.lead_funnel_sessions (lead_id);
create index lead_funnel_sessions_created_at_idx on public.lead_funnel_sessions (created_at desc);

create trigger lead_funnel_sessions_set_updated_at
  before update on public.lead_funnel_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- lead_consents
--
-- Consent is evidence, so it is stored append-only: one immutable row per
-- consent given, with the policy version that was in effect at the time.
-- There is no update or delete policy for any role.
-- ---------------------------------------------------------------------

create table public.lead_consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  -- 'contact' (phone/text/email) or 'sms' (separate, optional).
  consent_type text not null check (consent_type in ('contact', 'sms')),
  granted boolean not null,
  -- The exact wording the seller agreed to.
  consent_text text not null,
  policy_version text not null,
  granted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index lead_consents_lead_id_idx on public.lead_consents (lead_id, granted_at desc);
create index lead_consents_type_idx on public.lead_consents (lead_id, consent_type);

-- ---------------------------------------------------------------------
-- lead_assignments — history of who owned a lead and when
-- ---------------------------------------------------------------------

create table public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  assigned_by uuid references public.profiles (id) on delete set null,
  reason text,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  created_at timestamptz not null default now()
);

create index lead_assignments_lead_id_idx on public.lead_assignments (lead_id, assigned_at desc);
create index lead_assignments_assigned_to_idx on public.lead_assignments (assigned_to);

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  task_type public.task_type not null default 'follow_up',
  priority public.task_priority not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,

  assigned_to uuid references public.profiles (id) on delete set null,
  lead_id uuid references public.leads (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz
);

create index tasks_assigned_to_idx on public.tasks (assigned_to, due_at) where completed_at is null;
create index tasks_due_at_idx on public.tasks (due_at) where completed_at is null and archived_at is null;
create index tasks_lead_id_idx on public.tasks (lead_id);
create index tasks_open_idx on public.tasks (due_at) where completed_at is null;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,

  status public.appointment_status not null default 'requested',
  scheduled_for timestamptz,
  duration_minutes integer default 30 check (duration_minutes > 0),
  -- 'calendly', 'in_app_request', 'manual'
  booking_provider text,
  booking_reference text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz
);

create index appointments_lead_id_idx on public.appointments (lead_id);
create index appointments_scheduled_for_idx on public.appointments (scheduled_for)
  where status in ('requested', 'scheduled');
create index appointments_assigned_to_idx on public.appointments (assigned_to, scheduled_for);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.properties            enable row level security;
alter table public.leads                 enable row level security;
alter table public.lead_scores           enable row level security;
alter table public.lead_funnel_sessions  enable row level security;
alter table public.lead_consents         enable row level security;
alter table public.lead_assignments      enable row level security;
alter table public.tasks                 enable row level security;
alter table public.appointments          enable row level security;

-- The public funnel never touches these tables from the browser; it goes
-- through a server action using the service role. Nothing is granted to
-- anon, so an anonymous REST call is refused before policies even run.
revoke all on public.properties, public.leads, public.lead_scores,
  public.lead_funnel_sessions, public.lead_consents, public.lead_assignments,
  public.tasks, public.appointments from anon;

-- ---------------------------------------------------------------------
-- Helper: may the current user see this lead?
--
-- A closing specialist sees only the leads assigned to them. Every other
-- role with lead access sees the full pipeline. This mirrors
-- canReadAllLeads() in src/lib/auth/roles.ts.
-- ---------------------------------------------------------------------

create or replace function public.can_read_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case
      when public.has_any_role(array[
        'admin', 'acquisition_manager', 'analyst', 'disposition_manager'
      ]::public.app_role[]) then true
      when public.has_role('closing_specialist') then exists (
        select 1 from public.leads l
        where l.id = target_lead_id and l.assigned_to = auth.uid()
      )
      else false
    end;
$$;

revoke execute on function public.can_read_lead(uuid) from public, anon;
grant execute on function public.can_read_lead(uuid) to authenticated;

-- leads ---------------------------------------------------------------

create policy "leads: full-pipeline roles read"
  on public.leads for select
  to authenticated
  using (
    public.has_any_role(array[
      'admin', 'acquisition_manager', 'analyst', 'disposition_manager'
    ]::public.app_role[])
  );

create policy "leads: closing specialist reads assigned"
  on public.leads for select
  to authenticated
  using (public.has_role('closing_specialist') and assigned_to = auth.uid());

create policy "leads: acquisition and admin write"
  on public.leads for all
  to authenticated
  using (public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[]));

create policy "leads: closing specialist updates assigned"
  on public.leads for update
  to authenticated
  using (public.has_role('closing_specialist') and assigned_to = auth.uid())
  with check (public.has_role('closing_specialist') and assigned_to = auth.uid());

-- properties ----------------------------------------------------------

create policy "properties: staff read"
  on public.properties for select
  to authenticated
  using (public.is_staff());

create policy "properties: acquisition and admin write"
  on public.properties for all
  to authenticated
  using (public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[]))
  with check (public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[]));

-- lead_scores ---------------------------------------------------------
-- Read-only to the application. Scores are written by the server on
-- submission and on explicit rescore, both via the service role.

create policy "lead_scores: readable with the lead"
  on public.lead_scores for select
  to authenticated
  using (public.can_read_lead(lead_id));

-- lead_funnel_sessions ------------------------------------------------

create policy "lead_funnel_sessions: readable with the lead"
  on public.lead_funnel_sessions for select
  to authenticated
  using (
    lead_id is not null and public.can_read_lead(lead_id)
  );

-- Abandoned sessions have no lead attached; only admins review those.
create policy "lead_funnel_sessions: admin reads orphans"
  on public.lead_funnel_sessions for select
  to authenticated
  using (lead_id is null and public.is_admin());

-- lead_consents -------------------------------------------------------
-- Evidence: readable, never writable through the API.

create policy "lead_consents: readable with the lead"
  on public.lead_consents for select
  to authenticated
  using (public.can_read_lead(lead_id));

-- lead_assignments ----------------------------------------------------

create policy "lead_assignments: readable with the lead"
  on public.lead_assignments for select
  to authenticated
  using (public.can_read_lead(lead_id));

create policy "lead_assignments: assigners write"
  on public.lead_assignments for insert
  to authenticated
  with check (
    public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[])
    and assigned_by = auth.uid()
  );

-- tasks ---------------------------------------------------------------

create policy "tasks: read own or supervisory"
  on public.tasks for select
  to authenticated
  using (
    assigned_to = auth.uid()
    or created_by = auth.uid()
    or public.has_any_role(array['admin', 'acquisition_manager', 'analyst']::public.app_role[])
    or (lead_id is not null and public.can_read_lead(lead_id))
  );

create policy "tasks: staff create"
  on public.tasks for insert
  to authenticated
  with check (
    public.has_any_role(array[
      'admin', 'acquisition_manager', 'closing_specialist', 'disposition_manager'
    ]::public.app_role[])
    and created_by = auth.uid()
  );

create policy "tasks: update own or supervisory"
  on public.tasks for update
  to authenticated
  using (
    assigned_to = auth.uid()
    or public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[])
  )
  with check (
    assigned_to = auth.uid()
    or public.has_any_role(array['admin', 'acquisition_manager']::public.app_role[])
  );

-- appointments --------------------------------------------------------

create policy "appointments: read own or with the lead"
  on public.appointments for select
  to authenticated
  using (
    assigned_to = auth.uid()
    or public.has_any_role(array['admin', 'acquisition_manager', 'analyst']::public.app_role[])
    or (lead_id is not null and public.can_read_lead(lead_id))
  );

create policy "appointments: staff write"
  on public.appointments for all
  to authenticated
  using (
    assigned_to = auth.uid()
    or public.has_any_role(array['admin', 'acquisition_manager', 'closing_specialist']::public.app_role[])
  )
  with check (
    public.has_any_role(array[
      'admin', 'acquisition_manager', 'closing_specialist', 'disposition_manager'
    ]::public.app_role[])
  );

-- =====================================================================
-- Seed the version 1 scoring ruleset
--
-- Mirrors DEFAULT_RULESET in src/lib/leads/scoring.ts. The application
-- reads the active row from here, falling back to the in-code default.
-- =====================================================================

insert into public.scoring_rules (version, is_active, hot_threshold, warm_threshold, notes, definition)
values (
  1,
  true,
  70,
  45,
  'Launch ruleset. Weights are a hypothesis — revisit once there is closed-deal data showing which signals actually predicted a transaction.',
  jsonb_build_object(
    'baseline', 50,
    'signals', jsonb_build_object(
      'timeline_asap',           jsonb_build_object('key', 'timeline_asap',           'label', 'Wants to sell as soon as possible',                          'points', 20),
      'timeline_1_3_months',     jsonb_build_object('key', 'timeline_1_3_months',     'label', 'Timeline of one to three months',                            'points', 12),
      'timeline_over_6_months',  jsonb_build_object('key', 'timeline_over_6_months',  'label', 'Timeline beyond six months',                                 'points', -8),
      'just_exploring',          jsonb_build_object('key', 'just_exploring',          'label', 'Just exploring options',                                     'points', -10),
      'vacant',                  jsonb_build_object('key', 'vacant',                  'label', 'Property is vacant',                                         'points', 15),
      'inherited',               jsonb_build_object('key', 'inherited',               'label', 'Inherited property',                                         'points', 15),
      'major_repairs',           jsonb_build_object('key', 'major_repairs',           'label', 'Needs major repairs or a full renovation',                   'points', 12),
      'financial_pressure',      jsonb_build_object('key', 'financial_pressure',      'label', 'Financial pressure, behind on payments, or foreclosure concern', 'points', 15),
      'tired_landlord',          jsonb_build_object('key', 'tired_landlord',          'label', 'Tired landlord',                                             'points', 10),
      'relocating',              jsonb_build_object('key', 'relocating',              'label', 'Relocating',                                                 'points', 8),
      'sole_decision_maker',     jsonb_build_object('key', 'sole_decision_maker',     'label', 'Sole decision-maker',                                        'points', 8),
      'shared_decision_maker',   jsonb_build_object('key', 'shared_decision_maker',   'label', 'More than one decision-maker',                               'points', -3),
      'verified_contact',        jsonb_build_object('key', 'verified_contact',        'label', 'Usable phone and email provided',                            'points', 5),
      'in_service_area',         jsonb_build_object('key', 'in_service_area',         'label', 'In an active service area',                                  'points', 10),
      'outside_service_area',    jsonb_build_object('key', 'outside_service_area',    'label', 'Outside our service areas',                                  'points', -20),
      'missing_address',         jsonb_build_object('key', 'missing_address',         'label', 'No usable street address',                                   'points', -8)
    ),
    'thresholds', jsonb_build_object('hot', 70, 'warm', 45)
  )
)
on conflict (version) do nothing;
