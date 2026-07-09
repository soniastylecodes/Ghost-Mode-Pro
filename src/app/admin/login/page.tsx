"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/admin");
    } else {
      setError("Invalid credentials.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-void">
      <div className="gm-card w-full max-w-md space-y-8 p-8 border border-border bg-surface/50 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl mb-4">👻</div>
          <h2 className="text-2xl font-bold text-bone">Ghost Mode</h2>
          <p className="text-slate text-sm mt-1">Super Admin Portal</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">Email</label>
            <input
              className="w-full bg-void border border-border rounded-lg p-3 text-bone focus:outline-none focus:border-signal"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">Password</label>
            <input
              className="w-full bg-void border border-border rounded-lg p-3 text-bone focus:outline-none focus:border-signal"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="gm-btn-primary w-full mt-4" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate mt-8">
          Need an account?{" "}
          <Link href="/admin/register" className="text-signal hover:underline">
            Create admin account
          </Link>
        </p>
      </div>
    </div>
  );
}
