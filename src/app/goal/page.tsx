import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { GoalInterviewFlow } from "@/components/GoalInterviewFlow";

export default async function GoalPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  // If a goal already exists, go straight to today.
  const goal = await prisma.goal.findFirst({
    where: { userId, status: "active" },
  });
  if (goal) redirect("/today");

  return (
    <AppShell>
      <GoalInterviewFlow />
    </AppShell>
  );
}
