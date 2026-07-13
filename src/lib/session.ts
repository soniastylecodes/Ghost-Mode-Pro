import { cookies } from "next/headers";
import { createSessionClient } from "./appwrite";
import { prisma } from "./prisma";

// Returns the current user's id or null.
export async function getCurrentUserId(): Promise<string | null> {
  // Access cookies outside the try-catch block so Next.js's internal
  // DynamicServerError bubbles up correctly to mark the route as dynamic.
  const cookieStore = cookies();

  try {
    const { account } = createSessionClient(cookieStore);
    const user = await account.get();
    return user.$id;
  } catch (err) {
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

// Returns the current user's role (defaults to "user").
export async function getCurrentUserRole(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? "user";
}

// Throws UNAUTHORIZED unless the current user is an admin.
export async function requireAdminId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("UNAUTHORIZED");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "admin") throw new Error("UNAUTHORIZED");
  return userId;
}
