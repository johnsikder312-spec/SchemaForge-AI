import { useState } from 'react'
import ColumnEditor from './ColumnEditor'
import ConfirmButton from './ConfirmButton'
import { addColumn, deleteTable, renameTable } from '../../lib/schemaEdit'

// One editable table: rename, delete (with confirm), and column editing.
export default function TableEditor({ schema, table, onEdit, disabled }) {
  const [newCol, setNewCol] = useState('')
  const [newType, setNewType] = useState('INTEGER')

  const commitName = (e) => {
    const v = e.target.value.trim()
    if (v && v !== table.name) onEdit((s) => renameTable(s, table.name, v))
    else e.target.value = table.name
  }

  const addCol = () => {
    if (!newCol.trim()) return
    onEdit((s) => addColumn(s, table.name, newCol, newType))
    setNewCol('')
    setNewType('INTEGER')
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
        <input
          defaultValue={table.name}
          onBlur={commitName}
          disabled={disabled}
          aria-label="Table name"
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-sm font-semibold text-white focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
        <ConfirmButton
          onConfirm={() => onEdit((s) => deleteTable(s, table.name))}
          label="Delete table"
          prompt={`Delete "${table.name}"?`}
          confirmLabel="Delete"
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-red-800 hover:text-red-300"
        />
      </div>

      <div>
        {(table.columns ?? []).map((column) => (
          <ColumnEditor
            key={column.name}
            schema={schema}
            tableName={table.name}
            column={column}
            onEdit={onEdit}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/70 bg-slate-950/40 px-3 py-2">
        <input
          value={newCol}
          onChange={(e) => setNewCol(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCol()}
          placeholder="new_column"
          disabled={disabled}
          className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
        <input
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          list="sql-types"
          disabled={disabled}
          className="w-32 rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-300 focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={addCol}
          disabled={disabled || !newCol.trim()}
          className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          Add column
        </button>
      </div>
    </div>
  )
}
