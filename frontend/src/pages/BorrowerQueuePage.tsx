import { useCallback, useEffect, useState } from "react"
import { QueueFilters } from "../components/QueueFilters"
import { QueueTable } from "../components/QueueTable"
import { fetchApplications, type ApplicationListItem } from "../api/client"

export function BorrowerQueuePage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [filtered, setFiltered] = useState<ApplicationListItem[]>([])
  const [error, setError] = useState("")

  const onFiltered = useCallback((next: ApplicationListItem[]) => {
    setFiltered(next)
  }, [])

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900">
        Borrower queue
      </h1>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <QueueFilters applications={applications} onFiltered={onFiltered} />
      <QueueTable applications={filtered} />
    </main>
  )
}
