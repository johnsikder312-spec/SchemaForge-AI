import { useEffect, useRef, useState } from 'react'
import ChatMessage from './ChatMessage'

const SUGGESTIONS = [
  'Add a payments table.',
  'Add a phone_number column to users.',
  'Connect payments with orders.',
]

// Chat interface for modifying the current schema in plain language.
// The parent hook applies the returned schema, which refreshes the viewer,
// ER diagram, and SQL automatically.
export default function AssistantChat({
  messages,
  loading,
  error,
  onSend,
  disabled = false,
}) {
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const canSend = input.trim() && !loading && !disabled

  const submit = (e) => {
    e.preventDefault()
    if (!canSend) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">AI Database Assistant</h3>
        <span className="text-xs text-slate-500">modify the schema in words</span>
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[340px] min-h-[140px] flex-col gap-2 overflow-y-auto bg-slate-950 px-4 py-4"
      >
        {messages.length === 0 && !loading ? (
          <div className="m-auto text-center">
            <p className="text-sm text-slate-400">
              Ask for a change to the schema.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled || loading}
                  onClick={() => onSend(s)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessage key={m.id} role={m.role} text={m.text} />
          ))
        )}

        {loading && (
          <div className="self-start rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-slate-200" />
              Updating the schema…
            </span>
          </div>
        )}
      </div>

      {error && !loading && (
        <p
          role="alert"
          className="border-t border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-300"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/40 p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled || loading}
          placeholder={
            disabled ? 'Generate a schema first' : 'e.g. Add a payments table.'
          }
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="shrink-0 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
