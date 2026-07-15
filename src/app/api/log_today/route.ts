import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const goal = await prisma.goal.findFirst({
      where: { status: "active" },
      orderBy: { createdAt: "desc" }
    });

    if (!goal) return NextResponse.json({ error: "No active goal" });

    const mission = await prisma.mission.findFirst({
      where: { goalId: goal.id },
      orderBy: { createdAt: "desc" }
    });

    if (!mission) return NextResponse.json({ error: "No mission" });

    const existingReflection = await prisma.dailyReflection.findUnique({
      where: { missionId: mission.id }
    });

    const data = {
      accomplished: "I did quite alot coming from someone who procastinates, i was able to clear some of my goals and i feel tommorow will be better.",
      blockers: "Top issue was bad network, also since i didnt sleep early i couldnt wake up earliy so it affected my tasks.",
      focusRating: 3,
      adjustments: "Learn proper communication and also learn to push my self to do the work no matter how it is going."
    };

    if (existingReflection) {
      await prisma.dailyReflection.update({
        where: { missionId: mission.id },
        data
      });
    } else {
      await prisma.dailyReflection.create({
        data: {
          missionId: mission.id,
          ...data
        }
      });
    }

    await prisma.mission.update({
      where: { id: mission.id },
      data: { status: "partial" }
    });

    return NextResponse.json({ success: true, message: "Reflection logged successfully and mission ended!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
