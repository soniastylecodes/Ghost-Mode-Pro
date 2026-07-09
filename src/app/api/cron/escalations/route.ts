export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { processEscalations } from "@/lib/escalation";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    // Secure this endpoint with a Bearer token in production
    // e.g. if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await processEscalations();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Cron escalations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
