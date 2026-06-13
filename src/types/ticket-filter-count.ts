import { z } from "zod";
import {
  formatBucketLabel,
  sortDateUserWaitingBuckets,
} from "@/lib/ticket-filter-labels";

const countBadgeSchema: z.ZodType<CountBadgeRaw> = z.lazy(() =>
  z.object({
    type: z.string(),
    value: z.string(),
    count: z.number(),
    subCounts: z.array(countBadgeSchema).nullable(),
  }),
);

const filterCountEntrySchema = z.object({
  data: z.object({
    myFilterCounts: countBadgeSchema,
  }),
});

export const ticketFilterCountResponseSchema = z.array(filterCountEntrySchema);

interface CountBadgeRaw {
  type: string;
  value: string;
  count: number;
  subCounts: CountBadgeRaw[] | null;
}

export type DateUserWaitingBucketItem = {
  value: string;
  label: string;
  count: number;
};

export type TicketFilterCountsResponse = {
  dateUserWaiting: {
    filterId: "4";
    total: number;
    buckets: DateUserWaitingBucketItem[];
  };
  slaSeverity: {
    filterId: "13";
    total: number;
    buckets: { value: string; count: number }[];
  };
};

function mapSubCounts(
  subCounts: CountBadgeRaw[] | null,
): { value: string; count: number }[] {
  if (!subCounts) {
    return [];
  }

  return subCounts.map((item) => ({
    value: item.value,
    count: item.count,
  }));
}

export function normalizeTicketFilterCounts(
  data: unknown,
): TicketFilterCountsResponse {
  const parsed = ticketFilterCountResponseSchema.parse(data);

  const dateUserWaitingEntry = parsed.find(
    (entry) => entry.data.myFilterCounts.value === "4",
  );
  const slaSeverityEntry = parsed.find(
    (entry) => entry.data.myFilterCounts.value === "13",
  );

  if (!dateUserWaitingEntry) {
    throw new Error("date_user_waiting filter counts not found");
  }

  const dateUserWaiting = dateUserWaitingEntry.data.myFilterCounts;
  const slaSeverity = slaSeverityEntry?.data.myFilterCounts;

  const buckets = sortDateUserWaitingBuckets(
    mapSubCounts(dateUserWaiting.subCounts).map((bucket) => ({
      ...bucket,
      label: formatBucketLabel(bucket.value),
    })),
  );

  return {
    dateUserWaiting: {
      filterId: "4",
      total: dateUserWaiting.count,
      buckets,
    },
    slaSeverity: {
      filterId: "13",
      total: slaSeverity?.count ?? 0,
      buckets: mapSubCounts(slaSeverity?.subCounts ?? null),
    },
  };
}
