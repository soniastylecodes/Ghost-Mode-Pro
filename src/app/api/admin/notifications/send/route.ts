import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/session";
import { sendPushoverNotification } from "@/lib/pushover";

export async function POST(req: NextRequest) {
  try {
    await requireAdminId();

    const { userId, message, title, priority } = await req.json();

    if (!userId || !message)
      return NextResponse.json(
        { error: "userId and message are required." },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    await sendPushoverNotification(
      userId,
      message,
      title ?? "Ghost Mode — Admin",
      priority ?? 0
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
