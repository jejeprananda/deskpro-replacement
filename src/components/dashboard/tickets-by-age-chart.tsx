"use client";

import type { DateUserWaitingBucketItem } from "@/types/ticket-filter-count";

interface TicketsByAgeChartProps {
  buckets: DateUserWaitingBucketItem[];
  isLoading?: boolean;
}

export function TicketsByAgeChart({
  buckets,
  isLoading = false,
}: TicketsByAgeChartProps) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Tickets by Age</h2>
        <p className="mt-1 text-xs text-muted">
          Distribution by waiting duration
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          Loading...
        </div>
      ) : buckets.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          No data available
        </div>
      ) : (
        <div className="flex h-48 items-end gap-2">
          {buckets.map((bucket) => {
            const height = `${Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 8 : 0)}%`;

            return (
              <div
                key={bucket.value}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {bucket.count}
                </span>
                <div className="flex h-36 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                    style={{ height }}
                    title={`${bucket.label}: ${bucket.count}`}
                  />
                </div>
                <span className="line-clamp-2 text-center text-[10px] leading-tight text-muted">
                  {bucket.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
