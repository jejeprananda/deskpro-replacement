"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DATE_USER_WAITING_FILTER_ID,
  pickDefaultBucketWithTickets,
} from "@/lib/ticket-filter-labels";
import { useTicketFilterCounts } from "@/hooks/useTicketFilterCounts";
import type { TicketScope, WaitingSort } from "@/types/ticket-list";

const DEFAULT_LIMIT = 10;

export function useTicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const filterId =
    searchParams.get("filterId") ?? DATE_USER_WAITING_FILTER_ID;
  const bucket = searchParams.get("bucket");
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT));
  const waitingSortParam = searchParams.get("waitingSort");
  const waitingSort: WaitingSort | null =
    waitingSortParam === "asc" || waitingSortParam === "desc"
      ? waitingSortParam
      : null;
  const scopeParam = searchParams.get("scope");
  const scope: TicketScope = scopeParam === "mine" ? "mine" : "all";

  const filterCountsQuery = useTicketFilterCounts({ scope });

  const buckets = useMemo(
    () => filterCountsQuery.data?.dateUserWaiting.buckets ?? [],
    [filterCountsQuery.data?.dateUserWaiting.buckets],
  );

  const selectedBucketLabel = useMemo(() => {
    if (!bucket) {
      return null;
    }

    const bucketLabel =
      buckets.find((item) => item.value === bucket)?.label ?? bucket;

    if (scope === "mine") {
      return `My Ticket · ${bucketLabel}`;
    }

    return bucketLabel;
  }, [bucket, buckets, scope]);

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

  const buildTicketsListHref = useCallback(
    (options?: { resetOffset?: boolean }) => {
      const params = new URLSearchParams();
      params.set("filterId", filterId);
      if (bucket) {
        params.set("bucket", bucket);
      }
      const effectiveOffset =
        options?.resetOffset === false ? offset : 0;
      if (effectiveOffset > 0) {
        params.set("offset", String(effectiveOffset));
      }
      if (limit !== DEFAULT_LIMIT) {
        params.set("limit", String(limit));
      }
      if (waitingSort) {
        params.set("waitingSort", waitingSort);
      }
      if (scope === "mine") {
        params.set("scope", "mine");
      }
      const query = params.toString();
      return query ? `/tickets?${query}` : "/tickets";
    },
    [bucket, filterId, limit, offset, scope, waitingSort],
  );

  const returnToTicketsList = useCallback(
    async (options?: { resetOffset?: boolean }) => {
      const href = buildTicketsListHref(options);
      router.push(href);

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["tickets", "list"] }),
        queryClient.refetchQueries({ queryKey: ["tickets", "filter-counts"] }),
        queryClient.refetchQueries({
          queryKey: ["tickets", "status-summary"],
        }),
      ]);
    },
    [buildTicketsListHref, queryClient, router],
  );

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
      if (waitingSort) {
        params.set("waitingSort", waitingSort);
      }
      if (scope === "mine") {
        params.set("scope", "mine");
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
    [bucket, filterId, limit, offset, scope, waitingSort],
  );

  const handleScopeChange = useCallback(
    (nextScope: TicketScope) => {
      const effectiveBucket =
        bucket ?? pickDefaultBucketWithTickets(buckets);

      if (nextScope === "mine") {
        updateSearchParams({
          scope: "mine",
          bucket: effectiveBucket,
          offset: "0",
        });
        return;
      }

      updateSearchParams({
        scope: null,
        bucket: effectiveBucket,
        offset: "0",
      });
    },
    [bucket, buckets, updateSearchParams],
  );

  const handleWaitingSortChange = useCallback(() => {
    const nextSort: WaitingSort = waitingSort === "desc" ? "asc" : "desc";
    updateSearchParams({
      waitingSort: nextSort,
      offset: "0",
    });
  }, [updateSearchParams, waitingSort]);

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

  useEffect(() => {
    if (pathname !== "/tickets" || bucket || !filterCountsQuery.isSuccess) {
      return;
    }

    const defaultBucket = pickDefaultBucketWithTickets(buckets);
    updateSearchParams({
      filterId: DATE_USER_WAITING_FILTER_ID,
      bucket: defaultBucket,
      offset: "0",
    });
  }, [
    bucket,
    buckets,
    filterCountsQuery.isSuccess,
    pathname,
    updateSearchParams,
  ]);

  return {
    filterId,
    bucket,
    scope,
    offset: Number.isFinite(offset) ? offset : 0,
    limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
    waitingSort,
    buckets,
    selectedBucketLabel,
    filterCountsQuery,
    handleSelectBucket,
    handlePreviousPage,
    handleNextPage,
    handlePageChange,
    handleLimitChange,
    handleWaitingSortChange,
    handleScopeChange,
    buildTicketsListHref,
    buildTicketDetailHref,
    returnToTicketsList,
  };
}
