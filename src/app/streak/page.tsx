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
    select: { date: true, status: true }
  });

  const streak = user?.streak;

  const missionHistory = missions.map(m => ({
    date: m.date.toISOString(),
    status: m.status as "completed" | "failed" | "pending"
  }));

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
