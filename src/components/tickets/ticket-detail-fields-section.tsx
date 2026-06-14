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
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-900">Ticket Details</h2>
        <p className="mt-1 text-sm text-zinc-500">
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
              className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconConfig.containerClassName}`}
              >
                <Icon className={`h-5 w-5 ${iconConfig.iconClassName}`} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500">
                  {field.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
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
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 space-y-2">
        <div className="h-6 w-36 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-zinc-100"
          />
        ))}
      </div>
    </section>
  );
}
