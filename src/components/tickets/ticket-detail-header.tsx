"use client";

import Link from "next/link";
import {
  Calendar,
  FileText,
  MessageSquareReply,
  User,
  UserPlus,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatTicketDetailDate,
  type TicketDetailHeaderMeta,
} from "@/lib/ticket-detail-header";

interface TicketDetailHeaderProps {
  backHref: string;
  headerMeta: TicketDetailHeaderMeta;
}

function scrollToReplyComposer() {
  document
    .getElementById("ticket-reply-composer")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function TicketDetailHeader({
  backHref,
  headerMeta,
}: TicketDetailHeaderProps) {
  const metaItems = [
    headerMeta.status
      ? {
          key: "status",
          label: "Status",
          content: <StatusBadge status={headerMeta.status} />,
        }
      : null,
    headerMeta.priorityLabel
      ? {
          key: "priority",
          label: "Priority",
          content: (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {headerMeta.priorityLabel}
            </span>
          ),
        }
      : null,
    headerMeta.dateCreated
      ? {
          key: "created",
          label: "Created",
          content: (
            <span className="text-sm font-medium text-foreground">
              {formatTicketDetailDate(headerMeta.dateCreated)}
            </span>
          ),
        }
      : null,
    headerMeta.requester
      ? {
          key: "requester",
          label: "Requester",
          content: (
            <span className="text-sm font-medium text-foreground">
              {headerMeta.requester}
            </span>
          ),
        }
      : null,
    headerMeta.assignedAgent
      ? {
          key: "assignedAgent",
          label: "Assigned Agent",
          content: (
            <span className="text-sm font-medium text-foreground">
              {headerMeta.assignedAgent}
            </span>
          ),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item != null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-sm text-muted hover:text-foreground hover:underline"
        >
          ← Back to tickets
        </Link>

        <button
          type="button"
          onClick={scrollToReplyComposer}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <MessageSquareReply className="h-4 w-4" />
          Reply
        </button>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <FileText className="h-6 w-6 text-violet-600" />
          </div>

          <div className="min-w-0 flex-1">
            {headerMeta.channelLabel ? (
              <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                {headerMeta.channelLabel}
              </span>
            ) : null}

            <h1 className="mt-2 text-xl font-semibold text-foreground">
              {headerMeta.ref}
            </h1>
            <p className="mt-1 text-sm text-muted">{headerMeta.subject}</p>
          </div>
        </div>

        {metaItems.length > 0 ? (
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-5">
            {metaItems.map((item) => (
              <div key={item.key} className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {item.label}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {item.key === "created" ? (
                    <Calendar className="h-4 w-4 shrink-0 text-muted" />
                  ) : null}
                  {item.key === "requester" ? (
                    <User className="h-4 w-4 shrink-0 text-muted" />
                  ) : null}
                  {item.key === "assignedAgent" ? (
                    <UserPlus className="h-4 w-4 shrink-0 text-muted" />
                  ) : null}
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function TicketDetailHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-muted" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
    </div>
  );
}
