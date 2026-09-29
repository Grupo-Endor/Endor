/**
 * Construcción del reporte de salida.
 * Estructura fija (manual §7):
 * 1 veredicto · 2 global · 3 semáforo · 4 top 3 hallazgos ·
 * 5 lo que funciona · 6 patrón sector · 7 punto ciego · 8 CTA único
 *
 * Hallazgos: hecho → comparación → costo → cierre de categoría abierta.
 * Nunca: instrucción, nombre, tono, paleta, Brand DNA / DEFINE.
 */

import {
  DIMENSION_META,
  type DiagnosisIntake,
  type DiagnosisReport,
  type DimensionKey,
  type DimensionScore,
  type Finding,
  type SemaphoreColor,
} from "@/types/diagnosis";
import {
  anyNeedsHumanReview,
  computeGlobalScore,
  scoreToColor,
} from "@/lib/scoring";
import { sectorLabel } from "@/lib/sectors";

export interface CtaProfile {
  profile: string;
  service_hint: string;
  phrase: string;
}

/** Un solo CTA por perfil de rojos (manual §8) */
export function pickCta(dimensions: DimensionScore[]): CtaProfile {
  const red = new Set(
    dimensions.filter((d) => d.color === "red").map((d) => d.key)
  );
  const evaluatedGreens = dimensions.filter((d) => d.color === "green");
  const allGreen =
    dimensions.every(
      (d) => d.color === "green" || d.color === "not_evaluated"
    ) && evaluatedGreens.length > 0;
  const noRed = red.size === 0;

  if (allGreen) {
    return {
      profile: "todo_verde",
      service_hint: "referido",
      phrase:
        "Tu marca está en buen lugar. ¿Conoces a alguien que necesite este diagnóstico?",
    };
  }

  if (
    red.has("identidad_visual") &&
    red.has("coherencia_puntos_contacto")
  ) {
    return {
      profile: "identidad_puntos_contacto",
      service_hint: "rebranding",
      phrase: "Tienes tres marcas. Necesitas una.",
    };
  }

  if (red.has("voz_contenido")) {
    return {
      profile: "voz_contenido",
      service_hint: "plan_contenido",
      phrase: "Publicas, pero no habla nadie.",
    };
  }

  if (
    (red.has("claridad_propuesta") && red.has("diferenciacion_real")) ||
    noRed
  ) {
    return {
      profile: "claridad_diferenciacion",
      service_hint: "taller_brand_dna",
      phrase:
        "Tu problema no es de diseño, es de definición. Empieza por ahí.",
    };
  }

  return {
    profile: "general",
    service_hint: "llamada_20min",
    phrase:
      "Agenda una llamada de 20 minutos para ver qué está costándote más clientes.",
  };
}

export function inferBlindSpot(intake: DiagnosisIntake): string {
  const gaps: string[] = [];
  if (!intake.optional?.physical_materials?.trim()) {
    gaps.push(
      "no subiste material físico (empaque, sucursal, uniforme); en varios rubros el local pesa"
    );
  }
  if (!intake.optional?.recent_posts?.trim()) {
    gaps.push(
      "faltan piezas recientes de los últimos 60 días para afinar voz y contenido"
    );
  }
  const presenceCount = [
    intake.presence.website,
    intake.presence.instagram,
    intake.presence.facebook,
    intake.presence.tiktok,
    intake.presence.linkedin,
  ].filter(Boolean).length;
  if (presenceCount < 2) {
    gaps.push("presencia digital mínima: la encontrabilidad queda parcial");
  }
  if (gaps.length === 0) {
    return "No hay puntos ciegos críticos en la evidencia enviada.";
  }
  return `Punto ciego: ${gaps.join("; ")}. Se marca como no evaluado, no se penaliza.`;
}

export function buildReport(params: {
  intake: DiagnosisIntake;
  dimensions: DimensionScore[];
  findings: Finding[];
  verdict: string;
  what_works: string;
  sector_pattern: string;
  sector_pattern_matches: number;
  blind_spot?: string;
  position_vs_group?: string;
  mock?: boolean;
}): DiagnosisReport {
  const { global_score, global_color } = computeGlobalScore(params.dimensions);
  const needs_human_review = anyNeedsHumanReview(params.dimensions);
  const cta = pickCta(params.dimensions);

  return {
    verdict: params.verdict,
    global_score,
    global_color,
    dimensions: params.dimensions,
    findings: params.findings.slice(0, 3),
    what_works: params.what_works,
    sector_pattern: params.sector_pattern,
    sector_pattern_matches: params.sector_pattern_matches,
    blind_spot: params.blind_spot ?? inferBlindSpot(params.intake),
    cta,
    position_vs_group: params.position_vs_group,
    needs_human_review,
    analyzed_at: new Date().toISOString(),
    mock: params.mock,
  };
}

const MOCK_SCORES: Record<DimensionKey, number | null> = {
  identidad_visual: 62,
  claridad_propuesta: 48,
  voz_contenido: 55,
  coherencia_puntos_contacto: null, // suele faltar evidencia física
  presencia_encontrabilidad: 38,
  diferenciacion_real: 35,
};

/** Reporte mock para UI / sin OPENAI_API_KEY */
export function buildMockReport(intake: DiagnosisIntake): DiagnosisReport {
  const sector = sectorLabel(intake.scope.sector);
  const hasPhysical = Boolean(intake.optional?.physical_materials?.trim());

  const dimensions: DimensionScore[] = (
    Object.keys(DIMENSION_META) as DimensionKey[]
  )
    .sort((a, b) => DIMENSION_META[a].order - DIMENSION_META[b].order)
    .map((key) => {
      let score = MOCK_SCORES[key];
      if (key === "coherencia_puntos_contacto") {
        score = hasPhysical ? 44 : null;
      }
      const color: SemaphoreColor = scoreToColor(score);
      return {
        key,
        label: DIMENSION_META[key].label,
        weight: DIMENSION_META[key].weight,
        score,
        color,
        needs_human_review: false,
        run_a: score,
        run_b: score === null ? null : Math.min(100, score + 2),
      };
    });

  const findings: Finding[] = [
    {
      dimension: "diferenciacion_real",
      fact: `En el material de ${intake.contact.company || "tu marca"}, la promesa podría firmarla cualquiera de tus 3 competidores sin que chirriara.`,
      compare: `En ${sector}, al menos 3 de tus competidores repiten las mismas palabras genéricas en bio o headline.`,
      cost: "El cliente compra la categoría, no a ti: cada negociación termina en precio.",
      category_closer:
        "Esto se resuelve con definición de marca, no con más publicaciones.",
      evidence_note: "Comparación de headlines / bios (mock).",
    },
    {
      dimension: "presencia_encontrabilidad",
      fact: "Al buscar tu categoría + ciudad, tu marca no aparece de forma consistente en los primeros resultados públicos revisados.",
      compare:
        "Al menos un competidor del grupo sí ocupa ese espacio de encontrabilidad.",
      cost: "Pierdes la primera impresión en una parte relevante de búsquedas locales.",
      category_closer:
        "Esto se atiende con presencia y encontrabilidad (SEO/GEO), no con un post suelto.",
      evidence_note: "Búsqueda categoría + zona (mock).",
    },
    {
      dimension: "claridad_propuesta",
      fact: `Tú dijiste que querías que la gente sintiera: «${(intake.intention.feel || "…").slice(0, 80)}». El material público no sostiene esa intención en 5 segundos.`,
      compare:
        "La distancia entre intención declarada y lo que comunica el sitio/redes es visible frente al grupo.",
      cost: "Cada visitante tiene que adivinar por qué elegirte; eso frena conversión.",
      category_closer:
        "Esto se resuelve con claridad de propuesta, no con un ajuste cosmético de logo.",
      evidence_note: "Cita de intención del intake vs. presencia digital (mock).",
    },
  ];

  return buildReport({
    intake,
    dimensions,
    findings,
    verdict:
      "Tu marca tiene base visual usable pero desaparece frente a tus competidores: hoy eres una marca de categoría.",
    what_works:
      "Hay consistencia parcial en identidad visual (amarillo alto): el sistema no está roto del todo, por eso los rojos también son creíbles.",
    sector_pattern: `En ${sector} el patrón suele incluir promesas genéricas, estética intercambiable y poca frase propia.`,
    sector_pattern_matches: 3,
    position_vs_group:
      "Por debajo de la mediana en diferenciación y encontrabilidad (grupo mock de 4).",
    mock: true,
  });
}
