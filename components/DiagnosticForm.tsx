"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { SECTORS } from "@/lib/sectors";

export const RUBROS = [
  "Manufactura industrial", "Distribución y mayoreo", "Alimentos y bebidas (producto)", "Restaurantes y cafeterías",
  "Hotelería y turismo", "Desarrollo inmobiliario", "Construcción y materiales", "Automotriz y refacciones",
  "Logística y transporte", "Retail y tiendas", "Moda y calzado", "Belleza y cuidado personal",
  "Salud y clínicas", "Farmacéutica", "Bienestar y fitness", "Educación privada", "Servicios financieros",
  "Fintech", "Seguros", "Despachos legales", "Consultoría y servicios profesionales", "Tecnología y software",
  "Agencias y medios", "Agroindustria", "Energía", "Químicos y plásticos", "Empaque y embalaje",
  "Mobiliario y decoración", "Tecnología médica", "Bebidas alcohólicas", "Mascotas", "Eventos y entretenimiento",
  "Seguridad privada", "Limpieza e higiene", "Textil", "Joyería y accesorios", "Deportes",
  "Organizaciones sin fines de lucro", "Gobierno y sector público", "Otro",
];

const ALCANCES = ["Local", "Nacional", "Exportación"];

const schema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre").max(120),
  puesto: z.string().trim().min(1, "Escribe tu puesto").max(120),
  empresa: z.string().trim().min(1, "Escribe tu empresa").max(120),
  correo: z.string().trim().email("Correo no válido").max(255),
  telefono: z.string().trim().min(7, "Teléfono no válido").max(20).regex(/^[+\d][\d\s()-]+$/, "Solo números y + ( ) -"),
  sitio: z.string().trim().max(255).optional(),
  instagram: z.string().trim().max(120).optional(),
  facebook: z.string().trim().max(120).optional(),
  tiktok: z.string().trim().max(120).optional(),
  linkedin: z.string().trim().max(120).optional(),
  rubro: z.string().min(1, "Elige tu giro"),
  ciudad: z.string().trim().min(1, "Escribe tu ciudad").max(120),
  alcance: z.string().min(1, "Elige tu alcance"),
  comp1: z.string().trim().min(1, "Escribe al menos un competidor").max(200),
  comp2: z.string().trim().max(200).optional(),
  comp3: z.string().trim().max(200).optional(),
  sentir: z.string().trim().min(1, "Responde esta pregunta").max(600),
  noVendes: z.string().trim().min(1, "Responde esta pregunta").max(600),
  distinto: z.string().trim().min(1, "Responde esta pregunta").max(600),
  frases: z.string().trim().max(600).optional(),
});

type Values = z.infer<typeof schema>;
type Key = keyof Values;

const STEPS: { title: string; hint: string; fields: Key[] }[] = [
  { title: "Tus datos", hint: "Para enviarte el reporte.", fields: ["nombre", "puesto", "empresa", "correo", "telefono"] },
  { title: "Tu marca hoy", hint: "Evidencia, no opiniones. Mínimo una red o tu sitio.", fields: ["sitio", "instagram", "facebook", "tiktok", "linkedin"] },
  { title: "Rubro y competencia", hint: "Sin rubro no hay comparación. Solo analizamos a quien tú reconoces como competencia.", fields: ["rubro", "ciudad", "alcance", "comp1", "comp2", "comp3"] },
  { title: "Tu intención", hint: "Guardamos tus palabras tal cual. Así distinguimos un error de una apuesta deliberada.", fields: ["sentir", "noVendes", "distinto", "frases"] },
];

const empty: Values = {
  nombre: "", puesto: "", empresa: "", correo: "", telefono: "", sitio: "", instagram: "", facebook: "",
  tiktok: "", linkedin: "", rubro: "", ciudad: "", alcance: "", comp1: "", comp2: "", comp3: "",
  sentir: "", noVendes: "", distinto: "", frases: "",
};

const input =
  "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

const RUBRO_TO_SECTOR: Record<string, string> = {
  "Manufactura industrial": "manufactura",
  "Distribución y mayoreo": "distribucion",
  "Alimentos y bebidas (producto)": "food_beverage",
  "Restaurantes y cafeterías": "restaurantes",
  "Hotelería y turismo": "hoteles",
  "Desarrollo inmobiliario": "inmobiliaria",
  "Construcción y materiales": "construccion",
  "Automotriz y refacciones": "autos",
  "Logística y transporte": "logistica",
  "Retail y tiendas": "ecommerce",
  "Moda y calzado": "moda",
  "Belleza y cuidado personal": "belleza",
  "Salud y clínicas": "clinicas",
  "Farmacéutica": "farmacia",
  "Bienestar y fitness": "fitness",
  "Educación privada": "educacion",
  "Servicios financieros": "seguros",
  "Fintech": "fintech",
  "Seguros": "seguros",
  "Despachos legales": "despachos",
  "Consultoría y servicios profesionales": "consultoria",
  "Tecnología y software": "saas",
  "Agencias y medios": "agencias",
  "Agroindustria": "agro",
  "Energía": "energia",
  "Mobiliario y decoración": "muebles",
  "Mascotas": "mascotas",
  "Eventos y entretenimiento": "eventos",
  "Joyería y accesorios": "joyeria",
  "Deportes": "deportes",
  "Organizaciones sin fines de lucro": "ong",
  "Otro": "otro",
};

function mapReach(alcance: string): "local" | "nacional" | "exportacion" {
  const a = alcance.toLowerCase();
  if (a.startsWith("nac")) return "nacional";
  if (a.startsWith("exp")) return "exportacion";
  return "local";
}

function mapSector(rubro: string): string {
  const mapped = RUBRO_TO_SECTOR[rubro];
  if (mapped && SECTORS.some((s) => s.id === mapped)) return mapped;
  return "otro";
}

const inputClass = input;

export function DiagnosticForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<Key | "presencia" | "logo" | "submit", string>>>({});
  const [logo, setLogo] = useState<string>("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const validateStep = () => {
    const res = schema.safeParse(values);
    const next: typeof errors = {};
    if (!res.success) {
      for (const issue of res.error.issues) {
        const k = issue.path[0] as Key;
        if (STEPS[step]!.fields.includes(k) && !next[k]) next[k] = issue.message;
      }
    }
    if (step === 1) {
      const any = ["sitio", "instagram", "facebook", "tiktok", "linkedin"].some((k) => values[k as Key]?.trim());
      if (!any) next.presencia = "Agrega al menos tu sitio o una red social.";
      if (!logo) next.logo = "Sube tu logo (PNG, SVG o una captura).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  async function submitToApi() {
    setSubmitting(true);
    setErrors({});
    try {
      const names = [values.comp1, values.comp2, values.comp3]
        .map((c) => (c ?? "").trim())
        .filter(Boolean);
      while (names.length < 3) names.push(names[0] || "Competidor");

      const intake = {
        contact: {
          full_name: values.nombre,
          role: values.puesto,
          company: values.empresa,
          work_email: values.correo,
          whatsapp: values.telefono,
        },
        identity: {
          logo_filename: logo || undefined,
          logo_data_url: logoDataUrl || undefined,
          colors: "No proporcionado en formulario landing",
          fonts: "No proporcionado en formulario landing",
        },
        presence: {
          website: values.sitio || undefined,
          instagram: values.instagram || undefined,
          facebook: values.facebook || undefined,
          tiktok: values.tiktok || undefined,
          linkedin: values.linkedin || undefined,
        },
        scope: {
          sector: mapSector(values.rubro),
          city: values.ciudad,
          reach: mapReach(values.alcance),
        },
        competitors: names.slice(0, 5).map((name) => ({ name })),
        intention: {
          feel: values.sentir,
          not_for: values.noVendes,
          distinct: values.distinto,
        },
        optional: {
          client_words: values.frases || undefined,
        },
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ submit: data?.error || "No pudimos procesar el diagnóstico. Intenta de nuevo." });
        setSubmitting(false);
        return;
      }
      setSent(true);
      if (data?.id) {
        setTimeout(() => router.push(`/reporte/${data.id}`), 1800);
      }
    } catch {
      setErrors({ submit: "Error de red. Intenta de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  const onNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else void submitToApi();
  };

  const field = (k: Key, label: string, opts: { placeholder?: string; type?: string; area?: boolean } = {}) => (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-foreground">{label}</span>
      {opts.area ? (
        <textarea rows={3} className={inputClass} placeholder={opts.placeholder} value={values[k] ?? ""} onChange={set(k)} />
      ) : (
        <input type={opts.type ?? "text"} className={inputClass} placeholder={opts.placeholder} value={values[k] ?? ""} onChange={set(k)} />
      )}
      {errors[k] && <span className="mt-1 block text-xs text-destructive">{errors[k]}</span>}
    </label>
  );

  if (sent) {
    return (
      <div className="border border-border bg-background p-8 md:p-12">
        <p className="section-label">Recibido</p>
        <h3 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
          Tu diagnóstico ya está <span className="font-accent font-normal italic">en proceso.</span>
        </h3>
        <p className="mt-4 max-w-lg text-muted-foreground">
          {values.nombre.split(" ")[0]}, corremos dos evaluaciones independientes de {values.empresa} y las
          comparamos contra tu competencia. Recibirás tu reporte en {values.correo}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onNext} noValidate className="border border-border bg-background p-6 md:p-10">
      <div className="flex gap-2" aria-hidden>
        {STEPS.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
      <p className="section-label mt-6">Paso {step + 1} de {STEPS.length}</p>
      <h3 className="mt-2 text-2xl font-extrabold">{STEPS[step]!.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{STEPS[step]!.hint}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {step === 0 && (
          <>
            {field("nombre", "Nombre completo")}
            {field("puesto", "Puesto", { placeholder: "Director general, socio, marketing…" })}
            {field("empresa", "Empresa")}
            {field("correo", "Correo de trabajo", { type: "email" })}
            <div className="md:col-span-2">{field("telefono", "WhatsApp", { type: "tel", placeholder: "+52 55 0000 0000" })}</div>
          </>
        )}
        {step === 1 && (
          <>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em]">Logo (PNG, SVG o captura)</span>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setLogo(file?.name ?? "");
                  if (file && file.size < 180_000) {
                    const reader = new FileReader();
                    reader.onload = () => setLogoDataUrl(String(reader.result ?? ""));
                    reader.readAsDataURL(file);
                  } else {
                    setLogoDataUrl("");
                  }
                }}
                className="block w-full border border-dashed border-border bg-secondary p-4 text-sm file:mr-4 file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-background"
              />
              {errors.logo && <span className="mt-1 block text-xs text-destructive">{errors.logo}</span>}
            </label>
            <div className="md:col-span-2">{field("sitio", "Sitio web", { placeholder: "https://" })}</div>
            {field("instagram", "Instagram", { placeholder: "@tumarca" })}
            {field("facebook", "Facebook")}
            {field("tiktok", "TikTok")}
            {field("linkedin", "LinkedIn")}
            {errors.presencia && <p className="text-xs text-destructive md:col-span-2">{errors.presencia}</p>}
          </>
        )}
        {step === 2 && (
          <>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em]">Giro</span>
              <select className={inputClass} value={values.rubro} onChange={set("rubro")}>
                <option value="">Elige tu rubro</option>
                {RUBROS.map((r) => <option key={r}>{r}</option>)}
              </select>
              {errors.rubro && <span className="mt-1 block text-xs text-destructive">{errors.rubro}</span>}
            </label>
            {field("ciudad", "Ciudad")}
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em]">Alcance</span>
              <select className={inputClass} value={values.alcance} onChange={set("alcance")}>
                <option value="">Elige</option>
                {ALCANCES.map((r) => <option key={r}>{r}</option>)}
              </select>
              {errors.alcance && <span className="mt-1 block text-xs text-destructive">{errors.alcance}</span>}
            </label>
            <div className="md:col-span-2">{field("comp1", "¿Quién te quita clientes? (1)", { placeholder: "Nombre o URL" })}</div>
            {field("comp2", "Competidor 2")}
            {field("comp3", "Competidor 3")}
          </>
        )}
        {step === 3 && (
          <div className="grid gap-5 md:col-span-2">
            {field("sentir", "¿Qué quieres que sienta la gente al verte?", { area: true })}
            {field("noVendes", "¿A quién NO le vendes?", { area: true })}
            {field("distinto", "¿Qué haces distinto que nadie copia?", { area: true })}
            {field("frases", "Opcional: 3 frases con las que describes tu negocio", { area: true })}
          </div>
        )}
      </div>

      {errors.submit && (
        <p className="mt-6 text-sm text-destructive">{errors.submit}</p>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            ← Atrás
          </button>
        ) : <span />}
        <button type="submit" className="btn-cta" disabled={submitting}>
          {submitting
            ? "Analizando…"
            : step < STEPS.length - 1
              ? "Continuar"
              : "Diagnosticar mi marca"}
        </button>
      </div>
    </form>
  );
}
