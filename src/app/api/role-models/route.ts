import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, principleToLearn, notes, imageUrl } = body;

    if (!name || !principleToLearn) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const roleModel = await prisma.roleModel.create({
      data: {
        userId,
        name,
        principleToLearn,
        notes,
        imageUrl
      }
    });

    return NextResponse.json(roleModel);
  } catch (error) {
    console.error("[ROLE_MODELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
