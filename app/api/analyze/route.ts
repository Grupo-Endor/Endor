import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseIntake } from "@/lib/validate-intake";
import { analyzeBrand } from "@/lib/openai-analyze";
import {
  createServerClient,
  createServiceClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { mockSave } from "@/lib/mock-store";
import { randomUUID } from "crypto";

/**
 * POST /api/analyze
 * Valida intake → guarda fila → 2 corridas OpenAI (o mock) → reporte JSON.
 * Principio: diagnosticar, nunca recetar (ver lib/openai-analyze.ts).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Evitar persistir data URLs enormes en DB de demo
    if (body?.identity?.logo_data_url) {
      const len = String(body.identity.logo_data_url).length;
      if (len > 200_000) {
        body.identity.logo_data_url = "[omitted: too large for JSON body demo]";
      }
    }

    const intake = parseIntake(body);
    const report = await analyzeBrand(intake);

    const status = report.needs_human_review ? "needs_review" : "ready";
    let id: string = randomUUID();

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
            needs_human_review: false,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Supabase insert error:", error.message);
          // Continuar con mock store
          mockSave(id, intake, report);
        } else {
          id = data.id as string;
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

    return NextResponse.json({
      id,
      status,
      report,
      mock: Boolean(report.mock) || !process.env.OPENAI_API_KEY,
      supabase: hasSupabaseEnv(),
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
