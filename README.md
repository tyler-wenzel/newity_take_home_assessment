# Document Checklist

A small internal tool for the loan operations team to see which SBA loan applications still have
outstanding documents.

Today that tracking lives in a spreadsheet, where it is hard to tell at a glance which files need
attention. This app replaces the read-and-scan part of that workflow with two screens:

- **Borrower queue** — every application with a count of outstanding documents, the application
  date, the assigned coordinator, and a flag for any expired document. Coordinators can search by
  borrower, filter by coordinator or expired-only, and sort by outstanding count or application
  date. The list pages 15 at a time, and clicking any row opens that application.
- **Checklist** — the documents on file for one application, each with an editable status and an
  optional canned note. Edits save immediately and the queue's outstanding count and expired flag
  recompute, so the list never goes stale.

The sample dataset is 60 applications and 620 documents, of which 26 applications have at least one
expired document.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Python | 3.9 or newer | Verified on 3.9.6 |
| Node.js | 20.19+ or 22.12+ | Verified on 23.11.0. Vite 8 requires `^20.19.0 \|\| >=22.12.0`, so Node 21.x and 22.0–22.11 will not work |
| npm | 9 or newer | Verified on 10.9.2 |

No database server is needed. Persistence is a local SQLite file that the backend creates and seeds
on first start.

The backend seeds from `project_context/NEWITY_Sample_Data_A_Document_Checklist.csv`, so that file
must be present at that path relative to the repository root before you start the API.

## Running the app

The app needs two processes running at once, so use two terminals. **Start the backend first** — the
frontend has no data without it.

### 1. Backend (terminal 1)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

This serves the API at <http://127.0.0.1:8000>, with interactive docs at
<http://127.0.0.1:8000/docs>.

On the first run it creates `backend/app.db` and seeds it from the sample CSV. Later runs reuse the
existing file, so any edits you make are kept. To reset back to the original sample data, stop the
server, delete `backend/app.db`, and start it again.

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Then open <http://localhost:5173>.

The API base URL is hardcoded to `http://127.0.0.1:8000` in `frontend/src/api/client.ts`, and the
backend only allows CORS from port 5173. If you need to run either on a different port, both of
those need updating.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/applications` | Every application with its outstanding count and expired flag |
| GET | `/applications/{application_id}` | One application plus the documents on file for it |
| PATCH | `/checklist-items` | Update a document's status, note, or both |

## Layout

```
backend/     FastAPI app: main, controller, service, db, schemas
frontend/    Vite + React + TypeScript
  src/pages/       data fetching and page state
  src/components/  presentational components
  src/utils/       filtering, sorting, and pagination logic
```

## Key decisions

### Product

1. **The problem being solved is visibility into outstanding documents, and only that.** Of the five
   requests in the brief, this build covers outstanding-application visibility and per-application
   status tracking. Email alerts and the leadership dashboard were deliberately cut — they are not
   the reason files stall.
2. **Outstanding means Pending, Expired, Under Review, or Received; only Approved and Not Required
   count as finished.** Received stays in the outstanding bucket because the data cannot tell us
   whether anyone has reviewed the document yet, and excluding it risks hiding a file that still
   needs work.
3. **A document is expired only when its status says so — never inferred from `expiration_date`.**
   In the sample data those dates are frequently missing or contradict the status. Flagging a
   status-expired file with no date is a visible, correctable error; silently missing one because
   the date column was blank is not.
4. **Editing a document updates the queue immediately.** After a status or note change, the
   outstanding count and expired flag are recomputed server-side, so the queue a coordinator
   returns to always reflects the work they just did.

### Technical

1. **React + Vite frontend, FastAPI backend, SQLite for storage.** Three coordinators need to see
   each other's updates, which rules out browser-local storage. SQLite is a single file with no
   service to run, which is enough for a handful of local users and keeps setup to one command.
2. **The API is layered into controller, service, db, and schemas.** The controller stays
   HTTP-only, the service owns the outstanding and expired rules, and Pydantic schemas validate
   writes. Outstanding and expired are computed server-side because they require joining
   applications to their documents.
3. **Filtering, sorting, and pagination are frontend concerns.** `GET /applications` takes no
   parameters and returns the full list; the UI derives the view from it through three
   single-purpose functions in `src/utils`. At 60 records this is faster than round-tripping, and it
   keeps presentation choices out of the API contract.
4. **A checklist item is identified by borrower plus document type, and PATCH accepts status,
   comment, or both.** Accepting both in one request matters because changing a status often has to
   clear a note written for the previous status, and doing that in two calls could half-apply.

A fuller list of the decisions behind this build, including the ones that were reversed, is in
`project_decisions.md`.

## Known gaps

- **Concurrent edits are last-write-wins.** There is no version check on update, so if two
  coordinators change the same document at the same time, one change is silently overwritten.
- **No automated tests yet.** The filtering, sorting, and pagination helpers are pure functions and
  are the intended first target, followed by contract tests on the three routes.
- **The TypeScript API types are hand-written** in `frontend/src/api/client.ts` and can drift from
  the Pydantic schemas without anything failing to compile. Generating them from the OpenAPI schema
  would remove that risk.
