import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function SettingsPage() {
  await requireAuth();

  return (
    <AppShell title="Settings">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Application settings will be available here.
        </p>
      </div>
    </AppShell>
  );
}
