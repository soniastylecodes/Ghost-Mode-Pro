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

    const logDate = date ? new Date(date) : new Date();

    // Check if an existing log exists for the same calendar date and same currency
    const startOfDay = new Date(logDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logCurrency = currency || "NGN";

    const existingLog = await prisma.revenueLog.findFirst({
      where: {
        userId,
        currency: logCurrency,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingLog) {
      // Top up the existing record
      const parsedAmount = parseFloat(amount);
      const parsedOriginal = originalAmount ? parseFloat(originalAmount) : null;
      
      const newAmount = existingLog.amount + parsedAmount;
      const newOriginalAmount = existingLog.originalAmount !== null || parsedOriginal !== null
        ? (existingLog.originalAmount ?? 0) + (parsedOriginal ?? parsedAmount)
        : null;

      const newDescription = existingLog.description.includes(description)
        ? existingLog.description
        : `${existingLog.description}, ${description}`;

      const newSource = source && existingLog.source && !existingLog.source.includes(source)
        ? `${existingLog.source}, ${source}`
        : (source || existingLog.source || null);

      const updatedLog = await prisma.revenueLog.update({
        where: { id: existingLog.id },
        data: {
          amount: newAmount,
          originalAmount: newOriginalAmount,
          description: newDescription,
          source: newSource,
        },
      });

      return NextResponse.json(updatedLog);
    }

    // Create a new record if it's the first log on this date for this currency
    const log = await prisma.revenueLog.create({
      data: {
        userId,
        amount: parseFloat(amount),
        description,
        source: source || null,
        currency: logCurrency,
        originalAmount: originalAmount ? parseFloat(originalAmount) : null,
        date: logDate,
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
    const { baseCurrency, targetNumber } = body;

    if (baseCurrency) {
      await prisma.user.update({
        where: { id: userId },
        data: { baseCurrency },
      });
    }

    if (targetNumber !== undefined) {
      const activeGoal = await prisma.goal.findFirst({
        where: { userId, status: "active" },
        orderBy: { createdAt: "desc" },
      });
      if (activeGoal) {
        await prisma.goal.update({
          where: { id: activeGoal.id },
          data: { targetNumber: parseFloat(targetNumber) },
        });
      }
    }

    return NextResponse.json({ success: true, baseCurrency });
  } catch (error) {
    console.error("[REVENUE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
