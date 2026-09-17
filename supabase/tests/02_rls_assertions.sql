-- RLS behaviour assertions.
-- Run with scripts/test-rls.sh, which applies the harness, both migrations,
-- and the fixtures before this file. Any FAIL aborts with a non-zero exit.

\set ON_ERROR_STOP on
\pset pager off
\set QUIET on

-- Assert that a query is refused (either by grants or by RLS returning nothing).
create or replace function expect_denied(label text, stmt text)
returns void language plpgsql as $$
declare n bigint;
begin
  execute stmt into n;
  if n = 0 then
    raise notice 'PASS  %  (0 rows visible)', label;
  else
    raise exception 'FAIL  %  expected denial, saw % row(s)', label, n;
  end if;
exception
  when insufficient_privilege then
    raise notice 'PASS  %  (permission denied)', label;
end $$;

create or replace function expect_count(label text, stmt text, expected bigint)
returns void language plpgsql as $$
declare n bigint;
begin
  execute stmt into n;
  if n = expected then
    raise notice 'PASS  %  (% rows)', label, n;
  else
    raise exception 'FAIL  %  expected %, got %', label, expected, n;
  end if;
end $$;

-- A write is "denied" either by raising (INSERT with no policy) or by
-- affecting zero rows (UPDATE/DELETE, which RLS filters silently rather
-- than erroring). Both count; anything that actually changes a row fails.
create or replace function expect_write_denied(label text, stmt text)
returns void language plpgsql as $$
declare affected bigint;
begin
  execute stmt;
  get diagnostics affected = row_count;
  if affected = 0 then
    raise notice 'PASS  %  (0 rows affected)', label;
  else
    raise exception 'FAIL  %  write changed % row(s)', label, affected;
  end if;
exception
  when insufficient_privilege or check_violation then
    raise notice 'PASS  %  (permission denied)', label;
end $$;

\set QUIET off

-- =================== anon: total lockout ============================
set role anon;
select expect_denied('anon -> leads',      'select count(*) from public.leads');
select expect_denied('anon -> properties', 'select count(*) from public.properties');
select expect_denied('anon -> profiles',   'select count(*) from public.profiles');
select expect_denied('anon -> audit_logs', 'select count(*) from public.audit_logs');
select expect_denied('anon -> lead_consents', 'select count(*) from public.lead_consents');
reset role;

-- =================== no-role authenticated user =====================
set session request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
set role authenticated;
select expect_count('no-role user sees no leads', 'select count(*) from public.leads', 0::bigint);
select expect_count('no-role user sees no properties', 'select count(*) from public.properties', 0::bigint);
reset role;

-- =================== closing specialist scoping =====================
set session request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
set role authenticated;
select expect_count('closer1 sees only their assigned lead',
  'select count(*) from public.leads', 1::bigint);
select expect_count('closer1 cannot see closer2 lead by id',
  $$select count(*) from public.leads where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$, 0::bigint);
select expect_count('closer1 sees only their lead score',
  'select count(*) from public.lead_scores', 1::bigint);
select expect_count('closer1 sees only their lead consent',
  'select count(*) from public.lead_consents', 1::bigint);
select expect_denied('closer1 -> audit_logs', 'select count(*) from public.audit_logs');
reset role;

-- =================== closer2 sees the other lead ====================
set session request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
set role authenticated;
select expect_count('closer2 sees only their assigned lead',
  'select count(*) from public.leads', 1::bigint);
select expect_count('closer2 lead is the other one',
  $$select count(*) from public.leads where id = 'bbbbbbbb-0000-0000-0000-000000000002'$$, 1::bigint);
reset role;

-- =================== acquisition manager ============================
set session request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
set role authenticated;
select expect_count('acquisition sees the full pipeline',
  'select count(*) from public.leads', 2::bigint);
select expect_denied('acquisition -> audit_logs', 'select count(*) from public.audit_logs');
select expect_write_denied('acquisition cannot grant roles',
  $$insert into public.user_roles (user_id, role) values ('66666666-6666-6666-6666-666666666666', 'admin')$$);
reset role;

-- =================== analyst is read-only ===========================
set session request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
set role authenticated;
select expect_count('analyst sees the full pipeline',
  'select count(*) from public.leads', 2::bigint);
select expect_write_denied('analyst cannot update a lead',
  $$update public.leads set status = 'contacted' where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$);
select expect_write_denied('analyst cannot insert a property',
  $$insert into public.properties (city, postal_code) values ('Troy', '48083')$$);
reset role;

-- =================== admin ==========================================
set session request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select expect_count('admin sees the full pipeline', 'select count(*) from public.leads', 2::bigint);
select expect_count('admin reads the audit log', 'select count(*) from public.audit_logs', 1::bigint);
select expect_write_denied('admin cannot write the audit log',
  $$insert into public.audit_logs (action, summary) values ('sign_in', 'forged')$$);
select expect_write_denied('admin cannot revoke their own role',
  $$delete from public.user_roles where user_id = '11111111-1111-1111-1111-111111111111'$$);
select expect_write_denied('nobody can rewrite a consent record',
  $$update public.lead_consents set granted = false$$);
reset role;
reset session authorization;

select 'ALL RLS ASSERTIONS PASSED' as result;
