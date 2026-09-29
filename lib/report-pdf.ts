/**
 * One-pager PDF del diagnóstico (A4). Solo diagnostica — nunca prescribe.
 * Español, acentos Endor (negro / amarillo).
 */

import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from "pdf-lib";
import type { DiagnosisIntake, DiagnosisReport, SemaphoreColor } from "@/types/diagnosis";
import {
  PAI_META,
  PAI_STATUS_LABELS,
  SEMAPHORE_LABELS,
} from "@/types/diagnosis";

const BLACK = rgb(0.067, 0.094, 0.153); // #111827
const YELLOW = rgb(0.961, 0.62, 0.043); // #f59e0b
const MUTED = rgb(0.45, 0.45, 0.45);
const LIGHT = rgb(0.9, 0.9, 0.9);
const WHITE = rgb(1, 1, 1);

const COLOR_RGB: Record<SemaphoreColor, ReturnType<typeof rgb>> = {
  red: rgb(0.973, 0.443, 0.443),
  yellow: YELLOW,
  green: rgb(0.204, 0.827, 0.6),
  not_evaluated: rgb(0.45, 0.45, 0.45),
};

const DEFAULT_BOOKING = "https://calendar.app.google/P3Pi2TQHQ8cSgr6N7";
const DEFAULT_APP_URL = "https://endor-diagnostico.vercel.app";

/** WinAnsi-safe truncate for Helvetica */
/** Map chars Helvetica/WinAnsi cannot encode */
function sanitize(s: string): string {
  return (s || "")
    .replace(/\u0112/g, "E") // Ē
    .replace(/\u0113/g, "e")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\xFF]/g, "?");
}

function clip(s: string, max: number): string {
  const t = sanitize(s).replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "...";
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitize(text).replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const trial = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawHeader(page: PDFPage, company: string, width: number, font: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x: 0, y: 780, width, height: 62, color: BLACK });
  page.drawText("Endor · Diagnóstico de marca", {
    x: 40,
    y: 818,
    size: 9,
    font,
    color: YELLOW,
  });
  page.drawText(clip(`Tu diagnóstico — ${company}`, 55), {
    x: 40,
    y: 796,
    size: 16,
    font: bold,
    color: WHITE,
  });
}

export async function buildReportPdf(params: {
  intake: DiagnosisIntake;
  report: DiagnosisReport;
  diagnosisId: string;
}): Promise<Uint8Array> {
  const { intake, report, diagnosisId } = params;
  const company = intake.contact.company || "tu marca";
  const booking =
    process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || DEFAULT_BOOKING;
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL
  ).replace(/\/$/, "");
  const reportUrl = `${appUrl}/reporte/${diagnosisId}`;
  const pdfUrl = `${appUrl}/api/reporte/${diagnosisId}/pdf`;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  drawHeader(page, company, width, font, bold);

  let y = 750;

  // Semaphore label
  page.drawText(clip(SEMAPHORE_LABELS[report.global_color], 70), {
    x: 40,
    y,
    size: 10,
    font,
    color: COLOR_RGB[report.global_color],
  });
  y -= 28;

  // Verdict
  page.drawText("VEREDICTO", {
    x: 40,
    y,
    size: 8,
    font: bold,
    color: MUTED,
  });
  y -= 16;
  for (const line of wrapLines(report.verdict, bold, 12, width - 80).slice(0, 3)) {
    page.drawText(line, { x: 40, y, size: 12, font: bold, color: BLACK });
    y -= 16;
  }
  y -= 8;

  // Global score box
  page.drawRectangle({
    x: 40,
    y: y - 52,
    width: 120,
    height: 56,
    borderColor: LIGHT,
    borderWidth: 1,
  });
  page.drawText("PUNTAJE GLOBAL", {
    x: 50,
    y: y - 14,
    size: 7,
    font: bold,
    color: MUTED,
  });
  page.drawText(String(report.global_score), {
    x: 50,
    y: y - 44,
    size: 28,
    font: bold,
    color: COLOR_RGB[report.global_color],
  });

  // 6 dims to the right of score
  let dimY = y - 8;
  page.drawText("SEMAFORO (6 DIMENSIONES)", {
    x: 180,
    y: dimY,
    size: 7,
    font: bold,
    color: MUTED,
  });
  dimY -= 14;
  for (const d of report.dimensions.slice(0, 6)) {
    const hex = COLOR_RGB[d.color];
    page.drawCircle({ x: 186, y: dimY + 3, size: 4, color: hex });
    const score = d.score === null ? "—" : String(d.score);
    page.drawText(clip(`${d.label}`, 32), {
      x: 196,
      y: dimY,
      size: 8,
      font,
      color: BLACK,
    });
    page.drawText(score, {
      x: 420,
      y: dimY,
      size: 8,
      font: bold,
      color: hex,
    });
    dimY -= 12;
  }
  y = Math.min(y - 68, dimY - 8);

  // PAI strip
  page.drawText("CADENA PAI", {
    x: 40,
    y,
    size: 8,
    font: bold,
    color: MUTED,
  });
  y -= 18;
  const paiKeys = ["producto", "atributo", "idea", "concepto"] as const;
  const cellW = (width - 80) / 4;
  for (let i = 0; i < paiKeys.length; i++) {
    const k = paiKeys[i];
    const st = report.pai[k];
    const col =
      st === "claro"
        ? COLOR_RGB.green
        : st === "difuso"
          ? COLOR_RGB.yellow
          : COLOR_RGB.red;
    const x = 40 + i * cellW;
    page.drawRectangle({
      x,
      y: y - 28,
      width: cellW - 6,
      height: 36,
      borderColor: LIGHT,
      borderWidth: 1,
    });
    page.drawText(PAI_META[k].label.toUpperCase(), {
      x: x + 8,
      y: y - 4,
      size: 7,
      font,
      color: MUTED,
    });
    page.drawText(PAI_STATUS_LABELS[st], {
      x: x + 8,
      y: y - 20,
      size: 10,
      font: bold,
      color: col,
    });
  }
  y -= 48;
  for (const line of wrapLines(report.pai_reading, font, 9, width - 80).slice(0, 2)) {
    page.drawText(line, { x: 40, y, size: 9, font, color: BLACK });
    y -= 12;
  }
  y -= 6;

  // Top 3 findings
  page.drawText("LOS 3 HALLAZGOS QUE MAS PESAN", {
    x: 40,
    y,
    size: 8,
    font: bold,
    color: MUTED,
  });
  y -= 16;

  for (let i = 0; i < Math.min(3, report.findings.length); i++) {
    const f = report.findings[i];
    if (y < 140) break;
    page.drawText(`Hallazgo ${i + 1}`, {
      x: 40,
      y,
      size: 8,
      font: bold,
      color: YELLOW,
    });
    y -= 12;
    const factLines = wrapLines(`Hecho. ${f.fact}`, font, 8, width - 80).slice(0, 2);
    for (const line of factLines) {
      page.drawText(line, { x: 40, y, size: 8, font, color: BLACK });
      y -= 10;
    }
    const costLines = wrapLines(`Costo. ${f.cost}`, font, 8, width - 80).slice(0, 2);
    for (const line of costLines) {
      page.drawText(line, { x: 40, y, size: 8, font, color: MUTED });
      y -= 10;
    }
    y -= 6;
  }

  // CTA
  y = Math.min(y, 120);
  page.drawRectangle({
    x: 40,
    y: 48,
    width: width - 80,
    height: 64,
    color: rgb(0.98, 0.96, 0.9),
    borderColor: YELLOW,
    borderWidth: 1,
  });
  page.drawText(clip(report.cta.phrase, 70), {
    x: 52,
    y: 92,
    size: 10,
    font: bold,
    color: BLACK,
  });
  page.drawText(`Agendar 20 min: ${booking}`, {
    x: 52,
    y: 76,
    size: 8,
    font,
    color: MUTED,
  });
  page.drawText(`Reporte: ${reportUrl}`, {
    x: 52,
    y: 62,
    size: 7,
    font,
    color: MUTED,
  });
  page.drawText(`PDF: ${pdfUrl}`, {
    x: 52,
    y: 52,
    size: 7,
    font,
    color: MUTED,
  });

  page.drawText("Endor · Diagnóstico de marca", {
    x: 40,
    y: 28,
    size: 7,
    font,
    color: MUTED,
  });

  // silence unused height (header uses fixed coords)
  void height;

  return doc.save();
}

export function pdfFilename(company: string): string {
  const slug = (company || "marca")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .toLowerCase() || "marca";
  return `diagnostico-${slug}.pdf`;
}
