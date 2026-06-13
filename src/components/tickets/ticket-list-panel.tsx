"use client";

import Link from "next/link";
import type { TicketListItem } from "@/types/ticket-list";

interface TicketListPanelProps {
  tickets: TicketListItem[];
  totalCount: number;
  offset: number;
  limit: number;
  selectedBucketLabel: string | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  buildTicketHref: (ticket: TicketListItem) => string;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SlaBadge({ status }: { status: TicketListItem["slaStatus"] }) {
  if (!status) {
    return <span className="text-zinc-400">-</span>;
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "fail"
          ? "bg-red-100 text-red-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

export function TicketListPanel({
  tickets,
  totalCount,
  offset,
  limit,
  selectedBucketLabel,
  isLoading = false,
  errorMessage = null,
  buildTicketHref,
  onPreviousPage,
  onNextPage,
}: TicketListPanelProps) {
  if (!selectedBucketLabel) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Pilih filter durasi di sidebar.</p>
      </div>
    );
  }

  const hasPreviousPage = offset > 0;
  const hasNextPage = offset + limit < totalCount;

  return (
    <div className="flex min-h-80 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            {selectedBucketLabel}
          </h2>
          <p className="text-xs text-zinc-500">{totalCount} tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage || isLoading}
            className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={!hasNextPage || isLoading}
            className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="p-4 text-sm text-red-600">{errorMessage}</div>
      ) : null}

      {isLoading && tickets.length === 0 ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-md bg-zinc-100"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && tickets.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-zinc-500">No tickets in this filter.</p>
        </div>
      ) : null}

      {tickets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Assigned Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Waiting</th>
                <th className="px-4 py-3 font-medium">SLA</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3 align-top font-medium text-zinc-900">
                    <Link
                      href={buildTicketHref(ticket)}
                      className="text-zinc-900 hover:underline"
                    >
                      {ticket.ref}
                    </Link>
                  </td>
                  <td className="max-w-md px-4 py-3 align-top text-zinc-800">
                    <Link
                      href={buildTicketHref(ticket)}
                      className="line-clamp-2 block hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                    {ticket.labels.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ticket.labels.slice(0, 2).map((label) => (
                          <span
                            key={`${ticket.id}-${label.label}`}
                            className="rounded-full px-2 py-0.5 text-[11px] text-zinc-700"
                            style={{ backgroundColor: `${label.hex}33` }}
                          >
                            {label.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {ticket.person ? (
                      <div>
                        <p>{ticket.person.name}</p>
                        {ticket.person.email ? (
                          <p className="text-xs text-zinc-500">
                            {ticket.person.email}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {ticket.assignedAgent ?? "-"}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {ticket.status}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {formatDate(ticket.dateUserWaiting)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SlaBadge status={ticket.slaStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
