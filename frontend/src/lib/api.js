const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function postJson(path, body) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'Could not reach the backend. Is it running on ' + API_URL + '?',
    )
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const parsed = await res.json()
      if (parsed?.detail) {
        detail =
          typeof parsed.detail === 'string'
            ? parsed.detail
            : 'Invalid request. Please check your input.'
      }
    } catch {
      /* keep default detail */
    }
    throw new Error(detail)
  }

  return res.json()
}

/**
 * Generate a database schema (+ SQL for every dialect) from a description.
 * @param {string} description
 */
export async function generateSchema(description) {
  return postJson('/generate-schema', { description })
}

/**
 * Ask the AI assistant to apply a plain-language change to an existing schema.
 * The backend returns the COMPLETE updated schema (+ regenerated SQL).
 * @param {object} currentSchema  { project_name, tables, relationships }
 * @param {string} request        e.g. "Add a payments table."
 */
export async function modifySchema(currentSchema, request) {
  const { project_name, tables, relationships } = currentSchema
  return postJson('/modify-schema', {
    current_schema: { project_name, tables, relationships },
    request,
  })
}

/**
 * Validate a manually edited schema and regenerate its SQL (no AI).
 * Returns the schema + fresh `sql`, or throws with the validation problems.
 * @param {object} schema  { project_name, tables, relationships }
 */
export async function regenerateSql(schema) {
  const { project_name, tables, relationships } = schema
  return postJson('/generate-sql', { project_name, tables, relationships })
}

/**
 * Analyze a schema for problems (read-only, no AI).
 * @param {object} schema  { project_name, tables, relationships }
 * @returns {Promise<{ findings: object[], counts: Record<string, number> }>}
 */
export async function analyzeSchema(schema) {
  const { project_name, tables, relationships } = schema
  return postJson('/analyze-schema', { project_name, tables, relationships })
}
