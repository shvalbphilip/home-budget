# Auth, Roles & Collaboration — Setup Guide

This phase adds **authentication, user roles (Philip = Admin, Ben = User), Row Level
Security, an activity log, payments/contractor tracking and couple-collaboration**
to the live app — **without touching your existing data**.

Everything ships behind a master switch: **`NEXT_PUBLIC_AUTH_ENABLED`** (default `false`).
While it is `false`, the app behaves exactly as it does today. Nothing activates until
you run the SQL below and flip the switch.

> ⚠️ I could not run the SQL for you — the Supabase access token on this machine is
> locked behind a macOS keychain GUI prompt and I won't invent secrets. You run the
> SQL once in the Supabase dashboard; the app is already wired to light up afterwards.

---

## 1. What was added

**New Supabase tables** (all additive — your `settings`, `categories`, `items` are untouched):

| Table | Purpose |
|---|---|
| `profiles` | display name per user (auto-created on signup) |
| `user_roles` | global roles (`admin` / `member`) |
| `apartment_projects` | the shared apartment project (budget, name) |
| `project_members` | who belongs to a project + per-user `can_delete` grant |
| `rooms` | apartment rooms (Supabase-backed plan) |
| `room_items` | items per room, incl. decision status for couple approval |
| `item_votes` | simple Philip/Ben approve/reject votes |
| `contractor_costs` | contractor quotes & costs |
| `payments` | actual payments, paid/pending, who marked paid |
| `ai_preferences` | per-user style/budget preferences for the AI advisor |
| `activity_log` | immutable audit trail (who did what, when) |

**New app code:** `/login`, `/admin` (Philip-only), `/payments`, an `AuthProvider`,
role-based sidebar, and a `can()` permission helper. All gated by the feature flag.

---

## 2. Run the migration (once)

Open **Supabase Dashboard → SQL Editor → New query**, paste the **entire** contents of:

```
supabase/migrations/20260620120000_auth_roles_collaboration.sql
```

…and click **Run**. It is idempotent (safe to re-run) and only **creates** objects —
no `DROP`, no data deletion. *(Alternatively, if you log in to the CLI with
`supabase login`, run `supabase db push`.)*

---

## 3. Create the two users (safely, no passwords in code)

**Supabase Dashboard → Authentication → Users → Add user** (create two):

1. **Philip** — your email. (Admin)
2. **Ben** — Ben's email. (Regular user)

Set each password in that dialog. **Never put passwords or the service-role key in the repo.**

> Tip: enable **Auto Confirm User** so they can log in immediately without email verification.

---

## 4. Assign roles + create the shared project (once)

In the **SQL Editor**, paste this and **replace the two emails**, then Run:

```sql
-- ===== Bootstrap: roles, project, membership =====
-- Replace these two:
--   'PHILIP_EMAIL'  -> Philip's email
--   'BEN_EMAIL'     -> Ben's email

-- safety: ensure profiles exist (in case users were created before the trigger)
insert into profiles (id, full_name)
select id, split_part(email,'@',1) from auth.users
where email in ('PHILIP_EMAIL','BEN_EMAIL')
on conflict (id) do nothing;

-- Philip = global admin, Ben = member
insert into user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'PHILIP_EMAIL'
on conflict (user_id, role) do nothing;
insert into user_roles (user_id, role)
select id, 'member'::app_role from auth.users where email = 'BEN_EMAIL'
on conflict (user_id, role) do nothing;

-- Create the shared project owned by Philip (run only if you have none yet)
insert into apartment_projects (name, owner_id, total_budget)
select 'הדירה שלנו', id, 0 from auth.users where email = 'PHILIP_EMAIL';

-- Add both as members of the (latest) project
with proj as (select id from apartment_projects order by created_at desc limit 1)
insert into project_members (project_id, user_id, role, can_delete)
select proj.id, u.id,
       (case when u.email = 'PHILIP_EMAIL' then 'admin' else 'member' end)::app_role,
       (u.email = 'PHILIP_EMAIL')
from proj, auth.users u
where u.email in ('PHILIP_EMAIL','BEN_EMAIL')
on conflict (project_id, user_id) do nothing;
```

---

## 5. (Optional) Copy your 16 existing categories into the project as rooms

Your current budget categories live in the legacy `categories` table. To seed the new
project's `rooms` from them (one-time), run:

```sql
with proj as (select id from apartment_projects order by created_at desc limit 1)
insert into rooms (project_id, name, emoji, color, sort_order)
select proj.id, c.name, c.emoji, '#f59e0b', c.sort_order
from categories c, proj;

-- optional: copy the saved total budget onto the project
update apartment_projects set total_budget = (select total_budget from settings where id='main')
where id = (select id from apartment_projects order by created_at desc limit 1);
```

---

## 6. Turn it on

**Local:** `.env.local` already has `NEXT_PUBLIC_AUTH_ENABLED=false`. Change to `true`.

**Production (Vercel):**
```bash
vercel env add NEXT_PUBLIC_AUTH_ENABLED production    # paste: true
vercel --prod                                         # redeploy
```

Now visiting the site requires login. Philip sees **ניהול** (admin) + **תשלומים**;
Ben sees everything except admin, and delete buttons are hidden unless you tick his
**מחיקה** box in the admin panel.

---

## 7. Roles at a glance

| Capability | Philip (Admin) | Ben (User) |
|---|:--:|:--:|
| View shared budget / plan | ✅ | ✅ |
| Add / edit items, costs, notes | ✅ | ✅ |
| Use AI advisor | ✅ | ✅ |
| Mark payments paid | ✅ | ✅ |
| Delete data | ✅ | ⛔ (unless granted `can_delete`) |
| Manage users & roles | ✅ | ⛔ |
| Project settings | ✅ | ⛔ |
| Admin tools / activity log | ✅ | ⛔ |

Enforced in **two layers**: the UI hides actions (`can()` helper) **and** Supabase RLS
rejects them server-side, so it holds even if someone calls the API directly.

---

## 8. Env vars (note on naming)

This is a **Next.js** app, so browser-exposed vars must be prefixed `NEXT_PUBLIC_`
(the spec mentioned `VITE_…`, which only works in Vite projects — they would be ignored here).

| Required | Already set? |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ existing — preserved |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ existing — preserved |
| `NEXT_PUBLIC_AUTH_ENABLED` | new — `false` until you complete steps 2–5 |

No service-role key is used or needed by the app. Keep it secret if you ever use it for admin scripts.

---

## 9. What is still legacy (transparent note)

The original **budget/inventory** pages still read the public `categories`/`items`
tables (anon, `allow_all`) so the live app never broke. Tightening those to be
project-scoped + auth-only is a clean **follow-up** once you confirm the new auth
flow works for you both — say the word and I'll migrate them and wire the planning
store to the new `rooms`/`room_items` tables.

---

## 10. ⚠️ Going live safely — avoid locking yourself out

Turning the flag on makes the site show the **sign-in page on first load**. But a login
needs a **real user to exist first** — otherwise nobody (including you) can get in.
So the order matters:

1. Run the migration (step 2) → 2. Create your user (step 3) → 3. Bootstrap (step 4) →
4. **only then** set `NEXT_PUBLIC_AUTH_ENABLED=true` and redeploy (step 6).

Once a user exists, switching the flag on is reversible at any time (set it back to
`false` + redeploy). Tell me when your account exists and I'll flip the env var for you.

---

## 11. Tokens (JWT access + refresh) — already handled

You do **not** need to hand-build tokens. On every sign-in (password / Google / SMS)
Supabase issues:

* a short-lived **JWT access token** (default 1 hour — adjustable in *Auth → Settings*), and
* a long-lived **refresh token** that is automatically rotated.

The client (`lib/supabase.ts`) is configured with `persistSession`, `autoRefreshToken`
and PKCE, so sessions survive refreshes and the access token is renewed silently in the
background. RLS uses the JWT to identify the user on every request.

---

## 12. Google sign-in

The "המשך עם Google" button is already in the login screen. To make it work:

1. **Google Cloud Console** → create an OAuth 2.0 Client (type *Web*). Authorized redirect URI:
   ```
   https://kmypvvpcmpybdrukstwk.supabase.co/auth/v1/callback
   ```
2. **Supabase → Authentication → Providers → Google** → enable, paste the Client ID + Secret.
3. **Supabase → Authentication → URL Configuration** → add your site to *Redirect URLs*:
   ```
   https://home-budget-delta.vercel.app/auth/callback
   http://localhost:3001/auth/callback
   ```

No secrets go in the repo — the Client ID/Secret live only in Supabase. The app uses the
secure **Authorization-Code + PKCE** flow and finishes at `/auth/callback`.
(To hide the button until configured, set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false`.)

---

## 13. SMS two-factor (for email/password logins)

When `NEXT_PUBLIC_SMS_2FA_ENABLED=true`, an email/password sign-in is followed by an
**SMS one-time code** step (Google logins skip it — that provider is already trusted).

It uses Supabase's native **MFA phone factor**, which needs an SMS provider:

1. **Supabase → Authentication → Providers → Phone** → enable, and connect an SMS
   provider (Twilio / MessageBird / Vonage) with its credentials (kept in Supabase only).
2. **Supabase → Authentication → Multi-Factor** → enable the **Phone** factor.
3. Set `NEXT_PUBLIC_SMS_2FA_ENABLED=true` (Vercel + local) and redeploy.

First login asks for the phone number (enrolls the factor + sends a code); later logins
just send a code to the saved number.

> Zero-cost alternative: Supabase also supports **TOTP** (authenticator app) MFA with no
> SMS provider needed. Say the word and I'll switch the second factor to TOTP.

> Hardening follow-up: the 2FA step currently runs in the login flow. Enforcing AAL2
> globally (so a half-authenticated session can't deep-link past it) is a small follow-up.
