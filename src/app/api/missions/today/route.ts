export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { createMissionForGoal } from "@/lib/missionGenerator";
import type { RoadmapPhase } from "@/lib/types";

function startOfToday(): Date {
  const d = new Date();
  // Shift to Nigeria time (UTC+1), truncate to midnight, then shift back to UTC
  d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  d.setUTCHours(d.getUTCHours() - 1);
  return d;
}

async function getActiveGoal(userId: string) {
  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
    include: { roadmap: true, interviewResponse: true }
  });

  if (!goal) return null;

  // Appwrite relation adapter shim: manually fetch relation objects if returned as IDs
  if ((goal as any).roadmap && typeof (goal as any).roadmap === "string") {
    (goal as any).roadmap = await prisma.roadmap.findUnique({ where: { id: (goal as any).roadmap as string } });
  }
  if ((goal as any).interviewResponse && typeof (goal as any).interviewResponse === "string") {
    (goal as any).interviewResponse = await prisma.interviewResponse.findUnique({ where: { id: (goal as any).interviewResponse as string } });
  }

  return goal;
}

// GET -> today's mission (do not auto-generate; just read).
export async function GET() {
  try {
    const userId = await requireUserId();
    const goal = await getActiveGoal(userId);
    if (!goal)
      return NextResponse.json({ mission: null, goal: null });

    const mission = await prisma.mission.findFirst({
      where: { goalId: goal.id, date: { gte: startOfToday() } },
      orderBy: { createdAt: "desc" },
      include: { reflection: true }
    });

    if (mission) {
      const pTasks = await prisma.primaryTask.findMany({
        where: { missionId: mission.id },
      });
      for (const pt of pTasks) {
        (pt as any).proofs = await prisma.proof.findMany({ where: { primaryTaskId: pt.id } });
      }
      (mission as any).primaryTasks = pTasks;
      (mission as any).secondaryTasks = await prisma.secondaryTask.findMany({
        where: { missionId: mission.id },
      });
    }

    const phaseIndex = mission?.phaseIndex ?? 0;
    let phasesArray: RoadmapPhase[] = [];
    if (goal.roadmap?.phases) {
      if (Array.isArray(goal.roadmap.phases)) {
        phasesArray = goal.roadmap.phases as unknown as RoadmapPhase[];
      } else if (typeof goal.roadmap.phases === "string") {
        try {
          const parsed = JSON.parse(goal.roadmap.phases);
          if (Array.isArray(parsed)) {
            phasesArray = parsed;
          }
        } catch (e) {}
      }
    }
    const phase = phasesArray.length > 0 ? phasesArray[phaseIndex] : null;

    return NextResponse.json({
      mission,
      goal: { id: goal.id, title: goal.title, deadline: goal.deadline },
      phase,
    });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST -> generate today's mission (idempotent for the day).
export async function POST() {
  try {
    const userId = await requireUserId();
    const goal = await getActiveGoal(userId);
    
    try {
      const { mission, phase } = await createMissionForGoal(goal, userId);
      return NextResponse.json({ mission, phase }, { status: 201 });
    } catch (e: any) {
      if (e.message === "No active goal with a roadmap.") {
        return NextResponse.json(
          { error: e.message },
          { status: 400 }
        );
      }
      throw e;
    }
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("generate mission error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
