import {
  changeColumnType,
  deleteColumn,
  foreignKeyTarget,
  renameColumn,
  setForeignKey,
  setPrimaryKey,
} from '../../lib/schemaEdit'

// One editable column row: name, type, PK toggle, FK toggle + target picker.
export default function ColumnEditor({ schema, tableName, column, onEdit, disabled }) {
  const target = foreignKeyTarget(schema, tableName, column.name)
  const otherTables = schema.tables

  const commitName = (e) => {
    const v = e.target.value.trim()
    if (v && v !== column.name) onEdit((s) => renameColumn(s, tableName, column.name, v))
    else e.target.value = column.name
  }
  const commitType = (e) => {
    const v = e.target.value.trim()
    if (v && v !== column.type) onEdit((s) => changeColumnType(s, tableName, column.name, v))
    else e.target.value = column.type
  }

  const toggleFk = (checked) => {
    if (!checked) {
      onEdit((s) => setForeignKey(s, tableName, column.name, null))
      return
    }
    // Default target: first other table's first column.
    const other = otherTables.find((t) => t.name !== tableName) ?? otherTables[0]
    const col = other?.columns?.[0]
    if (other && col) {
      onEdit((s) =>
        setForeignKey(s, tableName, column.name, {
          table: other.name,
          column: col.name,
        }),
      )
    }
  }

  const changeTarget = (table, col) => {
    onEdit((s) => setForeignKey(s, tableName, column.name, { table, column: col }))
  }

  const targetTableColumns =
    otherTables.find((t) => t.name === target?.table)?.columns ?? []

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-slate-800/70 px-3 py-2 text-sm sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-center">
      <input
        defaultValue={column.name}
        onBlur={commitName}
        disabled={disabled}
        aria-label="Column name"
        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-slate-100 focus:border-slate-500 focus:outline-none disabled:opacity-60"
      />
      <input
        defaultValue={column.type}
        onBlur={commitType}
        list="sql-types"
        disabled={disabled}
        aria-label="Data type"
        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-300 focus:border-slate-500 focus:outline-none disabled:opacity-60"
      />
      <label className="flex items-center gap-1 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={column.primary_key}
          disabled={disabled}
          onChange={(e) =>
            onEdit((s) => setPrimaryKey(s, tableName, column.name, e.target.checked))
          }
        />
        PK
      </label>
      <label className="flex items-center gap-1 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={column.foreign_key}
          disabled={disabled}
          onChange={(e) => toggleFk(e.target.checked)}
        />
        FK
      </label>
      <button
        type="button"
        onClick={() => onEdit((s) => deleteColumn(s, tableName, column.name))}
        disabled={disabled}
        aria-label={`Delete column ${column.name}`}
        className="justify-self-end rounded border border-slate-700 px-1.5 text-xs text-slate-400 hover:border-red-800 hover:text-red-300 disabled:opacity-60"
      >
        ✕
      </button>

      {column.foreign_key && target && (
        <div className="col-span-full flex flex-wrap items-center gap-2 pl-2 text-xs text-slate-500">
          <span>references</span>
          <select
            value={target.table}
            disabled={disabled}
            onChange={(e) => {
              const t = otherTables.find((x) => x.name === e.target.value)
              changeTarget(e.target.value, t?.columns?.[0]?.name ?? '')
            }}
            className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-slate-300"
          >
            {otherTables.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <span>.</span>
          <select
            value={target.column}
            disabled={disabled}
            onChange={(e) => changeTarget(target.table, e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-slate-300"
          >
            {targetTableColumns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
