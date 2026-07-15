import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateRoleModelAI } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, principleToLearn, notes, imageUrl } = body;

    if (!name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Call AI to generate or enhance principles and notes
    const aiData = await generateRoleModelAI(name, principleToLearn);

    const finalPrinciple = aiData.principleToLearn || principleToLearn || "Excellence";
    const finalNotes = aiData.notes || notes || "";

    const roleModel = await prisma.roleModel.create({
      data: {
        userId,
        name,
        principleToLearn: finalPrinciple,
        notes: finalNotes,
        imageUrl
      }
    });

    return NextResponse.json(roleModel);
  } catch (error: any) {
    console.error("[ROLE_MODELS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
