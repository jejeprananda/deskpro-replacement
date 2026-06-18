import { z } from "zod";

const countBadgeSchema: z.ZodType<CountBadgeRaw> = z.lazy(() =>
  z.object({
    type: z.string(),
    value: z.string(),
    count: z.number(),
    subCounts: z.array(countBadgeSchema).nullable(),
  }),
);

const statusSummaryResponseSchema = z.object({
  data: z.object({
    myFilterCounts: countBadgeSchema,
  }),
});

interface CountBadgeRaw {
  type: string;
  value: string;
  count: number;
  subCounts: CountBadgeRaw[] | null;
}

export type TicketStatusSummary = {
  total: number;
  awaitingAgent: number;
  inProgress: number;
  onHold: number;
  resolved: number;
};

export type TicketStatusSummaryResponse = TicketStatusSummary;

function mapStatusCount(subCounts: CountBadgeRaw[] | null): TicketStatusSummary {
  const buckets = subCounts ?? [];
  const byStatus = new Map(buckets.map((item) => [item.value, item.count]));

  return {
    total: buckets.reduce((sum, item) => sum + item.count, 0),
    awaitingAgent:
      (byStatus.get("awaiting_agent") ?? 0) +
      (byStatus.get("awaiting_user") ?? 0),
    inProgress: byStatus.get("in_progress") ?? 0,
    onHold: byStatus.get("on_hold") ?? 0,
    resolved: byStatus.get("resolved") ?? 0,
  };
}

export function normalizeTicketStatusSummary(data: unknown): TicketStatusSummary {
  const parsed = statusSummaryResponseSchema.parse(data);
  return mapStatusCount(parsed.data.myFilterCounts.subCounts);
}

export function deriveStatusSummaryFromTickets(
  tickets: { status: string }[],
  totalCount: number,
): TicketStatusSummary {
  const counts = {
    awaitingAgent: 0,
    inProgress: 0,
    onHold: 0,
    resolved: 0,
  };

  for (const ticket of tickets) {
    switch (ticket.status) {
      case "awaiting_agent":
      case "awaiting_user":
        counts.awaitingAgent += 1;
        break;
      case "in_progress":
        counts.inProgress += 1;
        break;
      case "on_hold":
        counts.onHold += 1;
        break;
      case "resolved":
        counts.resolved += 1;
        break;
      default:
        break;
    }
  }

  return {
    total: totalCount,
    ...counts,
  };
}

export const ticketStatusSummaryQuerySchema = z
  .object({
    filterId: z.string().default("4"),
    bucket: z.string().min(1).optional(),
    scope: z.enum(["all", "mine"]).default("all"),
  })
  .superRefine((data, ctx) => {
    if (!data.bucket) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bucket is required",
        path: ["bucket"],
      });
    }
  });
