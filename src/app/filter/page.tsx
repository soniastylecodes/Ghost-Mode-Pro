import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { DecisionFilter } from "@/components/DecisionFilter";

export default async function FilterPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
  });
  if (!goal) redirect("/goal");

  return (
    <AppShell>
      <DecisionFilter />
    </AppShell>
  );
}
