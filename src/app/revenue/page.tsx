import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { RevenueClient } from "./RevenueClient";

export default async function RevenuePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  return (
    <AppShell>
      <RevenueClient />
    </AppShell>
  );
}
