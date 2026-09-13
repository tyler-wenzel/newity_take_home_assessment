import type { ChecklistItem as ChecklistItemData, DocumentStatus } from "../api/client"
import { STATUSES, commentLabel, commentsFor } from "../statusComments"

type ChecklistItemProps = {
  item: ChecklistItemData
  disabled: boolean
  onStatusChange: (status: DocumentStatus) => void
  onCommentChange: (comment: string) => void
}

const fieldClass =
  "mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-50 disabled:text-stone-400"

export function ChecklistItem({
  item,
  disabled,
  onStatusChange,
  onCommentChange,
}: ChecklistItemProps) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="mb-4 text-sm font-medium text-stone-900">{item.document_type}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-stone-500">
          Status
          <select
            className={fieldClass}
            value={item.status}
            disabled={disabled}
            onChange={(event) => onStatusChange(event.target.value as DocumentStatus)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-stone-500">
          Comment
          <select
            className={fieldClass}
            value={item.comment}
            disabled={disabled}
            onChange={(event) => onCommentChange(event.target.value)}
          >
            {commentsFor(item.status, item.comment).map((comment) => (
              <option key={comment || "blank"} value={comment}>
                {commentLabel(comment)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  )
}
