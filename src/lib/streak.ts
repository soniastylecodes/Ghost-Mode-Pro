import { prisma } from "./prisma";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(a: Date, b: Date): number {
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

// Record execution activity for the day and add focus minutes.
export async function recordActivity(userId: string, focusMinutes: number) {
  const streak = await prisma.streak.upsert({
    where: { userId },
    create: {
      userId,
      current: 1,
      longest: 1,
      lastActiveDate: new Date(),
      totalFocusMinutes: Math.max(0, focusMinutes),
    },
    update: {},
  });

  const now = new Date();
  let current = streak.current;

  if (!streak.lastActiveDate) {
    current = 1;
  } else if (isSameDay(streak.lastActiveDate, now)) {
    // Already counted today.
    current = streak.current || 1;
  } else {
    const gap = daysBetween(streak.lastActiveDate, now);
    current = gap === 1 ? streak.current + 1 : 1;
  }

  const longest = Math.max(streak.longest, current);

  await prisma.streak.update({
    where: { userId },
    data: {
      current,
      longest,
      lastActiveDate: now,
      totalFocusMinutes: { increment: Math.max(0, focusMinutes) },
    },
  });
}
