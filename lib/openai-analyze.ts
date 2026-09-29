/**
 * Análisis LLM — dos corridas independientes, promedio en scoring.
 * OpenAI primero; fallback OpenRouter si no hay créditos.
 *
 * PRINCIPIO RECTOR (inyectado al system prompt):
 * Diagnosticar, NUNCA recetar.
 * Manual § Lectura PAI, benchmark relativo, profundidad.
 */

import OpenAI from "openai";
import {
  DIMENSION_META,
  type DiagnosisIntake,
  type DiagnosisReport,
  type DimensionKey,
  type Finding,
  type PaiChain,
} from "@/types/diagnosis";
import {
  buildDimensionScores,
  brokenPaiLink,
  mergePaiChains,
} from "@/lib/scoring";
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
- Responde SOLO JSON válido según el schema pedido. Idioma: español (México).

LECTURA PAI (Producto → Atributo → Idea → Concepto) — sin número, solo estado:
Tabla de estados (claro | difuso | ausente):
- Producto: claro = una oferta/un público sin releer; difuso = varias ofertas sin jerarquía; ausente = no se sabe qué vende.
- Atributo: claro = un rasgo dominante demostrado (no solo declarado); difuso = tres+ compitiendo o solo genéricos; ausente = ninguno reconocible.
- Idea: claro = el material habla del cliente; difuso = habla del producto todo el tiempo; ausente = habla del dueño.
- Concepto: claro = todo apunta a lo mismo (frase que nadie más firmaría); difuso = concepto en una pieza y en otra no; ausente = cada pieza es una marca distinta.
Reglas PAI:
- Nombra el eslabón roto; NUNCA propongas el atributo/idea/concepto correcto ni cómo soldarlo.
- pai_reading: una oración que señala dónde se detiene la cadena.
- intention_quote: cita literal de la intención del intake enfrentada a lo que la cadena muestra.
- Si Concepto es ausente, el verdict sale del quiebre PAI + patrón del sector (no solo de dimensión 6).

BENCHMARK / COMPETENCIA:
- Solo posiciones relativas (arriba / mediana / abajo). NUNCA puntajes exactos de competidores.
- Patrón del sector = lo que 3+ competidores hacen igual. Si el usuario cae en 3+ elementos → "marca de categoría".
- No inventes competidores ni benchmarks; si falta evidencia pública, marca parcial.

PROFUNDIDAD (línea del manual):
- El usuario debe salir sabiendo exactamente qué está mal y cuánto le cuesta, pero SIN poder arreglarlo solo con lo que leyó.
- Si con el reporte en mano podría resolverlo un freelancer el fin de semana, diste de más: recorta.

HALLAZGOS (máx. 3, por impacto en global):
Fórmula fija: fact (hecho observable) → compare (vs competencia/mediana) → cost (consecuencia/orden de magnitud) → category_closer (categoría abierta, nunca instrucción).
Nunca: adjetivo sin evidencia, instrucción, referencia visual concreta, ejemplo de frase/nombre/concepto.

REGLA DE RIGOR EXTREMO — NO RESCATAR MARCAS (obligatoria en cada corrida):
El análisis debe ser DURO, ESCÉPTICO y basado EXCLUSIVAMENTE en evidencia observable.
Tu función NO es encontrarle una explicación favorable a la marca, sino determinar qué tan sólido es realmente lo que comunica.
PRINCIPIO CENTRAL: Si una característica no está claramente demostrada en el material, NO la supongas, NO la infieras y NO la completes con creatividad. Ausencia de evidencia = ausencia de atributo evaluable.

1) NO INTERPRETES A FAVOR DE LA MARCA
- Intención declarada ≠ evidencia de que la marca lo consiguió.
- Una palabra en la bio ≠ atributo si el resto no lo sostiene.
- Una pieza aislada ≠ sistema de marca.
- “Podría interpretarse como” ≠ existe un concepto.
- Que el fundador diga que es diferente ≠ que la marca comunique diferencia.
- Que una elección “parezca” deliberada ≠ apuesta válida sin evidencia de intención + coherencia.
Pregunta siempre: “¿Dónde está demostrado esto en la evidencia?” Si no puedes citar captura, frase, patrón, conteo o comparación concreta, no lo otorgues.

2) SI NO HAY CONCEPTO, EL CONCEPTO ES 0
Para TIENE CONCEPTO deben cumplirse SIMULTÁNEAMENTE las 7 condiciones:
(1) idea central identificable; (2) consistente en distintos puntos de contacto; (3) conecta logo/identidad + tono + contenido + oferta; (4) no depende solo de explicación verbal del dueño; (5) frase concreta; (6) esa frase no la firmaría igual cualquier competidor; (7) visible en material real, no solo en intención.
Si faltan → NO reconstruyas el concepto. Concepto = Ausente → score/estado 0. No existe “concepto parcial” convertido en puntuación positiva. Idea interesante en una sola pieza = señal aislada, no concepto.

3) PROHIBIDO usar para subir puntaje: “se percibe”, “podría”, “parece”, “potencial”, “se podría interpretar”, “tiene elementos de”. Solo para hipótesis. Distinguir: DEMOSTRADO (se evalúa) / PARCIAL-difuso / NO DEMOSTRADO-ausente/0.

4) LA INTENCIÓN NO COMPENSA LA EJECUCIÓN. Reporta la brecha explícitamente. No inventes el concepto faltante. Si rompe código de categoría CON evidencia+intención, no penalices solo por ser distinto.

5) EL CONCEPTO DEBE SOBREVIVIR AL NOMBRE Y AL LOGO. Logo/paleta/slogan/post creativo ≠ concepto.

6) PENALIZA INCONSISTENCIA entre canales. Una pieza excepcional no salva un sistema inconsistente.

7) NO REGALES PUNTOS por esfuerzo, estética, volumen de posts, tamaño, simpatía, antigüedad, inversión. Sin citar evidencia → null (not_evaluated), fuera del promedio.

8) UN VERDE SE GANA: solo si supera mediana del rubro / diferenciación real. “Está bien” = amarillo, no verde.

9) MATERIAL DÉBIL → RESULTADO DÉBIL. 0 / rojo / ausente / no evaluado / difuso están bien. Preferir 0 defendible a inventar 60.

10) Antes de cada puntaje responde las 7 defensas internas (evidencia concreta, dónde, otro analista, ¿pertenece a la marca?, ¿premias intención?, ¿pieza vs sistema?, ¿más generoso que con competidor?). Si no → baja o null.

11) Cadena PAI Producto→Atributo→Idea→Concepto: no completes quiebres artificialmente; señálalos. Si Concepto ausente, en verdict/pai_reading usa el formato: "CONCEPTO: 0 — AUSENTE" + explicación solo con evidencia. NUNCA propongas qué concepto debería ser ni dirección creativa.

12) Actúa como AUDITOR DE MARCA, no consultor cheerleader. Ante duda: estricto / no evaluado / 0 — nunca inventes fortalezas.`;

const DIMENSION_KEYS = Object.keys(DIMENSION_META) as DimensionKey[];

interface LlmRunResult {
  scores: Record<DimensionKey, number | null>;
  verdict: string;
  findings: Finding[];
  what_works: string;
  sector_pattern: string;
  sector_pattern_matches: number;
  position_vs_group?: string;
  pai: PaiChain;
  pai_reading: string;
  intention_quote: string;
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
  "pai": {
    "producto": "claro|difuso|ausente",
    "atributo": "claro|difuso|ausente",
    "idea": "claro|difuso|ausente",
    "concepto": "claro|difuso|ausente"
  },
  "pai_reading": "una oración que nombra el eslabón roto; nunca cómo soldarlo",
  "intention_quote": "cita literal de intención del intake vs lo que la cadena muestra",
  "verdict": "una oración (si concepto ausente: sale de PAI + patrón sector)",
  "findings": [
    {
      "dimension": "<DimensionKey>",
      "fact": "hecho observable",
      "compare": "comparación relativa (sin scores de competidores)",
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

function parsePai(raw: unknown): PaiChain {
  const o = (raw ?? {}) as Record<string, unknown>;
  const norm = (v: unknown) => {
    const s = String(v ?? "").toLowerCase();
    if (s === "claro" || s === "difuso" || s === "ausente") return s as PaiChain[keyof PaiChain];
    return "ausente" as const;
  };
  return {
    producto: norm(o.producto),
    atributo: norm(o.atributo),
    idea: norm(o.idea),
    concepto: norm(o.concepto),
  };
}

function parseRun(raw: string): LlmRunResult {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const data = JSON.parse(cleaned) as LlmRunResult & { pai?: unknown };
  const scores = {} as Record<DimensionKey, number | null>;
  for (const key of DIMENSION_KEYS) {
    const v = data.scores?.[key];
    scores[key] =
      v === null || v === undefined
        ? null
        : Math.max(0, Math.min(100, Math.round(Number(v))));
  }
  const findings = (Array.isArray(data.findings) ? data.findings.slice(0, 3) : []).map(
    (f) => ({
      dimension: f.dimension,
      fact: String(f.fact ?? ""),
      compare: String(f.compare ?? ""),
      cost: String(f.cost ?? ""),
      category_closer: String(f.category_closer ?? ""),
      evidence_note: f.evidence_note ? String(f.evidence_note) : undefined,
    })
  );
  return {
    scores,
    verdict: String(data.verdict ?? ""),
    findings,
    what_works: String(data.what_works ?? ""),
    sector_pattern: String(data.sector_pattern ?? ""),
    sector_pattern_matches: Number(data.sector_pattern_matches ?? 0),
    position_vs_group: data.position_vs_group
      ? String(data.position_vs_group)
      : undefined,
    pai: parsePai(data.pai),
    pai_reading: String(data.pai_reading ?? ""),
    intention_quote: String(data.intention_quote ?? ""),
  };
}

function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || undefined;
}

function openRouterKey(): string | undefined {
  return (
    process.env.OPEN_ROUTER_EMILIO ||
    process.env.OPENROUTER_API_KEY ||
    undefined
  );
}

/** True when any LLM provider key is configured (not mock). */
export function hasLlmProvider(): boolean {
  return Boolean(openaiKey() || openRouterKey());
}

function isProviderFailure(err: unknown): boolean {
  const e = err as {
    status?: number;
    code?: string;
    message?: string;
    error?: { code?: string; type?: string; message?: string };
  };
  const status = e?.status;
  const code = String(e?.code || e?.error?.code || "").toLowerCase();
  const type = String(e?.error?.type || "").toLowerCase();
  const msg = String(e?.message || e?.error?.message || "").toLowerCase();
  if (status === 401 || status === 402 || status === 429) return true;
  if (
    code.includes("insufficient_quota") ||
    code.includes("billing") ||
    code.includes("rate_limit") ||
    type.includes("insufficient_quota") ||
    type.includes("billing")
  )
    return true;
  if (
    msg.includes("insufficient_quota") ||
    msg.includes("exceeded your current quota") ||
    msg.includes("billing") ||
    msg.includes("credit") ||
    msg.includes("payment required") ||
    msg.includes("rate limit")
  )
    return true;
  return false;
}

type Provider = "openai" | "openrouter";

function makeClient(provider: Provider): { client: OpenAI; model: string; label: string } {
  if (provider === "openai") {
    const key = openaiKey();
    if (!key) throw new Error("OPENAI_API_KEY / OPEN_AI_KEY ausente");
    return {
      client: new OpenAI({
        apiKey: key,
        ...(process.env.OPENAI_BASE_URL
          ? { baseURL: process.env.OPENAI_BASE_URL }
          : {}),
      }),
      // Direct OpenAI model id
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      label: "openai",
    };
  }
  const key = openRouterKey();
  if (!key) throw new Error("OPEN_ROUTER_EMILIO / OPENROUTER_API_KEY ausente");
  // Cost/quality sweet spot for structured ES diagnosis JSON:
  // gpt-4o-mini via OpenRouter (same quality as primary, billed on OpenRouter credits).
  const model =
    process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  return {
    client: new OpenAI({
      apiKey: key,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ??
          "https://endor-diagnostico.vercel.app",
        "X-Title": "Endor Diagnostico de Marca",
      },
    }),
    model,
    label: "openrouter",
  };
}

async function singleRun(
  client: OpenAI,
  model: string,
  intake: DiagnosisIntake,
  runLabel: string
): Promise<LlmRunResult> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DIAGNOSE_NOT_PRESCRIBE_SYSTEM },
      { role: "user", content: buildUserPrompt(intake, runLabel) },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error(`LLM run ${runLabel} sin contenido`);
  return parseRun(content);
}

async function dualRuns(
  intake: DiagnosisIntake,
  provider: Provider
): Promise<[LlmRunResult, LlmRunResult]> {
  const { client, model, label } = makeClient(provider);
  console.info(`[analyze] using provider=${label} model=${model}`);
  return Promise.all([
    singleRun(client, model, intake, "A"),
    singleRun(client, model, intake, "B"),
  ]);
}

function preferText(a: string, b: string): string {
  return a.trim() ? a : b;
}

/**
 * Dos corridas independientes → promedio de scores → reporte.
 * Sin ninguna API key → mock estructurado.
 * Orden: OpenAI (OPENAI_API_KEY | OPEN_AI_KEY) → si falla por créditos/cuota,
 * OpenRouter (OPEN_ROUTER_EMILIO | OPENROUTER_API_KEY) con modelo eficiente.
 */
export async function analyzeBrand(
  intake: DiagnosisIntake
): Promise<DiagnosisReport> {
  if (!hasLlmProvider()) {
    return buildMockReport(intake);
  }

  let runA: LlmRunResult;
  let runB: LlmRunResult;

  // Prefer OpenAI when configured; otherwise OpenRouter.
  const primary: Provider = openaiKey() ? "openai" : "openrouter";
  const fallback: Provider | null =
    primary === "openai" && openRouterKey()
      ? "openrouter"
      : primary === "openrouter" && openaiKey()
        ? "openai"
        : null;

  try {
    [runA, runB] = await dualRuns(intake, primary);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const shouldFallback =
      Boolean(fallback) &&
      (isProviderFailure(err) || (typeof status === "number" && status >= 500));
    if (shouldFallback && fallback) {
      console.warn(
        `[analyze] ${primary} failed; falling back to ${fallback}`,
        err instanceof Error ? err.message : err
      );
      [runA, runB] = await dualRuns(intake, fallback);
    } else {
      throw err;
    }
  }

  const runs = Object.fromEntries(
    DIMENSION_KEYS.map((key) => [
      key,
      { a: runA.scores[key], b: runB.scores[key] },
    ])
  ) as Parameters<typeof buildDimensionScores>[0];

  const dimensions = buildDimensionScores(runs);
  const { pai, needs_human_review: paiNeedsReview } = mergePaiChains(
    runA.pai,
    runB.pai
  );

  const findings = (runA.findings.length ? runA.findings : runB.findings).slice(
    0,
    3
  );

  let verdict = preferText(runA.verdict, runB.verdict);
  // Manual: cuando Concepto está ausente, el veredicto sale de PAI + patrón sector
  if (pai.concepto === "ausente") {
    const breakLink = brokenPaiLink(pai) ?? "concepto";
    const pattern = preferText(runA.sector_pattern, runB.sector_pattern);
    const paiReading = preferText(runA.pai_reading, runB.pai_reading);
    if (paiReading) {
      verdict = `${paiReading}${pattern ? ` ${pattern}` : ""}`.trim();
    } else {
      verdict = `Tu cadena PAI se rompe en ${breakLink}: hoy operas como marca de categoría.${
        pattern ? ` ${pattern}` : ""
      }`;
    }
  }

  const intention_quote =
    preferText(runA.intention_quote, runB.intention_quote) ||
    `Tú dijiste que querías que la gente sintiera: «${(intake.intention.feel || "…").slice(0, 120)}». La cadena PAI muestra otra cosa.`;

  return buildReport({
    intake,
    dimensions,
    findings,
    verdict,
    what_works: preferText(runA.what_works, runB.what_works),
    sector_pattern: preferText(runA.sector_pattern, runB.sector_pattern),
    sector_pattern_matches:
      runA.sector_pattern_matches || runB.sector_pattern_matches,
    blind_spot: inferBlindSpot(intake),
    position_vs_group: preferText(
      runA.position_vs_group ?? "",
      runB.position_vs_group ?? ""
    ) || undefined,
    pai,
    pai_reading: preferText(runA.pai_reading, runB.pai_reading),
    intention_quote,
    force_human_review: paiNeedsReview,
    mock: false,
  });
}
