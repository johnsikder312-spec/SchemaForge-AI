import FindingCard from './FindingCard'

const GROUPS = [
  { key: 'error', label: 'Errors' },
  { key: 'warning', label: 'Warnings' },
  { key: 'suggestion', label: 'Suggestions' },
]

function Summary({ counts }) {
  const parts = GROUPS.filter((g) => counts[g.key] > 0).map(
    (g) => `${counts[g.key]} ${g.key}${counts[g.key] === 1 ? '' : 's'}`,
  )
  return (
    <span className="text-xs text-slate-500">
      {parts.length ? parts.join(' · ') : 'no issues'}
    </span>
  )
}

// Read-only analysis of the current schema, grouped by severity.
// Never modifies the schema. Separate from schema generation.
export default function AnalysisPanel({
  findings,
  counts,
  loading,
  error,
  onRefresh,
}) {
  const byCategory = (key) => findings.filter((f) => f.category === key)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">Schema Analysis</h3>
          {loading ? (
            <span className="text-xs text-slate-500">analyzing…</span>
          ) : (
            <Summary counts={counts} />
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
        >
          Re-analyze
        </button>
      </div>

      <div className="bg-slate-950 p-4">
        {error ? (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        ) : loading && findings.length === 0 ? (
          <p className="text-sm text-slate-500">Analyzing the schema…</p>
        ) : findings.length === 0 ? (
          <p className="text-sm text-slate-400">
            No issues found — the schema looks healthy.
          </p>
        ) : (
          <div className="space-y-5">
            {GROUPS.map((group) => {
              const items = byCategory(group.key)
              if (items.length === 0) return null
              return (
                <div key={group.key}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.label} ({items.length})
                  </p>
                  <div className="space-y-3">
                    {items.map((finding, i) => (
                      <FindingCard key={`${finding.code}-${i}`} finding={finding} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
