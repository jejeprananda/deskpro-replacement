"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { TicketFiltersNavSection } from "@/components/tickets/ticket-filters-nav-section";
import { useTicketFilters } from "@/hooks/useTicketFilters";

interface TicketsFilterLayoutProps {
  title: string;
  children: ReactNode;
}

export function TicketsFilterLayout({
  title,
  children,
}: TicketsFilterLayoutProps) {
  const { buckets, bucket, filterCountsQuery, handleSelectBucket } =
    useTicketFilters();

  return (
    <AppShell
      title={title}
      sidebarExtra={
        <TicketFiltersNavSection
          buckets={buckets}
          selectedBucket={bucket}
          onSelectBucket={handleSelectBucket}
          isLoading={filterCountsQuery.isLoading}
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
