export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import type { DashboardMetrics } from "@/lib/types";

// GET -> dashboard metrics for the active goal.
export async function GET() {
  try {
    const userId = await requireUserId();

    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      include: { roadmap: true },
    });

    const streak = await prisma.streak.findUnique({ where: { userId } });

    if (!goal) {
      const empty: DashboardMetrics = {
        daysRemaining: 0,
        missionProgress: 0,
        currentStreak: streak?.current ?? 0,
        focusHours: Math.round(((streak?.totalFocusMinutes ?? 0) / 60) * 10) / 10,
        momentumScore: 0,
      };
      return NextResponse.json({ metrics: empty, goal: null });
    }

    // Days remaining until deadline.
    const now = new Date();
    const msLeft = goal.deadline.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / 86400000));

    // Mission progress = phase progression + completed task ratio blended.
    const phases =
      (goal.roadmap?.phases as unknown as unknown[] | undefined)?.length ?? 1;
    const phaseProgress = goal.roadmap
      ? (goal.roadmap.currentPhase / Math.max(1, phases)) * 100
      : 0;

    const totalTasks = await prisma.primaryTask.count({
      where: { mission: { goalId: goal.id } },
    });
    const completedTasks = await prisma.primaryTask.count({
      where: { mission: { goalId: goal.id }, status: "complete" },
    });
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const missionProgress = Math.min(
      100,
      Math.round(phaseProgress * 0.6 + taskProgress * 0.4)
    );

    // Calculate Momentum Score (0-100)
    // 1. Streak bonus (10 points per streak day, up to 40 pts)
    const currentStreak = streak?.current ?? 0;
    const streakPoints = Math.min(40, currentStreak * 10);

    // 2. Recent task completion rate (last 7 days, up to 60 pts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalRecentTasks = await prisma.primaryTask.count({
      where: {
        mission: { goalId: goal.id },
        createdAt: { gte: sevenDaysAgo },
      },
    });
    const completedRecentTasks = await prisma.primaryTask.count({
      where: {
        mission: { goalId: goal.id },
        status: "complete",
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const recentCompletionRate = totalRecentTasks > 0 ? (completedRecentTasks / totalRecentTasks) : 1;
    const taskPoints = Math.round(recentCompletionRate * 60);

    const momentumScore = streakPoints + taskPoints;

    const metrics: DashboardMetrics = {
      daysRemaining,
      missionProgress,
      currentStreak,
      focusHours:
        Math.round(((streak?.totalFocusMinutes ?? 0) / 60) * 10) / 10,
      momentumScore,
    };

    return NextResponse.json({
      metrics,
      goal: { id: goal.id, title: goal.title, deadline: goal.deadline },
    });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
