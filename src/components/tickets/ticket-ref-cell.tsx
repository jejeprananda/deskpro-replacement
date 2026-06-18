import Link from "next/link";

interface TicketRefCellProps {
  href: string;
  ticketId: string;
  ticketRef: string;
  highlightId?: boolean;
}

export function TicketRefCell({
  href,
  ticketId,
  ticketRef,
  highlightId = false,
}: TicketRefCellProps) {
  return (
    <Link href={href} className="block hover:underline">
      <span
        className={`font-semibold text-foreground ${
          highlightId
            ? "rounded bg-amber-100 px-0.5 dark:bg-amber-950/50"
            : ""
        }`}
      >
        {ticketId}
      </span>
      <span className="mt-0.5 block text-xs text-muted">{ticketRef}</span>
    </Link>
  );
}
