import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    await prisma.revenueLog.deleteMany({
      where: {
        id: params.id,
        userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[REVENUE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
