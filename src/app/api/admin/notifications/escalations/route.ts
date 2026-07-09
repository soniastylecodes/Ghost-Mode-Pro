export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import { processEscalations } from "@/lib/escalation";

export async function GET() {
  try {
    await requireAdminId();

    const pending = await prisma.pushSchedule.findMany({
      where: { status: "pending" },
      orderBy: { scheduledTime: "asc" },
    });

    return NextResponse.json({ pending });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    await requireAdminId();
    await processEscalations();
    return NextResponse.json({ ok: true, message: "Escalation processing triggered." });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
