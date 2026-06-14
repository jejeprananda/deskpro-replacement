import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function SettingsPage() {
  await requireAuth();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">Application preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-muted">
          Application settings will be available here.
        </p>
      </div>
    </AppShell>
  );
}
