"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ID } from "appwrite";
import { account } from "@/lib/appwrite-client";

type Mode = "signin" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

export function AuthModal({ isOpen, initialMode = "signup", onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode when prop changes
  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await account.create(ID.unique(), email, password, name);
      }
      await account.createEmailPasswordSession(email, password);
      const syncRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!syncRes.ok) {
        const data = await syncRes.json();
        throw new Error(data.error || "Could not sync account with database");
      }
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      try { await account.deleteSession("current"); } catch {}
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal Card */}
      <div
        className="auth-modal-card relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-8 shadow-[0_0_80px_rgba(222,14,255,0.15)] animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gray-500 transition-colors hover:border-white/30 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Ghost Icon */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="text-4xl">👻</span>
          <h2 className="text-xl font-bold text-white">
            {mode === "signup" ? "Enter Ghost Mode" : "Welcome back"}
          </h2>
          <p className="text-sm text-gray-500">
            {mode === "signup" ? "No hype. No excuses. Only execution." : "Continue your execution streak."}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["signup", "signin"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-[#DE0EFF] text-white shadow-[0_0_20px_rgba(222,14,255,0.4)]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {m === "signup" ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400" htmlFor="modal-name">
                Your Name
              </label>
              <input
                id="modal-name"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should Ghost Mode call you?"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400" htmlFor="modal-email">
              Email
            </label>
            <input
              id="modal-email"
              type="email"
              required
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400" htmlFor="modal-password">
              Password
            </label>
            <input
              id="modal-password"
              type="password"
              required
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Working…
              </span>
            ) : mode === "signup" ? "🚀 Start executing" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
