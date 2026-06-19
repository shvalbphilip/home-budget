-- ============================================================================
--  Auth, roles & couple-collaboration foundation
--  SAFE / ADDITIVE: creates new tables only. Does NOT touch or drop the
--  existing settings / categories / items tables or any of their data.
--  Idempotent: can be run multiple times without error.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────────
do $$ begin create type app_role as enum ('admin','member'); exception when duplicate_object then null; end $$;
do $$ begin create type decision_status as enum ('מחכים להחלטה','אושר','נדחה'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('ממתין','שולם','בוטל'); exception when duplicate_object then null; end $$;
do $$ begin create type cost_status as enum ('הצעת מחיר','סוכם','בתשלום','הושלם'); exception when duplicate_object then null; end $$;

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── profiles (1:1 with auth.users) ──────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── user_roles (separate table = avoids RLS recursion; Supabase best practice)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'member',
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- ── Security-definer helpers (bypass RLS internally → no recursion) ──────────
create or replace function public.has_role(p_role app_role)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = p_role);
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin');
$$;

-- ── apartment_projects ──────────────────────────────────────────────────────
create table if not exists public.apartment_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'הדירה שלנו',
  owner_id uuid references auth.users(id) on delete set null,
  total_budget numeric default 0,
  currency text default 'ILS',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── project_members ─────────────────────────────────────────────────────────
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'member',
  can_delete boolean not null default false,
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

create or replace function public.is_member(p_project uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from project_members where project_id = p_project and user_id = auth.uid());
$$;

create or replace function public.is_project_admin(p_project uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = p_project and user_id = auth.uid() and role = 'admin'
  ) or public.is_admin();
$$;

create or replace function public.can_delete_in(p_project uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from project_members
    where project_id = p_project and user_id = auth.uid() and (role = 'admin' or can_delete = true)
  ) or public.is_admin();
$$;

-- ── rooms (project-scoped; Supabase-backed apartment plan) ───────────────────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  name text not null,
  emoji text default '🏠',
  x numeric default 40,
  y numeric default 40,
  width numeric default 300,
  length numeric default 250,
  height numeric default 270,
  color text default '#f59e0b',
  notes text default '',
  priority text default 'חשוב',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── room_items (with couple-collaboration columns) ──────────────────────────
create table if not exists public.room_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  room_id uuid references rooms(id) on delete cascade,
  name text not null,
  emoji text default '📦',
  status text default 'חסר',
  priority text default 'חשוב',
  quantity int default 1,
  price numeric default 0,
  store text default '',
  link text default '',
  notes text default '',
  category text default '',
  bought boolean default false,
  placed boolean default false,
  px numeric default 0,
  py numeric default 0,
  decision decision_status default 'מחכים להחלטה',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── item_votes (simple Philip/Ben approval) ─────────────────────────────────
create table if not exists public.item_votes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references room_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  approve boolean not null,
  created_at timestamptz default now(),
  unique (item_id, user_id)
);

-- ── contractor_costs ────────────────────────────────────────────────────────
create table if not exists public.contractor_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  room_id uuid references rooms(id) on delete set null,
  contractor_name text not null,
  description text default '',
  amount numeric default 0,
  status cost_status default 'הצעת מחיר',
  due_date date,
  notes text default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── payments ────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  title text not null,
  amount numeric default 0,
  status payment_status default 'ממתין',
  paid boolean default false,
  paid_at timestamptz,
  paid_by uuid references auth.users(id) on delete set null,
  due_date date,
  method text default '',
  contractor_cost_id uuid references contractor_costs(id) on delete set null,
  room_item_id uuid references room_items(id) on delete set null,
  notes text default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ai_preferences (per user, per project) ──────────────────────────────────
create table if not exists public.ai_preferences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  style text default '',
  budget numeric default 0,
  top_priorities text default '',
  partner_notes text default '',
  answers jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (project_id, user_id)
);

-- ── activity_log (immutable audit trail) ────────────────────────────────────
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references apartment_projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text default '',
  entity_id text default '',
  summary text default '',
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ── updated_at triggers ─────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','apartment_projects','rooms','room_items','contractor_costs','payments','ai_preferences']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ── New-user trigger: create profile + default member role ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id, role) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.user_roles        enable row level security;
alter table public.apartment_projects enable row level security;
alter table public.project_members   enable row level security;
alter table public.rooms             enable row level security;
alter table public.room_items        enable row level security;
alter table public.item_votes        enable row level security;
alter table public.contractor_costs  enable row level security;
alter table public.payments          enable row level security;
alter table public.ai_preferences    enable row level security;
alter table public.activity_log      enable row level security;

-- profiles: everyone authenticated can read (to show names); update own or admin
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());

-- user_roles: read own or admin; only admin writes
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists user_roles_write on public.user_roles;
create policy user_roles_write on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- apartment_projects: members read; owner/admin update+delete; authenticated create
drop policy if exists projects_select on public.apartment_projects;
create policy projects_select on public.apartment_projects for select to authenticated
  using (public.is_member(id) or public.is_admin());
drop policy if exists projects_insert on public.apartment_projects;
create policy projects_insert on public.apartment_projects for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists projects_update on public.apartment_projects;
create policy projects_update on public.apartment_projects for update to authenticated
  using (public.is_project_admin(id)) with check (public.is_project_admin(id));
drop policy if exists projects_delete on public.apartment_projects;
create policy projects_delete on public.apartment_projects for delete to authenticated
  using (public.is_project_admin(id));

-- project_members: members read; project admin manages
drop policy if exists members_select on public.project_members;
create policy members_select on public.project_members for select to authenticated
  using (public.is_member(project_id) or public.is_admin());
drop policy if exists members_write on public.project_members;
create policy members_write on public.project_members for all to authenticated
  using (public.is_project_admin(project_id)) with check (public.is_project_admin(project_id));

-- Generic project-scoped tables: members read+write, delete gated by can_delete_in
do $$
declare t text;
begin
  foreach t in array array['rooms','room_items','contractor_costs','payments','ai_preferences']
  loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format('create policy %I_select on public.%I for select to authenticated using (public.is_member(project_id))', t, t);
    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (public.is_member(project_id))', t, t);
    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format('create policy %I_update on public.%I for update to authenticated using (public.is_member(project_id)) with check (public.is_member(project_id))', t, t);
    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format('create policy %I_delete on public.%I for delete to authenticated using (public.can_delete_in(project_id))', t, t);
  end loop;
end $$;

-- item_votes: members of the item's project can read/write their own vote
drop policy if exists item_votes_select on public.item_votes;
create policy item_votes_select on public.item_votes for select to authenticated
  using (exists (select 1 from room_items ri where ri.id = item_id and public.is_member(ri.project_id)));
drop policy if exists item_votes_write on public.item_votes;
create policy item_votes_write on public.item_votes for all to authenticated
  using (user_id = auth.uid()) with check (
    user_id = auth.uid()
    and exists (select 1 from room_items ri where ri.id = item_id and public.is_member(ri.project_id))
  );

-- activity_log: members read; insert own actions; immutable (no update/delete)
drop policy if exists activity_select on public.activity_log;
create policy activity_select on public.activity_log for select to authenticated
  using (public.is_member(project_id));
drop policy if exists activity_insert on public.activity_log;
create policy activity_insert on public.activity_log for insert to authenticated
  with check (public.is_member(project_id) and (user_id = auth.uid() or user_id is null));

-- ============================================================================
--  NOTE: legacy tables (settings, categories, items) are intentionally left
--  untouched with their existing public policies so the current live app keeps
--  working. See SETUP_AUTH.md for the optional, data-preserving backfill that
--  copies the 16 existing categories into a project as rooms.
-- ============================================================================
