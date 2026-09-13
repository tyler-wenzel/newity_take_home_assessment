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


class ApplicationListItem(BaseModel):
    application_id: str
    borrower: str
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
    borrower: str
    borrower_name: str
    loan_amount: int
    application_date: date
    coordinator: str
    items: list[ChecklistItem]


class ChecklistItemPatch(BaseModel):
    borrower: str
    document_type: DocumentType
    status: Optional[DocumentStatus] = None
    comment: Optional[str] = None

    @model_validator(mode="after")
    def exactly_one_update_field(self) -> "ChecklistItemPatch":
        has_status = self.status is not None
        has_comment = self.comment is not None
        if has_status == has_comment:
            raise ValueError("Provide exactly one of status or comment")
        return self
