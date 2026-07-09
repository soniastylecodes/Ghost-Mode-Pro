"use client";

import { useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  goals: { id: string; title: string; status: string }[];
  streak: { current: number; longest: number } | null;
};

export default function AdminUserTable({
  users,
  onDelete,
  onSuspend,
}: {
  users: User[];
  onDelete: (id: string) => void;
  onSuspend: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="gm-card overflow-hidden p-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <input
          className="bg-void border border-border rounded-lg px-4 py-2 text-sm text-bone focus:outline-none focus:border-signal w-64"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm font-medium text-steel">{filtered.length} users</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate">
          <thead className="bg-void text-steel uppercase tracking-wider text-xs border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Active Goal</th>
              <th className="px-6 py-4 font-semibold">Streak</th>
              <th className="px-6 py-4 font-semibold">Joined</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => {
              const goal = u.goals[0];
              return (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-deep-green/30 text-signal font-bold">
                        {(u.name ?? u.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-bone">{u.name ?? "—"}</div>
                        <div className="text-xs text-steel">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                        u.role === "admin"
                          ? "bg-deep-green text-signal"
                          : "bg-surface text-slate"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {goal ? (
                      <span className="text-bone" title={goal.title}>
                        {goal.title.length > 32
                          ? goal.title.slice(0, 32) + "…"
                          : goal.title}
                      </span>
                    ) : (
                      <span className="text-steel italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-bone font-medium">
                      🔥 {u.streak?.current ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-steel">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="px-3 py-1.5 rounded bg-surface border border-border text-xs text-bone hover:border-signal transition-colors"
                      >
                        View
                      </Link>
                      {u.role !== "admin" && (
                        <button
                          className="px-3 py-1.5 rounded bg-surface border border-border text-xs text-orange-400 hover:border-orange-400 transition-colors"
                          onClick={() => onSuspend(u.id)}
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        className="px-3 py-1.5 rounded bg-surface border border-border text-xs text-red-500 hover:border-red-500 transition-colors"
                        onClick={() => onDelete(u.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-steel italic">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
