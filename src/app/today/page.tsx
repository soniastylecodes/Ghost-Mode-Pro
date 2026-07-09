import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { TodayView } from "@/components/TodayView";

export default async function TodayPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (!goal) redirect("/goal");

  return (
    <AppShell>
      <TodayView />
    </AppShell>
  );
}
