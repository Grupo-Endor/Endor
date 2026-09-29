/**
 * Análisis con OpenAI — dos corridas independientes, promedio en scoring.
 *
 * PRINCIPIO RECTOR (inyectado al system prompt):
 * Diagnosticar, NUNCA recetar.
 * - Sí: nombrar problema, evidencia, ubicación vs competencia/rubro, costo.
 * - No: soluciones, nombres, tonos, paletas, mensajes, Brand DNA, DEFINE
 *   (propósito, palabra clave, arquetipos, concepto).
 * - Distinguir error vs apuesta deliberada usando la sección de intención.
 * - Sin evidencia → not_evaluated (null), no inventar ni penalizar.
 */

import OpenAI from "openai";
import {
  DIMENSION_META,
  type DiagnosisIntake,
  type DiagnosisReport,
  type DimensionKey,
  type Finding,
} from "@/types/diagnosis";
import { buildDimensionScores } from "@/lib/scoring";
import { buildMockReport, buildReport, inferBlindSpot } from "@/lib/report";
import { sectorLabel } from "@/lib/sectors";

export const DIAGNOSE_NOT_PRESCRIBE_SYSTEM = `Eres el motor de diagnóstico de marca de Ēndor (Grupo Endor).

PRINCIPIO RECTOR — DIAGNOSTICAR, NUNCA RECETAR:
- Le dices a la persona qué le duele y qué tan grave es, comparado con su rubro.
- NUNCA le dices cómo curarlo.
- Puedes nombrar un problema, mostrar evidencia y ubicarlo contra la competencia.
- PROHIBIDO: proponer soluciones, acciones concretas, nombres, tonos, paletas, mensajes, conceptos, arquetipos, propósito, palabra clave, Brand DNA Brief o cualquier parte de DEFINE.
- PROHIBIDO: "cambia tu logo a…", "usa este tono", "mira lo que hace X marca", ejemplos de frases nuevas.
- SÍ puedes cerrar un hallazgo nombrando solo la CATEGORÍA de solución sin describirla
  (ej. "Esto se resuelve con un sistema de identidad, no con un ajuste de logo.").
- Distingue ERROR de APUESTA DELIBERADA usando la intención del intake. Si declaró una intención y el material la refleja (aunque se salga de lo esperado), respétalo — no lo marques como error.
- Si falta evidencia para un criterio o dimensión, responde null (not_evaluated). No inventes. No penalices.
- Ningún criterio por gusto: si no puedes citar evidencia (captura, frase, conteo), null.
- Un verde no se regala: 80+ solo si supera la mediana del rubro en esa dimensión. Estar "bien" donde todos están bien = amarillo.
- Responde SOLO JSON válido según el schema pedido. Idioma: español (México).`;

const DIMENSION_KEYS = Object.keys(DIMENSION_META) as DimensionKey[];

interface LlmRunResult {
  scores: Record<DimensionKey, number | null>;
  verdict: string;
  findings: Finding[];
  what_works: string;
  sector_pattern: string;
  sector_pattern_matches: number;
  position_vs_group?: string;
}

function buildUserPrompt(intake: DiagnosisIntake, runLabel: string): string {
  return `Corrida independiente: ${runLabel}. Evalúa SOLO con la evidencia del intake. Dimensiones y pesos: ${JSON.stringify(
    DIMENSION_META
  )}.

INTAKE (JSON):
${JSON.stringify(intake, null, 2)}

Rubro legible: ${sectorLabel(intake.scope.sector)}

Devuelve JSON con esta forma exacta:
{
  "scores": {
    "identidad_visual": number|null,
    "claridad_propuesta": number|null,
    "voz_contenido": number|null,
    "coherencia_puntos_contacto": number|null,
    "presencia_encontrabilidad": number|null,
    "diferenciacion_real": number|null
  },
  "verdict": "una oración",
  "findings": [
    {
      "dimension": "<DimensionKey>",
      "fact": "hecho observable",
      "compare": "comparación",
      "cost": "consecuencia / costo",
      "category_closer": "categoría de solución sin describirla",
      "evidence_note": "qué evidencia citas"
    }
  ],
  "what_works": "párrafo corto sobre verdes / lo sólido",
  "sector_pattern": "una oración del patrón del sector",
  "sector_pattern_matches": number,
  "position_vs_group": "posición relativa sin cifras de competidores"
}

Máximo 3 findings, ordenados por impacto en el global. Scores 0–100 o null.`;
}

function parseRun(raw: string): LlmRunResult {
  const cleaned = raw.replace(/^```json\\s*/i, "").replace(/```$/i, "").trim();
  const data = JSON.parse(cleaned) as LlmRunResult;
  const scores = {} as Record<DimensionKey, number | null>;
  for (const key of DIMENSION_KEYS) {
    const v = data.scores?.[key];
    scores[key] =
      v === null || v === undefined
        ? null
        : Math.max(0, Math.min(100, Math.round(Number(v))));
  }
  return {
    scores,
    verdict: String(data.verdict ?? ""),
    findings: Array.isArray(data.findings) ? data.findings.slice(0, 3) : [],
    what_works: String(data.what_works ?? ""),
    sector_pattern: String(data.sector_pattern ?? ""),
    sector_pattern_matches: Number(data.sector_pattern_matches ?? 0),
    position_vs_group: data.position_vs_group
      ? String(data.position_vs_group)
      : undefined,
  };
}

async function singleRun(
  client: OpenAI,
  intake: DiagnosisIntake,
  runLabel: string
): Promise<LlmRunResult> {
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DIAGNOSE_NOT_PRESCRIBE_SYSTEM },
      { role: "user", content: buildUserPrompt(intake, runLabel) },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error(`OpenAI run ${runLabel} sin contenido`);
  return parseRun(content);
}

/**
 * Dos corridas independientes → promedio de scores → reporte.
 * Sin OPENAI_API_KEY → mock estructurado.
 */
export async function analyzeBrand(
  intake: DiagnosisIntake
): Promise<DiagnosisReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return buildMockReport(intake);
  }

  const client = new OpenAI({ apiKey });

  // Dos corridas independientes (pueden paralelizarse)
  const [runA, runB] = await Promise.all([
    singleRun(client, intake, "A"),
    singleRun(client, intake, "B"),
  ]);

  const runs = Object.fromEntries(
    DIMENSION_KEYS.map((key) => [
      key,
      { a: runA.scores[key], b: runB.scores[key] },
    ])
  ) as Parameters<typeof buildDimensionScores>[0];

  const dimensions = buildDimensionScores(runs);

  // Preferir textos de la corrida A; findings ya limitados a 3
  const findings = (runA.findings.length ? runA.findings : runB.findings).map(
    (f) => ({
      ...f,
      dimension: f.dimension,
      fact: f.fact,
      compare: f.compare,
      cost: f.cost,
      category_closer: f.category_closer,
      evidence_note: f.evidence_note,
    })
  );

  return buildReport({
    intake,
    dimensions,
    findings,
    verdict: runA.verdict || runB.verdict,
    what_works: runA.what_works || runB.what_works,
    sector_pattern: runA.sector_pattern || runB.sector_pattern,
    sector_pattern_matches:
      runA.sector_pattern_matches || runB.sector_pattern_matches,
    blind_spot: inferBlindSpot(intake),
    position_vs_group: runA.position_vs_group || runB.position_vs_group,
    mock: false,
  });
}
