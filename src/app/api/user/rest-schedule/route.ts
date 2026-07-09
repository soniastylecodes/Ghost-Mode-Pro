import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const restScheduleSchema = z.object({
  wakeTime: z.string().optional(),
  sleepTime: z.string().optional(),
  napWindows: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = restScheduleSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        wakeTime: parsed.data.wakeTime,
        sleepTime: parsed.data.sleepTime,
        napWindows: parsed.data.napWindows ? JSON.stringify(parsed.data.napWindows) : null,
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
