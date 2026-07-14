import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { CalendarGrid } from "@/components/CalendarGrid";

export default async function StreakPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { streak: true }
  });

  const goals = await prisma.goal.findMany({ where: { userId } });
  const goalIds = goals.map(g => g.id);
  
  const missions = goalIds.length > 0 ? await prisma.mission.findMany({
    where: { goalId: { in: goalIds } },
  }) : [];

  const missionIds = missions.map(m => m.id);
  const primaryTasks = missionIds.length > 0 ? await prisma.primaryTask.findMany({
    where: { missionId: { in: missionIds } },
  }) : [];

  // Group tasks by missionId
  const tasksByMission: Record<string, any[]> = {};
  for (const task of primaryTasks) {
    if (!tasksByMission[task.missionId]) {
      tasksByMission[task.missionId] = [];
    }
    tasksByMission[task.missionId].push(task);
  }

  const streak = user?.streak;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missionHistory = missions.map(m => {
    let status = m.status as "completed" | "failed" | "pending" | "partial";
    const missionDate = m.date || new Date(m.createdAt); // Fallback to createdAt if date is missing

    if (status === "pending" && missionDate < today) {
      const tasks = tasksByMission[m.id] || [];
      const completedCount = tasks.filter((t: any) => t.status === "complete").length;
      if (completedCount > 0) {
        status = "partial";
      } else {
        status = "failed";
      }
    }
    return {
      date: missionDate.toISOString(),
      status
    };
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-bone">Streak Calendar</h1>
          <p className="text-slate mt-2">Don&apos;t break the chain.</p>
        </div>
        
        <CalendarGrid 
          missions={missionHistory}
          currentStreak={streak?.current || 0}
          longestStreak={streak?.longest || 0}
        />
      </div>
    </AppShell>
  );
}
