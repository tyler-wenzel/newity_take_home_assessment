export const QUEUE_PAGE_SIZE = 15

export type PageResult<T> = {
  items: T[]
  page: number
  pageCount: number
  rangeStart: number
  rangeEnd: number
  total: number
}

/** Clamps `page` into range so a shrinking list can never strand the view on an empty page. */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number = QUEUE_PAGE_SIZE,
): PageResult<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(page, 1), pageCount)
  const start = (current - 1) * pageSize
  const visible = items.slice(start, start + pageSize)

  return {
    items: visible,
    page: current,
    pageCount,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: start + visible.length,
    total,
  }
}
