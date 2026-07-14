import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { generateRoadmap } from "@/lib/ai";

const interviewSchema = z.object({
  income: z.string().min(1),
  skills: z.string().min(1),
  hoursAvailable: z.number().min(0.5).max(24),
  commitments: z.string().min(1),
  distractions: z.string().min(1),
});

export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id: goalId } = context.params;
    
    const goal = await prisma.goal.findUnique({
      where: { id: goalId, userId },
      include: { vow: true }
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const parsed = interviewSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const data = parsed.data;

    const existingResponse = await prisma.interviewResponse.findFirst({
      where: { goalId }
    });

    if (existingResponse) {
      await prisma.interviewResponse.update({
        where: { id: existingResponse.id },
        data: {
          income: data.income,
          skills: data.skills,
          hoursAvailable: data.hoursAvailable,
          commitments: data.commitments,
          distractions: data.distractions,
        }
      });
    } else {
      await prisma.interviewResponse.create({
        data: {
          goalId,
          income: data.income,
          skills: data.skills,
          hoursAvailable: data.hoursAvailable,
          commitments: data.commitments,
          distractions: data.distractions,
        }
      });
    }

    // Generate hidden roadmap
    const roadmap = await generateRoadmap(
      goal.title,
      goal.statement || "",
      goal.deadline.toISOString(),
      goal.reason || "",
      goal.definitionOfSuccess || "",
      {
        income: data.income,
        skills: data.skills,
        hoursAvailable: data.hoursAvailable,
        commitments: data.commitments,
        distractions: data.distractions,
      }
    );

    const existingRoadmap = await prisma.roadmap.findFirst({
      where: { goalId }
    });

    if (existingRoadmap) {
      await prisma.roadmap.update({
        where: { id: existingRoadmap.id },
        data: {
          phases: roadmap.phases as unknown as object,
          rawPlan: roadmap.rawPlan,
          currentPhase: 0,
        }
      });
    } else {
      await prisma.roadmap.create({
        data: {
          goalId: goal.id,
          phases: roadmap.phases as unknown as object,
          rawPlan: roadmap.rawPlan,
          currentPhase: 0,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Interview error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
