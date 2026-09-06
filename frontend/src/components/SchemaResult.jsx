// Minimal preview of the schema returned by the backend.
// A full ER-diagram / SQL view comes in a later phase.
export default function SchemaResult({ schema }) {
  if (!schema) return null

  return (
    <div className="animate-fade-up mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {schema.project_name}
        </h3>
        <span className="text-xs text-slate-500">
          {schema.tables?.length ?? 0} table
          {schema.tables?.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {schema.tables?.map((table) => (
          <div
            key={table.name}
            className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
          >
            <p className="text-sm font-medium text-indigo-400">{table.name}</p>
            <ul className="mt-2 space-y-1">
              {table.columns?.map((col) => (
                <li
                  key={col.name}
                  className="flex items-center gap-2 text-xs text-slate-400"
                >
                  <span className="font-mono text-slate-200">{col.name}</span>
                  <span className="text-slate-500">{col.type}</span>
                  {col.primary_key && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      PK
                    </span>
                  )}
                  {col.foreign_key && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      FK
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
          View raw JSON
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-400">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </details>
    </div>
  )
}
