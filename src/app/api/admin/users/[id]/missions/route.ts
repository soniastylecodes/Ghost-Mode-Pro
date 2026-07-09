export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdminId();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { goals: { select: { id: true } } },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const goalIds = user.goals.map((g) => g.id);

    const missions = await prisma.mission.findMany({
      where: { goalId: { in: goalIds } },
      orderBy: { date: "desc" },
      include: {
        primaryTasks: {
          include: { proofs: true },
        },
        secondaryTasks: true,
      },
    });

    return NextResponse.json({ missions });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
