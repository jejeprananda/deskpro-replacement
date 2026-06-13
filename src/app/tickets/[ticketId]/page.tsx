import { requireAuth } from "@/lib/auth";
import { TicketDetailPageShell } from "@/components/tickets/ticket-detail-page-shell";

export default async function TicketDetailPage() {
  await requireAuth();

  return <TicketDetailPageShell />;
}
