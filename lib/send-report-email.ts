/**
 * Envío del reporte de diagnóstico al cliente.
 *
 * Preferencia (steering):
 * 1) COMPOSIO_API_KEY → GMAIL_SEND_EMAIL vía Composio Actions/Tools API
 *    connected_account_id: gmail_bizet-strid (herramientas@grupoendor.com)
 * 2) RESEND_API_KEY → Resend (fallback; from EMAIL_FROM o onboarding@resend.dev)
 * 3) Sin claves → email_sent: false + email_skip_reason (no falla el analyze)
 *
 * Solo se llama cuando status === "ready" (no cuando needs_review).
 * PDF one-pager: link en el HTML; no bloquear email si PDF falla.
 */

import type { DiagnosisIntake, DiagnosisReport, SemaphoreColor } from "@/types/diagnosis";
import { PAI_META, PAI_STATUS_LABELS, SEMAPHORE_LABELS } from "@/types/diagnosis";

const DEFAULT_BOOKING =
  "https://calendar.app.google/P3Pi2TQHQ8cSgr6N7";
const DEFAULT_APP_URL = "https://endor-diagnostico.vercel.app";
const HERRAMIENTAS_FROM = "herramientas@grupoendor.com";
/** Composio connected account for herramientas@grupoendor.com */
export const COMPOSIO_GMAIL_ACCOUNT_I45, "gmail_bizet-strid";

export type EmailSendResult = {
  email_sent: boolean;
  email_error?: string;
  email_skip_reason?: string;
  provider?: "composio_gmail" | "resend";
  email_sent_at?: string;
};

const COLOR_HEX: Record<SemaphoreColor, string> = {
  red: "#f87171",
  yellow: "#fbbf24",
  green: "#34d399",
  not_evaluated: "#737373",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportEmailHtml(params: {
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  diagnosisId: string;
}): { subject: string; html: string; to: string } {
  const { intake, report, diagnosisId } = params;
  const company = intake.contact.company || "tu marca";
  const to = intake.contact.work_email;
  const booking =
    process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || DEFAULT_BOOKING;
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL
  ).replace(/\/$/, "");
  const reportUrl = `${appUrl}/reporte/${diagnosisId}`;
  const pdfUrl = `${appUrl}/api/reporte/${diagnosisId}/pdf`;

  const dimRows = report.dimensions
    .map((d) => {
      const hex = COLOR_HEX[d.color];
      const score = d.score === null ? "—" : String(d.score);
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${hex};margin-right:8px;"></span>
          ${escapeHtml(d.label)}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;text-align:right;color:${hex};font-weight:600;">${score}</td>
      </tr>`;
    })
    .join("");

  const paiStrip = (["producto", "atributo", "idea", "concepto"] as const)
    .map((k) => {
      const st = report.pai[k];
      const hex =
        st === "claro"
          ? COLOR_HEX.green
          : st === "difuso"
            ? COLOR_HEX.yellow
            : COLOR_HEX.red;
      return `<td style="padding:10px 8px;text-align:center;border:1px solid #e5e5e5;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#737373;">${escapeHtml(PAI_META[k].label)}</div>
        <div style="margin-top:6px;font-weight:700;color:${hex};">${escapeHtml(PAI_STATUS_LABELS[st])}</div>
      </td>`;
    })
    .join("");

  const findingsHtml = report.findings
    .slice(0, 3)
    .map(
      (f, i) => `<div style="margin:16px 0;padding:16px;border:1px solid #e5e5e5;border-radius:12px;">
      <div style="font-size:12px;color:#b45309;font-weight:600;">Hallazgo ${i + 1}</div>
      <p style="margin:8px 0;"><strong>Hecho.</strong> ${escapeHtml(f.fact)}</p>
      <p style="margin:8px 0;color:#525252;"><strong>Comparación.</strong> ${escapeHtml(f.compare)}</p>
      <p style="margin:8px 0;color:#525252;"><strong>Costo.</strong> ${escapeHtml(f.cost)}</p>
      <p style="margin:12px 0 0;padding-top:12px;border-top:1px solid #e5e5e5;font-style:italic;color:#737373;">${escapeHtml(f.category_closer)}</p>
    </div>`
    )
    .join("");

  const globalHex = COLOR_HEX[report.global_color];

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;line-height:1.5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
  <tr><td style="background:#111827;color:#fff;padding:28px 32px;">
    <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.75;margin-bottom:8px;">Ēndor · Diagnóstico de marca</div>
    <h1 style="margin:0 0 8px;font-size:22px;line-height:1.3;">Tu diagnóstico — ${escapeHtml(company)}</h1>
    <p style="margin:0;opacity:0.9;font-size:14px;">${escapeHtml(SEMAPHORE_LABELS[report.global_color])}</p>
  </td></tr>

  <tr><td style="padding:20px 32px;background:#fffbeb;border-bottom:1px solid #fde68a;" align="center">
    <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#92400e;">Descarga tu one-pager en PDF</p>
    <a href="${escapeHtml(pdfUrl)}" style="display:inline-block;background:#111827;color:#fbbf24;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px;">Descargar PDF · one-pager</a>
    <p style="margin:10px 0 0;font-size:11px;color:#a16207;word-break:break-all;">${escapeHtml(pdfUrl)}</p>
  </td></tr>

  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#737373;">Veredicto</p>
    <p style="margin:0;font-size:18px;font-weight:600;">${escapeHtml(report.verdict)}</p>
  </td></tr>

  <tr><td style="padding:0 32px 24px;" align="center">
    <div style="display:inline-block;padding:20px 32px;border:1px solid #e5e5e5;border-radius:16px;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#737373;">Puntaje global</div>
      <div style="font-size:48px;font-weight:700;color:${globalHex};">${report.global_score}</div>
    </div>
  </td></tr>

  <tr><td style="padding:0 32px 24px;">
    <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#737373;">Semáforo (6 dimensiones)</p>
    <table width="100%" cellpadding="0" cellspacing="0">${dimRows}</table>
    <p style="margin:8px 0 0;font-size:11px;color:#a3a3a3;">Sin puntajes de competidores — solo tu marca.</p>
  </td></tr>

  <tr><td style="padding:0 32px 24px;">
    <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#737373;">Cadena PAI</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>${paiStrip}</tr></table>
    <p style="margin:12px 0 0;font-size:14px;">${escapeHtml(report.pai_reading)}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#525252;font-style:italic;">${escapeHtml(report.intention_quote)}</p>
  </td></tr>

  <tr><td style="padding:0 32px 24px;">
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#737373;">Los 3 hallazgos que más pesan</p>
    ${findingsHtml}
  </td></tr>

  <tr><td style="padding:0 32px 32px;" align="center">
    <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#b45309;">${escapeHtml(report.cta.phrase)}</p>
    <a href="${escapeHtml(booking)}" style="display:inline-block;background:#f59e0b;color:#111;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;font-size:14px;">Agendar llamada de 20 min</a>
    <p style="margin:16px 0 0;font-size:13px;"><a href="${escapeHtml(reportUrl)}" style="color:#2563eb;">Ver reporte completo</a>
      · <a href="${escapeHtml(pdfUrl)}" style="color:#2563eb;">Descargar PDF</a></p>
  </td></tr>

  <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:11px;color:#737373;">
    Enviado por Ēndor (Grupo Endor) · ${escapeHtml(HERRAMIENTAS_FROM)}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return {
    to,
    subject: `[Ēndor] Tu diagnóstico de marca — ${company}`,
    html,
  };
}

function resolveAccountId(): string {
  return (
    process.env.COMPOSIO_GMAIL_ACCOUNT_I4?.trim() ||
    process.env.COMPOSIO_CONNECTED_ACCOUNT_I4?.trim() ||
    COMPOSIO_GMAIL_ACCOUNT_I4
  );
}

type ComposioAttempt = {
  label: string;
  url: string;
  body: Record<string, unknown>;
};

async function tryComposioExecute(
  apiKey: string,
  attempt: ComposioAttempt
): Promise<{ ok: true } | { ok: false; error: string }> {
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
      data?: { error?: string; successful?: boolean };
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
    if (
      data.successful === false ||
      data.error ||
      data.data?.error ||
      data.data?.successful === false
    ) {
      return {
        ok: false,
        error: `${attempt.label}: ${String(
          data.error || data.data?.error || data.message || "send failed"
        ).slice(0, 300)}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: `${attempt.label} exception: ${
        err instanceof Error ? err.message : String(err)
      }`.slice(0, 300),
    };
  }
}

async function sendViaComposio(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.COMPOSIO_API_KEY?.trim();
  if (!apiKey) {
    return {
      email_sent: false,
      email_skip_reason: "COMPOSIO_API_KEY missing",
    };
  }

  const accountId = resolveAccountId();
  const gmailArgs = {
    recipient_email: params.to,
    subject: params.subject,
    body: params.html,
    is_html: true,
    user_id: "me",
    from_email: HERRAMIENTAS_FROM,
  };

  // v2 Actions API is gone (HTTP 410). Prefer v3.1, then v3.
  const attempts: ComposioAttempt[] = [
    {
      label: "v3.1/tools",
      url: "https://backend.composio.dev/api/v3.1/tools/execute/GMAIL_SEND_EMAIL",
      body: {
        connected_account_id: accountId,
        arguments: gmailArgs,
        version: "latest",
      },
    },
    {
      label: "v3/tools",
      url: "https://backend.composio.dev/api/v3/tools/execute/GMAIL_SEND_EMAIL",
      body: {
        connected_account_id: accountId,
        arguments: gmailArgs,
        version: "latest",
      },
    },
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    const result = await tryComposioExecute(apiKey, attempt);
    if (result.ok) {
      return {
        email_sent: true,
        provider: "composio_gmail",
        email_sent_at: new Date().toISOString(),
      };
    }
    errors.push(result.error);
    console.warn("Composio Gmail attempt failed:", result.error);
  }

  return {
    email_sent: false,
    email_error: errors.join(" | ").slice(0, 800),
    provider: "composio_gmail",
  };
}

async function sendViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      email_sent: false,
      email_skip_reason: "RESEND_API_KEY missing",
    };
  }
  const from =
    process.env.EMAIL_FROM?.trim() ||
    `Ēndor <onboarding@resend.dev>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      email_sent: false,
      email_error: `Resend HTTP ${res.status}: ${text.slice(0, 200)}`,
      provider: "resend",
    };
  }

  return {
    email_sent: true,
    t {
        con
    } b: string):     acuando n            . NF dellanzareturn    v   o cuanconsolorte.
  | OPENROUTER_API_KEY) csect: ace(/"/g,,
  });
}

export async function buildReportPdf(params: {
  intake: DiagnosisIntake;
  report: Diagn  subject: string;
  html: {></tgify({
 ,lHex =}f buildDplace(/"/g, "&quot;");onst apiKeto dateto    msg.inc@")ocess.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
    ke.contact.company || "tufalse,
  oror:vali ${text.slice(0, 2nt: OpePromise<EmailSendResult> {
  conshtml: params, model, 
dFallbac| "tu] rors.joiected__FROM   o}L",
    =l_senY missing",
   }${escap  const text }`.slice(0, 300){></tgify({
 ,lHex =}: 10,
   nt: OpePromise<EmailSendResult> {
  coocess.env.RESENider: "composi{></tgify({
 ,lHex =}: 10,
 sio Gmail attempt failed:", result.error);
   return {
  ers: {
 No
 * PDFOpenAI; mt runB: Ll. Setal cliente.
 *
 * (
    )OLOR_push(rendor.com";
/** Composio construm */
export const) oro  email_sent: f) cV DEFAU").slice(0                                               