export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { generateMissions } from "@/lib/ai";
import { scheduleEscalation } from "@/lib/escalation";
import type { RoadmapPhase } from "@/lib/types";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
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
    const phase = goal.roadmap?.phases ? (goal.roadmap.phases as unknown as RoadmapPhase[])[phaseIndex] : null;

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
    if (!goal || !goal.roadmap)
      return NextResponse.json(
        { error: "No active goal with a roadmap." },
        { status: 400 }
      );

    const phases = Array.isArray(goal.roadmap.phases) ? goal.roadmap.phases as unknown as RoadmapPhase[] : [];
    const phaseIndex = Math.max(0, Math.min(goal.roadmap.currentPhase || 0, phases.length > 0 ? phases.length - 1 : 0));
    const phase = phases[phaseIndex] || { name: "Execution", objective: "Advance towards your goal.", order: 0, milestones: [] };

    // Return existing mission if already generated today.
    const existing = await prisma.mission.findFirst({
      where: { goalId: goal.id, date: { gte: startOfToday() } },
    });
    if (existing) {
      (existing as any).primaryTasks = await prisma.primaryTask.findMany({
        where: { missionId: existing.id },
      });
      (existing as any).secondaryTasks = await prisma.secondaryTask.findMany({
        where: { missionId: existing.id },
      });
      return NextResponse.json({ mission: existing, phase });
    }

    // Build a short prior-progress summary from completed tasks.
    const completed = await prisma.primaryTask.count({
      where: { mission: { goalId: goal.id }, status: "complete" },
    });
    const priorSummary =
      completed > 0
        ? `${completed} primary tasks completed so far. Keep advancing the current phase.`
        : "This is day one.";

    // Fetch Role Models to inject their principles
    const roleModels = await prisma.roleModel.findMany({ where: { userId } });
    const roleModelsContext = roleModels.length > 0 
      ? roleModels.map(rm => `${rm.name}: ${rm.principleToLearn}`).join("; ")
      : undefined;

    const result = await generateMissions(
      goal.title,
      phase,
      goal.interviewResponse?.hoursAvailable ?? 4,
      priorSummary,
      undefined,
      undefined,
      roleModelsContext
    );

    // Set today's deadline from AppSettings (default 22 = 10 PM).
    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    const deadlineHour = settings?.missionDeadlineHour ?? 22;
    const missionDeadline = new Date();
    missionDeadline.setHours(deadlineHour, 0, 0, 0);

    const mission = await prisma.mission.create({
      data: {
        goalId: goal.id,
        phaseIndex,
        summary: result.summary,
        date: startOfToday(),
        deadline: missionDeadline,
        primaryTasks: {
          create: result.primaryMissions.map((t) => ({
            objective: t.objective,
            priority: t.priority,
            estDuration: t.estDuration,
            expectedOutcome: t.expectedOutcome,
            proofTypeRequired: t.proofTypeRequired,
          })),
        },
        secondaryTasks: {
          create: result.secondaryTasks.map((t) => ({
            objective: t.objective,
          })),
        },
      },
    });

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

    // Schedule escalation path
    await scheduleEscalation(userId, mission.id, missionDeadline);

    return NextResponse.json({ mission, phase }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("generate mission error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
