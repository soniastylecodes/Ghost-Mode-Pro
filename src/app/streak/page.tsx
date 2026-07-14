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

  const missions = await prisma.mission.findMany({
    where: { goal: { userId } },
    select: { date: true, status: true, primaryTasks: { select: { status: true } } }
  });

  const streak = user?.streak;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missionHistory = missions.map(m => {
    let status = m.status as "completed" | "failed" | "pending" | "partial";
    if (status === "pending" && m.date < today) {
      const tasks = (m as any).primaryTasks || [];
      const completedCount = tasks.filter((t: any) => t.status === "complete").length;
      if (completedCount > 0) {
        status = "partial";
      } else {
        status = "failed";
      }
    }
    return {
      date: m.date.toISOString(),
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
