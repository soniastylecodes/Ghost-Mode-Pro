import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushoverNotification } from "@/lib/pushover";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "ghost_mode_cron_secret";
    
    // Allow triggering via ?secret=... or Authorization header
    const url = new URL(req.url);
    const secretParams = url.searchParams.get("secret");

    if (authHeader !== `Bearer ${cronSecret}` && secretParams !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    // Find all users with an active goal
    const activeGoals = await prisma.goal.findMany({
      where: { status: "active" },
      include: { user: true }
    });

    if (activeGoals.length === 0) {
      return NextResponse.json({ message: "No active goals found" });
    }

    let sent = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const goal of activeGoals) {
      // Check if they already generated today's mission
      const mission = await prisma.mission.findFirst({
        where: { goalId: goal.id, date: { gte: today } }
      });

      let primaryTasks: any[] = [];
      if (mission) {
        primaryTasks = await prisma.primaryTask.findMany({
          where: { missionId: mission.id }
        });
      }

      let message = "";
      if (mission && primaryTasks.length > 0) {
        const task1 = primaryTasks[0].objective;
        message = `Wake up. Your first mission for today is: "${task1}". Get to work immediately.`;
      } else {
        message = `Wake up. You have not generated today's mission yet. Open Ghost Mode and get your tasks.`;
      }

      // Priority 1 will bypass quiet hours and vibrate loudly on the user's phone.
      await sendPushoverNotification(
        goal.userId,
        message,
        "Ghost Mode Morning Briefing",
        1, // Priority 1 (High)
        "https://ghost-mode-pro.appwrite.network/today"
      );
      sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Morning briefing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
