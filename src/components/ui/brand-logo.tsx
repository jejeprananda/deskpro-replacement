import { APP_NAME } from "@/lib/app-config";

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-white"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L20 7v10l-8 5-8-5V7l8-5zm0 3.2L7.5 8.5 12 11.8l4.5-3.3L12 5.2zM6.5 10.2V16l5.5 3.4V13.6L6.5 10.2zm11 0l-5.5 3.4v5.8L17.5 16v-5.8z" />
        </svg>
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            Jeje&apos;s
          </p>
          <p className="truncate text-[11px] leading-tight text-muted">
            Ticket Manager
          </p>
        </div>
      ) : (
        <span className="sr-only">{APP_NAME}</span>
      )}
    </div>
  );
}
