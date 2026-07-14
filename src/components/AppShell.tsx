"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { account } from "@/lib/appwrite-client";
import { GhostLogo } from "./GhostLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/today", label: "Today's Mission" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/streak", label: "Streak Calendar" },
  { href: "/role-models", label: "Role Models" },
  { href: "/leads", label: "Leads" },
  { href: "/weekly-review", label: "Weekly Review" },
  { href: "/revenue", label: "Revenue Tracker" },
  { href: "/rest", label: "Rest Schedule" },
  { href: "/filter", label: "Decision Filter" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await account.deleteSession("current");
    } catch (err) {
      console.error("Logout error:", err);
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-void">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface-2 z-20">
        <Link href="/today" className="flex items-center">
          <GhostLogo size={24} withWordmark />
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate hover:text-bone"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } md:flex w-full md:w-64 flex-shrink-0 border-r border-border bg-surface-2 flex-col fixed md:relative z-10 h-[calc(100vh-65px)] md:h-screen top-[65px] md:top-0`}
      >
        <div className="hidden md:flex p-6">
          <Link href="/today" className="flex items-center">
            <GhostLogo size={32} withWordmark />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors flex items-center ${
                  active
                    ? "bg-surface text-signal shadow-glow"
                    : "text-slate hover:text-bone hover:bg-surface"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border flex items-center gap-2">
          <button
            onClick={handleSignOut}
            className="flex-1 text-left rounded-lg px-4 py-3 text-sm font-medium text-steel hover:text-bone hover:bg-surface"
          >
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-[calc(100vh-65px)] md:h-screen overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
