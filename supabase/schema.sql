-- ═══════════════════════════════════════════════════════
--  ACA Build Site Register – Supabase Schema
--  Run this in: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Jobs (renovation sites) ─────────────────────────────────
create table jobs (
  id            uuid primary key default uuid_generate_v4(),
  job_number    text not null,
  name          text not null,
  address       text not null,
  description   text,
  status        text not null default 'active',  -- active | completed | archived
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Trade Sign-ins ───────────────────────────────────────────
create table signins (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references jobs(id) on delete cascade,
  -- Personal details
  full_name       text not null,
  company_name    text not null,
  trade_type      text not null,  -- e.g. Electrician, Plumber, Carpenter
  abn             text,
  phone           text not null,
  email           text,
  licence_number  text,
  -- Induction
  induction_completed  boolean not null default false,
  swms_acknowledged    boolean not null default false,
  ppe_confirmed        boolean not null default false,
  site_rules_read      boolean not null default false,
  emergency_aware      boolean not null default false,
  -- Timestamps
  signed_in_at    timestamptz not null default now(),
  signed_out_at   timestamptz,
  -- Status
  status          text not null default 'on_site'  -- on_site | signed_out
);

-- ─── Documents ────────────────────────────────────────────────
create table documents (
  id            uuid primary key default uuid_generate_v4(),
  signin_id     uuid not null references signins(id) on delete cascade,
  job_id        uuid not null references jobs(id) on delete cascade,
  doc_type      text not null,  -- licence | insurance | swms | scope_of_works | other
  file_name     text not null,
  file_url      text not null,
  file_size     bigint,
  expiry_date   date,
  uploaded_at   timestamptz not null default now()
);

-- ─── Work Photos ──────────────────────────────────────────────
create table photos (
  id            uuid primary key default uuid_generate_v4(),
  signin_id     uuid not null references signins(id) on delete cascade,
  job_id        uuid not null references jobs(id) on delete cascade,
  file_name     text not null,
  file_url      text not null,
  file_size     bigint,
  caption       text,
  taken_at      timestamptz not null default now(),  -- client-reported photo time
  uploaded_at   timestamptz not null default now()   -- server upload time (tamper-proof)
);

-- ─── Row Level Security ───────────────────────────────────────
-- Trades can insert but not read other people's records
-- Admin uses service role key (bypasses RLS)

alter table jobs      enable row level security;
alter table signins   enable row level security;
alter table documents enable row level security;
alter table photos    enable row level security;

-- Allow anyone to READ job details (needed to show job info on sign-in page)
create policy "Public can read active jobs"
  on jobs for select
  using (status = 'active');

-- Allow anyone to INSERT a sign-in
create policy "Anyone can sign in"
  on signins for insert
  with check (true);

-- Allow sign-in owner to update their own record (sign-out)
create policy "Can update own signin"
  on signins for update
  using (true);

-- Allow document upload
create policy "Anyone can upload documents"
  on documents for insert
  with check (true);

-- Allow photo upload
create policy "Anyone can upload photos"
  on photos for insert
  with check (true);

-- ─── Storage Buckets ──────────────────────────────────────────
-- Run these separately in Supabase Storage settings, or via SQL:

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict do nothing;

-- Allow public upload to documents bucket
create policy "Allow document uploads"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Allow document reads"
  on storage.objects for select
  using (bucket_id = 'documents');

-- Allow public upload to photos bucket
create policy "Allow photo uploads"
  on storage.objects for insert
  with check (bucket_id = 'photos');

create policy "Allow photo reads"
  on storage.objects for select
  using (bucket_id = 'photos');

-- ─── Helpful Views ────────────────────────────────────────────

-- Current people on each site
create view site_roster as
select
  j.id as job_id,
  j.job_number,
  j.name as job_name,
  j.address,
  s.id as signin_id,
  s.full_name,
  s.company_name,
  s.trade_type,
  s.phone,
  s.email,
  s.signed_in_at,
  s.signed_out_at,
  s.status,
  s.induction_completed,
  s.swms_acknowledged
from signins s
join jobs j on j.id = s.job_id
order by s.signed_in_at desc;

-- Compliance summary per sign-in
create view compliance_summary as
select
  s.id as signin_id,
  s.job_id,
  s.full_name,
  s.company_name,
  s.trade_type,
  s.signed_in_at,
  count(case when d.doc_type = 'licence'         then 1 end) as has_licence,
  count(case when d.doc_type = 'insurance'       then 1 end) as has_insurance,
  count(case when d.doc_type = 'swms'            then 1 end) as has_swms,
  count(case when d.doc_type = 'scope_of_works'  then 1 end) as has_scope,
  count(p.id)                                                 as photo_count
from signins s
left join documents d on d.signin_id = s.id
left join photos    p on p.signin_id = s.id
group by s.id, s.job_id, s.full_name, s.company_name, s.trade_type, s.signed_in_at;
