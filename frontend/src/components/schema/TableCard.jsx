import ColumnRow from './ColumnRow'

// A single database table rendered as a card: name header + column rows.
export default function TableCard({ table }) {
  const columns = table.columns ?? []

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <h4 className="font-mono text-sm font-semibold uppercase tracking-wide text-white">
          {table.name}
        </h4>
      </div>
      <div className="divide-y divide-slate-800/70">
        {columns.length === 0 ? (
          <p className="px-4 py-3 text-xs text-slate-500">No columns</p>
        ) : (
          columns.map((col) => <ColumnRow key={col.name} column={col} />)
        )}
      </div>
    </div>
  )
}
