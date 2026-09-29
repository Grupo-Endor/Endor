-- Durable email outcome for diagnosis rows (sent / skipped_mock / failed / …).
alter table public.diagnoses
  add column if not exists email_status text;

comment on column public.diagnoses.email_status is
  'Email outcome: sent | skipped_mock | skipped_not_ready | skipped_invalid | skipped_no_provider | failed';
