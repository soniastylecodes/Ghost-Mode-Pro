import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Get the authenticated Appwrite user from the session cookie
    const { account } = createSessionClient();
    const appwriteUser = await account.get();

    if (!appwriteUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = appwriteUser.email.toLowerCase();
    const id = appwriteUser.$id;

    // 2. Check if the user already exists in Prisma by their Appwrite ID
    const existingById = await prisma.user.findUnique({ where: { id } });
    if (existingById) {
      return NextResponse.json({ id: existingById.id, email: existingById.email, role: existingById.role }, { status: 200 });
    }

    // 3. Check if the user exists in Prisma by email (migration / re-linking case)
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      if (existingByEmail.id !== id) {
        try {
          // Attempt to update the primary key ID to match the new Appwrite ID
          await prisma.user.update({
            where: { email },
            data: { id },
          });
        } catch (updateErr) {
          console.error("Failed to migrate existing user ID to Appwrite ID:", updateErr);
          return NextResponse.json(
            { error: "An account with this email already exists in the database under a different login method." },
            { status: 409 }
          );
        }
      }
      return NextResponse.json({ id, email, role: existingByEmail.role }, { status: 200 });
    }

    // 4. Create a new user in Prisma linked to the Appwrite User ID
    const user = await prisma.user.create({
      data: {
        id,
        email,
        name: appwriteUser.name || undefined,
        streak: { create: {} },
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    console.error("Register sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
