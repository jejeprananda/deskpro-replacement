"use client";

import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Mail,
  PauseCircle,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { TicketStatusSummary } from "@/types/ticket-status-summary";

interface DashboardStatCardsProps {
  summary: TicketStatusSummary;
  isLoading?: boolean;
}

export function DashboardStatCards({
  summary,
  isLoading = false,
}: DashboardStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Total Tickets"
        value={summary.total}
        icon={Mail}
        iconClassName="text-blue-600"
        isLoading={isLoading}
      />
      <StatCard
        label="Awaiting Agent"
        value={summary.awaitingAgent}
        icon={Clock3}
        iconClassName="text-amber-500"
        isLoading={isLoading}
      />
      <StatCard
        label="In Progress"
        value={summary.inProgress}
        icon={CircleDot}
        iconClassName="text-blue-500"
        isLoading={isLoading}
      />
      <StatCard
        label="On Hold"
        value={summary.onHold}
        icon={PauseCircle}
        iconClassName="text-purple-500"
        isLoading={isLoading}
      />
      <StatCard
        label="Resolved"
        value={summary.resolved}
        icon={CheckCircle2}
        iconClassName="text-emerald-500"
        isLoading={isLoading}
      />
    </div>
  );
}
