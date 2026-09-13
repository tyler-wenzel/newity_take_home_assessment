const API_BASE = "http://127.0.0.1:8000"

export type DocumentStatus =
  | "Pending"
  | "Expired"
  | "Under Review"
  | "Received"
  | "Approved"
  | "Not Required"

export type ApplicationListItem = {
  application_id: string
  borrower: string
  application_date: string
  coordinator: string
  outstanding: number
  expired: boolean
}

export type ChecklistItem = {
  document_type: string
  status: DocumentStatus
  comment: string
}

export type ApplicationDetail = {
  application_id: string
  borrower: string
  coordinator: string
  items: ChecklistItem[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error((await response.text()) || response.statusText)
  }
  return response.json() as Promise<T>
}

export function fetchApplications(): Promise<ApplicationListItem[]> {
  return request("/applications")
}

export function fetchApplication(applicationId: string): Promise<ApplicationDetail> {
  return request(`/applications/${encodeURIComponent(applicationId)}`)
}

export function patchChecklistItem(payload: {
  borrower: string
  document_type: string
  status?: DocumentStatus
  comment?: string
}): Promise<ApplicationDetail> {
  return request("/checklist-items", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}
