import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// This endpoint could be called internally or securely by an admin/cron
const pushoverSchema = z.object({
  userId: z.string(),
  message: z.string(),
  title: z.string().optional(),
  priority: z.number().optional(), // 2 for Emergency
  url: z.string().optional(),
  retry: z.number().optional(),
  expire: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    // In a real app, this route would be protected by a cron secret or admin token.
    // We assume it's hit by Make.com or an internal service.
    const parsed = pushoverSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const data = parsed.data;
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { pushoverApiToken: true }
    });

    if (!user || !user.pushoverApiToken) {
      return NextResponse.json({ error: "User has no Pushover token" }, { status: 400 });
    }

    const appSettings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    const appToken = appSettings?.pushoverAppToken || process.env.PUSHOVER_APP_TOKEN;

    if (!appToken) {
      return NextResponse.json({ error: "System Pushover app token not configured" }, { status: 500 });
    }

    const body = new URLSearchParams({
      token: appToken,
      user: user.pushoverApiToken,
      message: data.message,
    });

    if (data.title) body.append("title", data.title);
    if (data.priority !== undefined) body.append("priority", data.priority.toString());
    if (data.url) body.append("url", data.url);
    if (data.priority === 2) {
      body.append("retry", (data.retry || 60).toString());
      body.append("expire", (data.expire || 3600).toString());
    }

    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      body,
    });

    const result = await res.json();
    
    // Log the notification
    await prisma.notificationLog.create({
      data: {
        userId: data.userId,
        message: data.message,
        title: data.title,
        priority: data.priority,
        status: res.ok ? "sent" : "failed",
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Pushover API error", details: result }, { status: res.status });
    }

    return NextResponse.json({ success: true, receipt: result.receipt }, { status: 200 });
  } catch (err) {
    console.error("Pushover error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
