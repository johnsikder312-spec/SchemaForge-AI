import { useEffect, useMemo, useState } from 'react'
import { highlightSql } from './highlightSql'

// Shows the deterministically generated PostgreSQL DDL (from the backend)
// with a copy button. Kept separate from the schema viewer and ER diagram.
export default function SqlView({ sql }) {
  const [copied, setCopied] = useState(false)

  // Re-highlight only when the SQL string actually changes.
  const highlighted = useMemo(() => highlightSql(sql), [sql])
  const lineCount = useMemo(() => (sql ? sql.split('\n').length : 0), [sql])

  useEffect(() => {
    setCopied(false)
  }, [sql])

  if (!sql) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="animate-fade-up overflow-hidden rounded-xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">SQL</h3>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-400">
            PostgreSQL
          </span>
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
