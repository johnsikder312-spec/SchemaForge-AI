// Pure, immutable schema-edit helpers for the manual editor.
// Each function takes the current schema and returns either a new
// { project_name, tables, relationships } object, or { error } with a
// human-readable message. The schema is never mutated in place.
//
// Full structural validation (and SQL regeneration) happens on the backend;
// these helpers only block the clearly-invalid local operations and keep
// foreign-key flags / relationships internally consistent.

const IDENTIFIER_RE = /^[a-z][a-z0-9_]*$/

const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))

function base(schema) {
  return {
    project_name: schema.project_name ?? '',
    tables: clone(schema.tables ?? []),
    relationships: clone(schema.relationships ?? []),
  }
}

const findTable = (next, name) =>
  next.tables.find((t) => t.name.toLowerCase() === name.toLowerCase())

// After a structural change, drop the foreign_key flag from any column that
// no longer has a backing relationship.
function reconcileForeignKeys(next) {
  for (const table of next.tables) {
    for (const column of table.columns ?? []) {
      if (!column.foreign_key) continue
      const hasRel = next.relationships.some(
        (r) => r.source_table === table.name && r.source_column === column.name,
      )
      if (!hasRel) column.foreign_key = false
    }
  }
  return next
}

// ---- tables ----------------------------------------------------------------

export function addTable(schema, rawName) {
  const name = rawName.trim()
  if (!IDENTIFIER_RE.test(name))
    return { error: `"${name}" is not a valid table name (lowercase snake_case).` }

  const next = base(schema)
  if (findTable(next, name))
    return { error: `A table named "${name}" already exists.` }

  next.tables.push({
    name,
    columns: [
      { name: 'id', type: 'INTEGER', primary_key: true, foreign_key: false },
    ],
  })
  return next
}

export function deleteTable(schema, name) {
  const next = base(schema)
  next.tables = next.tables.filter((t) => t.name !== name)
  next.relationships = next.relationships.filter(
    (r) => r.source_table !== name && r.target_table !== name,
  )
  return reconcileForeignKeys(next)
}

export function renameTable(schema, oldName, rawNew) {
  const newName = rawNew.trim()
  if (newName === oldName) return base(schema)
  if (!IDENTIFIER_RE.test(newName))
    return { error: `"${newName}" is not a valid table name (lowercase snake_case).` }

  const next = base(schema)
  if (findTable(next, newName))
    return { error: `A table named "${newName}" already exists.` }

  const table = next.tables.find((t) => t.name === oldName)
  if (!table) return { error: `Table "${oldName}" not found.` }
  table.name = newName

  for (const r of next.relationships) {
    if (r.source_table === oldName) r.source_table = newName
    if (r.target_table === oldName) r.target_table = newName
  }
  return next
}

// ---- columns --------------------------------------------------------------

export function addColumn(schema, tableName, rawName, rawType) {
  const name = rawName.trim()
  const type = rawType.trim()
  if (!IDENTIFIER_RE.test(name))
    return { error: `"${name}" is not a valid column name (lowercase snake_case).` }
  if (!type) return { error: 'A data type is required.' }

  const next = base(schema)
  const table = next.tables.find((t) => t.name === tableName)
  if (!table) return { error: `Table "${tableName}" not found.` }
  if ((table.columns ?? []).some((c) => c.name.toLowerCase() === name.toLowerCase()))
    return { error: `Column "${name}" already exists in "${tableName}".` }

  table.columns = [
    ...(table.columns ?? []),
    { name, type, primary_key: false, foreign_key: false },
  ]
  return next
}

export function deleteColumn(schema, tableName, columnName) {
  const next = base(schema)
  const table = next.tables.find((t) => t.name === tableName)
  if (!table) return { error: `Table "${tableName}" not found.` }

  table.columns = (table.columns ?? []).filter((c) => c.name !== columnName)
  next.relationships = next.relationships.filter(
    (r) =>
      !(r.source_table === tableName && r.source_column === columnName) &&
      !(r.target_table === tableName && r.target_column === columnName),
  )
  return reconcileForeignKeys(next)
}

export function renameColumn(schema, tableName, oldName, rawNew) {
  const newName = rawNew.trim()
  if (newName === oldName) return base(schema)
  if (!IDENTIFIER_RE.test(newName))
    return { error: `"${newName}" is not a valid column name (lowercase snake_case).` }

  const next = base(schema)
  const table = next.tables.find((t) => t.name === tableName)
  if (!table) return { error: `Table "${tableName}" not found.` }
  if ((table.columns ?? []).some((c) => c.name.toLowerCase() === newName.toLowerCase()))
    return { error: `Column "${newName}" already exists in "${tableName}".` }

  const column = table.columns.find((c) => c.name === oldName)
  if (!column) return { error: `Column "${oldName}" not found.` }
  column.name = newName

  for (const r of next.relationships) {
    if (r.source_table === tableName && r.source_column === oldName)
      r.source_column = newName
    if (r.target_table === tableName && r.target_column === oldName)
      r.target_column = newName
  }
  return next
}

export function changeColumnType(schema, tableName, columnName, rawType) {
  const type = rawType.trim()
  if (!type) return { error: 'A data type is required.' }

  const next = base(schema)
  const table = next.tables.find((t) => t.name === tableName)
  const column = table?.columns?.find((c) => c.name === columnName)
  if (!column) return { error: `Column "${tableName}.${columnName}" not found.` }
  column.type = type
  return next
}

// A table has exactly one primary key: marking one clears the others.
export function setPrimaryKey(schema, tableName, columnName, isPrimary) {
  const next = base(schema)
  const table = next.tables.find((t) => t.name === tableName)
  if (!table) return { error: `Table "${tableName}" not found.` }

  for (const column of table.columns ?? []) {
    if (column.name === columnName) column.primary_key = isPrimary
    else if (isPrimary) column.primary_key = false
  }
  return next
}

// target: { table, column } to add/replace the FK, or null to remove it.
export function setForeignKey(schema, tableName, columnName, target) {
  const next = base(schema)
  const table = next.tables.find((t) => t.name === tableName)
  const column = table?.columns?.find((c) => c.name === columnName)
  if (!column) return { error: `Column "${tableName}.${columnName}" not found.` }

  // Always drop any existing FK relationship for this column first.
  next.relationships = next.relationships.filter(
    (r) => !(r.source_table === tableName && r.source_column === columnName),
  )

  if (!target) {
    column.foreign_key = false
    return next
  }

  const targetTable = next.tables.find((t) => t.name === target.table)
  if (!targetTable)
    return { error: `Target table "${target.table}" does not exist.` }
  const hasTargetColumn = (targetTable.columns ?? []).some(
    (c) => c.name === target.column,
  )
  if (!hasTargetColumn)
    return {
      error: `"${target.table}" has no column "${target.column}".`,
    }

  column.foreign_key = true
  next.relationships.push({
    source_table: tableName,
    source_column: columnName,
    target_table: target.table,
    target_column: target.column,
    relationship_type: 'many_to_one',
  })
  return next
}

// Current FK target of a column, from the relationships list (or null).
export function foreignKeyTarget(schema, tableName, columnName) {
  const rel = (schema.relationships ?? []).find(
    (r) => r.source_table === tableName && r.source_column === columnName,
  )
  return rel
    ? { table: rel.target_table, column: rel.target_column }
    : null
}
