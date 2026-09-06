import ConfirmButton from '../editor/ConfirmButton'

// Save / open / update / delete saved projects. No authentication.
export default function ProjectsBar({
  projects,
  schema,
  description,
  sqlDialect,
  onLoadProject,
  onNewProject,
}) {
  const {
    projects: list,
    currentId,
    current,
    available,
    busy,
    error,
  } = projects

  if (!available) {
    if (!schema) return null
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-xs text-slate-500">
        Project saving is off — set <code className="text-slate-400">DATABASE_URL</code>{' '}
        in <code className="text-slate-400">backend/.env</code> to enable it.
      </div>
    )
  }

  const openProject = async (id) => {
    if (!id) {
      projects.clearCurrent()
      onNewProject()
      return
    }
    const project = await projects.open(id)
    onLoadProject(project)
  }

  const saveCurrent = async () => {
    if (!schema) return
    if (currentId) {
      await projects.update(currentId, { schema, sqlDialect, description })
      return
    }
    const name = window.prompt(
      'Project name',
      schema.project_name || 'Untitled project',
    )
    if (!name?.trim()) return
    await projects.save({ name: name.trim(), description, schema, sqlDialect })
  }

  const saveAsNew = async () => {
    if (!schema) return
    const name = window.prompt(
      'New project name',
      `${schema.project_name || 'Untitled'} copy`,
    )
    if (!name?.trim()) return
    await projects.save({ name: name.trim(), description, schema, sqlDialect })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
      <span className="text-xs font-medium text-slate-400">Project</span>

      <select
        value={currentId ?? ''}
        onChange={(e) => openProject(e.target.value)}
        disabled={busy}
        className="min-w-[12rem] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-200 focus:border-slate-500 focus:outline-none disabled:opacity-60"
      >
        <option value="">— New / unsaved —</option>
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={saveCurrent}
        disabled={busy || !schema}
        className="rounded bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {currentId ? 'Save' : 'Save project'}
      </button>

      {currentId && (
        <>
          <button
            type="button"
            onClick={saveAsNew}
            disabled={busy || !schema}
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            Save as new
          </button>
          <ConfirmButton
            onConfirm={async () => {
              await projects.remove(currentId)
              onNewProject()
            }}
            label="Delete"
            prompt={`Delete "${current?.name ?? 'project'}"?`}
            confirmLabel="Delete"
            className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:border-red-800 hover:text-red-300"
          />
        </>
      )}

      {busy && <span className="text-xs text-slate-500">saving…</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
