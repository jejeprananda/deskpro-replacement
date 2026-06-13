import { requireAuth } from "@/lib/auth";
import { TicketsPageShell } from "@/components/tickets/tickets-page-shell";

export default async function TicketsPage() {
  await requireAuth();

  return <TicketsPageShell />;
}
