"use client";

import { TicketAttachmentAction } from "@/components/tickets/ticket-attachment-action";
import { TicketMessageHtmlContent } from "@/components/tickets/ticket-message-html-content";
import type { TicketMessage, TicketMessageKind } from "@/types/ticket-detail";

interface TicketMessageThreadProps {
  messages: TicketMessage[];
  totalCount: number;
  hasMoreMessages: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
}

type MessageStyles = {
  container: string;
  accentClass: string;
  badgeClass: string;
  labelText: string;
  prose: string;
  attachment: string;
  timestamp: string;
  dividerClass: string;
};

function getMessageStyles(kind: TicketMessageKind): MessageStyles {
  switch (kind) {
    case "agent":
      return {
        container: "border-emerald-200 bg-emerald-50/60",
        accentClass: "border-t-4 border-emerald-500",
        badgeClass:
          "rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
        labelText: "Email",
        prose: "text-emerald-950",
        attachment:
          "border-emerald-200 bg-surface text-emerald-900 hover:bg-emerald-100",
        timestamp: "text-emerald-700",
        dividerClass: "border-emerald-200",
      };
    case "note":
      return {
        container: "border-violet-200 bg-violet-50",
        accentClass: "border-t-4 border-violet-500",
        badgeClass:
          "rounded bg-violet-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
        labelText: "Note",
        prose: "text-violet-950",
        attachment:
          "border-violet-200 bg-surface text-violet-900 hover:bg-violet-100",
        timestamp: "text-violet-700",
        dividerClass: "border-violet-200",
      };
    case "user":
      return {
        container: "border-border bg-surface",
        accentClass: "",
        badgeClass:
          "rounded bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
        labelText: "Form",
        prose: "text-foreground",
        attachment:
          "border-border bg-surface-muted text-foreground hover:bg-surface-muted",
        timestamp: "text-muted",
        dividerClass: "border-border",
      };
    case "unknown":
      return getMessageStyles("note");
    default:
      return getMessageStyles("note");
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const MESSAGE_LINK_CLASSES =
  "[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-md [&_a]:border [&_a]:border-blue-200 [&_a]:bg-surface [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:font-medium [&_a]:text-blue-600 [&_a]:no-underline [&_a]:hover:bg-blue-50 [&_a]:hover:text-blue-700";

export function TicketMessageThread({
  messages,
  totalCount,
  hasMoreMessages,
  isLoading = false,
  errorMessage = null,
}: TicketMessageThreadProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg bg-surface-muted"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  if (messages.length === 0) {
    return <p className="text-sm text-muted">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Messages</h3>
        <p className="text-xs text-muted">
          Showing {messages.length} of {totalCount}
          {hasMoreMessages ? " (load more coming soon)" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {messages.map((message) => {
          const styles = getMessageStyles(message.kind);

          return (
            <article
              key={message.id}
              className={`overflow-hidden rounded-lg border p-4 ${styles.accentClass} ${styles.container}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={styles.badgeClass}>{styles.labelText}</span>
                <div className={`flex items-center gap-2 text-xs ${styles.timestamp}`}>
                  <time dateTime={message.dateCreated}>
                    {formatDate(message.dateCreated)}
                  </time>
                  <span>·</span>
                  <span>#{message.messageNumber}</span>
                </div>
              </div>

              <TicketMessageHtmlContent
                html={message.html}
                messageId={message.id}
                attachments={message.attachments}
                className={`prose prose-sm max-w-none ${styles.prose} ${MESSAGE_LINK_CLASSES}`}
              />

              {message.attachments.length > 0 ? (
                <div className={`mt-3 border-t pt-3 ${styles.dividerClass}`}>
                  <ul className="flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <TicketAttachmentAction attachment={attachment} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
