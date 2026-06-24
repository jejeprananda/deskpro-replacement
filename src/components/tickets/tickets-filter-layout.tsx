"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { TicketFiltersNavSection } from "@/components/tickets/ticket-filters-nav-section";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import { useTicketListPrefetch } from "@/hooks/useTicketListPrefetch";

interface TicketsFilterLayoutProps {
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
}

export function TicketsFilterLayout({
  children,
  searchValue,
  onSearchChange,
  onSearchFocus,
}: TicketsFilterLayoutProps) {
  const {
    filterId,
    bucket,
    scope,
    limit,
    waitingSort,
    buckets,
    filterCountsQuery,
    handleSelectBucket,
    handleScopeChange,
  } = useTicketFilters();

  const prefetchTicketList = useTicketListPrefetch();

  const handlePrefetchBucket = useCallback(
    (nextBucket: string) => {
      prefetchTicketList({
        filterId,
        bucket: nextBucket,
        scope,
        offset: 0,
        limit,
        waitingSort,
      });
    },
    [filterId, limit, prefetchTicketList, scope, waitingSort],
  );

  const handleRefreshCounts = useCallback(() => {
    void filterCountsQuery.refetch();
  }, [filterCountsQuery]);

  return (
    <AppShell
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      onSearchFocus={onSearchFocus}
      searchPlaceholder="Search tickets..."
      sidebarExtra={
        <TicketFiltersNavSection
          buckets={buckets}
          selectedBucket={bucket}
          onSelectBucket={handleSelectBucket}
          onPrefetchBucket={handlePrefetchBucket}
          scope={scope}
          onScopeChange={handleScopeChange}
          isLoading={filterCountsQuery.isLoading}
          isRefreshingCounts={filterCountsQuery.isFetching && !filterCountsQuery.isLoading}
          onRefreshCounts={handleRefreshCounts}
          ticketCount={
            filterCountsQuery.isSuccess
              ? (filterCountsQuery.data?.dateUserWaiting.total ?? null)
              : null
          }
          errorMessage={
            filterCountsQuery.isError
              ? "Failed to load filter counts."
              : null
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
