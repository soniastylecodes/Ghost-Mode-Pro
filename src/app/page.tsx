import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { AuthPanel } from "@/components/AuthPanel";
import { GhostLogo } from "@/components/GhostLogo";

export default async function Home() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/today");

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(4,186,99,0.16), transparent 70%)" }}
      />
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2">
        {/* Left: pitch */}
        <section className="animate-fade-in">
          <GhostLogo size={44} withWordmark />
          <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight text-bone sm:text-5xl">
            Execute in silence.
            <br />
            <span className="text-signal">Prove everything.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate">
            Ghost Mode is a ruthless execution engine. One goal. A hidden
            roadmap. Three missions a day — no more. Nothing completes without
            proof. No excuses accepted.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-steel">
            {[
              "One goal, one deadline, total focus.",
              "AI builds a hidden roadmap you never see.",
              "Max 3 missions per day. Proof required.",
              "Ruthless Decision Filter kills distractions.",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-glow" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Right: auth */}
        <section className="animate-fade-in">
          <AuthPanel />
        </section>
      </div>
    </main>
  );
}
