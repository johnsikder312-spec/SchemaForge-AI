// Tiny, dependency-free SQL highlighter for display only.
// Returns an HTML string with inline-styled <span>s (no external CSS needed).

const KEYWORDS = new Set([
  'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'ALTER', 'ADD',
  'CONSTRAINT', 'NOT', 'NULL', 'UNIQUE', 'DEFAULT', 'CHECK', 'CASCADE', 'ON',
  'DELETE', 'UPDATE', 'AND', 'OR', 'INDEX', 'IF', 'EXISTS',
])

const TYPES = new Set([
  'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'INTEGER', 'INT', 'INT2', 'INT4', 'INT8',
  'BIGINT', 'SMALLINT', 'VARCHAR', 'CHARACTER', 'VARYING', 'CHAR', 'TEXT',
  'BOOLEAN', 'BOOL', 'DATE', 'TIMESTAMP', 'TIME', 'WITH', 'WITHOUT', 'ZONE',
  'NUMERIC', 'DECIMAL', 'REAL', 'DOUBLE', 'PRECISION', 'FLOAT', 'UUID', 'JSON',
  'JSONB', 'BYTEA', 'MONEY', 'INTERVAL', 'INET', 'CIDR',
])

const COLORS = {
  comment: '#64748b',
  string: '#fbbf24',
  number: '#fbbf24',
  keyword: '#a5b4fc',
  type: '#5eead4',
}

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const TOKEN_RE =
  /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g

export function highlightSql(sql) {
  if (!sql) return ''
  return escapeHtml(sql).replace(
    TOKEN_RE,
    (match, comment, string, number, word) => {
      if (comment) return `<span style="color:${COLORS.comment}">${comment}</span>`
      if (string) return `<span style="color:${COLORS.string}">${string}</span>`
      if (number) return `<span style="color:${COLORS.number}">${number}</span>`
      const upper = word.toUpperCase()
      if (KEYWORDS.has(upper))
        return `<span style="color:${COLORS.keyword};font-weight:600">${word}</span>`
      if (TYPES.has(upper))
        return `<span style="color:${COLORS.type}">${word}</span>`
      return word
    },
  )
}
