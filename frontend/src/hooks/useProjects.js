import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../lib/api'

/**
 * Saved-project state for the current session. No authentication.
 * `available` is false when the backend has no database configured (503).
 */
export default function useProjects() {
  const [projects, setProjects] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [available, setAvailable] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const rows = await listProjects()
      setProjects(rows)
      setAvailable(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setAvailable(false)
        setProjects([])
      } else {
        setError(err.message || 'Could not load projects.')
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      return await fn()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      throw err
    } finally {
      setBusy(false)
    }
  }

  // Returns the opened project (with schema_data).
  const open = (id) =>
    run(async () => {
      const project = await getProject(id)
      setCurrentId(project.id)
      return project
    })

  const save = ({ name, description, schema, sqlDialect }) =>
    run(async () => {
      const project = await createProject({ name, description, schema, sqlDialect })
      setCurrentId(project.id)
      await refresh()
      return project
    })

  const update = (id, patch) =>
    run(async () => {
      const project = await updateProject(id, patch)
      await refresh()
      return project
    })

  const remove = (id) =>
    run(async () => {
      await deleteProject(id)
      if (currentId === id) setCurrentId(null)
      await refresh()
    })

  const clearCurrent = () => setCurrentId(null)

  return {
    projects,
    currentId,
    current: projects.find((p) => p.id === currentId) ?? null,
    available,
    busy,
    error,
    refresh,
    open,
    save,
    update,
    remove,
    clearCurrent,
  }
}
