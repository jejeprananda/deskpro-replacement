import type { TicketDetailSummary } from "@/types/ticket-detail";

export type TicketDetailHeaderMeta = {
  ref: string;
  subject: string;
  channelLabel: string | null;
  status: string | null;
  priorityLabel: string | null;
  dateCreated: string | null;
  requester: string | null;
  assignedAgent: string | null;
};

export type TicketDetailUrlParams = {
  ref: string | null;
  subject: string | null;
  status: string | null;
  urgency: number | null;
  dateCreated: string | null;
  requester: string | null;
  assignedAgent: string | null;
};

export function parseUrgencyParam(value: string | null): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function urgencyToPriorityLabel(
  urgency: number | null,
): string | null {
  if (urgency == null) {
    return null;
  }

  switch (urgency) {
    case 0:
      return "Low";
    case 1:
      return "Medium";
    case 2:
      return "High";
    case 3:
      return "Critical";
    default:
      return null;
  }
}

export function channelToLabel(
  lastChannelUsed: string | null,
): string | null {
  if (!lastChannelUsed) {
    return null;
  }

  switch (lastChannelUsed.toLowerCase()) {
    case "email":
      return "Email";
    case "form":
      return "Form";
    case "chat":
      return "Chat";
    case "phone":
      return "Phone";
    default:
      return lastChannelUsed.charAt(0).toUpperCase() + lastChannelUsed.slice(1);
  }
}

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildTicketDetailHeaderMeta(input: {
  urlParams: TicketDetailUrlParams;
  summary: TicketDetailSummary | undefined;
  fallbackRef: string;
  fallbackSubject: string;
}): TicketDetailHeaderMeta {
  const channelLabel = channelToLabel(input.summary?.lastChannelUsed ?? null);
  const dateCreated =
    normalizeText(input.urlParams.dateCreated) ??
    normalizeText(input.summary?.dateCreated ?? null);

  return {
    ref: normalizeText(input.urlParams.ref) ?? input.fallbackRef,
    subject:
      normalizeText(input.urlParams.subject) ?? input.fallbackSubject,
    channelLabel,
    status: normalizeText(input.urlParams.status),
    priorityLabel: urgencyToPriorityLabel(input.urlParams.urgency),
    dateCreated,
    requester: normalizeText(input.urlParams.requester),
    assignedAgent: normalizeText(input.urlParams.assignedAgent),
  };
}

export function formatTicketDetailDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
