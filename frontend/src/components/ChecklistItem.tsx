import type { ChecklistItem as ChecklistItemData, DocumentStatus } from "../api/client"
import { STATUSES, commentLabel, commentsFor, hasComments } from "../statusComments"

type ChecklistItemProps = {
  item: ChecklistItemData
  disabled: boolean
  onStatusChange: (status: DocumentStatus) => void
  onCommentChange: (comment: string) => void
}

const fieldClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-200 disabled:bg-stone-50 disabled:text-stone-400"

export function ChecklistItem({
  item,
  disabled,
  onStatusChange,
  onCommentChange,
}: ChecklistItemProps) {
  return (
    <tr className="border-t border-stone-200">
      <td className="px-4 py-3 font-medium text-stone-900">{item.document_type}</td>
      <td className="px-4 py-3">
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
      </td>
      <td className="px-4 py-3">
        {hasComments(item.status) ? (
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
        ) : null}
      </td>
    </tr>
  )
}
