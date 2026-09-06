import { useEffect } from 'react'
import Container from '../Container'
import ProjectCard from './ProjectCard'

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="h-4 w-1/2 rounded bg-slate-800" />
      <div className="mt-3 h-3 w-full rounded bg-slate-800" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-800" />
      <div className="mt-5 h-3 w-1/3 rounded bg-slate-800" />
      <div className="mt-5 h-7 w-24 rounded bg-slate-800" />
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 px-6 py-20 text-center">
      {children}
    </div>
  )
}

// Project dashboard: browse saved projects, open, delete, or start a new one.
export default function Dashboard({ projects, onOpen, onCreateNew }) {
  const { projects: list, available, loading, busy, error, refresh } = projects

  // Refresh whenever the dashboard is opened - a project may have been saved
  // from the workspace since it was last shown.
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Projects
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your saved schemas — open one to keep working, or start fresh.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            New project
          </button>
        </div>

        <div className="mt-10">
          {!available ? (
            <Centered>
              <p className="text-sm font-medium text-slate-300">
                Project saving is disabled
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Set <code className="text-slate-400">DATABASE_URL</code> in{' '}
                <code className="text-slate-400">backend/.env</code> and restart
                the server to save and reopen projects.
              </p>
            </Centered>
          ) : error ? (
            <Centered>
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-4 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                Try again
              </button>
            </Centered>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : list.length === 0 ? (
            <Centered>
              <p className="text-sm font-medium text-slate-300">
                No projects yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Generate a schema and save it to see it here.
              </p>
              <button
                type="button"
                onClick={onCreateNew}
                className="mt-5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Create your first project
              </button>
            </Centered>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={onOpen}
                  onDelete={projects.remove}
                  busy={busy}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
