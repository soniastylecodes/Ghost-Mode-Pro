import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";
import type { DashboardMetrics } from "@/lib/types";

export default async function DashboardPage() {
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

  const streak = await prisma.streak.findUnique({ where: { userId } });

  // Days remaining until deadline.
  const now = new Date();
  const deadlineDate = goal.deadline ? new Date(goal.deadline) : new Date();
  const msLeft = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msLeft / 86400000));

  // Mission progress
  let phasesCount = 1;
  if (goal.roadmap?.phases) {
    if (Array.isArray(goal.roadmap.phases)) {
      phasesCount = goal.roadmap.phases.length;
    } else if (typeof goal.roadmap.phases === "string") {
      try {
        const parsed = JSON.parse(goal.roadmap.phases);
        if (Array.isArray(parsed)) phasesCount = parsed.length;
      } catch (e) {}
    }
  }
  const phaseProgress = goal.roadmap
    ? (goal.roadmap.currentPhase / Math.max(1, phasesCount)) * 100
    : 0;

  const missions = await prisma.mission.findMany({
    where: { goalId: goal.id }
  });
  const missionIds = missions.map(m => m.id);

  const totalTasks = missionIds.length > 0 ? await prisma.primaryTask.count({
    where: { missionId: { in: missionIds } },
  }) : 0;
  const completedTasks = missionIds.length > 0 ? await prisma.primaryTask.count({
    where: { missionId: { in: missionIds }, status: "complete" },
  }) : 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const missionProgress = Math.min(
    100,
    Math.round(phaseProgress * 0.6 + taskProgress * 0.4)
  );

  const currentStreak = streak?.current ?? 0;
  const streakPoints = Math.min(40, currentStreak * 10);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalRecentTasks = missionIds.length > 0 ? await prisma.primaryTask.count({
    where: { missionId: { in: missionIds }, createdAt: { gte: sevenDaysAgo } },
  }) : 0;
  const completedRecentTasks = missionIds.length > 0 ? await prisma.primaryTask.count({
    where: { missionId: { in: missionIds }, status: "complete", createdAt: { gte: sevenDaysAgo } },
  }) : 0;

  const recentCompletionRate = totalRecentTasks > 0 ? (completedRecentTasks / totalRecentTasks) : 1;
  const taskPoints = Math.round(recentCompletionRate * 60);
  const momentumScore = streakPoints + taskPoints;

  const metrics: DashboardMetrics = {
    daysRemaining,
    missionProgress,
    currentStreak,
    focusHours: Math.round(((streak?.totalFocusMinutes ?? 0) / 60) * 10) / 10,
    momentumScore,
  };

  let parsedThreads = [];
  if (goal.outcomeThreads) {
    try {
      parsedThreads = typeof goal.outcomeThreads === "string" ? JSON.parse(goal.outcomeThreads) : goal.outcomeThreads;
    } catch (e) {
      console.error("Failed to parse outcomeThreads", e);
    }
  }

  const goalLite = { 
    id: goal.id, 
    title: goal.title, 
    deadline: deadlineDate.toISOString(), 
    outcomeThreads: parsedThreads 
  };

  return (
    <AppShell>
      <Dashboard initialMetrics={metrics} initialGoal={goalLite} />
    </AppShell>
  );
}
