# Email del diagnóstico al cliente

Cuando `/api/analyze` termina con `status: "ready"`, se intenta enviar un HTML
a `intake.contact.work_email`. Si `needs_review`, **no** se envía.

## Orden de providers

1. **Composio Gmail** (preferido) — `COMPOSIO_API_KEY` en Vercel
   - Action: `GMAIL_SEND_EMAIL` (`is_html: true`)
   - Connected account: `gmail_moosa-torve` → `herramientas@grupoendor.com`
   - Override opcional: `COMPOSIO_GMAIL_ACCOUNT_ID`
2. **Resend** — si no hay `COMPOSIO_API_KEY` pero sí `RESEND_API_KEY`
   - `EMAIL_FROM` (default test: `onboarding@resend.dev`)
3. Sin claves → `email_sent: false` + `email_skip_reason` en la respuesta JSON
   (el análisis **no** falla).

## Acción requerida en Vercel

Proyecto `endor-diagnostico` / team `endor2`: agregar env var de producción

- `COMPOSIO_API_KEY` = (API key de Composio org)
- Opcional: `COMPOSIO_GMAIL_ACCOUNT_ID=gmail_moosa-torve` (plain string)
- Alias: `COMPOSIO_CONNECTED_ACCOUNT_ID=gmail_moosa-torve`
- `NEXT_PUBLIC_APP_URL=https://endor-diagnostico.vercel.app`

## Columna Supabase

Migración `002_email_sent_at.sql` agrega `diagnoses.email_sent_at`.
Si falta, el update se omite sin romper el analyze.
