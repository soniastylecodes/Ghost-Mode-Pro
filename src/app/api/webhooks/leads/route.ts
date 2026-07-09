import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// To use this, send a POST request with the header:
// Authorization: Bearer ghostmode-make-secret-token

export async function POST(req: Request) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get("authorization");
    const secret = process.env.MAKE_WEBHOOK_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse Payload
    const body = await req.json();
    const { name, source, notes } = body;

    if (!name) {
      return new NextResponse("Missing required field: name", { status: 400 });
    }

    // 3. Find the first user (or admin) to attach the lead to
    // Since Ghost Mode is an MVP, we just assign to the primary user
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!firstUser) {
      return new NextResponse("No users found in database", { status: 500 });
    }

    // 4. Create the Lead
    const lead = await prisma.lead.create({
      data: {
        userId: firstUser.id,
        name,
        source: source || "Make.com Automation",
        notes: notes || "Automatically imported from Make.com",
        status: "new",
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[WEBHOOK_LEADS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
