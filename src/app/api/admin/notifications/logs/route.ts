export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    await requireAdminId();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 50;

    const logs = await prisma.notificationLog.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.notificationLog.count({
      where: {
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json({ logs, total, page });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
