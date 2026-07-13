"use client";

import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { GhostLogo } from "@/components/GhostLogo";

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

      {/* ── Ambient background glows ── */}
      <div className="landing-glow-1" />
      <div className="landing-glow-2" />
      <div className="landing-glow-3" />

      {/* ── Navbar ── */}
      <header className="landing-nav">
        <GhostLogo size={32} withWordmark />

        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
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
            Start Free →
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">

        {/* Badge pill */}
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          <span>Ghost Mode is live</span>
          <span className="landing-badge-sep">·</span>
          <span className="landing-badge-sub">No credit card required</span>
        </div>

        {/* Headline */}
        <h1 className="landing-h1">
          The AI execution engine<br />
          <span className="landing-h1-accent">that runs your life</span>
        </h1>

        {/* Sub-headline */}
        <p className="landing-sub">
          One locked goal. A hidden roadmap. Three ruthless missions a day.<br />
          Nothing marks done without proof. No excuses accepted.
        </p>

        {/* Stat pills */}
        <div className="landing-stats">
          <div className="landing-stat-pill">
            <span>🎯</span> One goal at a time
          </div>
          <div className="landing-stat-pill">
            <span>🤖</span> AI-verified proof
          </div>
          <div className="landing-stat-pill">
            <span>🔥</span> Daily streak tracking
          </div>
        </div>

        {/* CTA buttons */}
        <div className="landing-cta-row">
          <button
            id="hero-start-btn"
            className="landing-btn-hero"
            onClick={() => openModal("signup")}
          >
            Start executing – it&apos;s free →
          </button>
          <button
            id="hero-signin-btn"
            className="landing-btn-ghost-lg"
            onClick={() => openModal("signin")}
          >
            Already a ghost? Sign in
          </button>
        </div>

        {/* Social proof */}
        <p className="landing-proof">
          Join builders who stopped talking and started executing.
        </p>
      </section>

      {/* ── Feature Cards ── */}
      <section id="features" className="landing-features-section">
        <h2 className="landing-section-title">Built for ruthless execution</h2>
        <p className="landing-section-sub">Every feature is designed to eliminate excuses and force progress.</p>

        <div className="landing-cards-grid">
          {[
            { icon: "👻", title: "Ghost Mode On", desc: "No distractions. No social media. Just your goal and the work." },
            { icon: "🗺️", title: "Hidden Roadmap", desc: "AI builds your roadmap. You only see today's mission — no overwhelm." },
            { icon: "📸", title: "Proof of Work", desc: "Every task requires proof. AI reviews it. No proof = not done." },
            { icon: "🔥", title: "Streak Engine", desc: "Your streak is your identity. Miss a day and face yourself in the mirror." },
            { icon: "💰", title: "Revenue Tracker", desc: "Track every naira, dollar, or pound earned. Watch your hustle compound." },
            { icon: "🧠", title: "Weekly Reviews", desc: "AI analyses your week. Bottlenecks, wins, and what to double down on." },
          ].map((f) => (
            <div key={f.title} className="landing-card">
              <div className="landing-card-icon">{f.icon}</div>
              <h3 className="landing-card-title">{f.title}</h3>
              <p className="landing-card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-bottom-cta">
        <div className="landing-glow-bottom" />
        <h2 className="landing-bottom-title">Ready to go ghost?</h2>
        <p className="landing-bottom-sub">
          Stop planning. Stop scrolling. Start executing.
        </p>
        <button
          id="bottom-start-btn"
          className="landing-btn-hero"
          onClick={() => openModal("signup")}
        >
          Enter Ghost Mode – Free →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <GhostLogo size={24} withWordmark />
        <p>© {new Date().getFullYear()} Ghost Mode. Built for executors only.</p>
      </footer>

      {/* ── Auth Modal ── */}
      <AuthModal
        isOpen={modalOpen}
        initialMode={modalMode}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}
