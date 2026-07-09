import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { RestClient } from "./RestClient";

export default async function RestSchedulePage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <RestClient initialUser={user} />
      </div>
    </AppShell>
  );
}
