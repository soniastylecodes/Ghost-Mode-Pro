import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const schema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["pending", "complete"]),
});

export async function PATCH(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { taskId, status } = parsed.data;

    // Check ownership
    const task = await prisma.secondaryTask.findFirst({
      where: {
        id: taskId,
        mission: {
          goal: {
            userId,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Secondary task not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.secondaryTask.update({
      where: { id: taskId },
      data: { status },
    });

    return NextResponse.json({ task: updated });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("secondary task toggle error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
