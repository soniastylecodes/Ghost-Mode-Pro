export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
      include: { reflection: true }
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

    // Fetch the most recent mission before today to assess yesterday's progress.
    const lastMission = await prisma.mission.findFirst({
      where: { goalId: goal.id },
      orderBy: { date: "desc" }
    });

    let priorSummary = "";
    if (lastMission) {
      // Manually fetch relations since CollectionAdapter ignores 'include'
      const primaryList = await prisma.primaryTask.findMany({ where: { missionId: lastMission.id } });
      const reflection = await prisma.reflection.findFirst({ where: { missionId: lastMission.id } });

      const completedPrimary = primaryList.filter(t => t.status === "complete");
      const missedPrimary = primaryList.filter(t => t.status !== "complete");
      
      // @ts-ignore - Suppress IDE caching error for new schema fields
      const aiFeedbackContext = reflection?.aiFeedback
        // @ts-ignore
        ? `\nAI Feedback Given Yesterday: "${reflection.aiFeedback}"\nAI Grade: ${reflection.aiGrade}/100`
        : "";

      priorSummary = `Last mission was on ${lastMission.date.toLocaleDateString()}.
Status: ${lastMission.status}.
Primary tasks completed: ${completedPrimary.length}/${primaryList.length}.
${completedPrimary.length > 0 ? `Completed objectives: ${completedPrimary.map(t => `"${t.objective}"`).join(", ")}.` : ""}
${missedPrimary.length > 0 ? `MISSED objectives that need rollover/re-adaptation: ${missedPrimary.map(t => `"${t.objective}"`).join(", ")}.` : ""}${aiFeedbackContext}
Please adjust today's missions accordingly (e.g. carry over/re-adapt missed tasks if crucial, enforce the AI feedback given, or scale intensity down if they struggled).`;
    } else {
      priorSummary = "This is day one. No prior missions.";
    }

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
      },
    });

    for (const t of result.primaryMissions) {
      await prisma.primaryTask.create({
        data: {
          missionId: mission.id,
          objective: t.objective,
          priority: t.priority,
          estDuration: t.estDuration,
          expectedOutcome: t.expectedOutcome,
          proofTypeRequired: t.proofTypeRequired,
        }
      });
    }

    for (const t of result.secondaryTasks) {
      await prisma.secondaryTask.create({
        data: {
          missionId: mission.id,
          objective: t.objective,
        }
      });
    }

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
