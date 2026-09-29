/**
 * Detect Google Calendar appointment bookings on Paty's calendar and email
 * Patricia the commercial diagnosis summary + meeting date/time.
 *
 * Durable path: Vercel Cron → /api/cron/booking-alerts every 5 min.
 * Polls GOOGLECALENDAR_EVENTS_LIST (Composio account googlecalendar_refeel-embar).
 *
 * Matching (when possible): invitee email / description → diagnoses.contact_email,
 * or company_name in summary/description. Only events with ≥1 external attendee
 * and created within the lookback window are considered (avoids internal meetings
 * and historical noise on first deploy).
 *
 * Limitation: Google Appointment Schedules usually appear as normal timed events
 * with the booker as attendee shortly after booking. If an appointment never
 * surfaces with attendees, this poller cannot notify. Calendar push watch
 * (GOOGLECALENDAR_EVENTS_WATCH) exists but channels expire and need renewal;
 * cron polling is the durable choice here.
 */

import type { DiagnosisIntake, DiagnosisReport } from "@/types/diagnosis";
import {
  sendSalesAlertEmail,
  type EmailSendResult,
} from "@/lib/send-report-email";
import {
  createServerClient,
  createServiceClient,
} from "@/lib/supabase/server";

export const COMPOSIO_GCAL_ACCOUNT_ID = "googlecalendar_refeel-embar";
const PATY_EMAIL = "pfernandez@grupoendor.com";
const INTERNAL_DOMAINS = ["grupoendor.com"];
const DEFAULT_LOOKBACK_MIN = 180;
const DIAGNOSIS_MATCH_DAYS = 45;

export type CalendarAttendee = {
  email?: string;
  displayName?: string;
  self?: boolean;
  organizer?: boolean;
  responseStatus?: string;
};

export type CalendarEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: CalendarAttendee[];
  organizer?: { email?: string; self?: boolean };
  creator?: { email?: string; self?: boolean };
};

export type BookingAlertResult = {
  scanned: number;
  candidates: number;
  notified: number;
  skipped: number;
  errors: string[];
  details: Array<{
    event_id: string;
    action: string;
    diagnosis_id?: string;
    invitee?: string;
    reason?: string;
  }>;
};

function resolveGcalAccountId(): string {
  return (
    process.env.COMPOSIO_GOOGLE_CALENDAR_ACCOUNT_ID?.trim() ||
    process.env.COMPOSIO_GCAL_ACCOUNT_ID?.trim() ||
    COMPOSIO_GCAL_ACCOUNT_ID
  );
}

function lookbackMinutes(): number {
  const raw = process.env.BOOKING_ALERT_LOOKBACK_MINUTES?.trim();
  const n = raw ? Number(raw) : DEFAULT_LOOKBACK_MIN;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 60 * 24 * 7) : DEFAULT_LOOKBACK_MIN;
}

function normalizeEmail(e: string | undefined | null): string {
  return String(e || "")
    .trim()
    .toLowerCase();
}

function isInternalEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e.includes("@")) return true;
  const domain = e.split("@")[1] || "";
  return INTERNAL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function externalInviteeEmails(event: CalendarEvent): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of event.attendees || []) {
    const e = normalizeEmail(a.email);
    if (!e || a.self || isInternalEmail(e)) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

function eventCreatedMs(event: CalendarEvent): number | null {
  if (!event.created) return null;
  const t = Date.parse(event.created);
  return Number.isFinite(t) ? t : null;
}

function eventDurationMinutes(event: CalendarEvent): number | null {
  const s = event.start?.dateTime;
  const e = event.end?.dateTime;
  if (!s || !e) return null;
  const ms = Date.parse(e) - Date.parse(s);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return ms / 60_000;
}

/**
 * Likely appointment booking from the diagnóstico CTA (not internal standing meetings).
 */
export function isBookingCandidate(
  event: CalendarEvent,
  lookbackStartMs: number
): { ok: true } | { ok: false; reason: string } {
  if (!event.id) return { ok: false, reason: "missing event id" };
  if (event.status === "cancelled") return { ok: false, reason: "cancelled" };
  if (!event.start?.dateTime) return { ok: false, reason: "all-day or no dateTime" };
  const created = eventCreatedMs(event);
  if (created === null) return { ok: false, reason: "missing created" };
  if (created < lookbackStartMs) return { ok: false, reason: "created outside lookback" };
  const invitees = externalInviteeEmails(event);
  if (invitees.length === 0) {
    return { ok: false, reason: "no external invitee (Appointment Schedules usually add booker)" };
  }
  const dur = eventDurationMinutes(event);
  // Soft filter: CTA is ~20 min; allow 10–90 to catch schedule variants.
  if (dur !== null && (dur < 10 || dur > 90)) {
    return { ok: false, reason: `duration ${Math.round(dur)}m outside 10–90` };
  }
  return { ok: true };
}

type DiagnosisRow = {
  id: string;
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  contact_email: string | null;
  company_name: string | null;
  created_at: string;
  status: string;
};

function matchDiagnosis(
  event: CalendarEvent,
  invitees: string[],
  rows: DiagnosisRow[]
): { row: DiagnosisRow; matched_by: string } | null {
  const hay = `${event.summary || ""}\n${event.description || ""}`.toLowerCase();

  for (const email of invitees) {
    const hit = rows.find(
      (r) => normalizeEmail(r.contact_email) === email
    );
    if (hit) return { row: hit, matched_by: "contact_email" };
  }

  // Email mentioned in description but not as Calendar attendee field.
  for (const r of rows) {
    const ce = normalizeEmail(r.contact_email);
    if (ce && hay.includes(ce)) {
      return { row: r, matched_by: "description_email" };
    }
  }

  for (const r of rows) {
    const company = String(r.company_name || "").trim();
    if (company.length < 3) continue;
    if (hay.includes(company.toLowerCase())) {
      return { row: r, matched_by: "company_name" };
    }
  }

  return null;
}

type ComposioAttempt = {
  label: string;
  url: string;
  body: Record<string, unknown>;
};

async function tryComposioExecute(
  apiKey: string,
  attempt: ComposioAttempt
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(attempt.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(attempt.body),
    });
    const text = await res.text().catch(() => "");
    let data: {
      successful?: boolean;
      error?: string;
      data?: unknown;
      message?: string;
    } = {};
    try {
      data = text ? (JSON.parse(text) as typeof data) : {};
    } catch {
      /* non-JSON */
    }
    if (!res.ok) {
      return {
        ok: false,
        error: `${attempt.label} HTTP ${res.status}: ${text.slice(0, 300)}`,
      };
    }
    if (data.successful === false || data.error) {
      return {
        ok: false,
        error: `${attempt.label}: ${String(data.error || data.message || "failed").slice(0, 300)}`,
      };
    }
    return { ok: true, data: data.data ?? data };
  } catch (err) {
    return {
      ok: false,
      error: `${attempt.label} exception: ${
        err instanceof Error ? err.message : String(err)
      }`.slice(0, 300),
    };
  }
}

export async function listRecentCalendarEvents(params: {
  timeMin: string;
  timeMax: string;
  updatedMin?: string;
}): Promise<{ events: CalendarEvent[]; error?: string }> {
  const apiKey = process.env.COMPOSIO_API_KEY?.trim();
  if (!apiKey) {
    return { events: [], error: "COMPOSIO_API_KEY missing" };
  }
  const accountId = resolveGcalAccountId();
  const arguments_ = {
    calendarId: "primary",
    singleEvents: true,
    orderBy: "updated",
    maxResults: 100,
    timeMin: params.timeMin,
    timeMax: params.timeMax,
    timeZone: "America/Merida",
    ...(params.updatedMin ? { updatedMin: params.updatedMin } : {}),
    fields:
      "items(id,status,summary,description,start,end,created,updated,attendees,organizer,creator,htmlLink),nextPageToken",
  };

  const attempts: ComposioAttempt[] = [
    {
      label: "v3.1/tools",
      url: "https://backend.composio.dev/api/v3.1/tools/execute/GOOGLECALENDAR_EVENTS_LIST",
      body: {
        connected_account_id: accountId,
        arguments: arguments_,
        version: "latest",
      },
    },
    {
      label: "v3/tools",
      url: "https://backend.composio.dev/api/v3/tools/execute/GOOGLECALENDAR_EVENTS_LIST",
      body: {
        connected_account_id: accountId,
        arguments: arguments_,
        version: "latest",
      },
    },
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    const result = await tryComposioExecute(apiKey, attempt);
    if (result.ok) {
      const payload = result.data as {
        items?: CalendarEvent[];
        data?: { items?: CalendarEvent[] };
      };
      const items =
        payload?.items ||
        payload?.data?.items ||
        (Array.isArray(payload) ? (payload as CalendarEvent[]) : []);
      return { events: Array.isArray(items) ? items : [] };
    }
    errors.push(result.error);
  }
  return { events: [], error: errors.join(" | ").slice(0, 800) };
}

function dbClient() {
  return createServiceClient() ?? createServerClient();
}

async function alreadyNotified(eventId: string): Promise<boolean> {
  const sb = dbClient();
  if (!sb) return false;
  const { data, error } = await sb
    .from("booking_alerts")
    .select("event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) {
    console.warn("[booking-alerts] idempotency check failed:", error.message);
    return false;
  }
  return Boolean(data?.event_id);
}

async function recordAlert(row: {
  event_id: string;
  diagnosis_id: string | null;
  invitee_email: string | null;
  company_name: string | null;
  event_summary: string | null;
  event_start: string | null;
  event_end: string | null;
  event_html_link: string | null;
  matched_by: string | null;
  email_status: string;
  email_error: string | null;
}): Promise<void> {
  const sb = dbClient();
  if (!sb) {
    console.warn("[booking-alerts] no supabase client — cannot persist idempotency row");
    return;
  }
  const { error } = await sb.from("booking_alerts").upsert(row, {
    onConflict: "event_id",
    ignoreDuplicates: true,
  });
  if (error) {
    console.warn("[booking-alerts] upsert failed:", error.message);
  }
}

async function loadRecentDiagnoses(): Promise<DiagnosisRow[]> {
  const sb = dbClient();
  if (!sb) return [];
  const since = new Date(
    Date.now() - DIAGNOSIS_MATCH_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await sb
    .from("diagnoses")
    .select("id, intake, report, contact_email, company_name, created_at, status")
    .eq("status", "ready")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("[booking-alerts] diagnoses query failed:", error.message);
    return [];
  }
  return (data || []) as DiagnosisRow[];
}

function formatMeetingMerida(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Merida",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return iso;
  }
}

/**
 * Main cron job: poll calendar → match → email Paty once per event.
 */
export async function processBookingAlerts(): Promise<BookingAlertResult> {
  const lookbackMin = lookbackMinutes();
  const now = Date.now();
  const lookbackStartMs = now - lookbackMin * 60_000;
  const timeMin = new Date(lookbackStartMs).toISOString();
  // Events may be scheduled weeks ahead; still detect by created/updated.
  const timeMax = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString();
  const updatedMin = new Date(lookbackStartMs).toISOString();

  const result: BookingAlertResult = {
    scanned: 0,
    candidates: 0,
    notified: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  const listed = await listRecentCalendarEvents({
    timeMin,
    timeMax,
    updatedMin,
  });
  if (listed.error) {
    result.errors.push(listed.error);
    return result;
  }

  const events = listed.events;
  result.scanned = events.length;
  const diagnoses = await loadRecentDiagnoses();

  for (const event of events) {
    const cand = isBookingCandidate(event, lookbackStartMs);
    if (!cand.ok) {
      result.skipped += 1;
      continue;
    }
    result.candidates += 1;

    if (await alreadyNotified(event.id)) {
      result.skipped += 1;
      result.details.push({
        event_id: event.id,
        action: "skipped_idempotent",
      });
      continue;
    }

    const invitees = externalInviteeEmails(event);
    const match = matchDiagnosis(event, invitees, diagnoses);
    if (!match) {
      result.skipped += 1;
      result.details.push({
        event_id: event.id,
        action: "skipped_no_diagnosis_match",
        invitee: invitees[0],
        reason:
          "external invitee but no recent ready diagnosis matched by email/company",
      });
      // Do not persist: allow a later poll to match if diagnosis lands / email aligns.
      continue;
    }

    const { row, matched_by } = match;
    const meetingLabel = event.start?.dateTime
      ? formatMeetingMerida(event.start.dateTime)
      : "(sin hora)";

    const send: EmailSendResult = await sendSalesAlertEmail({
      intake: row.intake,
      report: row.report,
      diagnosisId: row.id,
      status: "ready",
      meeting: {
        startIso: event.start?.dateTime || "",
        endIso: event.end?.dateTime,
        summary: event.summary,
        htmlLink: event.htmlLink,
        inviteeEmails: invitees,
        formattedMerida: meetingLabel,
      },
    });

    await recordAlert({
      event_id: event.id,
      diagnosis_id: row.id,
      invitee_email: invitees[0] || normalizeEmail(row.contact_email) || null,
      company_name: row.company_name,
      event_summary: event.summary || null,
      event_start: event.start?.dateTime || null,
      event_end: event.end?.dateTime || null,
      event_html_link: event.htmlLink || null,
      matched_by,
      email_status: send.email_status,
      email_error: send.email_error || send.email_skip_reason || null,
    });

    if (send.email_sent) {
      result.notified += 1;
      result.details.push({
        event_id: event.id,
        action: "notified",
        diagnosis_id: row.id,
        invitee: invitees[0],
      });
    } else {
      result.skipped += 1;
      result.errors.push(
        `${event.id}: ${send.email_error || send.email_skip_reason || "send failed"}`
      );
      result.details.push({
        event_id: event.id,
        action: "send_failed",
        diagnosis_id: row.id,
        reason: send.email_error || send.email_skip_reason,
      });
    }
  }

  return result;
}
