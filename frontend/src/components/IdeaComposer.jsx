import Button from './Button'

const PLACEHOLDER = `Describe your application idea...

Example: I want to build a food delivery application where users order food from restaurants.`

// Controlled textarea + primary action.
// Phase 3: wired to the backend via the parent's onGenerate handler.
export default function IdeaComposer({
  value,
  onChange,
  onGenerate,
  loading = false,
  error = '',
}) {
  const disabled = !value.trim() || loading

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled) onGenerate?.()
      }}
    >
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 shadow-xl shadow-black/20 transition-colors focus-within:border-slate-600">
        <textarea
          id="idea"
          name="idea"
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={loading}
          className="w-full resize-y rounded-lg bg-transparent px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
          <span className="text-xs text-slate-500">
            {value.trim().length} characters
          </span>
          <Button type="submit" size="lg" disabled={disabled}>
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {loading ? 'Generating…' : 'Generate Database'}
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 whitespace-pre-line rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-2 text-sm leading-relaxed text-red-300"
        >
          {error}
        </p>
      )}
    </form>
  )
}
