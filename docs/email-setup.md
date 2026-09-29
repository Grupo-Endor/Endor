# Email del diagnóstico (cliente + alert comercial)

Cuando `/api/analyze` termina con `status: "ready"` **y** el reporte es real
(no mock/demo/placeholder), se intentan **dos** envíos vía Composio Gmail
(`herramientas@grupoendor.com` / `gmail_bizet-strid`):

1. **Cliente** → `intake.contact.work_email` (one-pager + CTA único de agenda)
2. **Alert comercial** → `pfernandez@grupoendor.com` (resumen de lead / conversación)

**Entrega automática:** el status de entrega es siempre `"ready"` cuando hay
reporte. `needs_human_review` (dual-run Δ>15) se guarda en DB/JSON como flag
interno y **nunca** bloquea el correo ni se muestra en ReportView.

**NUNCA** se envía correo si:
- `status !== "ready"` (p. ej. `analyzing` / `failed`)
- `report` ausente o vacío
- `report.mock === true` o scores/copy coinciden con `buildMockReport`
- el HTML generado parece PLACEHOLDER / demostración (solo correo cliente)

Gates en `lib/send-report-email.ts` **y** `app/api/analyze/route.ts` (belt + suspenders).
Se loguea claramente `[email] SKIPPED (...)` / `[sales-alert] SKIPPED (...)` cuando se omite.

## Orden de providers

1. **Composio Gmail** (preferido) — `COMPOSIO_API_KEY` en Vercel
   - Tool: `GMAIL_SEND_EMAIL` vía REST **v3.1** (v2 Actions está deprecado, HTTP 410)
   - Connected account: `gmail_bizet-strid` → `herramientas@grupoendor.com`
   - Override: `COMPOSIO_GMAIL_ACCOUNT_ID` / `COMPOSIO_CONNECTED_ACCOUNT_ID`
2. **Resend** — si no hay `COMPOSIO_API_KEY` pero sí `RESEND_API_KEY`
3. Sin claves → `email_sent: false` + `email_skip_reason` (el análisis no falla)

## Acción requerida en Vercel

Proyecto `endor-diagnostico` / team `endor2`:

- `COMPOSIO_API_KEY` = API key del proyecto Composio que posee `gmail_bizet-strid`
  (herramientas-endor). Una key inválida/revocada produce HTTP 401 y el correo no sale.
- `COMPOSIO_GMAIL_ACCOUNT_ID=gmail_bizet-strid`
- `NEXT_PUBLIC_APP_URL=https://endor-diagnostico.vercel.app`
- `NEXT_PUBLIC_BOOKING_URL=https://calendar.app.google/P3Pi2TQHQ8cSgr6N7`

## Observabilidad

El resultado del envío se escribe en `report._email` (`email_sent`, `email_error`,
`email_status`, `sales_alert_sent`, `sales_alert_status`, …), `diagnoses.email_sent_at`
cuando el envío al cliente fue exitoso, y `diagnoses.email_status`
(`sent` | `skipped_mock` | `skipped_not_ready` | `skipped_invalid` |
`skipped_no_provider` | `failed`).
