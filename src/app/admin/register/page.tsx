"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    adminCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/login");
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-void">
      <div className="gm-card w-full max-w-md space-y-8 p-8 border border-border bg-surface/50 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl mb-4">👻</div>
          <h2 className="text-2xl font-bold text-bone">Ghost Mode</h2>
          <p className="text-slate text-sm mt-1">Create Admin Account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">Full Name</label>
            <input
              className="w-full bg-void border border-border rounded-lg p-3 text-bone focus:outline-none focus:border-signal"
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Admin Name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">Email</label>
            <input
              className="w-full bg-void border border-border rounded-lg p-3 text-bone focus:outline-none focus:border-signal"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">Password</label>
            <input
              className="w-full bg-void border border-border rounded-lg p-3 text-bone focus:outline-none focus:border-signal"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">Admin Secret Code</label>
            <input
              className="w-full bg-void border border-border rounded-lg p-3 text-bone focus:outline-none focus:border-signal"
              type="password"
              required
              value={form.adminCode}
              onChange={(e) => set("adminCode", e.target.value)}
              placeholder="Enter the secret code"
            />
            <span className="block text-xs text-slate mt-1">
              Set in your <code>.env</code> as <code>ADMIN_SECRET_CODE</code>
            </span>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="gm-btn-primary w-full mt-4" disabled={loading}>
            {loading ? "Creating…" : "Create Admin Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate mt-8">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-signal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
