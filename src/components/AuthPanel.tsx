"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ID } from "appwrite";
import { account } from "@/lib/appwrite-client";

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
        // 1. Create account in Appwrite
        await account.create(ID.unique(), email, password, name);
      }

      // 2. Authenticate the user (create session) in Appwrite
      // This sets the secure cookies automatically
      await account.createEmailPasswordSession(email, password);

      // 3. Sync the Appwrite session with Prisma database
      const syncRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!syncRes.ok) {
        const data = await syncRes.json();
        throw new Error(data.error || "Could not sync account with database");
      }

      // 4. Redirect to the dashboard
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      // Clean up session if database sync failed so user isn't half-logged in
      try {
        await account.deleteSession("current");
      } catch {}
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
