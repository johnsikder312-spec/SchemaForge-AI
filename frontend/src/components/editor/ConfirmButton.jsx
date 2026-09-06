import { useEffect, useState } from 'react'

// A button that requires a second click to confirm a destructive action.
export default function ConfirmButton({
  onConfirm,
  label = 'Delete',
  confirmLabel = 'Confirm',
  prompt = 'Delete?',
  className = '',
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="text-slate-400">{prompt}</span>
        <button
          type="button"
          onClick={() => {
            setArmed(false)
            onConfirm()
          }}
          className="rounded border border-red-800 bg-red-950/60 px-2 py-0.5 font-medium text-red-300 hover:bg-red-900/60"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="rounded border border-slate-700 px-2 py-0.5 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      className={className}
    >
      {label}
    </button>
  )
}
