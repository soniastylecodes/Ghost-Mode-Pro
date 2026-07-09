import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { status, nextFollowUpDate, notes } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (nextFollowUpDate !== undefined) data.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    if (notes !== undefined) data.notes = notes;

    const lead = await prisma.lead.update({
      where: {
        id: params.id,
        userId
      },
      data
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[LEADS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    await prisma.lead.delete({
      where: {
        id: params.id,
        userId
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[LEADS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
