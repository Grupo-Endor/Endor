# Email del diagnóstico (cliente) + alert comercial al agendar

## Correo al cliente (en `/api/analyze`)

Cuando `/api/analyze` termina con `status: "ready"` **y** el reporte es real
(no mock/demo/placeholder), se envía **un** correo vía Composio Gmail
(`herramientas@grupoendor.com` / `gmail_bizet-strid`) a `intake.contact.work_email`
(one-pager + CTA de agenda).

**Patricia NO recibe correo en este paso.**

**Entrega automática:** el status de entrega es siempre `"ready"` cuando hay
reporte. `needs_human_review` (dual-run Δ>15) se guarda en DB/JSON como flag
interno y **nunca** bloquea el correo ni se muestra en ReportView.

**NUNCA** se envía correo al cliente si:
- `status !== "ready"`
- `report` ausente o vacío
- `report.mock === true` o scores/copy coinciden con `buildMockReport`
- el HTML generado parece PLACEHOLDER / demostración

Gates en `lib/send-report-email.ts` **y** `app/api/analyze/route.ts`.

## Alert comercial a Patricia (solo si agenda)

Patricia (`pfernandez@grupoendor.com`) recibe el resumen comercial **solo cuando
un lead agenda** en su Google Calendar Appointment Schedule
(`NEXT_PUBLIC_BOOKING_URL=https://calendar.app.google/P3Pi2TQHQ8cSgr6N7`).

### Flujo booking → Paty

1. Vercel Cron `*/5 * * * *` → `GET /api/cron/booking-alerts` (Bearer `CRON_SECRET`).
2. Composio `GOOGLECALENDAR_EVENTS_LIST` en la cuenta `googlecalendar_refeel-embar`
   (alias `endor-calendar`, calendar de `pfernandez@grupoendor.com`, TZ America/Merida).
3. Filtra eventos **timed** creados dentro del lookback (default 180 min) con
   ≥1 invitee externo (no `@grupoendor.com`) y duración ~10–90 min.
4. Empareja invitee email / descripción / company con un `diagnoses` reciente
   (`status=ready`, últimos 45 días) por `contact_email` o `company_name`.
5. Envía el mismo resumen comercial de antes + **fecha/hora de la cita**
   (America/Merida) vía Gmail `gmail_bizet-strid` → `pfernandez@`.
6. Idempotencia: tabla `booking_alerts` (PK `event_id`) — un correo por evento.

Código: `lib/booking-alerts.ts`, `app/api/cron/booking-alerts/route.ts`,
migración `006_booking_alerts.sql`.

### Limitaciones

- Google Appointment Schedules suelen aparecer como eventos normales con el
  booker como attendee poco después de agendar. Si un booking **no** crea un
  evento con attendees externos, el poller no puede notificar.
- `GOOGLECALENDAR_EVENTS_WATCH` (push webhook) existe en Composio, pero los
  channels expiran y hay que renovarlos; el cron cada 5 minutos es el camino
  durable elegido.
- Sin match a un diagnóstico reciente, se registra el evento como
  `skipped_no_match` (sin email) para no spamear citas internas/ajenas.
- Plan Vercel: cron `*/5` requiere Pro (Hobby solo permite 1/día).

## Orden de providers (ambos correos)

1. **Composio Gmail** — `COMPOSIO_API_KEY` + `gmail_bizet-strid`
2. **Resend** — fallback si no hay Composio
3. Sin claves → skip (el análisis no falla)

## Env vars (Vercel `endor-diagnostico`)

- `COMPOSIO_API_KEY`
- `COMPOSIO_GMAIL_ACCOUNT_ID=gmail_bizet-strid`
- `COMPOSIO_GOOGLE_CALENDAR_ACCOUNT_ID=googlecalendar_refeel-embar`
- `CRON_SECRET` (Bearer para `/api/cron/booking-alerts`)
- `BOOKING_ALERT_LOOKBACK_MINUTES=180` (opcional)
- `NEXT_PUBLIC_APP_URL=https://endor-diagnostico.vercel.app`
- `NEXT_PUBLIC_BOOKING_URL=https://calendar.app.google/P3Pi2TQHQ8cSgr6N7`
- `SUPABASE_SERVICE_ROLE_KEY` (recomendado para `booking_alerts` upsert)

## Observabilidad

- Cliente: `report._email`, `diagnoses.email_sent_at`, `diagnoses.email_status`
- Booking: filas en `booking_alerts` + logs `[booking-alerts]`
