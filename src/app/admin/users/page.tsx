"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminUserTable from "@/components/admin/AdminUserTable";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  goals: { id: string; title: string; status: string }[];
  streak: { current: number; longest: number } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this user and all their data?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  async function handleSuspend(id: string) {
    if (!confirm("Suspend this user's active goal?")) return;
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalStatus: "suspended" }),
    });
    router.refresh();
  }

  return (
    <AdminShell>
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-bone">Users</h1>
        <p className="text-slate mt-2">All registered accounts on Ghost Mode.</p>
      </div>
      {loading ? (
        <p className="text-steel">Loading users…</p>
      ) : (
        <AdminUserTable
          users={users}
          onDelete={handleDelete}
          onSuspend={handleSuspend}
        />
      )}
    </AdminShell>
  );
}
