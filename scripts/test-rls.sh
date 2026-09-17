#!/usr/bin/env bash
#
# Verify the Row Level Security policies actually behave as documented.
#
# Spins up a throwaway Postgres, stubs the objects Supabase normally provides
# (the auth schema, auth.uid(), and the anon / authenticated / service_role
# roles), applies every migration in order, loads fixtures, and asserts what
# each role can and cannot see.
#
# RLS is the real access boundary for this application, so it is verified
# against a real database rather than reviewed by eye.
#
# Requires: postgresql-16 (or any psql + initdb on PATH).
# Usage:    ./scripts/test-rls.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
WORKDIR="$(mktemp -d)"
DATADIR="$WORKDIR/data"
SOCKET="$WORKDIR"
DB=hsh_rls_test

cleanup() {
  "$PGBIN/pg_ctl" -D "$DATADIR" -s stop >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

echo "==> Starting a throwaway Postgres in $WORKDIR"
# initdb refuses to run as root, so drop to the postgres user when we are root.
if [ "$(id -u)" = "0" ]; then
  RUN_AS="su postgres -c"
  mkdir -p "$DATADIR"
  chown -R postgres "$WORKDIR"
else
  RUN_AS="bash -c"
fi

$RUN_AS "$PGBIN/initdb -D $DATADIR -U postgres --auth=trust" >/dev/null
$RUN_AS "$PGBIN/pg_ctl -D $DATADIR -o '-k $SOCKET -c listen_addresses=' -w start" >/dev/null

PSQL=("psql" "-h" "$SOCKET" "-U" "postgres" "-v" "ON_ERROR_STOP=1" "-q")

"${PSQL[@]}" -c "create database $DB;" >/dev/null

echo "==> Applying the Supabase harness"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/00_harness.sql" >/dev/null

echo "==> Applying migrations"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "    $(basename "$migration")"
  "${PSQL[@]}" -d "$DB" -f "$migration" >/dev/null
done

echo "==> Loading fixtures"
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/01_fixtures.sql" >/dev/null

echo "==> Asserting RLS behaviour"
# Assertions raise on failure, and ON_ERROR_STOP turns that into a non-zero exit.
"${PSQL[@]}" -d "$DB" -f "$ROOT/supabase/tests/02_rls_assertions.sql" 2>&1 \
  | grep -E "PASS|FAIL|ALL RLS" \
  | sed 's/.*NOTICE:  //'

echo
echo "==> Checking every public table has RLS enabled"
UNPROTECTED=$("${PSQL[@]}" -d "$DB" -tAc \
  "select coalesce(string_agg(tablename, ', '), '') from pg_tables
   where schemaname = 'public' and rowsecurity = false;")
if [ -n "$UNPROTECTED" ]; then
  echo "FAIL  tables without RLS: $UNPROTECTED"
  exit 1
fi
echo "PASS  every public table has RLS enabled"
