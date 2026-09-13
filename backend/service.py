from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
from typing import get_args

from db import (
    fetch_application_by_borrower,
    fetch_application_by_id,
    fetch_applications,
    fetch_item_statuses,
    fetch_items_by_application_id,
    fetch_items_by_borrower,
    get_connection,
    update_checklist_item,
)
from schemas import (
    OPEN_STATUSES,
    ApplicationDetail,
    ApplicationListItem,
    ChecklistItem,
    ChecklistItemPatch,
    DocumentStatus,
    DocumentType,
)

STATUS_VALUES = set(get_args(DocumentStatus))
DOCUMENT_TYPE_VALUES = set(get_args(DocumentType))


class InvalidInputError(ValueError):
    pass


class NotFoundError(LookupError):
    pass


def _require_application_id(application_id: object) -> str:
    if not isinstance(application_id, str):
        raise InvalidInputError("application_id must be a string")
    application_id = application_id.strip()
    if not application_id:
        raise InvalidInputError("application_id must be a non-empty string")
    return application_id


def _require_borrower(borrower: object) -> str:
    if not isinstance(borrower, str):
        raise InvalidInputError("borrower must be a string")
    borrower = borrower.strip()
    if not borrower:
        raise InvalidInputError("borrower must be a non-empty string")
    return borrower


def _require_document_type(document_type: object) -> str:
    if not isinstance(document_type, str) or document_type not in DOCUMENT_TYPE_VALUES:
        raise InvalidInputError("document_type is not a valid checklist item")
    return document_type


def _require_status(status: object) -> str:
    if not isinstance(status, str) or status not in STATUS_VALUES:
        raise InvalidInputError("status is not a valid document status")
    return status


def _require_comment(comment: object) -> str:
    if not isinstance(comment, str):
        raise InvalidInputError("comment must be a string")
    return comment


def _as_date(value: object) -> date:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not isinstance(value, str) or not value:
        raise InvalidInputError("date value is missing or not a date")
    return date.fromisoformat(value)


def _as_optional_date(value: object) -> date | None:
    if value is None or value == "":
        return None
    return _as_date(value)


def list_applications() -> list[ApplicationListItem]:
    connection = get_connection()
    try:
        applications = fetch_applications(connection)
        item_statuses = fetch_item_statuses(connection)
    finally:
        connection.close()

    outstanding_by_borrower: dict[str, int] = defaultdict(int)
    expired_by_borrower: dict[str, bool] = defaultdict(bool)
    for row in item_statuses:
        borrower = _require_borrower(row["business_name"])
        status = row["document_status"]
        if not isinstance(status, str) or status not in STATUS_VALUES:
            raise InvalidInputError("stored document_status does not match the database contract")
        if status in OPEN_STATUSES:
            outstanding_by_borrower[borrower] += 1
        if status == "Expired":
            expired_by_borrower[borrower] = True

    items = []
    for row in applications:
        borrower = _require_borrower(row["business_name"])
        coordinator = row["assigned_processor"]
        if not isinstance(coordinator, str):
            raise InvalidInputError("stored assigned_processor must be a string")
        application_id = _require_application_id(row["application_id"])
        items.append(
            ApplicationListItem(
                application_id=application_id,
                borrower=borrower,
                application_date=_as_date(row["application_date"]),
                coordinator=coordinator,
                outstanding=outstanding_by_borrower[borrower],
                expired=expired_by_borrower[borrower],
            )
        )

    return items


def get_application(application_id: object) -> ApplicationDetail:
    application_id = _require_application_id(application_id)
    connection = get_connection()
    try:
        application = fetch_application_by_id(connection, application_id)
        if application is None:
            raise NotFoundError("application not found")
        rows = fetch_items_by_application_id(connection, application_id)
    finally:
        connection.close()

    return _to_application_detail(application, rows)


def patch_checklist_item(payload: ChecklistItemPatch) -> ApplicationDetail:
    borrower = _require_borrower(payload.borrower)
    document_type = _require_document_type(payload.document_type)
    status = _require_status(payload.status) if payload.status is not None else None
    comment = _require_comment(payload.comment) if payload.comment is not None else None

    connection = get_connection()
    try:
        application = fetch_application_by_borrower(connection, borrower)
        if application is None:
            raise NotFoundError("application not found")
        existing_items = fetch_items_by_borrower(connection, borrower)
        if not any(row["document_type"] == document_type for row in existing_items):
            raise NotFoundError("checklist item not found")
        updated = update_checklist_item(
            connection,
            borrower,
            document_type,
            status=status,
            comment=comment,
        )
        if not updated:
            raise NotFoundError("checklist item not found")
        connection.commit()
        rows = fetch_items_by_borrower(connection, borrower)
    finally:
        connection.close()

    return _to_application_detail(application, rows)


def _to_application_detail(application, rows) -> ApplicationDetail:
    items = [
        ChecklistItem(
            document_type=_require_document_type(row["document_type"]),
            status=_require_status(row["document_status"]),
            comment=_require_comment(row["notes"]),
            date_received=_as_optional_date(row["date_received"]),
            expiration_date=_as_optional_date(row["expiration_date"]),
        )
        for row in rows
    ]
    items.sort(key=lambda item: item.status not in OPEN_STATUSES)

    loan_amount = application["loan_amount"]
    if not isinstance(loan_amount, int):
        raise InvalidInputError("stored loan_amount must be an integer")
    borrower_name = application["borrower_name"]
    coordinator = application["assigned_processor"]
    application_id = application["application_id"]
    if not all(isinstance(value, str) for value in (borrower_name, coordinator, application_id)):
        raise InvalidInputError("stored application fields do not match the database contract")

    return ApplicationDetail(
        application_id=application_id,
        borrower=_require_borrower(application["business_name"]),
        borrower_name=borrower_name,
        loan_amount=loan_amount,
        application_date=_as_date(application["application_date"]),
        coordinator=coordinator,
        items=items,
    )
