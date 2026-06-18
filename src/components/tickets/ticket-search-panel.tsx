"use client";

import Link from "next/link";
import { ArrowUpDown, Mail, Search, X } from "lucide-react";
import { useEffect } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { MIN_SEARCH_LENGTH, useTicketSearch } from "@/hooks/useTicketSearch";
import {
  formatRelativeDays,
  splitSearchResults,
} from "@/types/ticket-search";
import type { TicketListItem } from "@/types/ticket-list";

interface TicketSearchPanelProps {
  open: boolean;
  searchTerm: string;
  debouncedTerm: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  buildTicketHref: (ticket: TicketListItem) => string;
}

function PersonAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
      {initial}
    </span>
  );
}

function SearchTicketCard({
  ticket,
  href,
  onNavigate,
}: {
  ticket: TicketListItem;
  href: string;
  onNavigate: () => void;
}) {
  const relativeDays = formatRelativeDays(
    ticket.dateStatus ?? ticket.dateCreated,
  );

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-muted/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0">
              <span className="font-semibold text-foreground">{ticket.id}</span>
              <span className="mt-0.5 block text-xs text-muted">{ticket.ref}</span>
            </div>
            <p className="min-w-0 truncate text-sm font-medium text-foreground">
              {ticket.subject}
            </p>
          </div>
          {ticket.person ? (
            <div className="mt-3 flex items-center gap-3">
              <PersonAvatar name={ticket.person.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {ticket.person.name}
                </p>
                {ticket.person.email ? (
                  <p className="truncate text-xs text-muted">
                    {ticket.person.email}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            {ticket.urgency > 0 ? (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                {ticket.urgency}
              </span>
            ) : null}
          </div>
          {relativeDays ? (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {relativeDays}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function TicketSearchPanel({
  open,
  searchTerm,
  debouncedTerm,
  onSearchChange,
  onClose,
  buildTicketHref,
}: TicketSearchPanelProps) {
  const normalizedDebounced = debouncedTerm.trim();
  const shouldFetch = normalizedDebounced.length >= MIN_SEARCH_LENGTH;

  const searchQuery = useTicketSearch({
    searchTerm: debouncedTerm,
  });

  const tickets = searchQuery.data?.tickets ?? [];
  const { idMatches, tickets: allTickets } = splitSearchResults(
    tickets,
    normalizedDebounced,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const showResults = shouldFetch;
  const isFetching = showResults && searchQuery.isFetching;
  const hasError = showResults && searchQuery.isError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-search-panel-title"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2
            id="ticket-search-panel-title"
            className="text-lg font-semibold text-foreground"
          >
            Search
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search tickets..."
              autoFocus
              className="w-full rounded-lg border border-border bg-surface-muted py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted focus:border-blue-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort</span>
            </label>
            <select
              defaultValue="date_updated"
              disabled
              className="rounded-md border border-border bg-surface-muted px-2 py-1 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-80"
            >
              <option value="date_updated">Date updated</option>
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!showResults ? (
            <p className="text-sm text-muted">
              Type at least {MIN_SEARCH_LENGTH} characters to search.
            </p>
          ) : null}

          {hasError ? (
            <p className="text-sm text-red-600">Failed to search tickets.</p>
          ) : null}

          {isFetching ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg bg-surface-muted"
                />
              ))}
            </div>
          ) : null}

          {showResults && !isFetching && !hasError && tickets.length === 0 ? (
            <p className="text-sm text-muted">No tickets found.</p>
          ) : null}

          {showResults && !isFetching && !hasError && tickets.length > 0 ? (
            <div className="space-y-6">
              {idMatches.length > 0 ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    ID Matches ({idMatches.length})
                  </h3>
                  <div className="space-y-2">
                    {idMatches.map((ticket) => {
                      const href = buildTicketHref(ticket);

                      return (
                        <Link
                          key={`id-${ticket.id}`}
                          href={href}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 transition-colors hover:bg-surface-muted"
                        >
                          <Mail className="h-4 w-4 shrink-0 text-muted" />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="shrink-0">
                                <span className="rounded bg-amber-100 px-1 font-semibold text-foreground dark:bg-amber-950/50">
                                  {ticket.id}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted">
                                  {ticket.ref}
                                </span>
                              </div>
                              <p className="min-w-0 truncate text-sm text-foreground">
                                {ticket.subject}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Tickets ({allTickets.length})
                </h3>
                <div className="space-y-3">
                  {allTickets.map((ticket) => (
                    <SearchTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      href={buildTicketHref(ticket)}
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
