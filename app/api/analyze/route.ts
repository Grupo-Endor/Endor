import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseIntake } from "@/lib/validate-intake";
import { analyzeBrand, hasLlmProvider } from "@/lib/openai-analyze";
import {
  createServerClient,
  createServiceClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { mockSave } from "@/lib/mock-store";
import {
  assertReportEmailable,
  sendReportEmail,
  sendSalesAlertEmail,
} from "@/lib/send-report-email";
import { isMockLikeReport } from "@/lib/report";
import { randomUUID } from "crypto";

/**
 * POST /api/analyze
 * Valida intake → guarda fila → 2 corridas LLM OpenAI/OpenRouter (o mock) → reporte JSON.
 * Entrega automática: status siempre "ready" cuando hay reporte (nunca needs_review
 * para gating de entrega). needs_human_review se guarda en DB/JSON solo como flag interno.
 * Email cliente + alert comercial (Patricia) ONLY when status === ready AND report is real.
 * Gates in this route AND in lib/send-report-email.ts (belt and suspenders).
 */
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body?.identity?.logo_data_url) {
      const len = String(body.identity.logo_data_url).length;
      if (len > 200_000) {
        body.identity.logo_data_url = "[omitted: too large for JSON body demo]";
      }
    }
    if (Array.isArray(body?.identity?.materials)) {
      body.identity.materials = body.identity.materials
        .slice(0, 5)
        .map((m: { filename?: string; data_url?: string }) => {
          const filename = String(m?.filename ?? "material").slice(0, 255);
          const data_url = m?.data_url ? String(m.data_url) : undefined;
          if (data_url && data_url.length > 200_000) {
            return { filename, data_url: "[omitted: too large]" };
          }
          return data_url ? { filename, data_url } : { filename };
        });
    }

    const intake = parseIntake(body);
    const report = await analyzeBrand(intake);

    // La IA entrega sola: siempre "ready" para entrega. Dual-run + averaging siguen;
    // needs_human_review queda en report/DB como flag interno (invisible al cliente).
    const status = "ready";
    let id: string = randomUUID();
    let supabaseOk = false;

    if (hasSupabaseEnv()) {
      const insertClient = createServerClient();
      if (insertClient) {
        // Insert completo de una sola vez: el análisis ya terminó arriba.
        // Anon UPDATE RLS exists (004) for email_sent_at patches.
        const { data, error } = await insertClient
          .from("diagnoses")
          .insert({
            intake,
            status,
            sector: intake.scope.sector,
            city: intake.scope.city,
            contact_name: intake.contact.full_name,
            contact_email: intake.contact.work_email,
            contact_phone: intake.contact.whatsapp,
            company_name: intake.contact.company,
            reach: intake.scope.reach,
            scores: report.dimensions,
            report,
            needs_human_review: report.needs_human_review,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Supabase insert error:", error.message);
          mockSave(id, intake, report);
        } else {
          id = data.id as string;
          supabaseOk = true;
          // Best-effort update path if service role exists
          const updater = createServiceClient();
          if (updater) {
            await updater
              .from("diagnoses")
              .update({
                status,
                scores: report.dimensions,
                report,
                needs_human_review: report.needs_human_review,
              })
              .eq("id", id);
          }
        }
      } else {
        mockSave(id, intake, report);
      }
    } else {
      mockSave(id, intake, report);
    }

    let email_sent = false;
    let email_error: string | undefined;
    let email_skip_reason: string | undefined;
    let email_provider: string | undefined;
    let email_sent_at: string | undefined;
    let email_status:
      | "sent"
      | "skipped_mock"
      | "skipped_not_ready"
      | "skipped_invalid"
      | "skipped_no_provider"
      | "failed"
      | undefined;

    // Belt: refuse mock/demo/placeholder before even calling the sender.
    const mockCheck = isMockLikeReport(report);
    const preGate = assertReportEmailable({
      report,
      status,
      diagnosisId: id,
    });

    let sales_alert_sent = false;
    let sales_alert_status:
      | "sent"
      | "skipped_mock"
      | "skipped_not_ready"
      | "skipped_invalid"
      | "skipped_no_provider"
      | "failed"
      | undefined;
    let sales_alert_error: string | undefined;
    let sales_alert_skip_reason: string | undefined;

    if (!preGate.ok) {
      email_skip_reason = preGate.reason;
      email_status = preGate.email_status;
      sales_alert_status = preGate.email_status;
      sales_alert_skip_reason = preGate.reason;
      console.warn(
        `[email] SKIPPED at analyze gate (${email_status}) id=${id}: ${email_skip_reason}`
      );
    } else {
      // Await sends before responding so the client sees email_sent outcome.
      // sendReportEmail / sendSalesAlertEmail re-check the same gate (suspenders).
      const emailResult = await sendReportEmail({
        intake,
        report,
        diagnosisId: id,
        status,
      });
      email_sent = emailResult.email_sent;
      email_error = emailResult.email_error;
      email_skip_reason = emailResult.email_skip_reason;
      email_provider = emailResult.provider;
      email_sent_at = emailResult.email_sent_at;
      email_status = emailResult.email_status;
      if (!email_sent) {
        console.error(
          "[email] send failed/skipped:",
          emailResult.email_status,
          emailResult.email_error || emailResult.email_skip_reason
        );
      }

      const salesResult = await sendSalesAlertEmail({
        intake,
        report,
        diagnosisId: id,
        status,
      });
      sales_alert_sent = salesResult.email_sent;
      sales_alert_status = salesResult.email_status;
      sales_alert_error = salesResult.email_error;
      sales_alert_skip_reason = salesResult.email_skip_reason;
      if (!sales_alert_sent) {
        console.error(
          "[sales-alert] send failed/skipped:",
          salesResult.email_status,
          salesResult.email_error || salesResult.email_skip_reason
        );
      }
    }

    // Persist email outcome on the row (and inside report JSON).
    if (supabaseOk && email_status) {
      const updater = createServiceClient() ?? createServerClient();
      if (updater) {
        const emailMeta = {
          email_sent,
          email_provider: email_provider ?? null,
          email_sent_at: email_sent_at ?? null,
          email_error: email_error ?? null,
          email_skip_reason: email_skip_reason ?? null,
          email_status,
          sales_alert_sent,
          sales_alert_status: sales_alert_status ?? null,
          sales_alert_error: sales_alert_error ?? null,
          sales_alert_skip_reason: sales_alert_skip_reason ?? null,
        };
        const patch: Record<string, unknown> = {
          report: {
            ...report,
            // Flag interno; nunca se muestra al cliente en ReportView.
            needs_human_review: report.needs_human_review,
            _email: emailMeta,
          },
          email_status,
          needs_human_review: report.needs_human_review,
        };
        if (email_sent && email_sent_at) {
          patch.email_sent_at = email_sent_at;
        }
        const { error: emailColErr } = await updater
          .from("diagnoses")
          .update(patch)
          .eq("id", id);
        if (emailColErr) {
          console.warn("email meta update skipped:", emailColErr.message);
        }
      }
    }

    return NextResponse.json({
      id,
      status,
      report,
      mock: Boolean(report.mock) || !hasLlmProvider() || mockCheck.mock,
      supabase: hasSupabaseEnv(),
      email_sent,
      sales_alert_sent,
      ...(email_status ? { email_status } : {}),
      ...(email_error ? { email_error } : {}),
      ...(email_skip_reason ? { email_skip_reason } : {}),
      ...(email_provider ? { email_provider } : {}),
      ...(sales_alert_status ? { sales_alert_status } : {}),
      ...(sales_alert_error ? { sales_alert_error } : {}),
      ...(sales_alert_skip_reason ? { sales_alert_skip_reason } : {}),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Intake inválido", details: err.flatten() },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error al analizar la marca",
      },
      { status: 500 }
    );
  }
}
