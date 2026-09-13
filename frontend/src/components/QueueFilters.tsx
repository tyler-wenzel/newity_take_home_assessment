import { useEffect, useMemo, useState } from "react"
import type { ApplicationListItem } from "../api/client"

type QueueFiltersProps = {
  applications: ApplicationListItem[]
  onFiltered: (applications: ApplicationListItem[]) => void
}

const fieldClass =
  "mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200"

function applyFilters(
  applications: ApplicationListItem[],
  search: string,
  earliest: string,
  latest: string,
  coordinator: string,
  expiredOnly: boolean,
): ApplicationListItem[] {
  const query = search.trim().toLowerCase()
  return applications.filter((application) => {
    if (query && !application.borrower.toLowerCase().includes(query)) {
      return false
    }
    if (earliest && application.application_date < earliest) {
      return false
    }
    if (latest && application.application_date > latest) {
      return false
    }
    if (coordinator && application.coordinator !== coordinator) {
      return false
    }
    if (expiredOnly && !application.expired) {
      return false
    }
    return true
  })
}

export function QueueFilters({ applications, onFiltered }: QueueFiltersProps) {
  const [search, setSearch] = useState("")
  const [earliest, setEarliest] = useState("")
  const [latest, setLatest] = useState("")
  const [coordinator, setCoordinator] = useState("")
  const [expiredOnly, setExpiredOnly] = useState(false)

  const coordinators = useMemo(
    () =>
      Array.from(new Set(applications.map((application) => application.coordinator))).sort(),
    [applications],
  )

  useEffect(() => {
    onFiltered(applyFilters(applications, search, earliest, latest, coordinator, expiredOnly))
  }, [applications, search, earliest, latest, coordinator, expiredOnly, onFiltered])

  return (
    <form
      className="mb-6 grid grid-cols-1 items-end gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
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
        From
        <input
          className={fieldClass}
          type="date"
          value={earliest}
          onChange={(event) => setEarliest(event.target.value)}
        />
      </label>
      <label className="text-xs font-medium text-stone-500">
        To
        <input
          className={fieldClass}
          type="date"
          value={latest}
          onChange={(event) => setLatest(event.target.value)}
        />
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
