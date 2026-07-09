import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const leadSchema = z.object({
  name: z.string().min(1),
  source: z.string().optional(),
  status: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const leads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ leads });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = leadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    
    const lead = await prisma.lead.create({
      data: {
        userId,
        name: parsed.data.name,
        source: parsed.data.source,
        status: parsed.data.status || "new",
        nextFollowUpDate: parsed.data.nextFollowUpDate ? new Date(parsed.data.nextFollowUpDate) : null,
        notes: parsed.data.notes,
      }
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
