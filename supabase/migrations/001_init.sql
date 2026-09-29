-- Ēndor diagnóstico — schema inicial
-- Principio: intake público (anon insert); lectura por id; evidence en storage.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- diagnoses
-- ---------------------------------------------------------------------------
create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'intake_received'
    check (status in ('intake_received', 'analyzing', 'needs_review', 'ready', 'failed')),
  intake jsonb not null,
  scores jsonb,
  report jsonb,
  needs_human_review boolean not null default false,
  sector text,
  city text
);

create index if not exists diagnoses_created_at_idx on public.diagnoses (created_at desc);
create index if not exists diagnoses_sector_idx on public.diagnoses (sector);

alter table public.diagnoses enable row level security;

-- Anon puede insertar intake (diagnóstico gratuito público)
create policy "diagnoses_anon_insert"
  on public.diagnoses
  for insert
  to anon, authenticated
  with check (true);

-- Lectura por id (el reporte se comparte por URL/UUID)
-- Nota: cualquiera con el UUID puede leer. Aceptable para MVP de link secreto.
create policy "diagnoses_select_by_id"
  on public.diagnoses
  for select
  to anon, authenticated
  using (true);

-- Update solo vía service role en la práctica (policy restrictiva para anon)
-- Si se usa anon para update, limitar a filas recién creadas sería ideal;
-- por ahora dejamos update solo a service_role (bypass RLS).

-- ---------------------------------------------------------------------------
-- evidence_files
-- ---------------------------------------------------------------------------
create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references public.diagnoses (id) on delete cascade,
  kind text not null
    check (kind in ('logo', 'recent_post', 'physical', 'other')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists evidence_files_diagnosis_idx
  on public.evidence_files (diagnosis_id);

alter table public.evidence_files enable row level security;

create policy "evidence_files_anon_insert"
  on public.evidence_files
  for insert
  to anon, authenticated
  with check (true);

create policy "evidence_files_select"
  on public.evidence_files
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- sector_benchmarks (stub opcional)
-- ---------------------------------------------------------------------------
create table if not exists public.sector_benchmarks (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  city text,
  sample_size int not null default 0,
  median_scores jsonb,
  pattern_summary text,
  updated_at timestamptz not null default now()
);

create unique index if not exists sector_benchmarks_sector_city_uidx
  on public.sector_benchmarks (sector, coalesce(city, ''));

alter table public.sector_benchmarks enable row level security;

create policy "sector_benchmarks_public_read"
  on public.sector_benchmarks
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage bucket notes (ejecutar en dashboard o API):
--   insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false);
-- Policies sugeridas:
--   - INSERT: anon puede subir a evidence/{diagnosis_id}/*
--   - SELECT: solo service_role / o firmado por path
-- Ver README.md § Storage
-- ---------------------------------------------------------------------------
