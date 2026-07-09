import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Admin Settings — Ghost Mode" };

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-bone">Settings</h1>
        <p className="text-slate text-sm mt-1">Token for Pushover push notifications. If missing, notifications won&apos;t be sent.</p>
      </div>

      <div className="gm-card max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">
              Pushover App Token (for urgent push notifications)
            </label>
            <input
              type="text"
              readOnly
              className="w-full bg-void border border-border rounded-lg px-4 py-2 text-sm text-bone opacity-50 cursor-not-allowed"
              value={process.env.PUSHOVER_APP_TOKEN || "Not set in .env"}
            />
            <p className="text-xs text-slate">Update this in your server&apos;s .env file and restart to apply.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-steel uppercase tracking-wider block">
              Abacus AI Base URL
            </label>
            <input
              type="text"
              readOnly
              className="w-full bg-void border border-border rounded-lg px-4 py-2 text-sm text-bone opacity-50 cursor-not-allowed"
              value={process.env.ABACUS_LLM_BASE_URL || "Not set in .env"}
            />
            <p className="text-xs text-slate">Update this in your server&apos;s .env file and restart to apply.</p>
          </div>

          <button className="gm-btn-primary opacity-50 cursor-not-allowed" disabled>
            Save Settings
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
