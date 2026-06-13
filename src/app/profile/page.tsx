import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function ProfilePage() {
  await requireAuth();

  return (
    <AppShell title="Profile">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Profile settings will be available here.
        </p>
      </div>
    </AppShell>
  );
}
