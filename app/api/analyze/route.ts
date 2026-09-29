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
import { sendReportEmail } from "@/lib/send-report-email";
import { randomUUID } from "crypto";

/**
 * POST /api/analyze
 * Valida intake → guarda fila → 2 corridas LLM OpenAI/OpenRouter (o mock) → reporte JSON.
 * Si status === ready → intenta email al cliente (Composio Gmail / Resend).
 * Si needs_review → no envía correo.
 */
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

    const status = report.needs_human_review ? "needs_review" : "ready";
    let id: string = randomUUID();
    let supabaseOk = false;

    if (hasSupabaseEnv()) {
      const insertClient = createServerClient();
      if (insertClient) {
        const { data, error } = await insertClient
          .from("diagnoses")
          .insert({
            intake,
            status: "analyzing",
            sector: intake.scope.sector,
            city: intake.scope.city,
            contact_name: intake.contact.full_name,
            contact_email: intake.contact.work_email,
            contact_phone: intake.contact.whatsapp,
            company_name: intake.contact.company,
            reach: intake.scope.reach,
            needs_human_review: false,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Supabase insert error:", error.message);
          mockSave(id, intake, report);
        } else {
          id = data.id as string;
          supabaseOk = true;
          const updater = createServiceClient() ?? insertClient;
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

    if (status === "ready") {
      const emailResult = await sendReportEmail({
        intake,
        report,
        diagnosisId: id,
      });
      email_sent = emailResult.email_sent;
      email_error = emailResult.email_error;
      email_skip_reason = emailResult.email_skip_reason;
      email_provider = emailResult.provider;

      if (email_sent && emailResult.email_sent_at && supabaseOk) {
        const updater =
          createServiceClient() ?? createServerClient();
        if (updater) {
          const { error: emailColErr } = await updater
            .from("diagnoses")
            .update({ email_sent_at: emailResult.email_sent_at })
            .eq("id", id);
          if (emailColErr) {
            // Column may not exist yet — do not fail analyze
            console.warn(
              "email_sent_at update skipped:",
              emailColErr.message
            );
          }
        }
      }
    } else {
      email_skip_reason =
        "status is needs_review — email withheld until human review";
    }

    return NextResponse.json({
      id,
      status,
      report,
      mock: Boolean(report.mock) || !hasLlmProvider(),
      supabase: hasSupabaseEnv(),
      email_sent,
      ...(email_error ? { email_error } : {}),
      ...(email_skip_reason ? { email_skip_reason } : {}),
      ...(email_provider ? { email_provider } : {}),
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
