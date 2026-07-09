import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
  });
  if (!goal) redirect("/goal");

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
