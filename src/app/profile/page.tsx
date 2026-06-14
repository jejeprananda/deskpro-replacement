import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function ProfilePage() {
  await requireAuth();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your account</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-muted">
          Profile settings will be available here.
        </p>
      </div>
    </AppShell>
  );
}
