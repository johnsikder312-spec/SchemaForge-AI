import TableCard from './TableCard'

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-300">
        Your generated schema will appear here
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Describe an application above and click “Generate Database”.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
        >
          <div className="h-10 border-b border-slate-800 bg-slate-900/60" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-3/4 rounded bg-slate-800" />
            <div className="h-3 w-2/3 rounded bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Visual display of a generated database schema.
// Handles three states: loading, empty (no schema yet), and populated.
export default function SchemaViewer({ schema, loading = false }) {
  const tables = schema?.tables ?? []

  return (
    <section aria-label="Generated database schema" className="w-full">
      {loading ? (
        <LoadingState />
      ) : !schema ? (
        <EmptyState />
      ) : (
        <div className="animate-fade-up">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold text-white">
              {schema.project_name}
            </h3>
            <span className="text-xs text-slate-500">
              {tables.length} table{tables.length === 1 ? '' : 's'}
            </span>
          </div>

          {tables.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => (
                <TableCard key={table.name} table={table} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
