import type { DocumentStatus } from "./api/client"

export const STATUSES: DocumentStatus[] = [
  "Pending",
  "Expired",
  "Under Review",
  "Received",
  "Approved",
  "Not Required",
]

export const OPEN_STATUSES: DocumentStatus[] = [
  "Pending",
  "Expired",
  "Under Review",
  "Received",
]

const COMMENTS_BY_STATUS: Record<DocumentStatus, string[]> = {
  Pending: [
    "",
    "Borrower contacted via email",
    "Waiting on borrower",
    "Requested from borrower 2/3",
    "Follow-up call scheduled",
    "Second request sent",
  ],
  "Under Review": [
    "",
    "Reviewing for completeness",
    "Verifying with third party",
    "Minor discrepancy noted",
  ],
  Expired: [
    "",
    "Document expired - replacement requested",
    "Expired - needs updated statements",
  ],
  "Not Required": [
    "",
    "Waived per SBA guidelines",
    "Not applicable for this loan type",
    "Exempt - sole proprietorship",
  ],
  Received: [""],
  Approved: [""],
}

export function commentsFor(status: DocumentStatus, current?: string): string[] {
  const options = COMMENTS_BY_STATUS[status]
  if (current !== undefined && !options.includes(current)) {
    return [current, ...options]
  }
  return options
}

export function commentLabel(comment: string): string {
  return comment === "" ? "—" : comment
}
