import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.secondaryTask.deleteMany({});
    await prisma.primaryTask.deleteMany({});
    await prisma.mission.deleteMany({});
    return NextResponse.json({ success: true, message: "Tasks cleared" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to clear tasks" }, { status: 500 });
  }
}
