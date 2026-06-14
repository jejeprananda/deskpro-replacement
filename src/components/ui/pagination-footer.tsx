"use client";

const PAGE_SIZE_OPTIONS = [10, 25, 58] as const;

interface PaginationFooterProps {
  offset: number;
  limit: number;
  totalCount: number;
  isDisabled?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export function PaginationFooter({
  offset,
  limit,
  totalCount,
  isDisabled = false,
  onPageChange,
  onLimitChange,
}: PaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const start = totalCount === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, totalCount);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-4 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Showing {start} to {end} of {totalCount} tickets
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isDisabled || currentPage <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              disabled={isDisabled}
              className={`min-w-8 rounded-md px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "border border-border text-foreground hover:bg-surface-muted"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isDisabled || currentPage >= totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted">
          <select
            value={limit}
            disabled={isDisabled}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export { PAGE_SIZE_OPTIONS };
