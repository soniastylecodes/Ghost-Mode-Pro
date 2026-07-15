import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
      console.warn("WEBHOOK_SECRET not configured on the server.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, title, company, link, salary, source } = body;

    if (!userId || !title || !company) {
      return NextResponse.json({ error: "Missing required fields: userId, title, company" }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        userId,
        title,
        company,
        link,
        salary,
        source: source || "n8n",
        status: "new",
      },
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
