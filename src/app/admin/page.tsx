import { redirect } from "next/navigation";
import { requireAdminId } from "@/lib/session";
import AdminShell from "@/components/admin/AdminShell";
import AdminAnalyticsCards from "@/components/admin/AdminAnalyticsCards";

import { prisma } from "@/lib/prisma";

async function getAnalytics() {
  try {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyActiveUsers = await prisma.mission.groupBy({
      by: ["goalId"],
      where: { date: { gte: today } },
    });

    const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
    const avgStreak = streaks.length > 0 ? Math.round(streaks.reduce((sum, s) => sum + s.current, 0) / streaks.length) : 0;

    return {
      totalUsers,
      totalActiveGoals,
      dailyActiveUsers: dailyActiveUsers.length,
      totalPrimaryTasksCompleted,
      totalPrimaryTasksRejected,
      completionRate,
      avgStreak,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export const metadata = { title: "Admin Overview — Ghost Mode" };

export default async function AdminOverviewPage() {
  try {
    await requireAdminId();
  } catch {
    redirect("/admin/login");
  }

  const data = await getAnalytics();

  const metrics = data
    ? [
        { label: "Total Users", value: data.totalUsers, color: "blue" },
        { label: "Active Goals", value: data.totalActiveGoals, color: "purple" },
        { label: "Daily Active Users", value: data.dailyActiveUsers, color: "green" },
        {
          label: "Mission Completion",
          value: `${data.completionRate}%`,
          color: "orange",
        },
        { label: "Avg Streak", value: `🔥 ${data.avgStreak}`, color: "red" },
        {
          label: "Tasks Completed",
          value: data.totalPrimaryTasksCompleted,
          sub: `${data.totalPrimaryTasksRejected} rejected`,
        },
      ]
    : [];

  return (
    <AdminShell>
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-bone">Platform Overview</h1>
        <p className="text-slate mt-2">Live stats across all users and missions.</p>
      </div>
      {data ? (
        <AdminAnalyticsCards metrics={metrics} />
      ) : (
        <p className="text-red-400">Failed to load analytics.</p>
      )}
    </AdminShell>
  );
}
