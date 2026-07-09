import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { AuthPanel } from "@/components/AuthPanel";
import { GhostLogo } from "@/components/GhostLogo";
import Image from "next/image";

export default async function Home() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/today");

  return (
    <main className="relative min-h-screen overflow-hidden bg-void">
      {/* ── Ambient Background Glows ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(4,186,99,0.12) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(4,186,99,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Floating Particles ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0
                ? "rgba(4,186,99,0.4)"
                : "rgba(139,92,246,0.4)",
              animation: `float ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* ── Top Navigation Bar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <GhostLogo size={40} withWordmark />
        <div className="hidden items-center gap-6 sm:flex">
          <a href="#about" className="text-sm text-slate transition-colors hover:text-bone">
            About
          </a>
          <a href="#features" className="text-sm text-slate transition-colors hover:text-bone">
            Features
          </a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl grid-cols-1 items-center gap-8 px-6 py-8 lg:grid-cols-12 lg:gap-12 lg:px-10">

        {/* Left Column: Hero Content */}
        <section className="animate-fade-in lg:col-span-7">
          {/* Greeting Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-signal shadow-glow" />
            <span className="text-xs font-medium tracking-wide text-signal">
              Go Ghost 👻
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-bone sm:text-5xl lg:text-6xl">
            Execute in{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-signal via-emerald-400 to-signal bg-clip-text text-transparent">
                silence.
              </span>
            </span>
            <br />
            <span className="text-steel">Prove</span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              everything.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate sm:text-lg">
            Ghost Mode is a ruthless execution engine. One goal. A hidden
            roadmap. Three missions a day — no more. Nothing completes without
            proof. No excuses accepted.
          </p>

          {/* Feature Points */}
          <ul className="mt-8 space-y-3 text-sm text-steel sm:text-base">
            {[
              { icon: "🎯", text: "One goal, one deadline, total focus." },
              { icon: "🤖", text: "AI builds a hidden roadmap you never see." },
              { icon: "⚡", text: "Max 3 missions per day. Proof required." },
              { icon: "🔪", text: "Ruthless Decision Filter kills distractions." },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          {/* Hero Photo Section — Mobile Only */}
          <div className="relative mt-10 flex justify-center lg:hidden">
            <div className="hero-photo-wrapper relative">
              {/* Glow Ring */}
              <div className="absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-signal/30 via-purple-500/20 to-signal/30 blur-xl" />
              <div className="relative h-48 w-48 overflow-hidden rounded-full border-2 border-signal/30 shadow-[0_0_40px_rgba(4,186,99,0.3)]">
                <Image
                  src="/hero-photo.jpg"
                  alt="Ghost Mode Creator"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Photo + Auth */}
        <section className="flex flex-col items-center gap-8 lg:col-span-5">
          {/* Hero Photo — Desktop Only */}
          <div className="relative hidden lg:block">
            {/* Outer Glow Ring */}
            <div
              className="absolute -inset-6 rounded-full opacity-60 blur-2xl"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(4,186,99,0.3), rgba(139,92,246,0.3), rgba(4,186,99,0.3))",
              }}
            />
            {/* Pulsing Border */}
            <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-tr from-signal via-purple-500 to-signal opacity-30 blur-sm" />
            {/* Photo Container */}
            <div className="relative h-56 w-56 overflow-hidden rounded-full border-2 border-signal/40 shadow-[0_0_60px_rgba(4,186,99,0.25),0_0_120px_rgba(139,92,246,0.15)]">
              <Image
                src="/hero-photo.jpg"
                alt="Ghost Mode Creator"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Floating Accent Dots */}
            <div
              className="absolute -right-4 top-4 h-3 w-3 animate-bounce rounded-full bg-signal shadow-glow"
              style={{ animationDelay: "0s", animationDuration: "3s" }}
            />
            <div
              className="absolute -left-3 bottom-8 h-2 w-2 animate-bounce rounded-full bg-purple-400"
              style={{ animationDelay: "1s", animationDuration: "4s" }}
            />
            <div
              className="absolute right-2 -bottom-2 h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-300"
              style={{ animationDelay: "2s", animationDuration: "3.5s" }}
            />
          </div>

          {/* Auth Panel */}
          <div className="w-full animate-fade-in">
            <AuthPanel />
          </div>
        </section>
      </div>

      {/* ── About Section ── */}
      <section id="about" className="relative z-10 border-t border-border/30 bg-void/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:px-10">
          <h2 className="text-3xl font-bold tracking-tight text-bone sm:text-4xl">
            What is{" "}
            <span className="bg-gradient-to-r from-signal to-emerald-400 bg-clip-text text-transparent">
              Ghost Mode
            </span>
            ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate sm:text-lg">
            Ghost Mode is not another productivity app. It is an autonomous execution system
            designed for people who are done talking and ready to prove it.
            You set one goal. The AI breaks it down. Every day you get exactly three missions.
            Nothing counts until you upload proof. Miss a deadline? Your phone screams at you.
            There are no excuses in Ghost Mode — only results.
          </p>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative z-10 border-t border-border/30">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-bone">
            Built for{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              Ruthless Execution
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "👻",
                title: "Go Ghost",
                desc: "Work in silence. No social announcements. No hype. Just pure execution behind closed doors.",
              },
              {
                icon: "🧠",
                title: "AI Roadmap",
                desc: "DeepSeek AI analyzes your goal and builds a hidden roadmap. You only see today's missions.",
              },
              {
                icon: "📸",
                title: "Proof Required",
                desc: "Every task requires verifiable proof. Screenshots, links, files — or it didn't happen.",
              },
              {
                icon: "🔔",
                title: "Ruthless Alerts",
                desc: "Miss a deadline and your phone won't stop. Pushover notifications that escalate until you deliver.",
              },
              {
                icon: "💰",
                title: "Revenue Tracking",
                desc: "Track every naira, dollar, and euro. Know exactly where your money comes from.",
              },
              {
                icon: "⚔️",
                title: "Decision Filter",
                desc: "AI-powered filter that kills distractions. If it doesn't serve your goal, it gets rejected.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/50 bg-void/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-signal/30 hover:shadow-[0_0_30px_rgba(4,186,99,0.08)]"
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-bone">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/30 px-6 py-8 text-center">
        <p className="text-xs text-steel">
          © {new Date().getFullYear()} Ghost Mode by Digital Winch. No hype. No excuses. Only execution.
        </p>
      </footer>

      {/* ── CSS Animations ── */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.7;
          }
        }
      `}</style>
    </main>
  );
}
