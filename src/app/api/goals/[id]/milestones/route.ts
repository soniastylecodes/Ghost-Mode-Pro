import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const { id } = params;

    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const { milestones } = await req.json();

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        outcomeThreads: JSON.stringify(milestones)
      }
    });

    return NextResponse.json({ success: true, outcomeThreads: updated.outcomeThreads });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
