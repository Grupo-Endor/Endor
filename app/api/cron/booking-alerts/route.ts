import { NextResponse } from "next/server";
import { processBookingAlerts } from "@/lib/booking-alerts";

/**
 * GET/POST /api/cron/booking-alerts
 * Vercel Cron (every 5 minutes) + manual trigger with Authorization: Bearer $CRON_SECRET.
 * Polls Paty's Google Calendar for new appointment bookings and emails Patricia
 * (herramientas@ → pfernandez@) with commercial diagnosis + meeting time.
 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Fail closed in production if secret missing (except Vercel cron header alone is weak).
    // Allow Vercel Cron header when CRON_SECRET unset so first deploy still runs;
    // prefer setting CRON_SECRET.
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    return isVercelCron;
  }
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  // Vercel Cron also sends Authorization: Bearer <CRON_SECRET> when set.
  if (req.headers.get("x-vercel-cron") === "1" && auth === `Bearer ${secret}`) {
    return true;
  }
  return false;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await processBookingAlerts();
    console.info("[booking-alerts]", JSON.stringify({
      scanned: result.scanned,
      candidates: result.candidates,
      notified: result.notified,
      skipped: result.skipped,
      errors: result.errors.length,
    }));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[booking-alerts] fatal:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
