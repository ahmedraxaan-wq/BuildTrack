-- ═══════════════════════════════════════════════════════════════════
--  BuildTrack — Supabase setup
--  Run this ONCE, in your Supabase project: SQL Editor → New query →
--  paste all of this → Run.  It is safe to run again later; nothing
--  is deleted.
--
--  WHAT IT CREATES
--   • one table per kind of record (sites, employees, sales, …)
--   • each row is {id, doc} — doc holds the record itself
--   • readable columns (name, status, amounts…) derived automatically
--     from doc, so the Supabase table editor is easy to browse
--   • row-level security, so ONLY your signed-in account can read or
--     write your data, even though the anon key is in the app
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. The tables ──────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'sites','employees','stocks','purchase_orders','sales','roster',
    'fees','holidays','machinery','leave_records','vendors','holders',
    'cashflow','settings','expenses'
  ] loop
    execute format($f$
      create table if not exists public.%I (
        id          text primary key,
        owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
        doc         jsonb not null default '{}'::jsonb,
        updated_at  timestamptz not null default now()
      );
    $f$, t);

    -- only your own rows, for every operation
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists own_rows on public.%I;', t);
    execute format($f$
      create policy own_rows on public.%I
        for all
        to authenticated
        using (owner = auth.uid())
        with check (owner = auth.uid());
    $f$, t);

    execute format('create index if not exists %I on public.%I (owner);', t||'_owner_idx', t);
  end loop;
end $$;

-- ── 2. Readable columns, derived from doc ──────────────────────────
-- These are generated: you never write to them, Postgres keeps them in
-- step with doc. They exist purely so the data is pleasant to browse.
alter table public.sites
  add column if not exists name   text generated always as (doc->>'name') stored,
  add column if not exists loc    text generated always as (doc->>'loc') stored,
  add column if not exists status text generated always as (doc->>'status') stored,
  add column if not exists type   text generated always as (doc->>'type') stored;

alter table public.employees
  add column if not exists name    text generated always as (doc->>'name') stored,
  add column if not exists role    text generated always as (doc->>'role') stored,
  add column if not exists monthly numeric generated always as ((doc->>'monthly')::numeric) stored;

alter table public.stocks
  add column if not exists name  text generated always as (doc->>'name') stored,
  add column if not exists unit  text generated always as (doc->>'unit') stored,
  add column if not exists w_qty numeric generated always as ((doc->>'wQty')::numeric) stored;

alter table public.sales
  add column if not exists customer text generated always as (doc->>'customer') stored,
  add column if not exists sale_date text generated always as (doc->>'date') stored;

alter table public.expenses
  add column if not exists category text generated always as (doc->>'category') stored,
  add column if not exists descr    text generated always as (doc->>'desc') stored,
  add column if not exists amount   numeric generated always as ((doc->>'amount')::numeric) stored,
  add column if not exists exp_date text generated always as (doc->>'date') stored;

alter table public.roster
  add column if not exists work_date text generated always as (doc->>'date') stored,
  add column if not exists cost      numeric generated always as ((doc->>'cost')::numeric) stored;

alter table public.cashflow
  add column if not exists kind   text generated always as (doc->>'kind') stored,
  add column if not exists amount numeric generated always as ((doc->>'amount')::numeric) stored;

alter table public.vendors
  add column if not exists name text generated always as (doc->>'name') stored;

alter table public.machinery
  add column if not exists name text generated always as (doc->>'name') stored;

alter table public.holders
  add column if not exists name text generated always as (doc->>'name') stored;

-- ── 3. Done ────────────────────────────────────────────────────────
-- Next:
--   a) Authentication → Users → Add user → your email + a password,
--      with "Auto Confirm User" ticked.
--   b) Settings → API → copy the Project URL and the "anon public" key.
--   c) In BuildTrack: ⚙ Storage → Supabase → paste both, sign in.
--   d) Still connected to Google Sheets? Press "Copy everything from
--      Sheets →" first, then sign in to switch over.
select 'BuildTrack tables ready' as result;
