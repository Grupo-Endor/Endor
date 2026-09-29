/**
 * Tipos del diagnóstico de marca Ēndor.
 * Principio rector: diagnosticar, nunca recetar.
 * La plataforma nombra problemas con evidencia; no propone soluciones,
 * nombres, tonos, paletas ni Brand DNA / DEFINE.
 */

export type SemaphoreColor = "red" | "yellow" | "green" | "not_evaluated";

export type DimensionKey =
  | "identidad_visual"
  | "claridad_propuesta"
  | "voz_contenido"
  | "coherencia_puntos_contacto"
  | "presencia_encontrabilidad"
  | "diferenciacion_real";

/** Estados PAI (Producto → Atributo → Idea → Concepto). Sin número. */
export type PaiStatus = "claro" | "difuso" | "ausente";

export type PaiLinkKey = "producto" | "atributo" | "idea" | "concepto";

export interface PaiChain {
  producto: PaiStatus;
  atributo: PaiStatus;
  idea: PaiStatus;
  concepto: PaiStatus;
}

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  weight: number;
  score: number | null; // null = not_evaluated
  color: SemaphoreColor;
  needs_human_review?: boolean;
  run_a?: number | null;
  run_b?: number | null;
}

export interface Finding {
  /** Hecho observable con evidencia */
  fact: string;
  /** Comparación contra competencia / mediana */
  compare: string;
  /** Consecuencia / costo (orden de magnitud) */
  cost: string;
  /**
   * Cierre abierto: nombra la CATEGORÍA de solución sin describirla.
   * Nunca instrucción concreta, nombre, tono, paleta ni DEFINE.
   */
  category_closer: string;
  dimension: DimensionKey;
  evidence_note?: string;
}

export interface DiagnosisReport {
  verdict: string;
  global_score: number;
  global_color: SemaphoreColor;
  dimensions: DimensionScore[];
  /** Lectura PAI — después del semáforo, antes de hallazgos */
  pai: PaiChain;
  /** Una oración que nombra el eslabón roto; nunca cómo soldarlo */
  pai_reading: string;
  /** Cita literal de intención del intake vs lo que la cadena muestra */
  intention_quote: string;
  findings: Finding[]; // máx. 3
  what_works: string;
  sector_pattern: string;
  sector_pattern_matches: number;
  blind_spot: string;
  /** Un solo CTA — agendar llamada 20 min */
  cta: {
    profile: string;
    service_hint: string;
    phrase: string;
  };
  position_vs_group?: string;
  needs_human_review: boolean;
  analyzed_at: string;
  mock?: boolean;
}

export interface CompetitorInput {
  name: string;
  url?: string;
}

export interface ContactInput {
  full_name: string;
  role: string;
  company: string;
  work_email: string;
  whatsapp: string;
}

export interface IntentionInput {
  /** ¿Qué quieres que sienta la gente al verte? */
  feel: string;
  /** ¿A quién NO le vendes? */
  not_for: string;
  /** ¿Qué haces distinto que nadie copia? */
  distinct: string;
}

export interface IdentityInput {
  logo_filename?: string;
  logo_data_url?: string; // solo para demo; en prod va a storage
  colors: string;
  fonts: string;
}

export interface DigitalPresenceInput {
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface ScopeInput {
  sector: string;
  city: string;
  reach: "local" | "nacional" | "exportacion";
}

export interface OptionalEvidence {
  recent_posts?: string;
  physical_materials?: string;
  client_words?: string;
}

/** Intake completo del diagnóstico */
export interface DiagnosisIntake {
  contact: ContactInput;
  identity: IdentityInput;
  presence: DigitalPresenceInput;
  scope: ScopeInput;
  competitors: CompetitorInput[]; // 3
  intention: IntentionInput;
  optional?: OptionalEvidence;
}

export type DiagnosisStatus =
  | "intake_received"
  | "analyzing"
  | "needs_review"
  | "ready"
  | "failed";

export interface DiagnosisRow {
  id: string;
  created_at: string;
  status: DiagnosisStatus;
  intake: DiagnosisIntake;
  scores: DimensionScore[] | null;
  report: DiagnosisReport | null;
  needs_human_review: boolean;
  sector: string;
  city: string;
  email_sent_at?: string | null;
}

/** Pesos oficiales (punto de partida; se ajustan por rubro en scoring) */
export const DIMENSION_META: Record<
  DimensionKey,
  { label: string; weight: number; order: number }
> = {
  identidad_visual: {
    label: "Identidad visual",
    weight: 0.2,
    order: 1,
  },
  claridad_propuesta: {
    label: "Claridad de propuesta",
    weight: 0.2,
    order: 2,
  },
  voz_contenido: {
    label: "Voz y contenido",
    weight: 0.15,
    order: 3,
  },
  coherencia_puntos_contacto: {
    label: "Coherencia en puntos de contacto",
    weight: 0.15,
    order: 4,
  },
  presencia_encontrabilidad: {
    label: "Presencia y encontrabilidad",
    weight: 0.15,
    order: 5,
  },
  diferenciacion_real: {
    label: "Diferenciación real",
    weight: 0.15,
    order: 6,
  },
};

export const PAI_META: Record<
  PaiLinkKey,
  { label: string; order: number }
> = {
  producto: { label: "Producto", order: 1 },
  atributo: { label: "Atributo", order: 2 },
  idea: { label: "Idea", order: 3 },
  concepto: { label: "Concepto", order: 4 },
};

export const SEMAPHORE_LABELS: Record<SemaphoreColor, string> = {
  red: "Estás perdiendo clientes por esto hoy.",
  yellow: "Funciona, pero no te diferencia.",
  green: "Es una fortaleza. Cuídala.",
  not_evaluated: "Sin evidencia suficiente — no evaluado.",
};

export const PAI_STATUS_LABELS: Record<PaiStatus, string> = {
  claro: "Claro",
  difuso: "Difuso",
  ausente: "Ausente",
};
