import axios from "axios";
import {
  enrichTicketListAgents,
  resolveAgentNames,
} from "@/services/agent-directory.service";
import { DeskproClient } from "@/lib/deskpro-client";
import {
  DATE_USER_WAITING_FILTER_ID,
  formatBucketLabel,
  getBucketFql,
  isDateUserWaitingBucket,
  pickDefaultBucketWithTickets,
  sortDateUserWaitingBuckets,
} from "@/lib/ticket-filter-labels";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  getSlaFailedCount,
  mapSlaSeverityBuckets,
  type DashboardResponse,
} from "@/types/dashboard";
import { ticketFilterCountResponseSchema } from "@/types/ticket-filter-count";
import {
  normalizeTicketListResponse,
  shouldEnrichAssignedAgent,
} from "@/types/ticket-list";
import { normalizeTicketStatusSummary } from "@/types/ticket-status-summary";

const TICKET_FILTER_COUNT_HASH =
  "3703cb91e14aaae5341e5ebb9aa09f95706a456a61e406b4528d3299ca04c71b";

const TICKET_FQL_GROUPED_HASH =
  "11288e1444e6bf010469f31f709992d5feab70c550d51f3c0b8791b2e95b59cc";

const RECENT_TICKETS_LIMIT = 5;

const DASHBOARD_FILTER_COUNT_PAYLOAD = [
  {
    operationName: "TicketFilterCount",
    variables: {
      filterId: "4",
      groupBy: [{ enum: "date_user_waiting" }],
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_FILTER_COUNT_HASH,
      },
    },
  },
  {
    operationName: "TicketFilterCount",
    variables: {
      filterId: "13",
      groupBy: [{ enum: "sla_severity" }],
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_FILTER_COUNT_HASH,
      },
    },
  },
  {
    operationName: "TicketFilterCount",
    variables: {
      filterId: "4",
      groupBy: [{ enum: "status" }],
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_FILTER_COUNT_HASH,
      },
    },
  },
] as const;

function mapSubCounts(
  subCounts: Array<{
    value: string;
    count: number;
  }> | null,
): { value: string; count: number }[] {
  if (!subCounts) {
    return [];
  }

  return subCounts.map((item) => ({
    value: item.value,
    count: item.count,
  }));
}

function buildTicketFqlGroupedPayload(params: {
  filterId: string;
  fql: string;
  limit: number;
}) {
  return {
    operationName: "TicketFqlGrouped",
    variables: {
      groupBy: { fieldId: "@none", order: "ASC" },
      orderBy: { fieldId: "ticket.id", order: "DESC" },
      limit: params.limit,
      offset: 0,
      fql: params.fql,
      filterId: params.filterId,
      enableArchiveMode: false,
      loadPersonData: false,
      loadOrganizationData: false,
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_FQL_GROUPED_HASH,
      },
    },
  };
}

async function fetchRecentTickets(bucket: string) {
  if (!isDateUserWaitingBucket(bucket)) {
    throw new Error(`Invalid recent tickets bucket: ${bucket}`);
  }

  const client = await DeskproClient.fromSession();
  const data = await client.post<unknown>(
    "/graphql/TicketFqlGrouped",
    buildTicketFqlGroupedPayload({
      filterId: DATE_USER_WAITING_FILTER_ID,
      fql: getBucketFql(bucket),
      limit: RECENT_TICKETS_LIMIT,
    }),
  );

  const response = normalizeTicketListResponse(data, 0, RECENT_TICKETS_LIMIT);

  const agentIds = response.tickets
    .filter(shouldEnrichAssignedAgent)
    .map((ticket) => ticket.agentId)
    .filter((agentId): agentId is string => agentId != null);

  if (agentIds.length === 0) {
    return response.tickets;
  }

  const agentNames = await resolveAgentNames(agentIds);

  return enrichTicketListAgents(response.tickets, agentNames);
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  try {
    const client = await DeskproClient.fromSession();

    const filterCountData = await client.post<unknown>(
      "/graphql/TicketFilterCount,TicketFilterCount,TicketFilterCount",
      DASHBOARD_FILTER_COUNT_PAYLOAD,
    );

    const parsed = ticketFilterCountResponseSchema.parse(filterCountData);

    if (parsed.length < 3) {
      throw new Error("Incomplete dashboard filter count response");
    }

    const dateUserWaiting = parsed[0].data.myFilterCounts;
    const slaSeverity = parsed[1].data.myFilterCounts;
    const statusEntry = parsed[2];

    const ticketsByAge = sortDateUserWaitingBuckets(
      mapSubCounts(dateUserWaiting.subCounts).map((bucket) => ({
        ...bucket,
        label: formatBucketLabel(bucket.value),
      })),
    );

    const slaBuckets = mapSubCounts(slaSeverity.subCounts);
    const recentTicketsBucket = pickDefaultBucketWithTickets(
      mapSubCounts(dateUserWaiting.subCounts),
    );
    const recentTickets = await fetchRecentTickets(recentTicketsBucket);

    return {
      statusSummary: normalizeTicketStatusSummary(statusEntry),
      ticketsByAge,
      slaStatus: mapSlaSeverityBuckets(slaBuckets),
      slaFailedCount: getSlaFailedCount(slaBuckets),
      recentTickets,
      recentTicketsBucket,
      recentTicketsBucketLabel: formatBucketLabel(recentTicketsBucket),
    };
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[Dashboard] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to fetch dashboard data");
    }

    throw error;
  }
}
