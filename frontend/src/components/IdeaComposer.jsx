import Button from './Button'

const PLACEHOLDER = `Describe your application idea...

Example: I want to build a food delivery application where users order food from restaurants.`

// Controlled textarea + primary action. No backend wiring yet (Phase 2).
export default function IdeaComposer({ value, onChange, onGenerate }) {
  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault()
        onGenerate?.()
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
          className="w-full resize-y rounded-lg bg-transparent px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
          <span className="text-xs text-slate-500">
            {value.trim().length} characters
          </span>
          <Button type="submit" size="lg" disabled={!value.trim()}>
            Generate Database
          </Button>
        </div>
      </div>
    </form>
  )
}
