"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "./ProgressBar";
import { sectorsByGroup } from "@/lib/sectors";
import type { DiagnosisIntake } from "@/types/diagnosis";

const STEPS = [
  "Tus datos",
  "Identidad",
  "Presencia digital",
  "Rubro y zona",
  "Competencia",
  "Intención",
  "Opcional",
] as const;

const empty: DiagnosisIntake = {
  contact: {
    full_name: "",
    role: "",
    company: "",
    work_email: "",
    whatsapp: "",
  },
  identity: { colors: "", fonts: "" },
  presence: {},
  scope: { sector: "restaurantes", city: "", reach: "local" },
  competitors: [
    { name: "", url: "" },
    { name: "", url: "" },
    { name: "", url: "" },
  ],
  intention: { feel: "", not_for: "", distinct: "" },
  optional: {},
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-200">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-endor-accent/60";

export function DiagnosticoWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<DiagnosisIntake>(empty);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const groups = useMemo(() => sectorsByGroup(), []);

  function update<K extends keyof DiagnosisIntake>(
    key: K,
    value: DiagnosisIntake[K]
  ) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      const c = data.contact;
      if (!c.full_name || !c.role || !c.company || !c.work_email || !c.whatsapp)
        return "Completa todos los datos de contacto.";
    }
    if (step === 1) {
      if (!data.identity.colors.trim() || !data.identity.fonts.trim())
        return "Indica colores y tipografías (o captura de donde se ven).";
    }
    if (step === 2) {
      const p = data.presence;
      if (!p.website && !p.instagram && !p.facebook && !p.tiktok && !p.linkedin)
        return "Necesitamos al menos un canal (sitio o red social).";
    }
    if (step === 3) {
      if (!data.scope.sector || !data.scope.city.trim())
        return "Elige rubro y ciudad.";
    }
    if (step === 4) {
      if (data.competitors.filter((c) => c.name.trim()).length < 3)
        return "Confirma 3 competidores (nombre o URL).";
    }
    if (step === 5) {
      const i = data.intention;
      if (!i.feel.trim() || !i.not_for.trim() || !i.distinct.trim())
        return "Responde las 3 preguntas de intención (se guardan literales).";
    }
    return null;
  }

  async function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    await submit();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "No se pudo analizar");
      }
      router.push(`/reporte/${json.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSubmitting(false);
    }
  }

  function onLogo(file: File | null) {
    if (!file) {
      update("identity", {
        ...data.identity,
        logo_filename: undefined,
        logo_data_url: undefined,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("identity", {
        ...data.identity,
        logo_filename: file.name,
        logo_data_url:
          typeof reader.result === "string" ? reader.result : undefined,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <ProgressBar step={step} total={STEPS.length} labels={[...STEPS]} />

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Tus datos</h1>
            <p className="text-sm text-neutral-400">
              Para enviarte el reporte. No pedimos opiniones: pedimos evidencia.
            </p>
            <Field label="Nombre completo">
              <input
                className={inputClass}
                value={data.contact.full_name}
                onChange={(e) =>
                  update("contact", { ...data.contact, full_name: e.target.value })
                }
              />
            </Field>
            <Field label="Puesto">
              <input
                className={inputClass}
                value={data.contact.role}
                onChange={(e) =>
                  update("contact", { ...data.contact, role: e.target.value })
                }
              />
            </Field>
            <Field label="Empresa">
              <input
                className={inputClass}
                value={data.contact.company}
                onChange={(e) =>
                  update("contact", { ...data.contact, company: e.target.value })
                }
              />
            </Field>
            <Field label="Correo de trabajo">
              <input
                type="email"
                className={inputClass}
                value={data.contact.work_email}
                onChange={(e) =>
                  update("contact", {
                    ...data.contact,
                    work_email: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={inputClass}
                placeholder="+52 ..."
                value={data.contact.whatsapp}
                onChange={(e) =>
                  update("contact", {
                    ...data.contact,
                    whatsapp: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Identidad</h1>
            <p className="text-sm text-neutral-400">
              Logo en PNG/SVG, colores y tipografía. Sin evidencia = no evaluado.
            </p>
            <Field label="Logo (PNG/SVG)" hint="En producción se sube al bucket evidence.">
              <input
                type="file"
                accept=".png,.svg,.jpg,.jpeg,.webp"
                className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-endor-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-endor-black"
                onChange={(e) => onLogo(e.target.files?.[0] ?? null)}
              />
              {data.identity.logo_filename ? (
                <span className="text-xs text-endor-accent">
                  {data.identity.logo_filename}
                </span>
              ) : null}
            </Field>
            <Field label="Colores" hint="Hex, nombres o dónde se ven (sitio/manual).">
              <textarea
                className={inputClass}
                rows={2}
                value={data.identity.colors}
                onChange={(e) =>
                  update("identity", { ...data.identity, colors: e.target.value })
                }
              />
            </Field>
            <Field label="Tipografías">
              <textarea
                className={inputClass}
                rows={2}
                value={data.identity.fonts}
                onChange={(e) =>
                  update("identity", { ...data.identity, fonts: e.target.value })
                }
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Presencia digital</h1>
            <p className="text-sm text-neutral-400">
              Mínimo un canal. Dimensiones 2, 3 y 5.
            </p>
            {(
              [
                ["website", "Sitio web (URL)"],
                ["instagram", "Instagram"],
                ["facebook", "Facebook"],
                ["tiktok", "TikTok"],
                ["linkedin", "LinkedIn"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className={inputClass}
                  value={data.presence[key] ?? ""}
                  onChange={(e) =>
                    update("presence", {
                      ...data.presence,
                      [key]: e.target.value,
                    })
                  }
                />
              </Field>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Rubro y zona</h1>
            <p className="text-sm text-neutral-400">
              Lista cerrada: sin giro no hay benchmark.
            </p>
            <Field label="Giro">
              <select
                className={inputClass}
                value={data.scope.sector}
                onChange={(e) =>
                  update("scope", { ...data.scope, sector: e.target.value })
                }
              >
                {Object.entries(groups).map(([group, sectors]) => (
                  <optgroup key={group} label={group}>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id} className="bg-endor-black">
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Ciudad">
              <input
                className={inputClass}
                placeholder="Mérida, CDMX, Monterrey…"
                value={data.scope.city}
                onChange={(e) =>
                  update("scope", { ...data.scope, city: e.target.value })
                }
              />
            </Field>
            <Field label="Alcance">
              <select
                className={inputClass}
                value={data.scope.reach}
                onChange={(e) =>
                  update("scope", {
                    ...data.scope,
                    reach: e.target.value as DiagnosisIntake["scope"]["reach"],
                  })
                }
              >
                <option value="local" className="bg-endor-black">
                  Local
                </option>
                <option value="nacional" className="bg-endor-black">
                  Nacional
                </option>
                <option value="exportacion" className="bg-endor-black">
                  Exportación
                </option>
                <option value="internacional" className="bg-endor-black">
                  Internacional
                </option>
              </select>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Competencia</h1>
            <p className="text-sm text-neutral-400">
              3 nombres o URLs de quien te quita clientes. Solo analizamos a quien
              tú confirmas.
            </p>
            {data.competitors.map((c, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <Field label={`Competidor ${i + 1} — nombre`}>
                  <input
                    className={inputClass}
                    value={c.name}
                    onChange={(e) => {
                      const next = [...data.competitors];
                      next[i] = { ...next[i], name: e.target.value };
                      update("competitors", next);
                    }}
                  />
                </Field>
                <Field label="URL (opcional)">
                  <input
                    className={inputClass}
                    value={c.url ?? ""}
                    onChange={(e) => {
                      const next = [...data.competitors];
                      next[i] = { ...next[i], url: e.target.value };
                      update("competitors", next);
                    }}
                  />
                </Field>
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Intención</h1>
            <p className="text-sm text-neutral-400">
              Se guardan literales. Sirven para separar error de apuesta
              deliberada — no para inventar Brand DNA.
            </p>
            <Field label="¿Qué quieres que sienta la gente al verte?">
              <textarea
                className={inputClass}
                rows={3}
                value={data.intention.feel}
                onChange={(e) =>
                  update("intention", { ...data.intention, feel: e.target.value })
                }
              />
            </Field>
            <Field label="¿A quién NO le vendes?">
              <textarea
                className={inputClass}
                rows={3}
                value={data.intention.not_for}
                onChange={(e) =>
                  update("intention", {
                    ...data.intention,
                    not_for: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="¿Qué haces distinto que nadie copia?">
              <textarea
                className={inputClass}
                rows={3}
                value={data.intention.distinct}
                onChange={(e) =>
                  update("intention", {
                    ...data.intention,
                    distinct: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Opcional</h1>
            <p className="text-sm text-neutral-400">
              Afina el puntaje. Si no lo tienes, se marca no evaluado.
            </p>
            <Field label="Piezas recientes (últimos 60 días)">
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Links o descripción de 3–5 posts/anuncios"
                value={data.optional?.recent_posts ?? ""}
                onChange={(e) =>
                  update("optional", {
                    ...data.optional,
                    recent_posts: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Materiales físicos">
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Empaque, sucursal, uniforme, vehículo…"
                value={data.optional?.physical_materials ?? ""}
                onChange={(e) =>
                  update("optional", {
                    ...data.optional,
                    physical_materials: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Palabras del cliente">
              <textarea
                className={inputClass}
                rows={3}
                placeholder="3 frases con las que te describen"
                value={data.optional?.client_words ?? ""}
                onChange={(e) =>
                  update("optional", {
                    ...data.optional,
                    client_words: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0 || submitting}
            onClick={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm disabled:opacity-40"
          >
            Atrás
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={next}
            className="rounded-full bg-endor-accent px-6 py-2.5 text-sm font-semibold text-endor-black disabled:opacity-60"
          >
            {submitting
              ? "Analizando…"
              : step === STEPS.length - 1
                ? "Generar diagnóstico"
                : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
