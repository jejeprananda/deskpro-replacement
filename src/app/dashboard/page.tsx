import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";

export default async function DashboardPage() {
  await requireAuth();

  return (
    <AppShell>
      <DashboardPageShell />
    </AppShell>
  );
}
