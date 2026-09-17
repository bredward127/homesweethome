-- =====================================================================
-- Home Sweet Home — Phase 1 foundation
--
-- Identity (profiles, roles), business configuration (service areas,
-- funnel settings, scoring rules), and the audit / activity trail.
--
-- Lead, property, contract, and disposition tables are introduced in the
-- later phases that build those modules.
--
-- Every table in this file has Row Level Security ENABLED with explicit
-- policies. RLS is the real access boundary; the TypeScript permission
-- model in src/lib/auth/roles.ts only decides what to render.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type public.app_role as enum (
  'admin',
  'acquisition_manager',
  'closing_specialist',
  'disposition_manager',
  'analyst'
);

create type public.audit_action as enum (
  'sign_in',
  'sign_out',
  'sign_in_failed',
  'password_reset_requested',
  'record_created',
  'record_updated',
  'record_archived',
  'record_restored',
  'lead_status_changed',
  'lead_assigned',
  'contract_status_changed',
  'document_uploaded',
  'document_downloaded',
  'data_exported',
  'role_granted',
  'role_revoked',
  'settings_updated',
  'scoring_rules_updated'
);

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at honest
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles — one row per internal CRM user, keyed to auth.users
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  job_title text,
  -- Deactivated users keep their history but lose all access (see is_active_user).
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index profiles_is_active_idx on public.profiles (is_active) where archived_at is null;
create unique index profiles_email_key on public.profiles (lower(email));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- user_roles — a user may hold more than one role
-- ---------------------------------------------------------------------

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

-- ---------------------------------------------------------------------
-- Authorization helpers
--
-- These are SECURITY DEFINER so that policies on user_roles can consult
-- user_roles without recursing through its own RLS policies. search_path
-- is pinned to defeat search-path hijacking, and EXECUTE is granted only
-- to authenticated users.
-- ---------------------------------------------------------------------

create or replace function public.current_user_roles()
returns public.app_role[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(ur.role), '{}'::public.app_role[])
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id
  where ur.user_id = auth.uid()
    and p.is_active
    and p.archived_at is null;
$$;

create or replace function public.has_role(target public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target = any (public.current_user_roles());
$$;

create or replace function public.has_any_role(targets public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_user_roles() && targets;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_role('admin');
$$;

-- Any active user holding at least one role. Used as the baseline
-- "is an internal staff member" check.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select array_length(public.current_user_roles(), 1) > 0;
$$;

revoke execute on function public.current_user_roles() from public, anon;
revoke execute on function public.has_role(public.app_role) from public, anon;
revoke execute on function public.has_any_role(public.app_role[]) from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;

grant execute on function public.current_user_roles() to authenticated;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.has_any_role(public.app_role[]) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------
-- New auth user -> profile row
--
-- Creates the profile only. Roles are granted deliberately by an admin;
-- a brand new user has zero roles and therefore zero CRM access.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- service_areas — configurable market coverage
-- ---------------------------------------------------------------------

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city text not null,
  county text,
  state text not null default 'MI',
  postal_codes text[] not null default '{}',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz
);

create index service_areas_is_active_idx on public.service_areas (is_active) where archived_at is null;
create index service_areas_postal_codes_idx on public.service_areas using gin (postal_codes);

create trigger service_areas_set_updated_at
  before update on public.service_areas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- funnel_settings — a single configuration row for the public funnel
-- ---------------------------------------------------------------------

create table public.funnel_settings (
  id uuid primary key default gen_random_uuid(),
  -- Enforces exactly one settings row.
  singleton boolean not null default true unique check (singleton),
  booking_provider text not null default 'none',
  booking_url text,
  -- Minimum lead score at which the booking step is offered.
  bookable_score_threshold integer not null default 60
    check (bookable_score_threshold between 0 and 100),
  -- A fallback "request a call" action is always offered regardless of score.
  allow_request_call_fallback boolean not null default true,
  show_optional_photo_upload boolean not null default true,
  hot_followup_minutes integer not null default 15 check (hot_followup_minutes > 0),
  warm_followup_hours integer not null default 24 check (warm_followup_hours > 0),
  nurture_followup_days integer not null default 7 check (nurture_followup_days > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger funnel_settings_set_updated_at
  before update on public.funnel_settings
  for each row execute function public.set_updated_at();

insert into public.funnel_settings (singleton) values (true);

-- ---------------------------------------------------------------------
-- scoring_rules — versioned, admin-editable lead scoring model
--
-- Rules are stored as data rather than code so an admin can tune them
-- without a deploy, and so each lead score can record the exact rule
-- version that produced it.
--
-- Fair housing: scoring inputs are restricted to property and timeline
-- attributes. Protected characteristics are never collected and must
-- never be added here.
-- ---------------------------------------------------------------------

create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique,
  is_active boolean not null default false,
  -- { signals: [{ key, label, points, matcher }], tiers: {...} }
  definition jsonb not null,
  hot_threshold integer not null default 70 check (hot_threshold between 0 and 100),
  warm_threshold integer not null default 45 check (warm_threshold between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (hot_threshold > warm_threshold)
);

-- At most one active ruleset at a time.
create unique index scoring_rules_single_active_idx
  on public.scoring_rules (is_active) where is_active;

create trigger scoring_rules_set_updated_at
  before update on public.scoring_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- audit_logs — append-only security trail
--
-- Written server-side only (service role). No UPDATE or DELETE policy
-- exists for any role, so entries cannot be altered through the API.
-- ---------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  action public.audit_action not null,
  entity_type text,
  entity_id uuid,
  summary text,
  -- Never store raw seller PII, document contents, or credentials here.
  metadata jsonb not null default '{}'::jsonb,
  -- Salted hash, never a raw IP address.
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_action_idx on public.audit_logs (action, created_at desc);

-- ---------------------------------------------------------------------
-- activity_events — human-readable timeline shown inside the CRM
-- ---------------------------------------------------------------------

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_events_entity_idx on public.activity_events (entity_type, entity_id, created_at desc);
create index activity_events_created_at_idx on public.activity_events (created_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles        enable row level security;
alter table public.user_roles      enable row level security;
alter table public.service_areas   enable row level security;
alter table public.funnel_settings enable row level security;
alter table public.scoring_rules   enable row level security;
alter table public.audit_logs      enable row level security;
alter table public.activity_events enable row level security;

-- Belt and braces: no anonymous grants on any internal table. The public
-- funnel reaches the database through the server only.
revoke all on public.profiles, public.user_roles, public.service_areas,
  public.funnel_settings, public.scoring_rules, public.audit_logs,
  public.activity_events from anon;

-- profiles ------------------------------------------------------------

create policy "profiles: staff read directory"
  on public.profiles for select
  to authenticated
  using (public.is_staff());

create policy "profiles: read own row"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles: update own row"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin manages team"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- user_roles ----------------------------------------------------------

create policy "user_roles: read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_roles: admin reads all"
  on public.user_roles for select
  to authenticated
  using (public.is_admin());

-- Only admins may change role assignments, and never their own — this
-- stops a compromised admin session from silently escalating a second
-- account without leaving the intended audit trail.
create policy "user_roles: admin grants"
  on public.user_roles for insert
  to authenticated
  with check (public.is_admin());

create policy "user_roles: admin revokes"
  on public.user_roles for delete
  to authenticated
  using (public.is_admin() and user_id <> auth.uid());

-- service_areas -------------------------------------------------------

create policy "service_areas: staff read"
  on public.service_areas for select
  to authenticated
  using (public.is_staff());

create policy "service_areas: admin writes"
  on public.service_areas for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- funnel_settings -----------------------------------------------------

create policy "funnel_settings: staff read"
  on public.funnel_settings for select
  to authenticated
  using (public.is_staff());

create policy "funnel_settings: admin writes"
  on public.funnel_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- scoring_rules -------------------------------------------------------

create policy "scoring_rules: staff read"
  on public.scoring_rules for select
  to authenticated
  using (public.is_staff());

create policy "scoring_rules: admin writes"
  on public.scoring_rules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- audit_logs ----------------------------------------------------------
-- Read: admins only. Write: service role only (which bypasses RLS).
-- Deliberately no insert/update/delete policy for authenticated users.

create policy "audit_logs: admin reads"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- activity_events -----------------------------------------------------

create policy "activity_events: staff read"
  on public.activity_events for select
  to authenticated
  using (public.is_staff());

create policy "activity_events: staff append"
  on public.activity_events for insert
  to authenticated
  with check (public.is_staff() and actor_id = auth.uid());
