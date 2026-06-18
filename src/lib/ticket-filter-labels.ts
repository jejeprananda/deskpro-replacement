export const DATE_USER_WAITING_FILTER_ID = "4" as const;

export const DATE_USER_WAITING_BUCKET_ORDER = [
  "1_to_2_days",
  "2_to_3_days",
  "3_to_4_days",
  "4_to_5_days",
  "5_to_6_days",
  "6_to_7_days",
  "1_to_2_weeks",
  "2_to_3_weeks",
  "3_to_4_weeks",
  "1_to_2_months",
] as const;

export type DateUserWaitingBucket =
  (typeof DATE_USER_WAITING_BUCKET_ORDER)[number];

const DATE_USER_WAITING_LABELS: Record<DateUserWaitingBucket, string> = {
  "1_to_2_days": "1 - 2 days",
  "2_to_3_days": "2 - 3 days",
  "3_to_4_days": "3 - 4 days",
  "4_to_5_days": "4 - 5 days",
  "5_to_6_days": "5 - 6 days",
  "6_to_7_days": "6 - 7 days",
  "1_to_2_weeks": "1 - 2 weeks",
  "2_to_3_weeks": "2 - 3 weeks",
  "3_to_4_weeks": "3 - 4 weeks",
  "1_to_2_months": "1 - 2 months",
};

function buildDateUserWaitingFql(
  minSeconds: number,
  maxSeconds: number,
): string {
  return `(ticket.date_user_waiting > -${maxSeconds}s AND ticket.date_user_waiting < -${minSeconds + 1}s)`;
}

const DATE_USER_WAITING_FQL: Record<DateUserWaitingBucket, string> = {
  "1_to_2_days": buildDateUserWaitingFql(86_400, 172_800),
  "2_to_3_days": buildDateUserWaitingFql(172_800, 259_200),
  "3_to_4_days": buildDateUserWaitingFql(259_200, 345_600),
  "4_to_5_days": buildDateUserWaitingFql(345_600, 432_000),
  "5_to_6_days": buildDateUserWaitingFql(432_000, 518_400),
  "6_to_7_days": buildDateUserWaitingFql(518_400, 604_800),
  "1_to_2_weeks": buildDateUserWaitingFql(604_800, 1_209_600),
  "2_to_3_weeks": buildDateUserWaitingFql(1_209_600, 1_814_400),
  "3_to_4_weeks": buildDateUserWaitingFql(1_814_400, 2_419_200),
  "1_to_2_months":
    "(ticket.date_user_waiting > -4838400s AND ticket.date_user_waiting < -2419201s)",
};

export function isDateUserWaitingBucket(
  value: string,
): value is DateUserWaitingBucket {
  return value in DATE_USER_WAITING_LABELS;
}

export function getBucketLabel(bucket: DateUserWaitingBucket): string {
  return DATE_USER_WAITING_LABELS[bucket];
}

function formatUnknownBucketLabel(value: string): string {
  return value.replaceAll("_to_", " - ").replaceAll("_", " ");
}

export function formatBucketLabel(value: string): string {
  if (isDateUserWaitingBucket(value)) {
    return getBucketLabel(value);
  }

  return formatUnknownBucketLabel(value);
}

export function getBucketFql(bucket: DateUserWaitingBucket): string {
  return DATE_USER_WAITING_FQL[bucket];
}

export function buildAssignedAgentFql(agentId: string): string {
  return `ticket.agent = ${agentId}`;
}

export function combineFql(...parts: string[]): string {
  return parts.map((part) => `(${part})`).join(" AND ");
}

export function buildMyTicketBucketFql(
  bucket: DateUserWaitingBucket,
  agentId: string,
): string {
  return combineFql(getBucketFql(bucket), buildAssignedAgentFql(agentId));
}

export function sortDateUserWaitingBuckets<
  T extends { value: string; count: number },
>(buckets: T[]): T[] {
  const order = new Map<string, number>(
    DATE_USER_WAITING_BUCKET_ORDER.map((value, index) => [value, index]),
  );

  return [...buckets].sort((left, right) => {
    const leftOrder = order.get(left.value) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.value) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export function pickDefaultBucketWithTickets(
  buckets: { value: string; count: number }[],
): DateUserWaitingBucket {
  const countsByValue = new Map(
    buckets.map((bucket) => [bucket.value, bucket.count]),
  );

  for (const bucket of DATE_USER_WAITING_BUCKET_ORDER) {
    if ((countsByValue.get(bucket) ?? 0) > 0) {
      return bucket;
    }
  }

  return "1_to_2_days";
}
