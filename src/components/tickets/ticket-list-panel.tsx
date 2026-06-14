"use client";

import Link from "next/link";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TicketListItem } from "@/types/ticket-list";

interface TicketListPanelProps {
  tickets: TicketListItem[];
  totalCount: number;
  offset: number;
  limit: number;
  selectedBucketLabel: string | null;
  selectedIds?: Set<string>;
  isFetching?: boolean;
  errorMessage?: string | null;
  buildTicketHref: (ticket: TicketListItem) => string;
  onToggleTicket?: (ticketId: string) => void;
  onToggleAll?: (ticketIds: string[]) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
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
  selectedIds,
  isFetching = false,
  errorMessage = null,
  buildTicketHref,
  onToggleTicket,
  onToggleAll,
  onPageChange,
  onLimitChange,
}: TicketListPanelProps) {
  const ticketIds = tickets.map((ticket) => ticket.id);
  const selectedCount = ticketIds.filter((id) => selectedIds?.has(id)).length;
  const allSelected =
    ticketIds.length > 0 && selectedCount === ticketIds.length;
  const isIndeterminate =
    selectedCount > 0 && selectedCount < ticketIds.length;
  const selectionEnabled = selectedIds != null && onToggleTicket != null;
  if (!selectedBucketLabel) {
    return (
      <div className="flex h-full min-h-80 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Pilih filter durasi di sidebar.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {errorMessage ? (
        <div className="border-b border-zinc-200 p-4 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {isFetching && tickets.length === 0 ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-md bg-zinc-100"
            />
          ))}
        </div>
      ) : null}

      {!isFetching && tickets.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-zinc-500">No tickets in this filter.</p>
        </div>
      ) : null}

      {tickets.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                <tr>
                  {selectionEnabled ? (
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = isIndeterminate;
                          }
                        }}
                        onChange={() => onToggleAll?.(ticketIds)}
                        aria-label="Select all tickets"
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  ) : null}
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Requester</th>
                  <th className="px-4 py-3 font-medium">Assigned Agent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Waiting</th>
                  <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const href = buildTicketHref(ticket);
                  const primaryLabel = ticket.labels[0];
                  const isSelected = selectedIds?.has(ticket.id) ?? false;

                  return (
                    <tr
                      key={ticket.id}
                      className={`border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80 ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {selectionEnabled ? (
                        <td className="px-3 py-4 align-top">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleTicket?.(ticket.id)}
                            aria-label={`Select ticket ${ticket.ref}`}
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      ) : null}
                      <td className="px-4 py-4 align-top">
                        <Link
                          href={href}
                          className="font-semibold text-zinc-900 hover:underline"
                        >
                          {ticket.ref}
                        </Link>
                      </td>
                      <td className="max-w-md px-4 py-4 align-top">
                        <Link
                          href={href}
                          className="line-clamp-2 block font-medium text-zinc-900 hover:underline"
                        >
                          {ticket.subject}
                        </Link>
                        {primaryLabel ? (
                          <span
                            className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                            style={{
                              backgroundColor: `${primaryLabel.hex}33`,
                            }}
                          >
                            {primaryLabel.label}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 align-top text-zinc-700">
                        {ticket.person ? (
                          <div>
                            <p className="font-medium text-zinc-900">
                              {ticket.person.name}
                            </p>
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
                      <td className="px-4 py-4 align-top text-zinc-700">
                        {ticket.assignedAgent ?? "-"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-4 align-top text-zinc-700">
                        {formatDate(ticket.dateUserWaiting)}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <SlaBadge status={ticket.slaStatus} />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <RowActionsMenu href={href} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationFooter
            offset={offset}
            limit={limit}
            totalCount={totalCount}
            isDisabled={isFetching}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </>
      ) : null}
    </div>
  );
}
