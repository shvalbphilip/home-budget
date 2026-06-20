-- ============================================================================
--  Per-profile budgets: each user gets their own settings / categories / items.
--  SAFE / ADDITIVE + idempotent. Existing rows are assigned to Philip so his
--  current budget is preserved; every other user starts with their own empty
--  budget. After this, RLS scopes these tables to the logged-in user.
-- ============================================================================

-- 1. add an owner column (auto-filled with the JWT user on future inserts)
alter table public.settings   add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.categories add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.items      add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- 2. assign all pre-auth rows to Philip (preserve his existing budget)
do $$
declare philip uuid;
begin
  select id into philip from auth.users where email = 'shvalb.philip@gmail.com' limit 1;
  if philip is not null then
    update public.settings   set user_id = philip where user_id is null;
    update public.categories set user_id = philip where user_id is null;
    update public.items      set user_id = philip where user_id is null;
  end if;
end $$;

-- 3. settings becomes one row per user (was a single id='main' row)
alter table public.settings alter column id set default gen_random_uuid()::text;
create unique index if not exists settings_user_id_key on public.settings(user_id);

-- 4. tighten RLS: each user can only see/write their own rows
do $$
declare t text;
begin
  foreach t in array array['settings','categories','items']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists allow_all_%I on public.%I', t, t);
    execute format('drop policy if exists %I_owner on public.%I', t, t);
    execute format('create policy %I_owner on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
  end loop;
end $$;
