"use client";

import type { TicketDetailResponse } from "@/types/ticket-detail";
import type { TicketDetailHeaderMeta } from "@/lib/ticket-detail-header";
import {
  TicketDetailFieldsSection,
  TicketDetailFieldsSectionSkeleton,
} from "@/components/tickets/ticket-detail-fields-section";
import {
  TicketDetailHeader,
  TicketDetailHeaderSkeleton,
} from "@/components/tickets/ticket-detail-header";
import { TicketMessageThread } from "@/components/tickets/ticket-message-thread";
import { TicketReplyComposer } from "@/components/tickets/ticket-reply-composer";

interface TicketDetailViewProps {
  ticketId: string;
  ownerId?: string | null;
  headerMeta: TicketDetailHeaderMeta;
  backHref: string;
  detail: TicketDetailResponse | undefined;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function TicketDetailView({
  ticketId,
  ownerId = null,
  headerMeta,
  backHref,
  detail,
  isLoading = false,
  errorMessage = null,
}: TicketDetailViewProps) {
  return (
    <div className="space-y-6">
      {isLoading && !detail ? (
        <>
          <TicketDetailHeaderSkeleton />
          <TicketDetailFieldsSectionSkeleton />
        </>
      ) : (
        <>
          <TicketDetailHeader backHref={backHref} headerMeta={headerMeta} />

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          {detail ? (
            <>
              <TicketDetailFieldsSection fields={detail.fields} />

              <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <TicketMessageThread
                  messages={detail.messages}
                  totalCount={detail.messageTotalCount}
                  hasMoreMessages={detail.hasMoreMessages}
                />
              </section>
            </>
          ) : null}
        </>
      )}

      <TicketReplyComposer
        ticketId={ticketId}
        ownerId={ownerId}
        listHref={backHref}
        snippetContext={{
          requesterName: headerMeta.requester,
          subject:
            headerMeta.subject === "Loading ticket..." ? null : headerMeta.subject,
        }}
      />
    </div>
  );
}
