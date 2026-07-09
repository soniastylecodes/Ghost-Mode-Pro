import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { RoleModelsClient } from "./RoleModelsClient";

export default async function RoleModelsPage() {
  const userId = await requireUserId();
  const roleModels = await prisma.roleModel.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <RoleModelsClient initialRoleModels={roleModels} />
      </div>
    </AppShell>
  );
}
