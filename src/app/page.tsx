import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { AuthPanel } from "@/components/AuthPanel";
import { GhostLogo } from "@/components/GhostLogo";
import Image from "next/image";

export default async function Home() {
  const userId = await getCurrentUserId();
  if (userId) redirect("/today");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05000a] text-white selection:bg-[#DE0EFF]/30">
      
      {/* ── Ambient Gradients ── */}
      <div
        className="pointer-events-none absolute left-1/2 top-[10%] h-[600px] w-[800px] -translate-x-1/2 rounded-[100%] blur-[120px]"
        style={{
          background: "radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, rgba(4,186,99,0.1) 40%, transparent 70%)",
        }}
      />

      {/* ── Header Navbar (Logo left, Auth panel right) ── */}
      <header className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <GhostLogo size={36} withWordmark />
        
        {/* On desktop, show the auth panel inline or a trigger. We'll show a compact login here or hide it if we have the side panel */}
        <div className="hidden lg:flex items-center gap-6">
           <span className="text-sm font-medium text-gray-400">No hype. No excuses. Only execution.</span>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center pt-24 pb-12 lg:pt-0">
        
        {/* Centered Headline */}
        <div className="text-center animate-fade-in relative z-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DE0EFF]/20 bg-[#DE0EFF]/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="text-sm font-semibold tracking-wide text-[#DE0EFF]">Yo! Whats Up? 👻</span>
          </div>
          
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
            Let's create <br className="md:hidden" />
            <span className="bg-gradient-to-r from-[#DE0EFF] to-[#5E0EFF] bg-clip-text text-transparent">
              Magic
            </span>
            <br />
            together
          </h1>
        </div>

        {/* Massive Centered Photo & Floating Props */}
        <div className="relative mt-8 flex w-full max-w-4xl justify-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
          
          {/* Floating Prop 1 (Left) */}
          <div className="absolute left-[5%] top-1/4 hidden lg:block animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-800 bg-[#05000a] p-4 shadow-xl">
              <span className="text-3xl">🎯</span>
            </div>
            {/* Glow under prop */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(222,14,255,0.4)] mix-blend-screen" />
          </div>

          {/* Floating Prop 2 (Right) */}
          <div className="absolute right-[5%] top-1/3 hidden lg:block animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-800 bg-[#05000a] p-4 shadow-xl">
              <span className="text-4xl">🤖</span>
            </div>
            {/* Glow under prop */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(4,186,99,0.3)] mix-blend-screen" />
          </div>

          {/* Main Photo Container */}
          <div className="relative mx-auto w-[280px] sm:w-[350px] md:w-[450px] lg:w-[500px]">
             {/* Glowing outline shape */}
             <div className="absolute -inset-4 rounded-full border-2 border-dashed border-[#DE0EFF]/30 opacity-50 animate-spin-slow" style={{ animationDuration: '20s' }} />
             
             {/* Transparent Cutout Image */}
             <Image
               src="/hero-transparent.png"
               alt="Creator"
               width={600}
               height={600}
               className="relative z-10 w-full drop-shadow-[0_0_40px_rgba(222,14,255,0.2)]"
               priority
             />
             
             {/* Bottom fade to blend into background */}
             <div className="absolute bottom-0 left-0 right-0 z-20 h-24 bg-gradient-to-t from-[#05000a] to-transparent" />
          </div>
        </div>

        {/* Bottom Elements: Text (Left) & Login (Right) */}
        <div className="relative z-30 mt-12 w-full max-w-7xl px-6 lg:mt-[-4rem] lg:flex lg:items-end lg:justify-between lg:px-12">
          
          {/* Left Text */}
          <div className="mx-auto max-w-sm text-center lg:mx-0 lg:max-w-md lg:text-left">
            <p className="text-base leading-relaxed text-gray-400">
              Ghost Mode is a ruthless execution engine. One goal. A hidden roadmap. Three missions a day. Nothing completes without proof. No excuses accepted.
            </p>
          </div>

          {/* Right Auth / Login Panel */}
          <div className="mx-auto mt-12 w-full max-w-md lg:mx-0 lg:mt-0">
             <div className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-1 shadow-2xl backdrop-blur-xl">
               <AuthPanel />
             </div>
          </div>
          
        </div>
      </section>

    </main>
  );
}
