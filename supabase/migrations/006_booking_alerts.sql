-- Idempotent booking→sales-alert ledger (one row per Google Calendar event).
create table if not exists public.booking_alerts (
  event_id text primary key,
  diagnosis_id uuid references public.diagnoses (id) on delete set null,
  invitee_email text,
  company_name text,
  event_summary text,
  event_start timestamptz,
  event_end timestamptz,
  event_html_link text,
  matched_by text,
  email_status text,
  email_error text,
  notified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists booking_alerts_notified_at_idx
  on public.booking_alerts (notified_at desc);

create index if not exists booking_alerts_diagnosis_id_idx
  on public.booking_alerts (diagnosis_id);

alter table public.booking_alerts enable row level security;

-- Cron uses service role (bypass) when available; anon policies for MVP fallback.
create policy "booking_alerts_anon_select"
  on public.booking_alerts
  for select
  to anon, authenticated
  using (true);

create policy "booking_alerts_anon_insert"
  on public.booking_alerts
  for insert
  to anon, authenticated
  with check (true);

comment on table public.booking_alerts is
  'One sales-alert email to Patricia per booked Calendar event (idempotent by event_id).';
