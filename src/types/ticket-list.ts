import { z } from "zod";

const labelSchema = z.object({
  label: z.string(),
  color: z
    .object({
      hex: z.string(),
    })
    .optional(),
});

const ticketSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ref: z.string(),
  subject: z.string(),
  urgency: z.number().optional(),
  date_created: z.string().nullable().optional(),
  date_user_waiting: z.string().nullable().optional(),
  agent: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().nullable().optional(),
      display_name: z.string().nullable().optional(),
      displayName: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  status: z
    .object({
      id: z.string(),
    })
    .nullable()
    .optional(),
  labels: z.array(labelSchema).optional(),
  slas: z
    .array(
      z.object({
        sla_status: z.string(),
      }),
    )
    .optional(),
  person: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().nullable().optional(),
      primary_email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const ticketFqlGroupedResponseSchema = z.object({
  data: z.object({
    ticketFqlGrouped: z.object({
      totalCount: z.number(),
      groups: z.array(
        z.object({
          tickets: z.array(ticketSchema),
        }),
      ),
    }),
  }),
});

export type TicketListItem = {
  id: string;
  ref: string;
  subject: string;
  status: string;
  urgency: number;
  dateCreated: string | null;
  dateUserWaiting: string | null;
  person: { name: string; email: string } | null;
  personId: string | null;
  agentId: string | null;
  assignedAgent: string | null;
  labels: { label: string; hex: string }[];
  slaStatus: "ok" | "fail" | null;
};

export type TicketListResponse = {
  totalCount: number;
  tickets: TicketListItem[];
  offset: number;
  limit: number;
};

function mapAssignedAgent(
  agent: z.infer<typeof ticketSchema>["agent"],
): string | null {
  if (!agent) {
    return null;
  }

  const displayName =
    agent.display_name?.trim() ||
    agent.displayName?.trim() ||
    agent.name?.trim() ||
    null;

  if (displayName) {
    return displayName;
  }

  if (agent.id != null) {
    return String(agent.id);
  }

  return null;
}

function mapTicket(raw: z.infer<typeof ticketSchema>): TicketListItem {
  const primarySla = raw.slas?.[0];

  return {
    id: String(raw.id),
    ref: raw.ref,
    subject: raw.subject,
    status: raw.status?.id ?? "unknown",
    urgency: raw.urgency ?? 0,
    dateCreated: raw.date_created ?? null,
    dateUserWaiting: raw.date_user_waiting ?? null,
    person: raw.person?.name
      ? {
          name: raw.person.name,
          email: raw.person.primary_email ?? "",
        }
      : null,
    personId: raw.person?.id != null ? String(raw.person.id) : null,
    agentId: raw.agent?.id != null ? String(raw.agent.id) : null,
    assignedAgent: mapAssignedAgent(raw.agent),
    labels: (raw.labels ?? []).map((label) => ({
      label: label.label,
      hex: label.color?.hex ?? "#cccccc",
    })),
    slaStatus:
      primarySla?.sla_status === "ok" || primarySla?.sla_status === "fail"
        ? primarySla.sla_status
        : null,
  };
}

export function normalizeTicketListResponse(
  data: unknown,
  offset: number,
  limit: number,
): TicketListResponse {
  const parsed = ticketFqlGroupedResponseSchema.parse(data);
  const grouped = parsed.data.ticketFqlGrouped;
  const tickets = grouped.groups.flatMap((group) =>
    group.tickets.map(mapTicket),
  );

  return {
    totalCount: grouped.totalCount,
    tickets,
    offset,
    limit,
  };
}

export const ticketListQuerySchema = z.object({
  filterId: z.string().default("4"),
  bucket: z.string().min(1),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(58),
});
