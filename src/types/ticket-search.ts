import { z } from "zod";
import type { TicketListItem, TicketListResponse } from "@/types/ticket-list";

const searchTicketSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ref: z.string(),
  subject: z.string(),
  urgency: z.number().optional(),
  date_created: z.string().nullable().optional(),
  date_status: z.string().nullable().optional(),
  person: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().nullable().optional(),
      primary_email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  agent: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  ticketStatus: z
    .object({
      id: z.string(),
    })
    .nullable()
    .optional(),
});

const ticketSearchResponseSchema = z.object({
  data: z.object({
    ticketFulltextSearch: z.object({
      tickets: z.array(
        z.object({
          ticket: searchTicketSchema,
        }),
      ),
    }),
  }),
});

function mapSearchTicket(
  raw: z.infer<typeof searchTicketSchema>,
): TicketListItem {
  return {
    id: String(raw.id),
    ref: raw.ref,
    subject: raw.subject,
    status: raw.ticketStatus?.id ?? "unknown",
    urgency: raw.urgency ?? 0,
    dateCreated: raw.date_created ?? null,
    dateUserWaiting: null,
    dateStatus: raw.date_status ?? null,
    person: raw.person?.name
      ? {
          name: raw.person.name,
          email: raw.person.primary_email ?? "",
        }
      : null,
    personId: raw.person?.id != null ? String(raw.person.id) : null,
    agentId: raw.agent?.id != null ? String(raw.agent.id) : null,
    assignedAgent: raw.agent?.name ?? null,
    labels: [],
    slaStatus: null,
  };
}

export function normalizeTicketSearchResponse(
  data: unknown,
  perPage: number,
): TicketListResponse {
  const parsed = ticketSearchResponseSchema.parse(data);
  const tickets = parsed.data.ticketFulltextSearch.tickets.map((entry) =>
    mapSearchTicket(entry.ticket),
  );

  return {
    totalCount: tickets.length,
    tickets,
    offset: 0,
    limit: perPage,
  };
}

export const ticketSearchQuerySchema = z.object({
  q: z.string().trim().min(2),
  perPage: z.coerce.number().int().min(1).max(250).default(250),
});

export type TicketSearchQueryParams = z.infer<typeof ticketSearchQuerySchema>;

export function splitSearchResults(
  tickets: TicketListItem[],
  searchTerm: string,
): { idMatches: TicketListItem[]; tickets: TicketListItem[] } {
  const normalizedTerm = searchTerm.trim();
  const idMatches = tickets.filter(
    (ticket) => ticket.id === normalizedTerm,
  );

  return {
    idMatches,
    tickets,
  };
}

export function formatRelativeDays(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const diffMs = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) {
    return null;
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    return "today";
  }

  return days === 1 ? "1 day" : `${days} days`;
}
