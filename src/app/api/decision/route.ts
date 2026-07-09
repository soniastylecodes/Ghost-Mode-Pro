import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { decisionFilter } from "@/lib/ai";

const schema = z.object({
  request: z.string().min(2).max(1000),
});

// POST -> Ruthless Decision Filter for an off-mission request.
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!goal)
      return NextResponse.json({ error: "No active goal." }, { status: 400 });

    const result = await decisionFilter(
      goal.title,
      goal.deadline.toISOString(),
      parsed.data.request
    );

    return NextResponse.json(result);
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("decision error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
