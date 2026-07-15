"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { account } from "@/lib/appwrite-client";
import { GhostLogo } from "./GhostLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Target, 
  CalendarDays, 
  Briefcase, 
  Users, 
  DollarSign, 
  CheckSquare, 
  Trophy, 
  Coffee,
  LogOut
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today's Mission", icon: Target },
  { href: "/streak", label: "Streak Calendar", icon: CalendarDays },
  { href: "/jobs", label: "Job Board", icon: Briefcase },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/revenue", label: "Revenue Tracker", icon: DollarSign },
  { href: "/weekly-review", label: "Weekly Review", icon: CheckSquare },
  { href: "/role-models", label: "Role Models", icon: Trophy },
  { href: "/rest", label: "Rest Schedule", icon: Coffee },
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 5 minutes of inactivity
      timeoutId = setTimeout(() => {
        handleSignOut();
      }, 5 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'wheel', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-void">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface-2 z-20">
        <Link href="/today" className="flex items-center">
          <GhostLogo size={24} withWordmark />
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handleSignOut} className="p-2 text-slate hover:text-bone" title="Sign out">
            <LogOut size={20} />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate hover:text-bone"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
        <nav className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto">
          {NAV.map((n, idx) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`group rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 flex items-center gap-3 animate-fade-in ${
                  active
                    ? "bg-surface text-signal shadow-glow"
                    : "text-slate hover:text-bone hover:bg-surface hover:translate-x-1"
                }`}
              >
                <Icon size={18} className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
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
