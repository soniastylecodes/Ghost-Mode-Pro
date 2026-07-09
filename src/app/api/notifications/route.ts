import { NextResponse } from "next/server";
import { processEscalations } from "@/lib/escalation";

export const dynamic = "force-dynamic";

// GET / POST target for Vercel Cron or local scheduler to tick escalation queue
export async function GET() {
  try {
    await processEscalations();
    return NextResponse.json({ success: true, processedAt: new Date() });
  } catch (err) {
    console.error("Cron escalation error:", err);
    return NextResponse.json({ error: "Escalation check failed" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
