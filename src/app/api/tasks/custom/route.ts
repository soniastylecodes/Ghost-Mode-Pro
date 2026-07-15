import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { missionId, objective, type, estDuration, expectedOutcome } = await req.json();

    if (!missionId || !objective || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify mission belongs to user
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { goal: true }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const goalId = typeof (mission as any).goal === "string" ? (mission as any).goal : mission.goalId;
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (type === "primary") {
      // Determine priority (default to end of primary tasks)
      const existingPrimaryCount = await prisma.primaryTask.count({
        where: { missionId },
      });

      const primaryTask = await prisma.primaryTask.create({
        data: {
          missionId,
          objective,
          priority: existingPrimaryCount + 1,
          estDuration: Number(estDuration) || 60,
          expectedOutcome: expectedOutcome || "A verifiable outcome",
          proofTypeRequired: "text", // allow extending this later
        },
      });
      return NextResponse.json({ success: true, task: primaryTask });
    } else {
      const secondaryTask = await prisma.secondaryTask.create({
        data: {
          missionId,
          objective,
        },
      });
      return NextResponse.json({ success: true, task: secondaryTask });
    }
  } catch (error) {
    console.error("Custom task error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
