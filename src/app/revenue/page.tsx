import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { RevenueClient } from "./RevenueClient";

export default async function RevenuePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const revenueLogs = await prisma.revenueLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });

  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  // Convert Date objects to ISO strings for client component serialization
  const serializedLogs = revenueLogs.map(log => ({
    ...log,
    date: log.date.toISOString(),
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  }));

  return (
    <AppShell>
      <RevenueClient 
        initialLogs={serializedLogs} 
        initialTarget={goal?.targetNumber || 0} 
        initialCurrency={user?.baseCurrency || "NGN"} 
      />
    </AppShell>
  );
}
