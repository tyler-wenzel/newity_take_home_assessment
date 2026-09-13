from __future__ import annotations

import csv
import sqlite3
from datetime import date, datetime
from pathlib import Path
from typing import Optional

BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "app.db"
CSV_PATH = (
    BACKEND_DIR.parent
    / "project_context"
    / "NEWITY_Sample_Data_A_Document_Checklist.csv"
)


def _adapt_date(value: date) -> str:
    return value.isoformat()


def _convert_date(value: bytes) -> date:
    return date.fromisoformat(value.decode())


sqlite3.register_adapter(date, _adapt_date)
sqlite3.register_converter("DATE", _convert_date)


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def _parse_date(value: str) -> Optional[date]:
    value = (value or "").strip()
    if not value:
        return None
    return datetime.strptime(value, "%m/%d/%Y").date()


def init_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS applications (
            application_id TEXT PRIMARY KEY,
            business_name TEXT NOT NULL UNIQUE,
            borrower_name TEXT NOT NULL,
            loan_amount INTEGER NOT NULL,
            application_date DATE NOT NULL,
            assigned_processor TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist_items (
            application_id TEXT NOT NULL,
            document_type TEXT NOT NULL,
            document_status TEXT NOT NULL,
            date_received DATE,
            expiration_date DATE,
            notes TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (application_id, document_type),
            FOREIGN KEY (application_id) REFERENCES applications (application_id)
        );
        """
    )


def seed_from_csv(connection: sqlite3.Connection) -> None:
    existing = connection.execute("SELECT COUNT(*) FROM applications").fetchone()[0]
    if existing:
        return

    applications: dict[str, tuple] = {}
    items: list[tuple] = []

    with CSV_PATH.open(newline="", encoding="utf-8") as csv_file:
        for row in csv.DictReader(csv_file):
            application_id = row["application_id"]
            applications[application_id] = (
                application_id,
                row["business_name"],
                row["borrower_name"],
                int(row["loan_amount"]),
                _parse_date(row["application_date"]),
                row["assigned_processor"],
            )
            items.append(
                (
                    application_id,
                    row["document_type"],
                    row["document_status"],
                    _parse_date(row["date_received"]),
                    _parse_date(row["expiration_date"]),
                    (row["notes"] or "").strip(),
                )
            )

    connection.executemany(
        """
        INSERT INTO applications (
            application_id, business_name, borrower_name, loan_amount,
            application_date, assigned_processor
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        applications.values(),
    )
    connection.executemany(
        """
        INSERT INTO checklist_items (
            application_id, document_type, document_status,
            date_received, expiration_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        items,
    )


def init_db() -> None:
    connection = get_connection()
    try:
        init_schema(connection)
        seed_from_csv(connection)
        connection.commit()
    finally:
        connection.close()


def fetch_applications(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    return connection.execute(
        """
        SELECT application_id, business_name, borrower_name, loan_amount,
               application_date, assigned_processor
        FROM applications
        ORDER BY business_name
        """
    ).fetchall()


def fetch_item_statuses(connection: sqlite3.Connection) -> list[sqlite3.Row]:
    return connection.execute(
        """
        SELECT a.business_name, i.document_status
        FROM checklist_items i
        JOIN applications a ON a.application_id = i.application_id
        """
    ).fetchall()


def _text_param(value: object, name: str) -> str:
    if not isinstance(value, str) or not value:
        raise TypeError(f"{name} must be a non-empty string")
    return value


def fetch_application_by_id(
    connection: sqlite3.Connection, application_id: str
) -> Optional[sqlite3.Row]:
    application_id = _text_param(application_id, "application_id")
    return connection.execute(
        """
        SELECT application_id, business_name, borrower_name, loan_amount,
               application_date, assigned_processor
        FROM applications
        WHERE application_id = ?
        """,
        (application_id,),
    ).fetchone()


def fetch_items_by_application_id(
    connection: sqlite3.Connection, application_id: str
) -> list[sqlite3.Row]:
    application_id = _text_param(application_id, "application_id")
    return connection.execute(
        """
        SELECT document_type, document_status, notes,
               date_received, expiration_date
        FROM checklist_items
        WHERE application_id = ?
        """,
        (application_id,),
    ).fetchall()


def fetch_application_by_borrower(
    connection: sqlite3.Connection, borrower: str
) -> Optional[sqlite3.Row]:
    borrower = _text_param(borrower, "borrower")
    return connection.execute(
        """
        SELECT application_id, business_name, borrower_name, loan_amount,
               application_date, assigned_processor
        FROM applications
        WHERE business_name = ?
        """,
        (borrower,),
    ).fetchone()


def fetch_items_by_borrower(
    connection: sqlite3.Connection, borrower: str
) -> list[sqlite3.Row]:
    borrower = _text_param(borrower, "borrower")
    return connection.execute(
        """
        SELECT i.document_type, i.document_status, i.notes,
               i.date_received, i.expiration_date
        FROM checklist_items i
        JOIN applications a ON a.application_id = i.application_id
        WHERE a.business_name = ?
        """,
        (borrower,),
    ).fetchall()


def update_checklist_item(
    connection: sqlite3.Connection,
    borrower: str,
    document_type: str,
    status: Optional[str] = None,
    comment: Optional[str] = None,
) -> bool:
    borrower = _text_param(borrower, "borrower")
    document_type = _text_param(document_type, "document_type")
    if status is not None:
        status = _text_param(status, "status")
        cursor = connection.execute(
            """
            UPDATE checklist_items
            SET document_status = ?
            WHERE document_type = ?
              AND application_id = (
                  SELECT application_id FROM applications WHERE business_name = ?
              )
            """,
            (status, document_type, borrower),
        )
    else:
        if not isinstance(comment, str):
            raise TypeError("comment must be a string")
        cursor = connection.execute(
            """
            UPDATE checklist_items
            SET notes = ?
            WHERE document_type = ?
              AND application_id = (
                  SELECT application_id FROM applications WHERE business_name = ?
              )
            """,
            (comment, document_type, borrower),
        )
    return cursor.rowcount == 1
