# SchemaForge AI

Describe an application idea in natural language and SchemaForge AI will (in later
phases) generate a database schema, tables, relationships, an ER diagram, and SQL.

**Status: Phase 1 — project setup only.** No AI integration, no database, no
authentication, no ER diagrams yet.

## Tech Stack

| Layer    | Tech                                   |
| -------- | -------------------------------------- |
| Frontend | React, Vite, JavaScript, Tailwind CSS  |
| Backend  | Python, FastAPI, Uvicorn               |

## Project Structure

```
SchemaForge-AI/
├── frontend/          React + Vite + Tailwind app
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── backend/           FastAPI app
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+

## Backend — setup and run

```bash
cd backend

# create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt

# optional: cp .env.example .env

# run the dev server
uvicorn main:app --reload --port 8000
```

Check it:

- http://localhost:8000/ → `{"message": "SchemaForge AI Backend Running"}`
- http://localhost:8000/docs → interactive API docs

## Frontend — setup and run

```bash
cd frontend
npm install

# optional: cp .env.example .env   (defaults to http://localhost:8000)

npm run dev
```

Open http://localhost:5173. The page shows the backend status message fetched
from `GET /`.

## Notes

- Tailwind CSS v4 is wired through the official `@tailwindcss/vite` plugin and
  loaded via `@import "tailwindcss";` in `src/index.css`. No `tailwind.config.js`
  is required.
- Run the backend and frontend in two separate terminals.
