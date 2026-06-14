const STATUS_CLASS: Record<string, string> = {
  awaiting_agent: "status-badge-awaiting_agent",
  awaiting_user: "status-badge-awaiting_user",
  in_progress: "status-badge-in_progress",
  on_hold: "status-badge-on_hold",
  resolved: "status-badge-resolved",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = STATUS_CLASS[status] ?? "status-badge-default";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}
