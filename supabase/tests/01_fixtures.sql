-- Fixtures for the RLS assertions. Applied as superuser, so RLS does not
-- apply to these inserts — that is the point: we set up a world, then check
-- what each role can see of it.

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin@hsh.test'),
  ('22222222-2222-2222-2222-222222222222', 'acq@hsh.test'),
  ('33333333-3333-3333-3333-333333333333', 'closer1@hsh.test'),
  ('44444444-4444-4444-4444-444444444444', 'closer2@hsh.test'),
  ('55555555-5555-5555-5555-555555555555', 'analyst@hsh.test'),
  ('66666666-6666-6666-6666-666666666666', 'norole@hsh.test');

-- Profiles are created by the on_auth_user_created trigger.
-- Deliberately no role for norole@hsh.test: a new account must have no access.
insert into public.user_roles (user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'acquisition_manager'),
  ('33333333-3333-3333-3333-333333333333', 'closing_specialist'),
  ('44444444-4444-4444-4444-444444444444', 'closing_specialist'),
  ('55555555-5555-5555-5555-555555555555', 'analyst');

insert into public.properties (id, city, postal_code)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Royal Oak', '48067');

-- Two leads, assigned to two different closing specialists, so we can prove
-- that one specialist cannot reach the other's lead.
insert into public.leads (id, property_id, first_name, last_name, phone, email, assigned_to)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Dana', 'Reyes', '2485550101', 'dana@example.test', '33333333-3333-3333-3333-333333333333'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Sam', 'Okafor', '2485550102', 'sam@example.test', '44444444-4444-4444-4444-444444444444');

insert into public.lead_scores (lead_id, total, tier, rules_version)
values ('bbbbbbbb-0000-0000-0000-000000000001', 82, 'hot', 1),
       ('bbbbbbbb-0000-0000-0000-000000000002', 51, 'warm', 1);

insert into public.lead_consents (lead_id, consent_type, granted, consent_text, policy_version)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'contact', true, 'agreed', '2026-01-v1');

insert into public.audit_logs (action, summary) values ('sign_in', 'fixture');
