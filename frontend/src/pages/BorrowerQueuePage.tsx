import { useCallback, useEffect, useState } from "react"
import { QueueFilters } from "../components/QueueFilters"
import { QueuePagination } from "../components/QueuePagination"
import { QueueTable } from "../components/QueueTable"
import { paginate } from "../utils/paginate"
import { fetchApplications, type ApplicationListItem } from "../api/client"

export function BorrowerQueuePage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [filtered, setFiltered] = useState<ApplicationListItem[]>([])
  const [page, setPage] = useState(1)
  const [error, setError] = useState("")

  const onFiltered = useCallback((next: ApplicationListItem[]) => {
    setFiltered(next)
    setPage(1)
  }, [])

  useEffect(() => {
    fetchApplications()
      .then(setApplications)
      .catch((err: Error) => setError(err.message))
  }, [])

  const currentPage = paginate(filtered, page)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900">
        Borrower queue
      </h1>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <QueueFilters applications={applications} onFiltered={onFiltered} />
      <QueueTable applications={currentPage.items} />
      <QueuePagination
        onPageChange={setPage}
        page={currentPage.page}
        pageCount={currentPage.pageCount}
        rangeEnd={currentPage.rangeEnd}
        rangeStart={currentPage.rangeStart}
        total={currentPage.total}
      />
    </main>
  )
}
