import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { wakeTime, sleepTime, napWindows } = body;

    const data: any = {};
    if (wakeTime !== undefined) data.wakeTime = wakeTime;
    if (sleepTime !== undefined) data.sleepTime = sleepTime;
    if (napWindows !== undefined) {
      data.napWindows = Array.isArray(napWindows) ? JSON.stringify(napWindows) : napWindows;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[REST_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
