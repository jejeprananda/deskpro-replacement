"use client";

import Link from "next/link";
import type { TicketDetailResponse } from "@/types/ticket-detail";
import { TicketMessageThread } from "@/components/tickets/ticket-message-thread";
import { TicketReplyComposer } from "@/components/tickets/ticket-reply-composer";

interface TicketDetailViewProps {
  ticketId: string;
  ownerId?: string | null;
  ticketRef: string | null;
  ticketSubject: string | null;
  backHref: string;
  detail: TicketDetailResponse | undefined;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function TicketDetailView({
  ticketId,
  ownerId = null,
  ticketRef,
  ticketSubject,
  backHref,
  detail,
  isLoading = false,
  errorMessage = null,
}: TicketDetailViewProps) {
  const headerRef = ticketRef ?? detail?.ticketId ?? "Ticket";
  const headerSubject = ticketSubject ?? "Loading ticket...";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={backHref}
            className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            ← Back to tickets
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-zinc-900">
            {headerRef}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">{headerSubject}</p>
        </div>
      </div>

      {isLoading && !detail ? (
        <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {detail ? (
        <>
          {(detail.fields.length > 0 || detail.organizationFields.length > 0) ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                Ticket fields
              </h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[...detail.fields, ...detail.organizationFields].map(
                  (field) => (
                    <div
                      key={field.id}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                    >
                      <dt className="text-xs uppercase tracking-wide text-zinc-500">
                        {field.id.split(".").slice(1, 2)[0] ?? field.id}
                      </dt>
                      <dd className="mt-1 text-sm text-zinc-800">
                        {field.value}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          ) : null}

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <TicketMessageThread
              messages={detail.messages}
              totalCount={detail.messageTotalCount}
              hasMoreMessages={detail.hasMoreMessages}
            />
          </section>
        </>
      ) : null}

      <TicketReplyComposer
        ticketId={ticketId}
        ownerId={ownerId}
        listHref={backHref}
      />
    </div>
  );
}
