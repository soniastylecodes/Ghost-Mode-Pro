import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const vowSchema = z.object({
  missionStatement: z.string().min(1),
  whyItMatters: z.string().min(1),
  targetNumber: z.number().optional(),
  deadline: z.string().min(1),
  definitionOfSuccess: z.string().min(1),
  outcomeThreads: z.array(z.object({
    title: z.string(),
    deadline: z.string(),
    completed: z.boolean()
  })).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = vowSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const data = parsed.data;

    // Create Goal and Vow in one transaction
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: "Ghost Mode Mission",
        statement: data.missionStatement,
        reason: data.whyItMatters,
        targetNumber: data.targetNumber,
        deadline: new Date(data.deadline),
        definitionOfSuccess: data.definitionOfSuccess,
        outcomeThreads: data.outcomeThreads ? JSON.stringify(data.outcomeThreads) : null,
        vow: {
          create: {
            missionStatement: data.missionStatement,
            whyItMatters: data.whyItMatters,
          }
        }
      }
    });

    return NextResponse.json({ goalId: goal.id }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Vow error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
