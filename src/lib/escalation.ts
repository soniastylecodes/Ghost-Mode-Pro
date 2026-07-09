import { prisma } from "./prisma";
import { sendPushoverNotification } from "./pushover";

export async function scheduleEscalation(
  userId: string,
  missionId: string,
  deadline: Date
) {
  try {
    // Clear any existing schedules for this mission
    await prisma.pushSchedule.updateMany({
      where: { missionId, status: "pending" },
      data: { status: "cancelled" },
    });

    const deadlineTime = deadline.getTime();

    // Create 4 steps
    const schedules = [
      {
        userId,
        missionId,
        step: "deadline",
        scheduledTime: new Date(deadlineTime),
        status: "pending",
      },
      {
        userId,
        missionId,
        step: "30min",
        scheduledTime: new Date(deadlineTime + 30 * 60 * 1000),
        status: "pending",
      },
      {
        userId,
        missionId,
        step: "60min",
        scheduledTime: new Date(deadlineTime + 60 * 60 * 1000),
        status: "pending",
      },
      {
        userId,
        missionId,
        step: "final",
        // close of day's window: 11:59 PM on the deadline day
        scheduledTime: (() => {
          const d = new Date(deadlineTime);
          d.setHours(23, 59, 0, 0);
          return d;
        })(),
        status: "pending",
      },
    ];

    await prisma.pushSchedule.createMany({
      data: schedules,
    });
  } catch (err) {
    console.error("Failed to schedule escalation:", err);
  }
}

export async function cancelEscalation(missionId: string) {
  try {
    await prisma.pushSchedule.updateMany({
      where: { missionId, status: "pending" },
      data: { status: "cancelled" },
    });
  } catch (err) {
    console.error("Failed to cancel escalation:", err);
  }
}

const STEP_MESSAGES: Record<string, string> = {
  deadline: "Your deadline has passed. Submit your proof now.",
  "30min": "You are 30 minutes late. No excuses. Upload your proof.",
  "60min": "60 minutes overdue. You are diluting your momentum. Prove the work.",
  final: "Window closed. Today's mission is failed. Streak broken.",
};

const STEP_PRIORITIES: Record<string, number> = {
  deadline: 0,
  "30min": 1,
  "60min": 1,
  final: 2, // Critical / emergency
};

export async function processEscalations() {
  const now = new Date();
  try {
    // Find all pending schedules that are due
    const dueSchedules = await prisma.pushSchedule.findMany({
      where: {
        status: "pending",
        scheduledTime: { lte: now },
      },
    });

    for (const schedule of dueSchedules) {
      const { id, userId, missionId, step } = schedule;

      // Check if all primary tasks are complete (fetched separately)
      const primaryTasks = await prisma.primaryTask.findMany({
        where: { missionId },
        select: { status: true },
      });

      const allComplete =
        primaryTasks.length > 0 &&
        primaryTasks.every((t) => t.status === "complete");

      if (allComplete) {
        // Mission already complete — cancel this schedule and move on
        await prisma.pushSchedule.update({
          where: { id },
          data: { status: "cancelled" },
        });
        continue;
      }

      // Send the nudge
      const msg = STEP_MESSAGES[step] || "Submit your mission proof.";
      const priority = STEP_PRIORITIES[step] ?? 0;

      await sendPushoverNotification(
        userId,
        msg,
        "Ghost Mode Escalation",
        priority
      );

      // Mark this schedule as sent
      await prisma.pushSchedule.update({
        where: { id },
        data: { status: "sent" },
      });

      // Special action for final step: reset streak, fail mission, reject incomplete tasks
      if (step === "final") {
        await prisma.streak.update({
          where: { userId },
          data: { current: 0 },
        });

        await prisma.mission.update({
          where: { id: missionId },
          data: { status: "failed" },
        });

        await prisma.primaryTask.updateMany({
          where: {
            missionId,
            status: { not: "complete" },
          },
          data: { status: "rejected" },
        });
      }
    }
  } catch (err) {
    console.error("Failed to process escalations:", err);
  }
}
