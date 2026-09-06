const SEVERITY = {
  error: { label: 'Error', chip: 'bg-red-950/60 text-red-300 border-red-800' },
  warning: {
    label: 'Warning',
    chip: 'bg-amber-950/50 text-amber-300 border-amber-800',
  },
  suggestion: {
    label: 'Suggestion',
    chip: 'bg-sky-950/50 text-sky-300 border-sky-800',
  },
}

// One analysis finding: severity, title, explanation, affected table, fix.
export default function FindingCard({ finding }) {
  const meta = SEVERITY[finding.category] ?? SEVERITY.suggestion

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chip}`}
        >
          {meta.label}
        </span>
        <h4 className="text-sm font-semibold text-white">{finding.title}</h4>
        {finding.table && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
            {finding.table}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {finding.explanation}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-300">Suggested fix: </span>
        {finding.solution}
      </p>
    </div>
  )
}
