"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";

type Mission = {
  id: string;
  date: string;
  status: string;
  summary: string | null;
  deadline: string;
  primaryTasks: {
    id: string;
    objective: string;
    status: string;
    priority: number;
    proofs: { id: string; verdict: string | null }[];
  }[];
  secondaryTasks: { id: string; objective: string; status: string }[];
};

type UserDetail = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  pushoverUserKey: string | null;
  createdAt: string;
  streak: { current: number; longest: number; totalFocusMinutes: number } | null;
  goals: { id: string; title: string; status: string; deadline: string; createdAt: string }[];
};

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "missions">("profile");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users/${params.id}`).then((r) => r.json()),
      fetch(`/api/admin/users/${params.id}/missions`).then((r) => r.json()),
    ]).then(([ud, md]) => {
      setUser(ud.user ?? null);
      setMissions(md.missions ?? []);
      setLoading(false);
    });
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("Delete this user permanently?")) return;
    await fetch(`/api/admin/users/${params.id}`, { method: "DELETE" });
    router.push("/admin/users");
  }

  async function handlePromote() {
    const newRole = user?.role === "admin" ? "user" : "admin";
    if (!confirm(`Change role to "${newRole}"?`)) return;
    await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setUser((u) => u ? { ...u, role: newRole } : u);
  }

  async function handleSuspend() {
    if (!confirm("Suspend this user's active goal?")) return;
    await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalStatus: "suspended" }),
    });
  }

  if (loading) {
    return (
      <AdminShell>
        <p className="text-steel">Loading…</p>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell>
        <p className="text-red-500 mb-4">User not found.</p>
        <Link href="/admin/users" className="text-signal hover:underline">
          ← Back to users
        </Link>
      </AdminShell>
    );
  }

  const activeGoal = user.goals.find((g) => g.status === "active");

  return (
    <AdminShell>
      <div className="mb-8 border-b border-border pb-6 flex items-start justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-steel hover:text-bone transition-colors mb-2 inline-block">
            ← Users
          </Link>
          <h1 className="text-3xl font-bold text-bone">{user.name ?? user.email}</h1>
          <p className="text-slate mt-1">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded bg-surface border border-border text-sm text-bone hover:border-signal transition-colors" onClick={handlePromote}>
            {user.role === "admin" ? "Demote to User" : "Promote to Admin"}
          </button>
          {user.role !== "admin" && (
            <button className="px-4 py-2 rounded bg-surface border border-border text-sm text-orange-400 hover:border-orange-400 transition-colors" onClick={handleSuspend}>
              Suspend Goal
            </button>
          )}
          <button className="px-4 py-2 rounded bg-surface border border-border text-sm text-red-500 hover:border-red-500 transition-colors" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-border mb-8">
        {(["profile", "missions"] as const).map((t) => (
          <button
            key={t}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? "border-signal text-signal"
                : "border-transparent text-slate hover:text-bone"
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="gm-card">
            <h3 className="text-lg font-bold text-bone mb-4">Account</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Role</dt>
                <dd>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${user.role === "admin" ? "bg-deep-green text-signal" : "bg-surface text-slate"}`}>
                    {user.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Joined</dt>
                <dd className="text-bone">{new Date(user.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Pushover Key</dt>
                <dd className="text-bone">{user.pushoverUserKey ? <code className="bg-void px-2 py-1 rounded text-sm text-signal">{user.pushoverUserKey.slice(0, 8)}…</code> : <span className="text-steel italic">Not set</span>}</dd>
              </div>
            </dl>
          </div>
          
          <div className="gm-card">
            <h3 className="text-lg font-bold text-bone mb-4">Streak</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Current</dt>
                <dd className="text-bone font-medium text-lg">🔥 {user.streak?.current ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Longest</dt>
                <dd className="text-bone font-medium text-lg">⚡ {user.streak?.longest ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Focus Minutes</dt>
                <dd className="text-bone font-medium text-lg">{user.streak?.totalFocusMinutes ?? 0} <span className="text-sm text-steel font-normal">min</span></dd>
              </div>
            </dl>
          </div>
          
          {activeGoal && (
            <div className="gm-card md:col-span-2">
              <h3 className="text-lg font-bold text-bone mb-4">Active Goal</h3>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Title</dt>
                  <dd className="text-bone font-medium">{activeGoal.title}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Deadline</dt>
                  <dd className="text-bone">{new Date(activeGoal.deadline).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-steel mb-1">Status</dt>
                  <dd>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-deep-green/20 text-signal border border-deep-green">
                      {activeGoal.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}

      {tab === "missions" && (
        <div>
          {missions.length === 0 ? (
            <p className="text-steel italic">No missions generated yet.</p>
          ) : (
            <div className="space-y-4">
              {missions.map((m) => (
                <div key={m.id} className="gm-card">
                  <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                    <span className="text-bone font-medium">
                      {new Date(m.date).toLocaleDateString()}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider border ${
                      m.status === "complete" ? "bg-deep-green/20 text-signal border-deep-green" : 
                      m.status === "failed" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                      "bg-surface text-slate border-border"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  {m.summary && <p className="text-slate text-sm mb-4 italic">&quot;{m.summary}&quot;</p>}
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-steel">Tasks</h4>
                    {m.primaryTasks.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-1">
                          {t.status === "complete" ? (
                            <span className="text-signal text-lg leading-none">✓</span>
                          ) : t.status === "rejected" ? (
                            <span className="text-red-500 text-lg leading-none">✗</span>
                          ) : (
                            <span className="text-steel text-lg leading-none">○</span>
                          )}
                        </div>
                        <div className="flex-1 text-bone">{t.objective}</div>
                        {t.proofs[0]?.verdict && (
                          <span className={`px-2 py-0.5 rounded text-xs uppercase ${t.proofs[0].verdict === "approved" ? "text-signal bg-deep-green/20" : "text-red-500 bg-red-500/10"}`}>
                            {t.proofs[0].verdict}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
