const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body != null ? { 'Content-Type': 'application/json' } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Could not reach the backend. Is it running on ' + API_URL + '?',
      0,
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
    throw new ApiError(detail, res.status)
  }

  if (res.status === 204) return null
  return res.json()
}

const postJson = (path, body) => request('POST', path, body)

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

// ---- project persistence -------------------------------------------------

const schemaPayload = (schema) => {
  const { project_name, tables, relationships } = schema
  return { project_name, tables, relationships }
}

export const listProjects = () => request('GET', '/projects')

export const getProject = (id) => request('GET', `/projects/${id}`)

export const createProject = ({ name, description, schema, sqlDialect }) =>
  request('POST', '/projects', {
    name,
    description: description ?? '',
    schema_data: schemaPayload(schema),
    sql_dialect: sqlDialect ?? 'postgresql',
  })

export const updateProject = (id, { name, description, schema, sqlDialect }) => {
  const body = {}
  if (name !== undefined) body.name = name
  if (description !== undefined) body.description = description
  if (schema !== undefined) body.schema_data = schemaPayload(schema)
  if (sqlDialect !== undefined) body.sql_dialect = sqlDialect
  return request('PUT', `/projects/${id}`, body)
}

export const deleteProject = (id) => request('DELETE', `/projects/${id}`)
