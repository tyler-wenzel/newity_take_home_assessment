type QueuePaginationProps = {
  page: number
  pageCount: number
  rangeStart: number
  rangeEnd: number
  total: number
  onPageChange: (page: number) => void
}

const buttonClass =
  "rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-white"

export function QueuePagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPageChange,
}: QueuePaginationProps) {
  if (total === 0) {
    return null
  }

  return (
    <nav
      aria-label="Borrower queue pages"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm tabular-nums text-stone-500">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex items-center gap-3">
        <button
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <span className="text-sm tabular-nums text-stone-500">
          Page {page} of {pageCount}
        </span>
        <button
          className={buttonClass}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </nav>
  )
}
