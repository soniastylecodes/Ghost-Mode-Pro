import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const roleModelSchema = z.object({
  name: z.string().min(1),
  principleToLearn: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const roleModels = await prisma.roleModel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ roleModels });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = roleModelSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    
    const roleModel = await prisma.roleModel.create({
      data: {
        userId,
        name: parsed.data.name,
        principleToLearn: parsed.data.principleToLearn,
        notes: parsed.data.notes,
      }
    });

    return NextResponse.json({ roleModel }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
