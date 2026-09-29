-- Persistir cuándo se envió el correo del reporte al cliente.
-- Si la columna ya existe, IF NOT EXISTS evita error.
alter table public.diagnoses
  add column if not exists email_sent_at timestamptz;

comment on column public.diagnoses.email_sent_at is
  'Timestamp del envío del email HTML del diagnóstico (solo status=ready).';
