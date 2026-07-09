import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
  const userId = await requireUserId();
  const leads = await prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="mx-auto">
        <LeadsClient initialLeads={leads as any[]} />
      </div>
    </AppShell>
  );
}
