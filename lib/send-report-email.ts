/**
 * Envío del reporte de diagnóstico al cliente.
 *
 * Preferencia (steering):
 * 1) COMPOSIO_API_KEY → GMAIL_SEND_EMAIL vía Composio Actions/Tools API
 *    connected_account_id: gmail_bizet-strid (herramientas@grupoendor.com)
 * 2) RESEND_API_KEY → Resend (fallback; from EMAIL_FROM o onboarding@resend.dev)
 * 3) Sin claves → email_sent: false + email_skip_reason (no falla el analyze)
 *
 * Solo se envía cuando status === "ready" Y el reporte es real (no mock/demo/placeholder).
 * PDF one-pager: link en el HTML; no bloquear email si PDF falla.
 *
 * GATE (belt): también se valida en app/api/analyze/route.ts antes de llamar.
 */

import type { DiagnosisIntake, DiagnosisReport, SemaphoreColor } from "@/types/diagnosis";
import { PAI_META, PAI_STATUS_LABELS, SEMAPHORE_LABELS } from "@/types/diagnosis";
import { isMockLikeReport } from "@/lib/report";

const DEFAULT_BOOKING =
  "https://calendar.app.google/P3Pi2TQHQ8cSgr6N7";
const DEFAULT_APP_URL = "https://endor-diagnostico.vercel.app";
const HERRAMIENTAS_FROM = "herramientas@grupoendor.com";
/** Composio connected account for herramientas@grupoendor.com */
export const COMPOSIO_GMAIL_ACCOUNT_ID = "gmail_bizet-strid";

export type EmailStatus =
  | "sent"
  | "skipped_mock"
  | "skipped_not_ready"
  | "skipped_invalid"
  | "skipped_no_provider"
  | "falled";

export type EmailSendResult = {
  email_sent: boolean;
  email_error?: string;
  email_skip_reason?: string;
  provider?: "composio_gmail" | "resend";
  email_sent_at?: string;
  /** Durable outcome for diagnoses.email_status */
  email_status: EmailStatus;
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
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#92400e;">Tu diagnóstico ya está listo</p>
    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">Léelo abajo — y agenda 20 minutos para priorizar qué atacar primero.</p>
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
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#b45309;">Siguiente paso</p>
    <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#b45309;line-height:1.35;">${escapeHtml(report.cta.phrase)}</p>
    <p style="margin:0 auto 18px;max-width:420px;font-size:14px;color:#525252;line-height:1.5;">Este diagnóstico ya te dice dónde se te están yendo clientes. En 20 minutos te ayudamos a priorizar qué atacar primero — sin pitch de paquete, solo claridad.</p>
    <a href="${escapeHtml(booking)}" style="display:inline-block;background:#f59e0b;color:#111;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;font-size:15px;letter-spacing:0.02em;">Agenda tu llamada de 20 min</a>
    <p style="margin:14px 0 0;font-size:12px;color:#a3a3a3;">Cupo limitado · Sin compromiso · Equipo Ēndor</p>
    <p style="margin:18px 0 0;font-size:12px;color:#737373;">
      <a href="${escapeHtml(reportUrl)}" style="color:#737373;text-decoration:underline;">Ver reporte en línea</a>
      &nbsp;·&nbsp;
      <a href="${escapeHtml(pdfUrl)}" style="color:#737373;text-decoration:underline;">PDF one-pager</a>
    </p>
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
    process.env.COMPOSIO_GMAIL_ACCOUNT_ID?.trim() ||
    process.env.COMPOSIO_CONNECTED_ACCOUNT_ID?.trim() ||
    COMPOSIO_GMAIL_ACCOUNT_ID
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
      email_status: "skipped_no_provider",
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
        email_status: "sent",
      };
    }
    errors.push(result.error);
    console.warn("Composio Gmail attempt failed:", result.error);
  }

  return {
    email_sent: false,
    email_error: errors.join(" | ").slice(0, 800),
    provider: "composio_gmail",
    email_status: "failed",
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
      email_status: "skipped_no_provider",
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
      email_status: "failed",
    };
  }

  return {
    email_sent: true,
    provider: "resend",
    email_sent_at: new Date().toISOString(),
    email_status: "sent",
  };
}

/**
 * Quality gate — never send mock/demo/placeholder/incomplete reports.
 * Also called from app/api/analyze/route.ts (belt and suspenders).
 */
export function assertReportEmailable(params: {
  report: DiagnosisReport | null | undefined;
  status?: string;
  diagnosisId?: string;
}): { ok: true } | { ok: false; reason: string; email_status: EmailStatus } {
  const { report, status, diagnosisId } = params;
  if (status !== undefined && status !== "ready") {
    return {
      ok: false,
      reason: `status is ${status || "undefined"} — email withheld (only status=ready)`,
      email_status: "skipped_not_ready",
    };
  }
  if (!report) {
    return {
      ok: false,
      reason: "report missing — refusing to email",
      email_status: "skipped_mock",
    };
  }
  const mockCheck = isMockLikeReport(report);
  if (mockCheck.mock) {
    return {
      ok: false,
      reason: `mock/demo/placeholder report blocked: ${mockCheck.reason}`,
      email_status: "skipped_mock",
    };
  }
  if (!diagnosisId || !String(diagnosisId).trim()) {
    return {
      ok: false,
      reason: "diagnosisId missing — refusing to email without PDF/report links",
      email_status: "skipped_invalid",
    };
  }
  return { ok: true };
}

function looksLikePlaceholderHtml(html: string): boolean {
  const trimmed = html.replace(/\s+/g, " ").trim();
  if (!trimmed) return true;
  if (trimmed.length < 200) return true;
  const lower = trimmed.toLowerCase();
  if (lower === "placeholder" || lower.includes(">placeholder<")) return true;
  if (lower.includes("demostración") || lower.includes("demostracion")) return true;
  if (lower.includes("(mock)") || lower.includes("grupo mock")) return true;
  // Real diagnosis emails always include these sections from buildReportEmailHtml
  if (!lower.includes("puntaje global") || !lower.includes("cadena pai")) return true;
  return false;
}

/**
 * Envía el HTML del reporte. Nunca lanza: errores van en el resultado.
 * NEVER emails mock/demo/placeholder reports (see assertReportEmailable).
 */
export async function sendReportEmail(params: {
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  diagnosisId: string;
  /** When provided, must be "ready" or email is skipped. */
  status?: string;
}): Promise<EmailSendResult> {
  const gate = assertReportEmailable({
    report: params.report,
    status: params.status,
    diagnosisId: params.diagnosisId,
  });
  if (!gate.ok) {
    console.warn(
      `[email] SKIPPED (${gate.email_status}) id=${params.diagnosisId}: ${gate.reason}`
    );
    return {
      email_sent: false,
      email_skip_reason: gate.reason,
      email_status: gate.email_status,
    };
  }

  const { to, subject, html } = buildReportEmailHtml(params);
  if (!to || !to.includes("@")) {
    console.warn(
      `[email] SKIPPED (skipped_invalid) id=${params.diagnosisId}: invalid work_email`
    );
    return {
      email_sent: false,
      email_skip_reason: "intake.contact.work_email missing or invalid",
      email_status: "skipped_invalid",
    };
  }

  if (looksLikePlaceholderHtml(html)) {
    console.warn(
      `[email] SKIPPED (skipped_mock) id=${params.diagnosisId}: HTML looks like placeholder/mock — refusing send`
    );
    return {
      email_sent: false,
      email_skip_reason:
        "generated HTML looks like placeholder/mock/demo — refusing send",
      email_status: "skipped_mock",
    };
  }

  if (process.env.COMPOSIO_API_KEY?.trim()) {
    console.info(
      `[email] composio gmail → ${to} account=${resolveAccountId()} id=${params.diagnosisId}`
    );
    return sendViaComposio({ to, subject, html });
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend({ to, subject, html });
  }

  return {
    email_sent: false,
    email_skip_reason:
      "No email provider configured. Set COMPOSIO_API_KEY (preferred: Gmail herramientas@grupoendor.com via gmail_bizet-strid) or RESEND_API_KEY on Vercel.",
    email_status: "skipped_no_provider",
  };
}


/** Destinataria comercial del alert interno (Patricia Fernández). */
export const SALES_ALERT_TO = "pfernandez@grupoendor.com";

/**
 * Resumen comercial del mismo análisis — tono interno, no one-pager de cliente.
 * Solo se arma cuando el reporte ya pasó assertReportEmailable (real / ready).
 */
export function buildSalesAlertEmailHtml(params: {
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  diagnosisId: string;
}): { subject: string; html: string; to: string } {
  const { intake, report, diagnosisId } = params;
  const company = intake.contact.company || "(sin empresa)";
  const contactName = intake.contact.full_name || "(sin nombre)";
  const contactEmail = intake.contact.work_email || "—";
  const contactPhone = intake.contact.whatsapp || "—";
  const sector = intake.scope.sector || "—";
  const city = intake.scope.city || "—";
  const reach = intake.scope.reach || "—";
  const booking =
    process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || DEFAULT_BOOKING;
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL
  ).replace(/\/$/, "");
  const reportUrl = `${appUrl}/reporte/${diagnosisId}`;
  const globalHex = COLOR_HEX[report.global_color];
  const colorLabel = SEMAPHORE_LABELS[report.global_color];

  const dimGaps = report.dimensions
    .filter((d) => d.color === "red" || d.color === "yellow")
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
    .slice(0, 4)
    .map((d) => {
      const score = d.score === null ? "—" : String(d.score);
      return `<li style="margin:4px 0;"><strong>${escapeHtml(d.label)}</strong>: ${score} (${escapeHtml(SEMAPHORE_LABELS[d.color])})</li>`;
    })
    .join("");

  const paiLine = (["producto", "atributo", "idea", "concepto"] as const)
    .map((k) => `${PAI_META[k].label}: ${PAI_STATUS_LABELS[report.pai[k]]}`)
    .join(" → ");

  const findingsSales = report.findings
    .slice(0, 3)
    .map(
      (f, i) => `<div style="margin:12px 0;padding:12px;border-left:3px solid #f59e0b;background:#fffbeb;">
      <div style="font-size:12px;font-weight:700;color:#92400e;">Ángulo de conversación ${i + 1}</div>
      <p style="margin:6px 0;font-size:13px;"><strong>Hecho:</strong> ${escapeHtml(f.fact)}</p>
      <p style="margin:6px 0;font-size:13px;color:#525252;"><strong>Costo que duele:</strong> ${escapeHtml(f.cost)}</p>
      <p style="margin:6px 0;font-size:13px;color:#737373;font-style:italic;">Categoría (sin recetar): ${escapeHtml(f.category_closer)}</p>
    </div>`
    )
    .join("");

  const whyLead = `Score ${report.global_score}/100 (${colorLabel}). ${escapeHtml(report.verdict)} Abrir conversación por: ${escapeHtml(report.cta.phrase)} Perfil CTA interno: ${escapeHtml(report.cta.profile)} / hint ${escapeHtml(report.cta.service_hint)}.`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;line-height:1.5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
  <tr><td style="background:#7c2d12;color:#fff;padding:24px 28px;">
    <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.85;">Ēndor · Alert comercial</div>
    <h1 style="margin:8px 0 0;font-size:20px;">Lead: ${escapeHtml(company)}</h1>
    <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">Score <strong style="color:${globalHex};">${report.global_score}</strong> · ${escapeHtml(colorLabel)}</p>
  </td></tr>

  <tr><td style="padding:24px 28px;">
    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#737373;">Contacto</p>
    <p style="margin:0;font-size:15px;font-weight:600;">${escapeHtml(contactName)}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#525252;">${escapeHtml(contactEmail)} · ${escapeHtml(contactPhone)}</p>
    <p style="margin:12px 0 0;font-size:13px;"><strong>Sector:</strong> ${escapeHtml(sector)} · <strong>Ciudad:</strong> ${escapeHtml(city)} · <strong>Alcance:</strong> ${escapeHtml(reach)}</p>
  </td></tr>

  <tr><td style="padding:0 28px 20px;">
    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#737373;">Por qué este lead / conversación a abrir</p>
    <p style="margin:0;font-size:14px;line-height:1.55;">${whyLead}</p>
  </td></tr>

  <tr><td style="padding:0 28px 20px;">
    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#737373;">Cadena PAI</p>
    <p style="margin:0;font-size:13px;font-family:monospace;">${escapeHtml(paiLine)}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#525252;">${escapeHtml(report.pai_reading)}</p>
  </td></tr>

  <tr><td style="padding:0 28px 20px;">
    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#737373;">Top gaps / semáforo débil</p>
    <ul style="margin:0;padding-left:18px;font-size:13px;">${dimGaps || "<li>Sin rojos/amarillos destacados</li>"}</ul>
    <p style="margin:12px 0 0;font-size:13px;"><strong>Punto ciego:</strong> ${escapeHtml(report.blind_spot)}</p>
  </td></tr>

  <tr><td style="padding:0 28px 24px;">
    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#737373;">Hallazgos (lenguaje comercial)</p>
    ${findingsSales}
  </td></tr>

  <tr><td style="padding:0 28px 28px;" align="center">
    <a href="${escapeHtml(reportUrl)}" style="display:inline-block;background:#111827;color:#fbbf24;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px;margin:4px;">Abrir reporte</a>
    <a href="${escapeHtml(booking)}" style="display:inline-block;background:#f59e0b;color:#111;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px;margin:4px;">Link de agenda</a>
    <p style="margin:14px 0 0;font-size:11px;color:#a3a3a3;word-break:break-all;">${escapeHtml(reportUrl)}</p>
  </td></tr>

  <tr><td style="padding:14px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:11px;color:#737373;">
    Alert interno · ${escapeHtml(HERRAMIENTAS_FROM)} → ${escapeHtml(SALES_ALERT_TO)} · id ${escapeHtml(diagnosisId)}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return {
    to: SALES_ALERT_TO,
    subject: `[Endor Diagnóstico] Lead: ${company} — score ${report.global_score}`,
    html,
  };
}

/**
 * Alert comercial a Patricia. Mismos gates que el correo al cliente
 * (ready + reporte real, no mock). Nunca lanza.
 */
export async function sendSalesAlertEmail(params: {
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  diagnosisId: string;
  status?: string;
}): Promise<EmailSendResult> {
  const gate = assertReportEmailable({
    report: params.report,
    status: params.status,
    diagnosisId: params.diagnosisId,
  });
  if (!gate.ok) {
    console.warn(
      `[sales-alert] SKIPPED (${gate.email_status}) id=${params.diagnosisId}: ${gate.reason}`
    );
    return {
      email_sent: false,
      email_skip_reason: gate.reason,
      email_status: gate.email_status,
    };
  }

  const { to, subject, html } = buildSalesAlertEmailHtml(params);
  // Sales HTML usa títulos distintos al correo cliente; no usar looksLikePlaceholderHtml.
  const trimmed = html.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length < 200) {
    return {
      email_sent: false,
      email_skip_reason: "sales alert HTML too short — refusing send",
      email_status: "skipped_mock",
    };
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("(mock)") || lower.includes("grupo mock")) {
    return {
      email_sent: false,
      email_skip_reason: "sales alert looks like mock — refusing send",
      email_status: "skipped_mock",
    };
  }

  if (process.env.COMPOSIO_API_KEY?.trim()) {
    console.info(
      `[sales-alert] composio gmail → ${to} account=${resolveAccountId()} id=${params.diagnosisId}`
    );
    return sendViaComposio({ to, subject, html });
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend({ to, subject, html });
  }

  return {
    email_sent: false,
    email_skip_reason:
      "No email provider configured for sales alert (COMPOSIO_API_KEY or RESEND_API_KEY).",
    email_status: "skipped_no_provider",
  };
}
