import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName = "text-muted",
  isLoading = false,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {isLoading ? "..." : value}
          </p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted ${iconClassName}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
