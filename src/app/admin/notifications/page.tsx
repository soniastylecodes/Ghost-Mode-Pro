import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Admin Notifications — Ghost Mode" };

export default function AdminNotificationsPage() {
  return (
    <AdminShell>
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-bone">Notifications</h1>
        <p className="text-slate mt-2">System-wide notification history and broadcast controls.</p>
      </div>

      <div className="gm-card text-center py-16">
        <div className="text-4xl mb-4">📯</div>
        <h3 className="text-xl font-bold text-bone mb-2">Notification Center</h3>
        <p className="text-slate mb-6">
          Global notification logs and custom broadcast capabilities are coming in the next update.
        </p>
        <button className="gm-btn-primary opacity-50 cursor-not-allowed" disabled>
          Send Broadcast (Disabled)
        </button>
      </div>
    </AdminShell>
  );
}
