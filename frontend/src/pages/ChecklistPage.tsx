import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ChecklistItem } from "../components/ChecklistItem"
import {
  fetchApplication,
  patchChecklistItem,
  type ApplicationDetail,
  type DocumentStatus,
} from "../api/client"
import { OPEN_STATUSES } from "../statusComments"

export function ChecklistPage() {
  const { applicationId } = useParams()
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!applicationId) {
      return
    }
    fetchApplication(applicationId)
      .then(setDetail)
      .catch((err: Error) => setError(err.message))
  }, [applicationId])

  const items = [...(detail?.items ?? [])].sort((left, right) => {
    const leftOpen = OPEN_STATUSES.includes(left.status) ? 0 : 1
    const rightOpen = OPEN_STATUSES.includes(right.status) ? 0 : 1
    return leftOpen - rightOpen
  })

  async function update(documentType: string, change: { status?: DocumentStatus; comment?: string }) {
    if (!detail) {
      return
    }
    setSaving(true)
    setError("")
    try {
      const next = await patchChecklistItem({
        borrower: detail.borrower,
        document_type: documentType,
        ...change,
      })
      setDetail(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="mb-6">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-800">
          Back to queue
        </Link>
      </p>
      {detail ? (
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900">
          {detail.borrower}
        </h1>
      ) : (
        <p className="text-sm text-stone-500">Loading…</p>
      )}
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <ChecklistItem
                key={item.document_type}
                item={item}
                disabled={saving}
                onStatusChange={(status) => update(item.document_type, { status })}
                onCommentChange={(comment) => update(item.document_type, { comment })}
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
