"use client";

import Link from "next/link";
import type { DashboardSlaStatusItem } from "@/types/dashboard";

const SLA_COLORS: Record<string, string> = {
  ok: "#22c55e",
  warning: "#f59e0b",
  at_risk: "#f59e0b",
  fail: "#ef4444",
};

const DEFAULT_SLA_COLOR = "#94a3b8";

interface SlaStatusPanelProps {
  items: DashboardSlaStatusItem[];
  total: number;
  isLoading?: boolean;
}

function getSlaColor(value: string): string {
  return SLA_COLORS[value] ?? DEFAULT_SLA_COLOR;
}

function buildDonutGradient(items: DashboardSlaStatusItem[]): string {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return "conic-gradient(#e4e4e7 0deg 360deg)";
  }

  let currentAngle = 0;
  const segments = items.map((item) => {
    const angle = (item.count / total) * 360;
    const start = currentAngle;
    currentAngle += angle;
    return `${getSlaColor(item.value)} ${start}deg ${currentAngle}deg`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export function SlaStatusPanel({
  items,
  total,
  isLoading = false,
}: SlaStatusPanelProps) {
  const donutGradient = buildDonutGradient(items);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">SLA Status</h2>
          <p className="mt-1 text-xs text-muted">Current SLA severity</p>
        </div>
        <Link
          href="/tickets?filterId=13"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View tickets
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted">
          No SLA data available
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative h-36 w-36 shrink-0">
            <div
              className="h-full w-full rounded-full"
              style={{ background: donutGradient }}
            />
            <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-surface">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {total}
              </span>
              <span className="text-xs text-muted">Total</span>
            </div>
          </div>

          <ul className="w-full space-y-2">
            {items.map((item) => {
              const percentage =
                total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";

              return (
                <li
                  key={item.value}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getSlaColor(item.value) }}
                    />
                    <span className="truncate text-foreground">{item.label}</span>
                  </div>
                  <span className="shrink-0 tabular-nums text-muted">
                    {item.count} ({percentage}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
