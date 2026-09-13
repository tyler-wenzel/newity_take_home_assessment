from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

DocumentStatus = Literal[
    "Pending",
    "Expired",
    "Under Review",
    "Received",
    "Approved",
    "Not Required",
]

DocumentType = Literal[
    "Bank Statements (90 day)",
    "Ownership Verification",
    "Articles of Incorporation",
    "Business Licenses & Permits",
    "Personal Tax Returns (3yr)",
    "Lease Agreement",
    "Business Tax Returns (3yr)",
    "Business Financial Statements",
    "Insurance Verification",
    "SBA Form 1919",
    "SBA Form 912",
    "Debt Schedule",
]

OPEN_STATUSES: tuple[DocumentStatus, ...] = (
    "Pending",
    "Expired",
    "Under Review",
    "Received",
)

COMMENTS_BY_STATUS: dict[DocumentStatus, tuple[str, ...]] = {
    "Pending": (
        "",
        "Borrower contacted via email",
        "Waiting on borrower",
        "Requested from borrower 2/3",
        "Follow-up call scheduled",
        "Second request sent",
    ),
    "Under Review": (
        "",
        "Reviewing for completeness",
        "Verifying with third party",
        "Minor discrepancy noted",
    ),
    "Expired": (
        "Document expired - replacement requested",
        "Expired - needs updated statements",
    ),
    "Not Required": (
        "Waived per SBA guidelines",
        "Not applicable for this loan type",
        "Exempt - sole proprietorship",
    ),
    "Received": ("",),
    "Approved": ("",),
}

ALLOWED_COMMENTS = frozenset(
    comment for comments in COMMENTS_BY_STATUS.values() for comment in comments
)


class ApplicationListItem(BaseModel):
    vendor: str
    application_date: date
    coordinator: str
    outstanding: int = Field(ge=0)
    expired: bool


class ChecklistItem(BaseModel):
    document_type: DocumentType
    status: DocumentStatus
    comment: str
    date_received: Optional[date] = None
    expiration_date: Optional[date] = None


class ApplicationDetail(BaseModel):
    application_id: str
    vendor: str
    borrower_name: str
    loan_amount: int
    application_date: date
    coordinator: str
    items: list[ChecklistItem]


class ChecklistItemPatch(BaseModel):
    vendor: str
    document_type: DocumentType
    status: Optional[DocumentStatus] = None
    comment: Optional[str] = None

    @model_validator(mode="after")
    def exactly_one_update_field(self) -> "ChecklistItemPatch":
        has_status = self.status is not None
        has_comment = self.comment is not None
        if has_status == has_comment:
            raise ValueError("Provide exactly one of status or comment")
        if has_comment and self.comment not in ALLOWED_COMMENTS:
            raise ValueError("comment must be a canned note for a known status")
        return self
