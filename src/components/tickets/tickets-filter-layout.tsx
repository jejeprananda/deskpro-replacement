"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { TicketFiltersNavSection } from "@/components/tickets/ticket-filters-nav-section";
import { useTicketFilters } from "@/hooks/useTicketFilters";

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
    bucket,
    scope,
    buckets,
    filterCountsQuery,
    handleSelectBucket,
    handleScopeChange,
  } = useTicketFilters();

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
          scope={scope}
          onScopeChange={handleScopeChange}
          isLoading={filterCountsQuery.isLoading}
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
