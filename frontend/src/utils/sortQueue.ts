import type { ApplicationListItem } from "../api/client"

export type QueueSort = "outstanding" | "earliest" | "latest"

function compareDates(
  a: ApplicationListItem,
  b: ApplicationListItem,
  order: "earliest" | "latest",
): number {
  const comparison = a.application_date.localeCompare(b.application_date)
  return order === "latest" ? -comparison : comparison
}

function compareOutstanding(a: ApplicationListItem, b: ApplicationListItem): number {
  return b.outstanding - a.outstanding
}

export function sortQueue(
  applications: ApplicationListItem[],
  sort: QueueSort,
): ApplicationListItem[] {
  return [...applications].sort((a, b) => {
    if (sort === "outstanding") {
      return (
        compareOutstanding(a, b) ||
        compareDates(a, b, "earliest") ||
        a.borrower.localeCompare(b.borrower)
      )
    }
    return (
      compareDates(a, b, sort) ||
      compareOutstanding(a, b) ||
      a.borrower.localeCompare(b.borrower)
    )
  })
}
