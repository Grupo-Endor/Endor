import Link from "next/link";
import { EndorLogo } from "@/components/EndorLogo";
import { ReportView } from "@/components/reporte/ReportView";
import { buildMockReport } from "@/lib/report";
import { createServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { DiagnosisIntake, DiagnosisReport } from "@/types/diagnosis";

export const dynamic = "force-dynamic";

async function loadReport(id: string): Promise<{
  report: DiagnosisReport;
  company?: string;
}> {
  // Mock id especial para demos sin DB
  if (id === "demo") {
    const intake: DiagnosisIntake = {
      contact: {
        full_name: "Demo",
        role: "CEO",
        company: "Marca Demo",
        work_email: "demo@example.com",
        whatsapp: "+520000000000",
      },
      identity: { colors: "#000 #FFF", fonts: "Mulish" },
      presence: { website: "https://example.com", instagram: "@demo" },
      scope: { sector: "restaurantes", city: "Mérida", reach: "local" },
      competitors: [
        { name: "Comp A" },
        { name: "Comp B" },
        { name: "Comp C" },
      ],
      intention: {
        feel: "Confianza cercana",
        not_for: "Turistas de paso",
        distinct: "Producto local con historia",
      },
    };
    return { report: buildMockReport(intake), company: "Marca Demo" };
  }

  if (hasSupabaseEnv()) {
    const supabase = createServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("diagnoses")
        .select("report, intake, status")
        .eq("id", id)
        .maybeSingle();
      if (data?.report) {
        const intake = data.intake as DiagnosisIntake;
        return {
          report: data.report as DiagnosisReport,
          company: intake?.contact?.company,
        };
      }
    }
  }

  // Fallback: intentar leer mock en memoria global del proceso (dev)
  const g = globalThis as unknown as {
    __endor_mock_store?: Map<string, { report: DiagnosisReport; intake: DiagnosisIntake }>;
  };
  const row = g.__endor_mock_store?.get(id);
  if (row) {
    return { report: row.report, company: row.intake.contact.company };
  }

  // Último recurso: reporte mock genérico con el id
  const fallback = buildMockReport({
    contact: {
      full_name: "—",
      role: "—",
      company: "Tu marca",
      work_email: "a@b.co",
      whatsapp: "0000000000",
    },
    identity: { colors: "—", fonts: "—" },
    presence: { website: "https://example.com" },
    scope: { sector: "otro", city: "México", reach: "nacional" },
    competitors: [{ name: "A" }, { name: "B" }, { name: "C" }],
    intention: {
      feel: "—",
      not_for: "—",
      distinct: "—",
    },
  });
  return { report: fallback, company: "Tu marca" };
}

export default async function ReportePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { report, company } = await loadReport(id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/">
            <EndorLogo className="h-7 w-auto" />
          </Link>
          <Link
            href="/diagnostico"
            className="text-xs text-neutral-400 hover:text-endor-accent"
          >
            Nuevo diagnóstico
          </Link>
        </div>
      </header>
      <ReportView report={report} company={company} id={id} />
    </div>
  );
}
