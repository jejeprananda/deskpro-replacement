import { InvalidTicketBucketError } from "@/lib/errors";

export const DATE_USER_WAITING_FILTER_ID = "4" as const;

const BUCKET_PATTERN =
  /^(\d+)_to_(\d+)_(hours|days|weeks|months)$/;

const UNIT_SECONDS = {
  hours: 3_600,
  days: 86_400,
  weeks: 604_800,
  months: 2_419_200,
} as const;

type DateUserWaitingUnit = keyof typeof UNIT_SECONDS;

export type ParsedDateUserWaitingBucket = {
  minSeconds: number;
  maxSeconds: number;
  unit: DateUserWaitingUnit;
};

function buildDateUserWaitingFql(
  minSeconds: number,
  maxSeconds: number,
): string {
  return `(ticket.date_user_waiting > -${maxSeconds}s AND ticket.date_user_waiting < -${minSeconds + 1}s)`;
}

export function parseDateUserWaitingBucket(
  value: string,
): ParsedDateUserWaitingBucket | null {
  const match = BUCKET_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const min = Number(match[1]);
  const max = Number(match[2]);
  const unit = match[3] as DateUserWaitingUnit;

  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
    return null;
  }

  if (min >= max) {
    return null;
  }

  const unitSeconds = UNIT_SECONDS[unit];
  return {
    minSeconds: min * unitSeconds,
    maxSeconds: max * unitSeconds,
    unit,
  };
}

export function getBucketMinSeconds(value: string): number | null {
  return parseDateUserWaitingBucket(value)?.minSeconds ?? null;
}

export function isDateUserWaitingBucket(value: string): boolean {
  return parseDateUserWaitingBucket(value) != null;
}

function formatBucketLabelFromValue(value: string): string {
  return value.replaceAll("_to_", " - ").replaceAll("_", " ");
}

export function formatBucketLabel(value: string): string {
  return formatBucketLabelFromValue(value);
}

export function getBucketFql(value: string): string {
  const parsed = parseDateUserWaitingBucket(value);
  if (!parsed) {
    throw new InvalidTicketBucketError(value);
  }

  return buildDateUserWaitingFql(parsed.minSeconds, parsed.maxSeconds);
}

export function buildAssignedAgentFql(agentId: string): string {
  return `ticket.agent = ${agentId}`;
}

export function combineFql(...parts: string[]): string {
  return parts.map((part) => `(${part})`).join(" AND ");
}

export function buildMyTicketBucketFql(
  bucket: string,
  agentId: string,
): string {
  return combineFql(getBucketFql(bucket), buildAssignedAgentFql(agentId));
}

export function sortDateUserWaitingBuckets<
  T extends { value: string; count: number },
>(buckets: T[]): T[] {
  return [...buckets].sort((left, right) => {
    const leftMin = getBucketMinSeconds(left.value) ?? Number.MAX_SAFE_INTEGER;
    const rightMin =
      getBucketMinSeconds(right.value) ?? Number.MAX_SAFE_INTEGER;

    if (leftMin !== rightMin) {
      return leftMin - rightMin;
    }

    return left.value.localeCompare(right.value);
  });
}

export function pickDefaultBucketWithTickets(
  buckets: { value: string; count: number }[],
): string {
  const sortedBuckets = sortDateUserWaitingBuckets(buckets);
  const firstWithTickets = sortedBuckets.find((bucket) => bucket.count > 0);

  if (firstWithTickets) {
    return firstWithTickets.value;
  }

  if (sortedBuckets.length > 0) {
    return sortedBuckets[0].value;
  }

  return "1_to_2_days";
}
