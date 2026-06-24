const STORAGE_KEY = "deskpro-ticket-list-limit";

export const TICKET_LIST_PAGE_SIZE_OPTIONS = [10, 25, 58] as const;

export type TicketListPageSize = (typeof TICKET_LIST_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_TICKET_LIST_LIMIT: TicketListPageSize = 58;

export function isValidTicketListLimit(value: number): value is TicketListPageSize {
  return (TICKET_LIST_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

export function getStoredTicketListLimit(): TicketListPageSize | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return isValidTicketListLimit(parsed) ? parsed : null;
}

export function setStoredTicketListLimit(limit: TicketListPageSize): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, String(limit));
}

export function resolveTicketListLimit(
  urlLimit: string | null,
): TicketListPageSize {
  if (urlLimit) {
    const parsed = Number(urlLimit);
    if (isValidTicketListLimit(parsed)) {
      return parsed;
    }
  }

  return getStoredTicketListLimit() ?? DEFAULT_TICKET_LIST_LIMIT;
}
