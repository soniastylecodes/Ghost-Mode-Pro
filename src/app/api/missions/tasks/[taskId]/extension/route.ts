import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const extensionSchema = z.object({
  additionalMinutes: z.number().min(1),
});

export async function POST(req: Request, context: { params: { taskId: string } }) {
  try {
    const userId = await requireUserId();
    const taskId = context.params.taskId;

    const task = await prisma.primaryTask.findUnique({
      where: { id: taskId },
      include: { mission: { include: { goal: true } } }
    });

    if (!task || task.mission.goal.userId !== userId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const parsed = extensionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    await prisma.primaryTask.update({
      where: { id: taskId },
      data: {
        extensionRequested: true,
        extensionGrantedMinutes: parsed.data.additionalMinutes,
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("Extension error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
