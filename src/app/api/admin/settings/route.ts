export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";

const SINGLETON_ID = "singleton";

async function getOrCreateSettings() {
  return prisma.appSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID },
    update: {},
  });
}

export async function GET() {
  try {
    await requireAdminId();
    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminId();

    const body = await req.json();

    const allowed = [
      "missionDeadlineHour",
      "maxPrimaryTasks",
      "maxSecondaryTasks",
      "pushoverAppToken",
      "roadmapSystemPrompt",
      "missionSystemPrompt",
      "proofSystemPrompt",
      "decisionSystemPrompt",
    ] as const;

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...update },
      update,
    });

    return NextResponse.json({ settings });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
