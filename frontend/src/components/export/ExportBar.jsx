import { downloadText, slugify } from '../../lib/download'

const DIALECT_LABEL = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
}

// Export the current schema to a file: SQL for the selected dialect, or the
// schema structure as JSON. Purely client-side.
export default function ExportBar({ schema, dialect = 'postgresql' }) {
  if (!schema?.tables?.length) return null

  const stem = slugify(schema.project_name)
  const sql = schema.sql?.[dialect]

  const exportSql = () => {
    if (!sql) return
    downloadText(`${stem}-${dialect}.sql`, sql, 'application/sql')
  }

  const exportJson = () => {
    const { project_name, tables, relationships } = schema
    const json = JSON.stringify({ project_name, tables, relationships }, null, 2)
    downloadText(`${stem}-schema.json`, json, 'application/json')
  }

  const btn =
    'rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-white">Export</h3>
        <p className="text-xs text-slate-500">
          download this schema as a file — nothing leaves your browser
        </p>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        <button type="button" onClick={exportSql} disabled={!sql} className={btn}>
          {DIALECT_LABEL[dialect] ?? dialect} SQL{' '}
          <span className="text-slate-500">.sql</span>
        </button>
        <button type="button" onClick={exportJson} className={btn}>
          Schema <span className="text-slate-500">.json</span>
        </button>
      </div>
    </div>
  )
}
