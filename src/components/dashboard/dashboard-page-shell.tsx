"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards";
import { RecentTicketsList } from "@/components/dashboard/recent-tickets-list";
import { SlaStatusPanel } from "@/components/dashboard/sla-status-panel";
import { TicketsByAgeChart } from "@/components/dashboard/tickets-by-age-chart";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDashboard } from "@/hooks/useDashboard";

export function DashboardPageShell() {
  const currentUserQuery = useCurrentUser();
  const dashboardQuery = useDashboard();

  const displayName =
    currentUserQuery.data?.user?.displayName ??
    currentUserQuery.data?.user?.name ??
    "Agent";

  const isLoading = dashboardQuery.isLoading;
  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back, {displayName}
        </p>
      </div>

      {dashboardQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load dashboard data. Please refresh the page.
        </div>
      ) : null}

      {!isLoading && data && data.slaFailedCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">SLA Breach Alert</p>
              <p className="mt-0.5 text-sm text-red-700">
                You have {data.slaFailedCount} ticket
                {data.slaFailedCount === 1 ? "" : "s"} with failed SLA.
              </p>
            </div>
          </div>
          <Link
            href="/tickets?filterId=13"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            View SLA tickets
          </Link>
        </div>
      ) : null}

      <DashboardStatCards
        summary={
          data?.statusSummary ?? {
            total: 0,
            awaitingAgent: 0,
            inProgress: 0,
            onHold: 0,
            resolved: 0,
          }
        }
        isLoading={isLoading}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TicketsByAgeChart
          buckets={data?.ticketsByAge ?? []}
          isLoading={isLoading}
        />
        <SlaStatusPanel
          items={data?.slaStatus ?? []}
          total={data?.slaStatus.reduce((sum, item) => sum + item.count, 0) ?? 0}
          isLoading={isLoading}
        />
      </div>

      <RecentTicketsList
        tickets={data?.recentTickets ?? []}
        bucket={data?.recentTicketsBucket ?? "1_to_2_days"}
        bucketLabel={data?.recentTicketsBucketLabel ?? "1 - 2 days"}
        isLoading={isLoading}
      />
    </div>
  );
}
