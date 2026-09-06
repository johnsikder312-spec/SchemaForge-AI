import ConfirmButton from '../editor/ConfirmButton'

const DIALECT_LABEL = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
}

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// One saved project on the dashboard.
export default function ProjectCard({ project, onOpen, onDelete, busy }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-semibold text-white" title={project.name}>
          {project.name}
        </h3>
        <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-400">
          {DIALECT_LABEL[project.sql_dialect] ?? project.sql_dialect}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-400">
        {project.description?.trim() || (
          <span className="italic text-slate-600">No description</span>
        )}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div>
          <dt className="uppercase tracking-wide">Created</dt>
          <dd className="mt-0.5 text-slate-400">{formatDate(project.created_at)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Last updated</dt>
          <dd className="mt-0.5 text-slate-400">{formatDate(project.updated_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-800/70 pt-3">
        <button
          type="button"
          onClick={() => onOpen(project.id)}
          disabled={busy}
          className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Open
        </button>
        <ConfirmButton
          onConfirm={() => onDelete(project.id)}
          label="Delete"
          prompt={`Delete "${project.name}"?`}
          confirmLabel="Delete"
          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-red-800 hover:text-red-300"
        />
      </div>
    </div>
  )
}
