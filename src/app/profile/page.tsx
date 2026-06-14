import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function ProfilePage() {
  await requireAuth();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your account</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Profile settings will be available here.
        </p>
      </div>
    </AppShell>
  );
}
