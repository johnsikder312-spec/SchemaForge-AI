import { useEffect, useMemo, useState } from 'react'
import { highlightSql } from './highlightSql'

// Dialects the backend generates SQL for, in display order.
const DIALECTS = [
  { key: 'postgresql', label: 'PostgreSQL' },
  { key: 'mysql', label: 'MySQL' },
  { key: 'sqlite', label: 'SQLite' },
]

// Shows the deterministically generated DDL (from the backend) for the
// selected database system, with a dialect switcher and a copy button.
// Kept separate from the schema viewer and ER diagram.
export default function SqlView({ sql }) {
  const available = DIALECTS.filter((d) => typeof sql?.[d.key] === 'string')
  const [dialect, setDialect] = useState('postgresql')
  const [copied, setCopied] = useState(false)

  // Fall back to the first available dialect if the selected one is missing.
  const activeKey = sql?.[dialect] != null ? dialect : available[0]?.key
  const currentSql = activeKey ? sql[activeKey] : ''

  // Changing the selected database regenerates the displayed SQL automatically:
  // currentSql changes, so the highlight and line count recompute.
  const highlighted = useMemo(() => highlightSql(currentSql), [currentSql])
  const lineCount = useMemo(
    () => (currentSql ? currentSql.split('\n').length : 0),
    [currentSql],
  )

  useEffect(() => {
    setCopied(false)
  }, [currentSql])

  if (!currentSql) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentSql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="animate-fade-up overflow-hidden rounded-xl border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">SQL</h3>
          <div
            role="group"
            aria-label="Database system"
            className="flex rounded-md border border-slate-700 p-0.5"
          >
            {available.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={d.key === activeKey}
                onClick={() => setDialect(d.key)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  d.key === activeKey
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex max-h-[440px] overflow-auto bg-slate-950 text-[12.5px] leading-relaxed">
        <div
          aria-hidden="true"
          className="select-none border-r border-slate-800/70 px-3 py-3 text-right font-mono text-slate-600"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="min-w-0 flex-1 overflow-x-auto px-4 py-3 font-mono text-slate-200">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  )
}
