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
  LogOut,
  Sliders
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today's Mission", icon: Target },
  { href: "/streak", label: "Streak Calendar", icon: CalendarDays },
  { href: "/jobs", label: "Job Board", icon: Briefcase },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/revenue", label: "Revenue Tracker", icon: DollarSign },
  { href: "/reviews", label: "Reviews", icon: CheckSquare },
  { href: "/role-models", label: "Role Models", icon: Trophy },
  { href: "/rest", label: "Rest Schedule", icon: Coffee },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Target },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/streak", label: "Streak", icon: CalendarDays },
  { href: "#more", label: "More", icon: Sliders },
];

const DRAWER_NAV = [
  { href: "/jobs", label: "Job Board", icon: Briefcase },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/reviews", label: "Reviews", icon: CheckSquare },
  { href: "/role-models", label: "Role Models", icon: Trophy },
  { href: "/rest", label: "Rest Schedule", icon: Coffee },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [formattedDate, setFormattedDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  
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
    // Fetch client-side user info
    account.get()
      .then((res) => {
        setUser({ name: res.name || "Ghost" });
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
      });
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000); // Update clock every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Prefetch all key pages client-side for near-instant page changes
    router.prefetch("/dashboard");
    router.prefetch("/today");
    router.prefetch("/revenue");
    router.prefetch("/streak");
    router.prefetch("/jobs");
    router.prefetch("/leads");
    router.prefetch("/reviews");
    router.prefetch("/role-models");
    router.prefetch("/rest");
  }, [router]);

  useEffect(() => {
    // Calculate time-of-day greeting
    const updateGreeting = () => {
      const hrs = new Date().getHours();
      const name = user?.name ? ` ${user.name}` : "";
      
      if (hrs >= 5 && hrs < 12) {
        setGreeting(`Good Morning,${name}`);
      } else if (hrs >= 12 && hrs < 17) {
        setGreeting(`What are you up to,${name}?`);
      } else {
        setGreeting(`Good Evening,${name}`);
      }
    };
    
    updateGreeting();

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    setFormattedDate(new Date().toLocaleDateString('en-US', options));
  }, [user]);

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
    <div className="flex flex-col md:flex-row min-h-screen bg-void relative">
      {/* Mobile Sticky Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface-2/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/today" className="flex items-center">
          <GhostLogo size={24} withWordmark />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={handleSignOut} className="p-2 text-slate hover:text-bone" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside 
        className="hidden md:flex w-64 flex-shrink-0 border-r border-border bg-surface-2 flex-col fixed md:relative z-10 h-screen top-0"
      >
        <div className="flex p-6">
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

      {/* Main Content Area */}
      <main className="flex-1 min-h-[calc(100vh-65px)] md:h-screen overflow-y-auto pb-safe md:pb-10 momentum-scroll">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 py-6 md:py-10">
          
          {/* Unified Premium Greeting Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-bone tracking-tight flex items-center gap-2">
                {greeting}
              </h1>
              <p className="text-sm text-slate mt-1">{formattedDate}</p>
            </div>
            
            {/* Dynamic Premium Clock Badge (replaces active session) */}
            <div className="flex items-center gap-2 bg-surface-2 border border-border/50 py-1.5 px-4 rounded-full text-slate hover:text-bone hover:border-steel transition-all duration-300 shadow-glow self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate">Local Time</span>
              <span className="font-mono text-xs font-bold text-bone">{currentTime || "00:00"}</span>
            </div>
          </div>

          {children}
        </div>
      </main>

      {/* Floating Bottom Nav Capsule on Mobile */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="bg-black/90 backdrop-blur-md border border-border/80 rounded-full py-2 px-3 shadow-glow flex items-center justify-between">
          {MOBILE_NAV.map((n) => {
            const isMore = n.href === "#more";
            const active = isMore ? moreDrawerOpen : pathname === n.href;
            const Icon = n.icon;
            
            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreDrawerOpen(true)}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-75 active:duration-75 active:ease-out ${
                    active 
                      ? "bg-bone text-void shadow-lg transform -translate-y-1.5 scale-110" 
                      : "text-slate hover:text-bone"
                  }`}
                  title="More Tools"
                >
                  <Icon size={20} className={active ? "text-void" : "text-slate"} />
                </button>
              );
            }
            
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-75 active:duration-75 active:ease-out ${
                  active 
                    ? "bg-bone text-void shadow-lg transform -translate-y-1.5 scale-110" 
                    : "text-slate hover:text-bone"
                }`}
                title={n.label}
              >
                <Icon size={20} className={active ? "text-void" : "text-slate"} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Drawer Backdrop */}
      <div 
        className={`bottom-drawer-backdrop ${moreDrawerOpen ? "active" : ""}`}
        onClick={() => setMoreDrawerOpen(false)}
      />

      {/* Slide-up "More Tools" Drawer on Mobile */}
      <div className={`bottom-drawer ${moreDrawerOpen ? "open" : ""}`}>
        <div className="w-12 h-1 bg-border rounded-full mx-auto mb-5" />
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-bone">More Tools</h3>
          <button 
            onClick={() => setMoreDrawerOpen(false)}
            className="p-2 text-slate hover:text-bone rounded-full hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {DRAWER_NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMoreDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                  active 
                    ? "bg-surface border-signal text-signal shadow-glow" 
                    : "border-border bg-black/20 text-slate hover:text-bone hover:border-steel"
                }`}
              >
                <Icon size={20} className="mb-2" />
                <span className="text-[10px] font-semibold text-center leading-tight">{n.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
          <ThemeToggle />
          <button
            onClick={() => {
              setMoreDrawerOpen(false);
              handleSignOut();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

