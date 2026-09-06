<div align="center">

# SchemaForge AI

**Turn a plain-language app idea into a database schema, ER diagram, and SQL.**

Describe what you want to build — *"a food delivery app where users order from
restaurants"* — and SchemaForge AI designs the tables, columns, keys and
relationships, draws an interactive ER diagram, and generates ready-to-run SQL
for PostgreSQL, MySQL and SQLite. Refine the result with an AI chat assistant
or a manual editor, run a quality analysis, save projects, and export the
schema or SQL to a file.

</div>

---

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [API documentation](#api-documentation)
- [How it works](#how-it-works)
- [Notes](#notes)

---

## Features

| Area | What it does |
| --- | --- |
| **AI schema generation** | Claude turns a natural-language description into a structured schema (project name, tables, columns, data types, primary/foreign keys, relationships). |
| **Schema validation** | Every generated or edited schema is checked: one primary key per table, snake_case names, no duplicate tables/columns, foreign keys backed by real relationships, recognised SQL types. Problems are reported, never silently "fixed". |
| **Interactive ER diagram** | Tables as draggable nodes (columns, types, 🔑/🔗 indicators); edges from the relationships. Zoom, pan, minimap, controls. Rebuilds automatically on every change. |
| **Deterministic SQL** | `CREATE TABLE` + primary keys + foreign keys for **PostgreSQL, MySQL and SQLite**, generated without AI. Switch dialect instantly; copy to clipboard. |
| **AI Database Assistant** | Chat to modify the schema — *"Add a payments table"*, *"Connect payments with orders"*. The AI returns the complete updated schema; unrelated tables are preserved. |
| **Manual schema editor** | Add / delete / rename tables and columns, change data types, toggle primary and foreign keys. FK targets are chosen from existing columns so invalid references can't be created. Table deletes are confirmed. |
| **Schema analyzer** | Read-only advisory pass grouped as **Error / Warning / Suggestion**: missing/composite keys, duplicate columns, invalid FKs, isolated or redundant tables, 1NF issues (list columns, repeating groups), many-to-many without a junction table, and more — each with a title, explanation, affected table and suggested fix. |
| **Project persistence** | Optional PostgreSQL storage: create, open, update and delete projects. A project keeps its id, name, original description, schema JSON, selected SQL dialect, and created/updated timestamps. |
| **Project dashboard** | A card view of saved projects (name, description, dates, dialect) with open / delete / new actions and full loading / empty / error states. |
| **Export** | Download the SQL for the selected dialect (`<project>-<dialect>.sql`) or the schema structure (`<project>-schema.json`) — entirely client-side. |
| **Polish** | Light **and** dark mode (respects OS preference, remembered per browser), responsive/mobile layout, keyboard focus styles, `prefers-reduced-motion` support, consistent typography and spacing. |

Not included yet: authentication.

---

## Screenshots

> _Add screenshots to `docs/screenshots/` and update the links below._

| | |
| --- | --- |
| **Workspace — schema + ER diagram** | ![Workspace](docs/screenshots/workspace.png) |
| **Generated SQL (dialect switcher)** | ![SQL](docs/screenshots/sql.png) |
| **AI Database Assistant** | ![Assistant](docs/screenshots/assistant.png) |
| **Manual schema editor** | ![Editor](docs/screenshots/editor.png) |
| **Schema analysis** | ![Analysis](docs/screenshots/analysis.png) |
| **Project dashboard** | ![Dashboard](docs/screenshots/dashboard.png) |
| **Light mode** | ![Light mode](docs/screenshots/light-mode.png) |

---

## Technology stack

**Frontend**

- React 18 + Vite 6
- JavaScript (no TypeScript)
- Tailwind CSS v4 (via `@tailwindcss/vite`, no config file)
- [`@xyflow/react`](https://reactflow.dev/) for the ER diagram

**Backend**

- Python 3.10+ · FastAPI · Uvicorn
- [Anthropic Claude API](https://docs.anthropic.com/) (`anthropic` SDK) — schema generation and modification only
- SQLAlchemy 2 + `psycopg` 3 — optional project persistence (PostgreSQL)
- Pydantic v2 for request/response models and AI-output validation

**Design principles**

- AI is used **only** for turning language into a schema. SQL generation,
  validation and analysis are 100% deterministic Python.
- The Anthropic API key lives in `backend/.env`, is read only by the backend,
  and is never sent to the frontend or embedded in any export.
- Persistence is optional — the app is fully usable with no database.

---

## Project structure

```
SchemaForge-AI/
├── backend/
│   ├── app/
│   │   ├── main.py                  FastAPI app, CORS, DB lifespan
│   │   ├── config.py               env / .env loading (API key, DATABASE_URL, CORS)
│   │   ├── api/
│   │   │   ├── routes.py            /generate-schema, /generate-sql, /analyze-schema, /modify-schema
│   │   │   └── projects.py          /projects CRUD
│   │   ├── db/
│   │   │   ├── base.py              engine, session, get_db dependency
│   │   │   └── models.py            Project ORM model
│   │   ├── schemas/
│   │   │   ├── schema_models.py     SchemaResponse, GeneratedSchema, ...
│   │   │   └── project_schemas.py   ProjectCreate / Update / Out
│   │   └── services/
│   │       ├── ai_service.py        Claude schema generation + modification
│   │       ├── schema_validator.py  structural validation rules
│   │       ├── schema_analyzer.py   read-only advisory analysis
│   │       ├── project_service.py   project persistence CRUD
│   │       └── sql/                 per-dialect SQL generators + shared renderer
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── schema/              SchemaViewer, TableCard, ColumnRow
│   │   │   ├── er/                  ERDiagram, TableNode, buildGraph
│   │   │   ├── sql/                 SqlView, highlightSql
│   │   │   ├── assistant/           AssistantChat, ChatMessage
│   │   │   ├── editor/              SchemaEditor, TableEditor, ColumnEditor, ConfirmButton
│   │   │   ├── analysis/            AnalysisPanel, FindingCard
│   │   │   ├── projects/            ProjectsBar
│   │   │   ├── dashboard/           Dashboard, ProjectCard
│   │   │   └── export/              ExportBar
│   │   ├── hooks/                   useSchemaGenerator, useSchemaAnalysis, useProjects, useTheme
│   │   ├── lib/                     api.js, schemaEdit.js, dialects.js, download.js
│   │   └── index.css               Tailwind + theme tokens
│   ├── index.html
│   ├── vite.config.js
│   └── .env.example
├── README.md
└── .gitignore
```

---

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- An **Anthropic API key** — <https://console.anthropic.com/>
- *(optional)* **PostgreSQL** 13+ for project persistence

### 1. Clone

```bash
git clone https://github.com/johnsikder312-spec/SchemaForge-AI.git
cd SchemaForge-AI
```

### 2. Backend

```bash
cd backend

python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env          # then edit .env — see "Environment variables"
```

### 3. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env          # optional; defaults are fine for local dev
```

### 4. (optional) PostgreSQL

Create a database and user, then set `DATABASE_URL` in `backend/.env` (below).
Tables are created automatically the first time the backend starts.

```sql
CREATE DATABASE schemaforge;
CREATE USER schemaforge WITH PASSWORD 'schemaforge';
GRANT ALL PRIVILEGES ON DATABASE schemaforge TO schemaforge;
```

---

## Environment variables

### `backend/.env`

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | **Yes** (for AI features) | — | Anthropic API key. Backend-only; never exposed to the client. Without it, `/generate-schema` and `/modify-schema` return `502`. |
| `AI_MODEL` | No | `claude-opus-5` | Claude model used for schema generation/modification. |
| `DATABASE_URL` | No | *(empty)* | PostgreSQL connection URL. Empty → project persistence is disabled and `/projects` returns `503`; everything else works. |
| `FRONTEND_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of allowed CORS origins. |
| `HOST` / `PORT` | No | `0.0.0.0` / `8000` | Informational (pass `--host` / `--port` to uvicorn to actually bind). |

Example:

```dotenv
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-opus-5
DATABASE_URL=postgresql+psycopg://schemaforge:schemaforge@localhost:5432/schemaforge
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### `frontend/.env`

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:8000` | Base URL of the backend API. |

> `.env` files are git-ignored. Only `*.env.example` is committed.

---

## Running the app

Two terminals:

```bash
# terminal 1 — backend
cd backend
.venv\Scripts\Activate.ps1        # or: source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

```bash
# terminal 2 — frontend
cd frontend
npm run dev
```

- App: <http://localhost:5173>
- API: <http://localhost:8000> · interactive docs: <http://localhost:8000/docs>

**Try it:** describe an app → **Generate Database** → the schema, ER diagram
and SQL render → refine with the AI assistant or the manual editor → check the
analysis panel → save the project → export `.sql` / `.json`.

### Production build

```bash
cd frontend && npm run build    # static files in frontend/dist/
```

---

## API documentation

Base URL: `http://localhost:8000`. All bodies are JSON. Errors are
`{ "detail": "<message>" }` (the detail may be multi-line for validation
failures).

### `GET /`

Health check → `{ "message": "SchemaForge AI Backend Running" }`.

### `POST /generate-schema`

Generate a schema from a description (uses Claude).

**Request**

```json
{ "description": "I want to build a food delivery application where users order food from restaurants." }
```

**Response `200`** — the validated schema plus SQL for every dialect:

```json
{
  "project_name": "Food Delivery Platform",
  "tables": [
    {
      "name": "users",
      "columns": [
        { "name": "id",    "type": "INTEGER",      "primary_key": true,  "foreign_key": false },
        { "name": "email", "type": "VARCHAR(255)",  "primary_key": false, "foreign_key": false }
      ]
    }
  ],
  "relationships": [
    { "source_table": "orders", "source_column": "user_id",
      "target_table": "users",  "target_column": "id",
      "relationship_type": "many_to_one" }
  ],
  "sql": {
    "postgresql": "-- PostgreSQL schema ...",
    "mysql":      "-- MySQL schema ...",
    "sqlite":     "-- SQLite schema ..."
  }
}
```

**Errors** — `422` empty description or the generated schema fails validation
(detail lists every problem); `502` AI not configured / rate limited / refused
/ malformed output; `500` unexpected.

### `POST /modify-schema`

Apply a plain-language change to an existing schema (uses Claude). Returns the
**complete** updated schema in the same shape as `/generate-schema`.

**Request**

```json
{
  "current_schema": { "project_name": "...", "tables": [ ... ], "relationships": [ ... ] },
  "request": "Add a payments table connected to orders."
}
```

Same error codes as `/generate-schema`.

### `POST /generate-sql`

Validate a (manually edited) schema and regenerate its SQL. **No AI.**

**Request** — a schema: `{ "project_name": "...", "tables": [ ... ], "relationships": [ ... ] }`
**Response `200`** — same shape as `/generate-schema`.
**Errors** — `422` no tables / validation failure (itemised).

### `POST /analyze-schema`

Read-only advisory analysis. **No AI, never modifies the schema.**

**Request** — a schema (as above).
**Response `200`**

```json
{
  "findings": [
    {
      "category": "error",
      "code": "missing_primary_key",
      "title": "Table has no primary key",
      "explanation": "'logs' has no primary key column ...",
      "table": "logs",
      "solution": "Add a primary key column (for example an auto-incrementing 'id')."
    }
  ],
  "counts": { "error": 1, "warning": 0, "suggestion": 0 }
}
```

### `GET|POST|PUT|DELETE /projects` — project persistence

Requires `DATABASE_URL`; every route returns `503` when persistence is disabled.

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/projects` | — | `200` — list of summaries (`id, name, description, sql_dialect, created_at, updated_at`) |
| `POST` | `/projects` | `{ name, description, schema_data, sql_dialect }` | `201` — full project |
| `GET` | `/projects/{id}` | — | `200` — full project incl. `schema_json`; `404` if missing |
| `PUT` | `/projects/{id}` | any subset of `{ name, description, schema_data, sql_dialect }` | `200` — updated project; `404` if missing |
| `DELETE` | `/projects/{id}` | — | `204`; `404` if missing |

### SQL dialect differences

`sql` is deterministic Python (`backend/app/services/sql/`), one generator per
dialect:

| | Auto-increment primary key | Data types | Foreign keys |
| --- | --- | --- | --- |
| **PostgreSQL** | `SERIAL` / `BIGSERIAL` / `SMALLSERIAL` | native (`BOOLEAN`, `JSONB`, `UUID`, `TIMESTAMP WITH TIME ZONE`, `NUMERIC(p,s)`) | `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY` |
| **MySQL** | `INT … NOT NULL AUTO_INCREMENT` | `TINYINT(1)`, `JSON`, `CHAR(36)`, `DATETIME`, `DECIMAL(p,s)` | `ALTER TABLE … ADD CONSTRAINT` |
| **SQLite** | `INTEGER PRIMARY KEY AUTOINCREMENT` | type affinity: `TEXT` / `INTEGER` / `NUMERIC` / `REAL` / `BLOB` | inline `FOREIGN KEY (…)` inside `CREATE TABLE` |

---

## How it works

1. **Generate** — the description goes to Claude with a strict system prompt;
   the response is parsed into `SchemaResponse` (Pydantic) and then run through
   `schema_validator`. Anything that breaks a rule is reported as a `422`, not
   corrected.
2. **SQL** — the validated schema is compiled to DDL for all three dialects by
   deterministic generators. The frontend caches all three and switches
   instantly.
3. **Modify** — the AI assistant sends the *whole* current schema plus a change
   request; the prompt requires the model to return the entire schema with
   untouched parts preserved. The result is re-validated.
4. **Edit** — the manual editor applies pure, immutable transforms locally
   (`lib/schemaEdit.js`), then calls `/generate-sql` to re-validate and refresh
   SQL. FK targets come from a dropdown of existing columns, so invalid
   references can't be created.
5. **Analyze** — `schema_analyzer` runs a separate advisory pass and the
   frontend re-runs it whenever the schema *structure* changes.
6. **Persist** — projects are stored in PostgreSQL via SQLAlchemy. The schema
   structure is saved (not the generated SQL, which is regenerated on open).

---

## Notes

- Tailwind CSS v4 is configured through the `@tailwindcss/vite` plugin with
  `@import "tailwindcss";` in `src/index.css` — there is no `tailwind.config.js`.
- Light mode is a token remap in `index.css` toggled by `data-theme` on
  `<html>`; the initial value is set before first paint by a tiny script in
  `index.html` (stored choice, else OS preference).
- The AI model defaults to `claude-opus-5`; override with `AI_MODEL`.
- Run the backend and frontend in separate terminals.
