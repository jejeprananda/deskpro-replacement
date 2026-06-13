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
  label: string;
  labelText: string;
  prose: string;
  attachment: string;
  timestamp: string;
};

function getMessageStyles(kind: TicketMessageKind): MessageStyles {
  switch (kind) {
    case "agent":
      return {
        container: "border-emerald-700 bg-emerald-50",
        label: "font-semibold text-emerald-900",
        labelText: "Agent",
        prose: "text-emerald-950",
        attachment:
          "border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100",
        timestamp: "text-emerald-700",
      };
    case "note":
      return {
        container: "border-blue-600 bg-blue-50",
        label: "font-semibold text-blue-900",
        labelText: "Note",
        prose: "text-blue-950",
        attachment: "border-blue-200 bg-white text-blue-900 hover:bg-blue-100",
        timestamp: "text-blue-700",
      };
    case "user":
      return {
        container: "border-zinc-200 bg-white",
        label: "font-medium text-zinc-700",
        labelText: "User",
        prose: "text-zinc-800",
        attachment:
          "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
        timestamp: "text-zinc-500",
      };
    default:
      return getMessageStyles("user");
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const MESSAGE_LINK_CLASSES =
  "[&_a]:inline-flex [&_a]:items-center [&_a]:rounded-md [&_a]:border [&_a]:border-blue-200 [&_a]:bg-white [&_a]:px-2.5 [&_a]:py-1 [&_a]:text-xs [&_a]:font-medium [&_a]:text-blue-600 [&_a]:no-underline [&_a]:hover:bg-blue-50 [&_a]:hover:text-blue-700";

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
            className="h-24 animate-pulse rounded-lg bg-zinc-100"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return <p className="text-sm text-red-600">{errorMessage}</p>;
  }

  if (messages.length === 0) {
    return <p className="text-sm text-zinc-500">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Messages</h3>
        <p className="text-xs text-zinc-500">
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
              className={`rounded-lg border p-4 ${styles.container}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className={`text-xs ${styles.label}`}>
                  {styles.labelText} · #{message.messageNumber}
                </p>
                <time className={`text-xs ${styles.timestamp}`}>
                  {formatDate(message.dateCreated)}
                </time>
              </div>

              <TicketMessageHtmlContent
                html={message.html}
                className={`prose prose-sm max-w-none ${styles.prose} ${MESSAGE_LINK_CLASSES}`}
              />

              {message.attachments.length > 0 ? (
                <div className="mt-3 border-t border-zinc-200 pt-3">
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
