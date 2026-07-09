export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";

export async function GET() {
  try {
    await requireAdminId();

    const [
      totalUsers,
      totalActiveGoals,
      totalMissions,
      completedMissions,
      totalPrimaryTasksCompleted,
      totalPrimaryTasksRejected,
      streaks,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "user" } }),
      prisma.goal.count({ where: { status: "active" } }),
      prisma.mission.count(),
      prisma.mission.count({ where: { status: "complete" } }),
      prisma.primaryTask.count({ where: { status: "complete" } }),
      prisma.primaryTask.count({ where: { status: "rejected" } }),
      prisma.streak.findMany({ select: { current: true } }),
    ]);

    // Daily active users: users with a mission created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyActiveUsers = await prisma.mission.groupBy({
      by: ["goalId"],
      where: { date: { gte: today } },
    });

    const completionRate =
      totalMissions > 0
        ? Math.round((completedMissions / totalMissions) * 100)
        : 0;

    const avgStreak =
      streaks.length > 0
        ? Math.round(
            streaks.reduce((sum, s) => sum + s.current, 0) / streaks.length
          )
        : 0;

    return NextResponse.json({
      totalUsers,
      totalActiveGoals,
      dailyActiveUsers: dailyActiveUsers.length,
      totalPrimaryTasksCompleted,
      totalPrimaryTasksRejected,
      completionRate,
      avgStreak,
    });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
