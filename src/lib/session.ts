import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

type SessionUser = { id?: string; role?: string };

// Returns the current user's id or null.
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as SessionUser | undefined)?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

// Returns the current user's role (defaults to "user").
export async function getCurrentUserRole(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as SessionUser | undefined)?.role ?? null;
}

// Throws UNAUTHORIZED unless the current user is an admin.
export async function requireAdminId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) throw new Error("UNAUTHORIZED");
  if (user.role !== "admin") throw new Error("UNAUTHORIZED");
  return user.id;
}
