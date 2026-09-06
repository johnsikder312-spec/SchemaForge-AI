import { Handle, Position } from '@xyflow/react'

// Custom React Flow node representing one database table.
// Kept independent of the plain schema viewer's TableCard on purpose.
function TableNode({ data }) {
  const { table } = data
  const columns = table.columns ?? []

  return (
    <div className="w-[300px] overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg shadow-black/40">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-slate-500 !bg-slate-700"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-slate-500 !bg-slate-700"
      />

      <div className="border-b border-slate-700 bg-slate-800 px-3 py-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-white">
          {table.name}
        </span>
      </div>

      <div className="divide-y divide-slate-800">
        {columns.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-slate-500">No columns</p>
        ) : (
          columns.map((col) => {
            const indicator = col.primary_key ? '🔑' : col.foreign_key ? '🔗' : ''
            const title = col.primary_key
              ? 'Primary key'
              : col.foreign_key
                ? 'Foreign key'
                : undefined
            return (
              <div
                key={col.name}
                className="grid grid-cols-[1rem_1fr_auto] items-center gap-2 px-3 py-1.5 text-[12px]"
              >
                <span className="text-[10px]" title={title} aria-label={title}>
                  {indicator}
                </span>
                <span className="truncate font-mono text-slate-100">
                  {col.name}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {col.type}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TableNode
