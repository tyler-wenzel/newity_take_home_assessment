import { useNavigate } from "react-router-dom"
import type { ApplicationListItem } from "../api/client"

type QueueTableProps = {
  applications: ApplicationListItem[]
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-")
  return `${Number(month)}/${Number(day)}/${year}`
}

export function QueueTable({ applications }: QueueTableProps) {
  const navigate = useNavigate()

  if (applications.length === 0) {
    return (
      <p className="rounded-lg border border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-500">
        No applications match these filters.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">Outstanding</th>
            <th className="px-4 py-3">Application date</th>
            <th className="px-4 py-3">Borrower</th>
            <th className="px-4 py-3">Coordinator</th>
            <th className="px-4 py-3">Expired</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const checklistPath = `/applications/${application.application_id}`
            return (
              <tr
                className="cursor-pointer border-t border-stone-200 hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
                key={application.application_id}
                onClick={() => navigate(checklistPath)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    navigate(checklistPath)
                  }
                }}
                tabIndex={0}
              >
                <td className="px-4 py-3 text-base font-semibold tabular-nums text-stone-900">
                  {application.outstanding}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {formatDate(application.application_date)}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {application.borrower}
                </td>
                <td className="px-4 py-3 text-stone-600">{application.coordinator}</td>
                <td className="px-4 py-3">
                  {application.expired ? (
                    <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Expired
                    </span>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
