import type { ApplicationListItem } from "../api/client"

export type QueueFilterInput = {
  search: string
  coordinator: string
  expiredOnly: boolean
}

export function applyQueueFilters(
  applications: ApplicationListItem[],
  filters: QueueFilterInput,
): ApplicationListItem[] {
  const query = filters.search.trim().toLowerCase()
  return applications.filter((application) => {
    if (query && !application.borrower.toLowerCase().includes(query)) {
      return false
    }
    if (filters.coordinator && application.coordinator !== filters.coordinator) {
      return false
    }
    if (filters.expiredOnly && !application.expired) {
      return false
    }
    return true
  })
}
