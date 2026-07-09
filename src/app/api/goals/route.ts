export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { generateRoadmap } from "@/lib/ai";

const interviewSchema = z.object({
  income: z.string().min(1),
  skills: z.string().min(1),
  hoursPerDay: z.number().min(0.5).max(24),
  commitments: z.string().min(1),
  distractions: z.string().min(1),
  deadline: z.string().min(1),
  reason: z.string().min(1),
  definitionOfSuccess: z.string().min(1),
  pushoverUserKey: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional(),
  deadline: z.string().min(1),
  interview: interviewSchema,
});

// GET -> the user's most recent active goal (with roadmap hidden from payload).
export async function GET() {
  try {
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      include: { interviewResponse: true },
    });
    return NextResponse.json({ goal });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


