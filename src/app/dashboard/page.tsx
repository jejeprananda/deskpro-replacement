import Image from "next/image";
import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function DashboardPage() {
  const session = await requireAuth();
  const { user } = session;

  return (
    <AppShell title="Dashboard">
      <div className="max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.displayName || user.name}
              width={64}
              height={64}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-600">
              {(user.displayName || user.name).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {user.displayName || user.name}
              </h2>
              <p className="text-sm text-zinc-500">{user.name}</p>
            </div>

            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-medium text-zinc-700">Email</dt>
                <dd className="text-zinc-600">{user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700">Timezone</dt>
                <dd className="text-zinc-600">{user.timezone ?? "Not set"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
