"use client";

import Link from "next/link";
import { DATE_USER_WAITING_FILTER_ID } from "@/lib/ticket-filter-labels";
import type { TicketListItem } from "@/types/ticket-list";

interface RecentTicketsListProps {
  tickets: TicketListItem[];
  bucket: string;
  bucketLabel: string;
  isLoading?: boolean;
}

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "-";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function buildRecentTicketHref(ticket: TicketListItem, bucket: string): string {
  const params = new URLSearchParams();
  params.set("filterId", DATE_USER_WAITING_FILTER_ID);
  params.set("bucket", bucket);
  params.set("ref", ticket.ref);
  params.set("subject", ticket.subject);
  params.set("status", ticket.status);
  params.set("urgency", String(ticket.urgency));

  if (ticket.dateCreated) {
    params.set("dateCreated", ticket.dateCreated);
  }

  if (ticket.assignedAgent) {
    params.set("assignedAgent", ticket.assignedAgent);
  }

  if (ticket.personId) {
    params.set("ownerId", ticket.personId);
  }

  if (ticket.person?.name) {
    params.set("requester", ticket.person.name);
  }

  return `/tickets/${ticket.id}?${params.toString()}`;
}

function SlaBadge({ status }: { status: TicketListItem["slaStatus"] }) {
  if (!status) {
    return (
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
        -
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "fail"
          ? "bg-red-100 text-red-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {status === "fail" ? "SLA Failed" : "Within SLA"}
    </span>
  );
}

export function RecentTicketsList({
  tickets,
  bucket,
  bucketLabel,
  isLoading = false,
}: RecentTicketsListProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Recent Tickets</h2>
          <p className="mt-1 text-xs text-zinc-500">
            From tickets waiting {bucketLabel.toLowerCase()}
          </p>
        </div>
        <Link
          href={`/tickets?filterId=${DATE_USER_WAITING_FILTER_ID}&bucket=${bucket}`}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-zinc-400">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-400">
          No recent tickets
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={buildRecentTicketHref(ticket, bucket)}
                className="flex items-start justify-between gap-3 py-3 transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">{ticket.ref}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-zinc-600">
                    {ticket.subject}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <SlaBadge status={ticket.slaStatus} />
                  <span className="text-xs text-zinc-400">
                    {formatRelativeTime(ticket.dateCreated)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
