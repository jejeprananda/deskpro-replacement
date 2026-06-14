"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DATE_USER_WAITING_FILTER_ID } from "@/lib/ticket-filter-labels";
import { useTicketFilterCounts } from "@/hooks/useTicketFilterCounts";

const DEFAULT_LIMIT = 10;

export function useTicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterId =
    searchParams.get("filterId") ?? DATE_USER_WAITING_FILTER_ID;
  const bucket = searchParams.get("bucket");
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT));

  const filterCountsQuery = useTicketFilterCounts();

  const buckets = useMemo(
    () => filterCountsQuery.data?.dateUserWaiting.buckets ?? [],
    [filterCountsQuery.data?.dateUserWaiting.buckets],
  );

  const selectedBucketLabel = useMemo(() => {
    if (!bucket) {
      return null;
    }

    return buckets.find((item) => item.value === bucket)?.label ?? bucket;
  }, [bucket, buckets]);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>, nextPathname = pathname) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      router.replace(query ? `${nextPathname}?${query}` : nextPathname);
    },
    [pathname, router, searchParams],
  );

  const handleSelectBucket = useCallback(
    (nextBucket: string) => {
      const isOnListPage = pathname === "/tickets";
      const nextPathname = isOnListPage ? pathname : "/tickets";
      const updates: Record<string, string | null> = {
        filterId,
        bucket: nextBucket,
        offset: "0",
      };

      if (!isOnListPage) {
        updates.ownerId = null;
        updates.ref = null;
        updates.subject = null;
      }

      updateSearchParams(updates, nextPathname);
    },
    [filterId, pathname, updateSearchParams],
  );

  const buildTicketsListHref = useCallback(() => {
    const params = new URLSearchParams();
    params.set("filterId", filterId);
    if (bucket) {
      params.set("bucket", bucket);
    }
    if (offset > 0) {
      params.set("offset", String(offset));
    }
    if (limit !== DEFAULT_LIMIT) {
      params.set("limit", String(limit));
    }
    const query = params.toString();
    return query ? `/tickets?${query}` : "/tickets";
  }, [bucket, filterId, limit, offset]);

  const buildTicketDetailHref = useCallback(
    (ticket: {
      id: string;
      personId: string | null;
      ref: string;
      subject: string;
      status: string;
      urgency: number;
      dateCreated: string | null;
      assignedAgent: string | null;
      person: { name: string } | null;
    }) => {
      const params = new URLSearchParams();
      params.set("filterId", filterId);
      if (bucket) {
        params.set("bucket", bucket);
      }
      if (offset > 0) {
        params.set("offset", String(offset));
      }
      if (limit !== DEFAULT_LIMIT) {
        params.set("limit", String(limit));
      }
      if (ticket.personId) {
        params.set("ownerId", ticket.personId);
      }
      params.set("ref", ticket.ref);
      params.set("subject", ticket.subject);
      params.set("status", ticket.status);
      params.set("urgency", String(ticket.urgency));
      if (ticket.dateCreated) {
        params.set("dateCreated", ticket.dateCreated);
      }
      if (ticket.assignedAgent) {
        params.set("assignedAgent", ticket.assignedAgent);
      }
      if (ticket.person?.name) {
        params.set("requester", ticket.person.name);
      }
      return `/tickets/${ticket.id}?${params.toString()}`;
    },
    [bucket, filterId, limit, offset],
  );

  const handlePreviousPage = useCallback(() => {
    const nextOffset = Math.max(0, offset - limit);
    updateSearchParams({ offset: String(nextOffset) });
  }, [limit, offset, updateSearchParams]);

  const handleNextPage = useCallback(() => {
    updateSearchParams({ offset: String(offset + limit) });
  }, [limit, offset, updateSearchParams]);

  const handlePageChange = useCallback(
    (page: number) => {
      const nextOffset = Math.max(0, (page - 1) * limit);
      updateSearchParams({ offset: String(nextOffset) });
    },
    [limit, updateSearchParams],
  );

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      updateSearchParams({
        limit: String(nextLimit),
        offset: "0",
      });
    },
    [updateSearchParams],
  );

  return {
    filterId,
    bucket,
    offset: Number.isFinite(offset) ? offset : 0,
    limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
    buckets,
    selectedBucketLabel,
    filterCountsQuery,
    handleSelectBucket,
    handlePreviousPage,
    handleNextPage,
    handlePageChange,
    handleLimitChange,
    buildTicketsListHref,
    buildTicketDetailHref,
  };
}
