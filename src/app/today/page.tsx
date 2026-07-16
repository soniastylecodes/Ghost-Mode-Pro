import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { TodayView } from "@/components/TodayView";
import type { RoadmapPhase } from "@/lib/types";

function startOfToday(): Date {
  const d = new Date();
  // Shift to Nigeria time (UTC+1), truncate to midnight, then shift back to UTC
  d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  d.setUTCHours(d.getUTCHours() - 1);
  return d;
}

export default async function TodayPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
    include: { roadmap: true }
  });
  
  if (!goal) redirect("/goal");

  if (goal && (goal as any).roadmap && typeof (goal as any).roadmap === "string") {
    (goal as any).roadmap = await prisma.roadmap.findUnique({ where: { id: (goal as any).roadmap as string } });
  }

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
  if ((goal as any).roadmap?.phases) {
    if (Array.isArray((goal as any).roadmap.phases)) {
      phasesArray = (goal as any).roadmap.phases as unknown as RoadmapPhase[];
    } else if (typeof (goal as any).roadmap.phases === "string") {
      try {
        const parsed = JSON.parse((goal as any).roadmap.phases);
        if (Array.isArray(parsed)) phasesArray = parsed;
      } catch (e) {}
    }
  }
  const phase = phasesArray.length > 0 ? phasesArray[phaseIndex] : null;

  return (
    <AppShell>
      <TodayView initialMission={mission as any} initialGoal={goal as any} initialPhase={phase as any} />
    </AppShell>
  );
}
