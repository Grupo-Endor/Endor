import type { DiagnosisReport } from "@/types/diagnosis";
import { SEMAPHORE_LABELS } from "@/types/diagnosis";
import { SemaphoreDot } from "@/components/ui/SemaphoreDot";

const COLOR_TEXT: Record<string, string> = {
  red: "text-red-400",
  yellow: "text-endor-accent",
  green: "text-emerald-400",
  not_evaluated: "text-neutral-500",
};

export function ReportView({
  report,
  company,
  id,
}: {
  report: DiagnosisReport;
  company?: string;
  id: string;
}) {
  return (
    <article className="mx-auto max-w-2xl space-y-10 px-5 py-12">
      {report.mock ? (
        <p className="rounded-xl border border-endor-accent/40 bg-endor-accent/10 px-4 py-3 text-sm text-endor-accent">
          Reporte de demostración (sin OPENAI_API_KEY o modo mock). La estructura
          es la real del producto.
        </p>
      ) : null}

      {report.needs_human_review ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Una o más dimensiones difieren &gt;15 entre corridas independientes —
          marcado para revisión humana antes de entrega final.
        </p>
      ) : null}

      {/* 1. Veredicto */}
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Veredicto{company ? ` · ${company}` : ""}
        </p>
        <h1 className="mt-3 text-2xl leading-snug tracking-tight sm:text-3xl">
          {report.verdict}
        </h1>
      </section>

      {/* 2. Global */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Puntaje global
        </p>
        <p
          className={`mt-3 text-6xl font-semibold tabular-nums ${COLOR_TEXT[report.global_color]}`}
        >
          {report.global_score}
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          {SEMAPHORE_LABELS[report.global_color]}
        </p>
        {report.position_vs_group ? (
          <p className="mt-4 text-sm text-neutral-300">{report.position_vs_group}</p>
        ) : null}
      </section>

      {/* 3. Semáforo 6 dims */}
      <section>
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-neutral-500">
          Semáforo de 6 dimensiones
        </h2>
        <ul className="space-y-2">
          {report.dimensions.map((d) => (
            <li
              key={d.key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <SemaphoreDot color={d.color} />
                <span className="text-sm">{d.label}</span>
                {d.needs_human_review ? (
                  <span className="text-[10px] uppercase text-amber-400">
                    revisión
                  </span>
                ) : null}
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${COLOR_TEXT[d.color]}`}
              >
                {d.score === null ? "—" : d.score}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Top 3 hallazgos */}
      <section>
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-neutral-500">
          Los 3 hallazgos que más pesan
        </h2>
        <ol className="space-y-6">
          {report.findings.map((f, i) => (
            <li
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-xs text-endor-accent">Hallazgo {i + 1}</p>
              <p className="mt-2 text-sm leading-relaxed">
                <span className="font-semibold text-white">Hecho. </span>
                {f.fact}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                <span className="font-semibold text-white">Comparación. </span>
                {f.compare}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                <span className="font-semibold text-white">Costo. </span>
                {f.cost}
              </p>
              <p className="mt-3 border-t border-white/10 pt-3 text-sm italic text-neutral-400">
                {f.category_closer}
              </p>
              {f.evidence_note ? (
                <p className="mt-2 text-xs text-neutral-600">
                  Evidencia: {f.evidence_note}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Lo que funciona */}
      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h2 className="text-sm uppercase tracking-[0.2em] text-emerald-400/80">
          Lo que ya funciona
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-200">
          {report.what_works}
        </p>
      </section>

      {/* 6. Patrón sector */}
      <section>
        <h2 className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Patrón de tu sector
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-200">
          {report.sector_pattern}
        </p>
        <p className="mt-2 text-sm text-endor-accent">
          Elementos tuyos dentro del patrón: {report.sector_pattern_matches}
        </p>
      </section>

      {/* 7. Punto ciego */}
      <section>
        <h2 className="text-sm uppercase tracking-[0.2em] text-neutral-500">
          Punto ciego
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-300">
          {report.blind_spot}
        </p>
      </section>

      {/* 8. CTA único */}
      <section className="rounded-3xl border border-endor-accent/40 bg-endor-accent/10 p-8 text-center">
        <p className="text-xl font-semibold text-endor-accent">
          {report.cta.phrase}
        </p>
        <p className="mt-3 text-sm text-neutral-400">
          Un solo siguiente paso: agenda una llamada de 20 minutos.
        </p>
        <a
          href="https://cal.com"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex rounded-full bg-endor-accent px-6 py-3 text-sm font-semibold text-endor-black"
        >
          Agendar llamada de 20 min
        </a>
        <p className="mt-4 text-[10px] uppercase tracking-wider text-neutral-600">
          Perfil CTA: {report.cta.profile} · {report.cta.service_hint}
        </p>
      </section>

      <p className="text-center text-xs text-neutral-600">
        ID {id} · {new Date(report.analyzed_at).toLocaleString("es-MX")}
      </p>
    </article>
  );
}
