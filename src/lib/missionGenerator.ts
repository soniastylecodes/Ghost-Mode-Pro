import { prisma } from "@/lib/prisma";
import { generateMissions } from "@/lib/ai";
import { scheduleEscalation } from "@/lib/escalation";
import type { RoadmapPhase } from "@/lib/types";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function createMissionForGoal(goal: any, userId: string) {
  if (!goal || !goal.roadmap) {
    throw new Error("No active goal with a roadmap.");
  }

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
    return { mission: existing, phase };
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
    
    // @ts-ignore
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
        priority: Math.min(3, Math.max(1, Number(t.priority) || 3)),
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

  return { mission, phase };
}
