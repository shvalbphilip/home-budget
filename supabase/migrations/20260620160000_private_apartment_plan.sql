-- ============================================================================
--  Make the apartment plan (rooms/items/budget/advisor) PRIVATE per user.
--  SAFE / ADDITIVE + idempotent. Each user's plan row is owned by them and
--  RLS enforces that only the owner can read/write it.
-- ============================================================================

-- 1. owner column (auto-filled from the JWT on insert)
alter table public.apartment_plan
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 2. backfill: rows are already keyed by the user's id (the app uses uid as the
--    primary key), so derive the owner from it; the legacy 'main' row -> Philip.
update public.apartment_plan
  set user_id = id::uuid
  where user_id is null and id ~ '^[0-9a-fA-F-]{36}$';
update public.apartment_plan
  set user_id = (select id from auth.users where email = 'shvalb.philip@gmail.com')
  where user_id is null;

-- 3. tighten RLS to owner-only
drop policy if exists allow_all_apartment_plan on public.apartment_plan;
drop policy if exists apartment_plan_owner on public.apartment_plan;
create policy apartment_plan_owner on public.apartment_plan
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
