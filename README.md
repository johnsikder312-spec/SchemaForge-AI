# SchemaForge AI

Describe an application idea in natural language and SchemaForge AI generates a
database schema — project name, tables, columns, data types, primary/foreign
keys, and relationships. (ER diagram and SQL export come in later phases.)

## Tech Stack

| Layer    | Tech                                            |
| -------- | ---------------------------------------------- |
| Frontend | React, Vite, JavaScript, Tailwind CSS           |
| Backend  | Python, FastAPI, Uvicorn, Anthropic Claude API  |

## Project Structure

```
SchemaForge-AI/
├── frontend/                 React + Vite + Tailwind app
│   └── src/
│       ├── components/       Navbar, Hero, schema/ (SchemaViewer, TableCard, ColumnRow), ...
│       ├── hooks/            useSchemaGenerator
│       ├── lib/              api.js  (calls POST /generate-schema)
│       └── data/             example ideas
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app + CORS
│   │   ├── config.py         env / .env loading (API key stays here)
│   │   ├── api/routes.py     GET / , POST /generate-schema
│   │   ├── schemas/          Pydantic models
│   │   └── services/ai_service.py   Claude-powered schema generation
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

## Frontend — setup and run

```bash
cd frontend
npm install

# optional: cp .env.example .env   (VITE_API_URL defaults to http://localhost:8000)

npm run dev
```

Open http://localhost:5173 → describe an application → **Generate Database** →
the generated tables render as cards.

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
  ]
}
```

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
