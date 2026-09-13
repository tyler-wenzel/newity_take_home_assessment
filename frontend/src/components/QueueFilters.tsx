import { useEffect, useMemo, useState } from "react"
import type { ApplicationListItem } from "../api/client"
import { applyQueueFilters } from "../utils/applyQueueFilters"
import { sortQueue, type QueueSort } from "../utils/sortQueue"

type QueueFiltersProps = {
  applications: ApplicationListItem[]
  onFiltered: (applications: ApplicationListItem[]) => void
}

const fieldClass =
  "mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"

export function QueueFilters({ applications, onFiltered }: QueueFiltersProps) {
  const [search, setSearch] = useState("")
  const [coordinator, setCoordinator] = useState("")
  const [expiredOnly, setExpiredOnly] = useState(false)
  const [sort, setSort] = useState<QueueSort>("outstanding")

  const coordinators = useMemo(
    () =>
      Array.from(new Set(applications.map((application) => application.coordinator))).sort(),
    [applications],
  )

  useEffect(() => {
    const matched = applyQueueFilters(applications, { search, coordinator, expiredOnly })
    onFiltered(sortQueue(matched, sort))
  }, [applications, search, coordinator, expiredOnly, sort, onFiltered])

  return (
    <form
      className="mb-6 grid grid-cols-1 items-end gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="text-xs font-medium text-stone-500">
        Search borrower
        <input
          className={fieldClass}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label className="text-xs font-medium text-stone-500">
        Sort by
        <select
          className={fieldClass}
          value={sort}
          onChange={(event) => setSort(event.target.value as QueueSort)}
        >
          <option value="outstanding">Most outstanding</option>
          <option value="earliest">Application date: earliest</option>
          <option value="latest">Application date: latest</option>
        </select>
      </label>
      <label className="text-xs font-medium text-stone-500">
        Coordinator
        <select
          className={fieldClass}
          value={coordinator}
          onChange={(event) => setCoordinator(event.target.value)}
        >
          <option value="">All</option>
          {coordinators.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex h-10 items-center gap-2 text-sm text-stone-700">
        <input
          className="h-4 w-4 rounded border-stone-300 text-stone-800"
          type="checkbox"
          checked={expiredOnly}
          onChange={(event) => setExpiredOnly(event.target.checked)}
        />
        Expired only
      </label>
    </form>
  )
}
