export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";

export async function GET() {
  try {
    await requireAdminId();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        goals: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, title: true, status: true, deadline: true },
        },
        streak: {
          select: { current: true, longest: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
