"use client";

import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { GhostLogo } from "@/components/GhostLogo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";

type Mode = "signin" | "signup";

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<Mode>("signup");

  function openModal(mode: Mode) {
    setModalMode(mode);
    setModalOpen(true);
  }

  return (
    <main className="landing-root">

      {/* Ambient glows */}
      <div className="landing-glow-1" />
      <div className="landing-glow-2" />

      <Particles />

      {/* ── Navbar ── */}
      <header className="landing-nav">
        <GhostLogo size={32} withWordmark />

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <ThemeToggle />
        </nav>

        <div className="landing-nav-cta">
          <button
            id="nav-signin-btn"
            className="landing-btn-ghost"
            onClick={() => openModal("signin")}
          >
            Sign In
          </button>
          <button
            id="nav-signup-btn"
            className="landing-btn-primary"
            onClick={() => openModal("signup")}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero (100vh) ── */}
      <section className="landing-hero">

        {/* Badge */}
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          <span>Now live — free to start</span>
        </div>

        {/* Headline */}
        <h1 className="landing-h1">
          Execute in silence.
          <br />
          <span className="landing-h1-accent">Let results speak.</span>
        </h1>

        {/* Sub */}
        <p className="landing-sub">
          One mission. One task at a time.
          <br />
          Nothing counts until you prove it.
        </p>

        {/* Single CTA */}
        <button
          id="hero-start-btn"
          className="landing-btn-hero"
          onClick={() => openModal("signup")}
        >
          Enter Ghost Mode →
        </button>

        {/* Stat pills */}
        <div className="landing-stats">
          <div className="landing-stat-pill">One goal focus</div>
          <div className="landing-stat-pill">Verified proof</div>
          <div className="landing-stat-pill">Execution tracking</div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section id="features" className="landing-features-section">
        <h2 className="landing-section-title">Built to eliminate excuses</h2>
        <p className="landing-section-sub">
          Every feature forces you forward. No fluff. No motivation quotes.
        </p>

        <div className="landing-cards-grid">
          {[
            { title: "Ghost Mode", desc: "Lock in. No social. No noise. Just you, your goal, and the work." },
            { title: "Hidden Roadmap", desc: "AI builds your path. You only see today. No overwhelm, no paralysis." },
            { title: "Proof of Work", desc: "Submit proof for every task. AI grades it. Fail = not done." },
            { title: "Streak Engine", desc: "Your streak is your identity. Guard it like your life depends on it." },
            { title: "Revenue Log", desc: "Track every coin earned. See your hustle turn into income." },
            { title: "Weekly Review", desc: "AI diagnoses your week. Wins, bottlenecks, and the brutal truth." },
          ].map((f) => (
            <div key={f.title} className="landing-card">
              <h3 className="landing-card-title">{f.title}</h3>
              <p className="landing-card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-bottom-cta">
        <div className="landing-glow-bottom" />
        <h2 className="landing-bottom-title">Ready to stop talking?</h2>
        <p className="landing-bottom-sub">
          Ghost Mode doesn&apos;t motivate you. It holds you accountable.
        </p>
        <button
          id="bottom-start-btn"
          className="landing-btn-hero"
          onClick={() => openModal("signup")}
        >
          Start executing — it&apos;s free →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <GhostLogo size={22} withWordmark />
        <p>© {new Date().getFullYear()} Ghost Mode. Built for executors only.</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={modalOpen}
        initialMode={modalMode}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}
