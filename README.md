# Ēndor — Plataforma de diagnóstico de marca

Scaffold inicial del diagnóstico gratuito de Grupo Endor.

**Principio rector:** diagnosticar, nunca recetar. La plataforma nombra problemas con evidencia y los ubica contra el rubro; no propone soluciones, nombres, tonos, paletas ni Brand DNA / DEFINE.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase JS (server + browser)
- OpenAI SDK (`POST /api/analyze`, dos corridas independientes)

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing (copy del export HTML) |
| `/diagnostico` | Intake multi-paso |
| `/reporte/[id]` | Reporte (estructura completa; mock si no hay env) |
| `/reporte/demo` | Vista demo sin DB |

## Setup local

```bash
cp .env.example .env.local
# Completa OPENAI_API_KEY y/o vars de Supabase (opcionales)
npm install
npm run dev
```

Sin `OPENAI_API_KEY` el API devuelve un **reporte mock estructurado** (la UI funciona).  
Sin Supabase se usa un store en memoria del proceso Node (solo dev).

```bash
npm run typecheck
npm run build
```

## Vercel + Supabase + OpenAI

1. **Supabase:** crea proyecto → SQL Editor → pega `supabase/migrations/001_init.sql`.
2. **Storage:** crea bucket privado `evidence`. Políticas sugeridas:
   - `INSERT` para `anon` en paths `evidence/{diagnosis_id}/*`
   - `SELECT` restringido (service role o signed URLs)
3. **Vercel:** importa el repo, añade env:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, para actualizar scores)
   - `NEXT_PUBLIC_APP_URL`
4. Deploy.

## Reglas de producto (código)

- 6 dimensiones / pesos: ver `types/diagnosis.ts` → `DIMENSION_META`
- Semáforo + tope si Diferenciación es roja: `lib/scoring.ts`
- Dos corridas LLM + `needs_human_review` si Δ>15: `lib/openai-analyze.ts` + `lib/scoring.ts`
- Hallazgos hecho→comparación→costo→categoría abierta: `lib/report.ts`
- System prompt **diagnose-not-prescribe**: constante `DIAGNOSE_NOT_PRESCRIBE_SYSTEM` en `lib/openai-analyze.ts`
- Rubros MX (~40): `lib/sectors.ts`

## Marca UI

- Negro / blanco, acento `#FFE255`
- Tipografía Mulish (sin weight 700)
- Logo: siempre `components/EndorLogo.tsx` — nunca escribir la palabra del logo como texto

## RLS (resumen)

- `diagnoses`: insert público (anon); select por id (UUID como link secreto en MVP)
- Updates de scores: preferir `SUPABASE_SERVICE_ROLE_KEY`
- `evidence_files`: insert/select anon (ajustar en producción)
- `sector_benchmarks`: solo lectura pública (stub)

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run typecheck` | `tsc --noEmit` |
