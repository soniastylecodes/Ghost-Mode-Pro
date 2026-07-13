import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import LandingPage from "./LandingPage";

export default async function Home() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/today");
  return <LandingPage />;
}
