import { useState } from 'react'
import TableEditor from './TableEditor'
import { addTable } from '../../lib/schemaEdit'

const COMMON_TYPES = [
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  'VARCHAR(255)',
  'VARCHAR(100)',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'NUMERIC(10,2)',
  'UUID',
  'JSONB',
]

// Manual schema editor. Kept separate from the AI assistant.
// Every change goes through the parent's `onEdit`, which updates the schema
// state (refreshing the viewer, ER diagram and SQL).
export default function SchemaEditor({ schema, onEdit, syncing, error }) {
  const [newTable, setNewTable] = useState('')

  if (!schema?.tables) return null

  const create = () => {
    if (!newTable.trim()) return
    onEdit((s) => addTable(s, newTable))
    setNewTable('')
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <datalist id="sql-types">
        {COMMON_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">Manual Schema Editor</h3>
        <span className="text-xs text-slate-500">
          {syncing ? 'Regenerating SQL…' : 'edits apply instantly'}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="whitespace-pre-line border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs leading-relaxed text-red-300"
        >
          {error}
        </p>
      )}

      <div className="space-y-3 bg-slate-950 p-4">
        {schema.tables.map((table) => (
          <TableEditor
            key={table.name}
            schema={schema}
            table={table}
            onEdit={onEdit}
            disabled={syncing}
          />
        ))}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="new_table"
            disabled={syncing}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={create}
            disabled={syncing || !newTable.trim()}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add table
          </button>
        </div>
      </div>
    </div>
  )
}
