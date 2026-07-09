"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Could not create account");
        }
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Invalid email or password");
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="gm-card w-full max-w-md">
      <div className="mb-6 flex gap-2 rounded-lg border border-border p-1">
        {(["signup", "signin"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === m ? "bg-signal text-void" : "text-slate hover:text-bone"
            }`}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="gm-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="gm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should Ghost Mode call you?"
            />
          </div>
        )}
        <div>
          <label className="gm-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="gm-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="gm-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className="gm-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="gm-btn-primary w-full">
          {loading
            ? "Working…"
            : mode === "signup"
            ? "Enter Ghost Mode"
            : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-steel">
        No hype. No excuses. Only execution.
      </p>
    </div>
  );
}
