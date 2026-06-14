import type { TicketDetailField } from "@/types/ticket-detail";
import { getTicketDetailFieldIcon } from "@/lib/ticket-detail-fields";

interface TicketDetailFieldsSectionProps {
  fields: TicketDetailField[];
}

export function TicketDetailFieldsSection({
  fields,
}: TicketDetailFieldsSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Ticket Details</h2>
        <p className="mt-1 text-sm text-muted">
          Informasi lengkap mengenai tiket ini
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const iconConfig = getTicketDetailFieldIcon(field.fieldKey);
          const Icon = iconConfig.icon;

          return (
            <div
              key={field.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/70 p-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconConfig.containerClassName}`}
              >
                <Icon className={`h-5 w-5 ${iconConfig.iconClassName}`} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">
                  {field.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {field.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TicketDetailFieldsSectionSkeleton() {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-5 space-y-2">
        <div className="h-6 w-36 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-surface-muted"
          />
        ))}
      </div>
    </section>
  );
}
