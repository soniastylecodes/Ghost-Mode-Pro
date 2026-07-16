import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushoverNotification } from "@/lib/pushover";
import { createMissionForGoal } from "@/lib/missionGenerator";

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
      include: { user: true, roadmap: true, interviewResponse: true }
    });

    if (activeGoals.length === 0) {
      return NextResponse.json({ message: "No active goals found" });
    }

    let sent = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const goal of activeGoals) {
      try {
        const { mission } = await createMissionForGoal(goal, goal.userId);
        
        const primaryTasks = (mission as any).primaryTasks || [];

        let message = "";
        if (primaryTasks.length > 0) {
          const task1 = primaryTasks[0].objective;
          message = `Wake up. Your first mission for today is: "${task1}". Get to work immediately.`;
        } else {
          message = `Wake up. Your mission for today is ready. Open Ghost Mode and get your tasks.`;
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
      } catch (err: any) {
        console.error(`Failed to auto-generate morning mission for goal ${goal.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error("Morning briefing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
