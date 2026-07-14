import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const revenueLogs = await prisma.revenueLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });

    const goal = await prisma.goal.findFirst({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      logs: revenueLogs,
      targetNumber: goal?.targetNumber || 0,
      baseCurrency: user?.baseCurrency || "NGN",
    });
  } catch (error) {
    console.error("[REVENUE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { amount, description, date, source, currency, originalAmount } = body;

    if (amount === undefined || amount === null || !description) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const log = await prisma.revenueLog.create({
      data: {
        userId,
        amount: parseFloat(amount),
        description,
        source: source || null,
        currency: currency || "NGN",
        originalAmount: originalAmount ? parseFloat(originalAmount) : null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("[REVENUE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { baseCurrency } = body;

    if (!baseCurrency) {
      return new NextResponse("Missing baseCurrency", { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { baseCurrency },
    });

    return NextResponse.json({ success: true, baseCurrency });
  } catch (error) {
    console.error("[REVENUE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
