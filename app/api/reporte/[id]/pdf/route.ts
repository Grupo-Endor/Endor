import { NextResponse } from "next/server";
import {
  createServerClient,
  createServiceClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { mockGet } from "@/lib/mock-store";
import { buildReportPdf, pdfFilename } from "@/lib/report-pdf";
import type { DiagnosisIntake, DiagnosisReport } from "@/types/diagnosis";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/reporte/[id]/pdf
 * One-pager PDF attachment. 404 JSON if report missing.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  let intake: DiagnosisIntake | null = null;
  let report: DiagnosisReport | null = null;
  let company = "marca";

  if (hasSupabaseEnv()) {
    const client = createServiceClient() ?? createServerClient();
    if (client) {
      const { data, error } = await client
        .from("diagnoses")
        .select("intake, report, company_name")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("PDF load error:", error.message);
      } else if (data?.report) {
        intake = data.intake as DiagnosisIntake;
        report = data.report as DiagnosisReport;
        company =
          (data.company_name as string) ||
          intake?.contact?.company ||
          "marca";
      }
    }
  }

  if (!report || !intake) {
    const mock = mockGet(id);
    if (mock?.report) {
      intake = mock.intake;
      report = mock.report;
      company = mock.intake.contact.company || "marca";
    }
  }

  if (!report || !intake) {
    return NextResponse.json(
      { error: "Reporte no encontrado", id },
      { status: 404 }
    );
  }

  try {
    const bytes = await buildReportPdf({
      intake,
      report,
      diagnosisId: id,
    });
    const filename = pdfFilename(company);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    console.error("PDF build failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error al generar el PDF",
      },
      { status: 500 }
    );
  }
}
