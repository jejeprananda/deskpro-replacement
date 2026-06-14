import { formatBucketLabel } from "@/lib/ticket-filter-labels";
import type { DateUserWaitingBucketItem } from "@/types/ticket-filter-count";
import type { TicketListItem } from "@/types/ticket-list";
import type { TicketStatusSummary } from "@/types/ticket-status-summary";

export type DashboardSlaStatusItem = {
  value: string;
  label: string;
  count: number;
};

export type DashboardResponse = {
  statusSummary: TicketStatusSummary;
  ticketsByAge: DateUserWaitingBucketItem[];
  slaStatus: DashboardSlaStatusItem[];
  slaFailedCount: number;
  recentTickets: TicketListItem[];
  recentTicketsBucket: string;
  recentTicketsBucketLabel: string;
};

const SLA_LABELS: Record<string, string> = {
  ok: "Within SLA",
  warning: "At Risk",
  at_risk: "At Risk",
  fail: "SLA Failed",
};

export function mapSlaSeverityLabel(value: string): string {
  return SLA_LABELS[value] ?? formatBucketLabel(value);
}

export function mapSlaSeverityBuckets(
  buckets: { value: string; count: number }[],
): DashboardSlaStatusItem[] {
  return buckets.map((bucket) => ({
    value: bucket.value,
    label: mapSlaSeverityLabel(bucket.value),
    count: bucket.count,
  }));
}

export function getSlaFailedCount(
  buckets: { value: string; count: number }[],
): number {
  return buckets
    .filter((bucket) => bucket.value === "fail")
    .reduce((sum, bucket) => sum + bucket.count, 0);
}
