const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Send an application description to the backend and get back a database schema.
 * Phase 3: the backend returns a fixed dummy schema (no AI yet).
 *
 * @param {string} description
 * @returns {Promise<object>} schema { project_name, tables, relationships }
 */
export async function generateSchema(description) {
  let res
  try {
    res = await fetch(`${API_URL}/generate-schema`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
  } catch {
    throw new Error('Could not reach the backend. Is it running on ' + API_URL + '?')
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) {
        detail =
          typeof body.detail === 'string'
            ? body.detail
            : 'Invalid request. Please check your description.'
      }
    } catch {
      /* keep default detail */
    }
    throw new Error(detail)
  }

  return res.json()
}
