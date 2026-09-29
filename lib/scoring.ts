/**
 * Puntuación y semáforo Ēndor.
 *
 * Reglas (manual):
 * - 0–39 rojo, 40–79 amarillo, 80–100 verde
 * - Missing evidence = not_evaluated (no penaliza; no entra al promedio)
 * - Global nunca arriba de 60 si Diferenciación real está en rojo
 * - Dos corridas: si una dimensión difiere >15 → needs_human_review
 * - Verde no se regala: superar mediana del rubro (calibración en análisis LLM)
 */

import {
  DIMENSION_META,
  type DimensionKey,
  type DimensionScore,
  type SemaphoreColor,
} from "@/types/diagnosis";

export const HUMAN_REVIEW_DELTA = 15;
export const DIFFERENCIACION_CAP = 60;

export function scoreToColor(score: number | null): SemaphoreColor {
  if (score === null || Number.isNaN(score)) return "not_evaluated";
  if (score < 40) return "red";
  if (score < 80) return "yellow";
  return "green";
}

export function averageRuns(
  a: number | null,
  b: number | null
): { score: number | null; needs_human_review: boolean } {
  if (a === null && b === null) {
    return { score: null, needs_human_review: false };
  }
  if (a === null) return { score: b, needs_human_review: false };
  if (b === null) return { score: a, needs_human_review: false };
  const delta = Math.abs(a - b);
  return {
    score: Math.round((a + b) / 2),
    needs_human_review: delta > HUMAN_REVIEW_DELTA,
  };
}

export function buildDimensionScores(
  runs: Partial<Record<DimensionKey, { a: number | null; b: number | null }>>
): DimensionScore[] {
  return (Object.keys(DIMENSION_META) as DimensionKey[])
    .sort((x, y) => DIMENSION_META[x].order - DIMENSION_META[y].order)
    .map((key) => {
      const pair = runs[key] ?? { a: null, b: null };
      const { score, needs_human_review } = averageRuns(pair.a, pair.b);
      return {
        key,
        label: DIMENSION_META[key].label,
        weight: DIMENSION_META[key].weight,
        score,
        color: scoreToColor(score),
        needs_human_review,
        run_a: pair.a,
        run_b: pair.b,
      };
    });
}

/**
 * Promedio ponderado solo sobre dimensiones evaluadas.
 * Si Diferenciación real es roja, el global se tapa a 60.
 */
export function computeGlobalScore(dimensions: DimensionScore[]): {
  global_score: number;
  global_color: SemaphoreColor;
  capped_by_diferenciacion: boolean;
} {
  const evaluated = dimensions.filter((d) => d.score !== null);
  if (evaluated.length === 0) {
    return {
      global_score: 0,
      global_color: "not_evaluated",
      capped_by_diferenciacion: false,
    };
  }

  const weightSum = evaluated.reduce((s, d) => s + d.weight, 0);
  let global = Math.round(
    evaluated.reduce((s, d) => s + (d.score as number) * d.weight, 0) / weightSum
  );

  const diff = dimensions.find((d) => d.key === "diferenciacion_real");
  let capped = false;
  if (diff?.color === "red" && global > DIFFERENCIACION_CAP) {
    global = DIFFERENCIACION_CAP;
    capped = true;
  }

  return {
    global_score: global,
    global_color: scoreToColor(global),
    capped_by_diferenciacion: capped,
  };
}

export function anyNeedsHumanReview(dimensions: DimensionScore[]): boolean {
  return dimensions.some((d) => d.needs_human_review);
}
