"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { GhostLogo } from "./GhostLogo";
import { ThemeToggle } from "./ThemeToggle";

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
  
  // Exclude AppShell sidebar on the Goal Setup screen if we want, but it's fine
  // PRD: "a slim, always present interactive sidebar replaces the header."
  return (
    <div className="flex min-h-screen bg-void">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface-2 flex flex-col">
        <div className="p-6">
          <Link href="/today" className="flex items-center">
            <GhostLogo size={32} withWordmark />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-2 px-4 py-4">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
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
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex-1 text-left rounded-lg px-4 py-3 text-sm font-medium text-steel hover:text-bone hover:bg-surface"
          >
            Sign out
          </button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
