# SchemaForge AI

Describe an application idea in natural language and SchemaForge AI generates a
database schema — project name, tables, columns, data types, primary/foreign
keys, and relationships — an interactive ER diagram, and ready-to-run SQL for
PostgreSQL, MySQL, and SQLite.

## Tech Stack

| Layer    | Tech                                                        |
| -------- | ---------------------------------------------------------- |
| Frontend | React, Vite, JavaScript, Tailwind CSS                       |
| Backend  | Python, FastAPI, Uvicorn, Anthropic Claude API              |
| Storage  | PostgreSQL via SQLAlchemy (optional — project persistence)  |

## Project Structure

```
SchemaForge-AI/
├── frontend/                 React + Vite + Tailwind app
│   └── src/
│       ├── components/       Navbar, Hero, schema/ (viewer), er/ (ER diagram), sql/ (SQL view)
│       ├── hooks/            useSchemaGenerator
│       ├── lib/              api.js  (calls POST /generate-schema)
│       └── data/             example ideas
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app + CORS + DB lifespan
│   │   ├── config.py         env / .env loading (API key, DATABASE_URL)
│   │   ├── api/
│   │   │   ├── routes.py     schema generation / SQL / analysis endpoints
│   │   │   └── projects.py   /projects CRUD
│   │   ├── db/               SQLAlchemy engine, session, Project model
│   │   ├── schemas/          Pydantic models
│   │   └── services/
│   │       ├── ai_service.py         Claude-powered schema generation
│   │       ├── schema_validator.py   structural validation rules
│   │       ├── schema_analyzer.py    read-only advisory analysis
│   │       ├── project_service.py    project persistence CRUD
│   │       └── sql/                  deterministic per-dialect SQL (pg / mysql / sqlite)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                  (git-ignored — your real key goes here)
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- An Anthropic API key (https://console.anthropic.com/)

## Backend — setup and run

```bash
cd backend

python -m venv .venv
# Windows (PowerShell):  .venv\Scripts\Activate.ps1
# macOS / Linux:         source .venv/bin/activate

pip install -r requirements.txt

# configure secrets
cp .env.example .env          # then edit .env and set ANTHROPIC_API_KEY=...

# run (note the app.main path)
uvicorn app.main:app --reload --port 8000
```

- http://localhost:8000/ → `{"message": "SchemaForge AI Backend Running"}`
- http://localhost:8000/docs → interactive API docs

The API key is read only by the backend (`app/config.py`) and is never sent to
the frontend.

### Project persistence (optional)

Schema generation, editing, SQL and analysis all work without a database.
To let users **save / open / update / delete projects**, run PostgreSQL and set
`DATABASE_URL` in `backend/.env`:

```
DATABASE_URL=postgresql+psycopg://schemaforge:schemaforge@localhost:5432/schemaforge
```

Tables are created automatically on startup. If `DATABASE_URL` is unset or the
database is unreachable, the `/projects` endpoints return `503` and everything
else keeps working. A stored project holds: id, name, original description,
schema JSON, selected SQL dialect, created date, updated date. No authentication
yet.

## Frontend — setup and run

```bash
cd frontend
npm install

# optional: cp .env.example .env   (VITE_API_URL defaults to http://localhost:8000)

npm run dev
```

Open http://localhost:5173 → describe an application → **Generate Database** →
the tables, ER diagram and SQL render. Then change the schema either with the
**AI Database Assistant** chat ("Add a payments table.") or the **Manual
Schema Editor** (add/rename/delete tables and columns, toggle keys) — the
viewer, ER diagram and SQL all refresh.

## API

`POST /generate-schema`

```json
// request
{ "description": "I want to build a food delivery application ..." }

// response
{
  "project_name": "...",
  "tables": [
    { "name": "users", "columns": [
      { "name": "id", "type": "INTEGER", "primary_key": true, "foreign_key": false }
    ]}
  ],
  "relationships": [
    { "source_table": "orders", "source_column": "user_id",
      "target_table": "users", "target_column": "id",
      "relationship_type": "many_to_one" }
  ],
  "sql": {
    "postgresql": "-- PostgreSQL schema for ...\nCREATE TABLE users (\n    id SERIAL PRIMARY KEY, ...\n);\n...",
    "mysql":      "-- MySQL schema for ...\nCREATE TABLE users (\n    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, ...\n);\n...",
    "sqlite":     "-- SQLite schema for ...\nCREATE TABLE users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT, ...\n);\n..."
  }
}
```

`sql` is generated deterministically from the validated schema (no AI), one
entry per dialect. Each dialect has its own generator
(`backend/app/services/sql/`) handling the differences:

| | Auto-increment PK | Types | Foreign keys |
| --- | --- | --- | --- |
| PostgreSQL | `SERIAL` / `BIGSERIAL` | native (`BOOLEAN`, `JSONB`, `UUID`, `TIMESTAMP WITH TIME ZONE`) | `ALTER TABLE ... ADD CONSTRAINT` |
| MySQL | `INT ... AUTO_INCREMENT` | `TINYINT(1)`, `JSON`, `CHAR(36)`, `DATETIME`, `DECIMAL` | `ALTER TABLE ... ADD CONSTRAINT` |
| SQLite | `INTEGER PRIMARY KEY AUTOINCREMENT` | affinity: `TEXT` / `INTEGER` / `NUMERIC` / `REAL` / `BLOB` | inline `FOREIGN KEY (...)` in `CREATE TABLE` |

`POST /modify-schema` — AI Database Assistant.

```json
// request
{
  "current_schema": { "project_name": "...", "tables": [ ... ], "relationships": [ ... ] },
  "request": "Add a payments table connected to orders."
}
// response: same shape as /generate-schema (the COMPLETE updated schema + regenerated sql)
```

The AI is instructed to return the entire schema and preserve every table,
column and relationship the request does not touch. The result is validated
the same way as generation (`422` on a rule violation, `502` on an AI
failure). No persistence — chat history lives only in the browser session.

`POST /generate-sql` — validate a manually edited schema and regenerate its
SQL. No AI. Body is a schema (`{ project_name, tables, relationships }`);
response is the same shape as `/generate-schema`. `422` (with the itemised
problem list) if the schema breaks a validation rule.

The **Manual Schema Editor** (frontend, separate from the AI assistant) uses
this endpoint: add / delete / rename tables and columns, change data types,
toggle primary and foreign keys. Foreign-key targets are picked from existing
tables/columns (invalid references are structurally prevented); deleting a
table asks for confirmation. Every edit updates the schema state, which
refreshes the viewer, ER diagram and SQL.

`POST /analyze-schema` — read-only schema analysis. No AI, never modifies the
schema. Body is a schema; response is
`{ findings: [...], counts: { error, warning, suggestion } }`. Each finding
has `category` (error / warning / suggestion), `title`, `explanation`,
`table` (affected, or null), and `solution`.

Checks: missing / composite primary keys, duplicate columns, invalid or
unlinked foreign keys, unused / duplicate / unreflected relationships,
isolated tables, repeated columns and identical tables (redundant data),
list columns, repeating groups, many-to-many without a junction table, very
wide tables. The **Schema Analysis** panel (frontend) re-runs automatically
whenever the schema structure changes and groups the findings by severity.

`/projects` — project persistence (requires `DATABASE_URL`; `503` otherwise):

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/projects` | list saved projects (summaries) |
| `POST` | `/projects` | create — body `{ name, description, schema_data, sql_dialect }` → `201` |
| `GET` | `/projects/{id}` | full project incl. `schema_json` |
| `PUT` | `/projects/{id}` | partial update (any of the fields) |
| `DELETE` | `/projects/{id}` | `204`, or `404` if not found |

The frontend has a PostgreSQL / MySQL / SQLite switcher; changing it
regenerates the displayed SQL instantly (no new request). Copy button copies
the selected dialect. The **Project** bar (top of the workspace) saves the
current schema, description and selected dialect, and reloads them when a
saved project is opened.

The **Projects** view (navbar → "Projects") is a dashboard of saved projects
— each card shows the name, short description, created date, last-updated date
and SQL dialect, with Open / Delete actions and a "New project" button. It has
loading (skeletons), empty, error (with retry) and "persistence disabled"
states.

Error responses use `{"detail": "..."}` — `422` for an empty/invalid body, or
for a generated schema that fails structural validation (the `detail` string
lists every problem, one per line; the schema is never silently corrected),
`502` for a handled AI failure (not configured, rate limited, malformed AI
output, refusal), `500` for anything unexpected. Malformed AI JSON never
crashes the server.

Schema validation rules: every table has a primary key; table and column names
are lowercase snake_case; no duplicate table or column names; foreign-key
columns are backed by a relationship; relationships reference real tables and
columns; column data types are recognisable SQL types.

## Notes

- Tailwind CSS v4 via the `@tailwindcss/vite` plugin; `@import "tailwindcss";` in
  `src/index.css`. No `tailwind.config.js`.
- Model defaults to `claude-opus-5`; override with `AI_MODEL` in `.env`.
- Run backend and frontend in two separate terminals.
