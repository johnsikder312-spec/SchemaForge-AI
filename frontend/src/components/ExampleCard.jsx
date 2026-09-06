// A single clickable example idea. Calls onSelect with the full prompt text.
export default function ExampleCard({ title, description, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full flex-col items-start gap-1 rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className="text-xs leading-relaxed text-slate-400">
        {description}
      </span>
      <span className="mt-2 text-xs font-medium text-indigo-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Use this idea →
      </span>
    </button>
  )
}
