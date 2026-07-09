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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pushoverUserKey: true,
        createdAt: true,
        streak: true,
        goals: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdminId();

    const body = await req.json();
    const { role, goalStatus } = body;

    if (role) {
      if (role !== "user" && role !== "admin")
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });

      await prisma.user.update({
        where: { id: params.id },
        data: { role },
      });
    }

    if (goalStatus) {
      // Update the most recent active goal
      const goal = await prisma.goal.findFirst({
        where: { userId: params.id, status: "active" },
        orderBy: { createdAt: "desc" },
      });
      if (goal) {
        await prisma.goal.update({
          where: { id: goal.id },
          data: { status: goalStatus },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdminId();

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
