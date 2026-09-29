-- Denormalized contact / scope columns for ops browsing in Supabase dashboard.
-- Full intake remains in jsonb `intake`; these mirror contact + reach for filters.

alter table public.diagnoses
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists company_name text,
  add column if not exists reach text;

comment on column public.diagnoses.contact_name is
  'Denormalized from intake.contact.full_name';
comment on column public.diagnoses.contact_email is
  'Denormalized from intake.contact.work_email';
comment on column public.diagnoses.contact_phone is
  'Denormalized from intake.contact.whatsapp';
comment on column public.diagnoses.company_name is
  'Denormalized from intake.contact.company';
comment on column public.diagnoses.reach is
  'Denormalized from intake.scope.reach (local|nacional|exportacion|internacional)';

create index if not exists diagnoses_contact_email_idx
  on public.diagnoses (contact_email);

create index if not exists diagnoses_company_name_idx
  on public.diagnoses (company_name);

-- Backfill from existing intake jsonb rows (if any).
update public.diagnoses
set
  contact_name = coalesce(contact_name, intake->'contact'->>'full_name'),
  contact_email = coalesce(contact_email, intake->'contact'->>'work_email'),
  contact_phone = coalesce(contact_phone, intake->'contact'->>'whatsapp'),
  company_name = coalesce(company_name, intake->'contact'->>'company'),
  reach = coalesce(reach, intake->'scope'->>'reach')
where intake is not null
  and (
    contact_name is null
    or contact_email is null
    or contact_phone is null
    or company_name is null
    or reach is null
  );
