// Tiny, dependency-free SQL highlighter for display only. Returns an HTML
// string of <span class="sf-tok-*"> tokens; the colours (light + dark) are
// defined in index.css.

const KEYWORDS = new Set([
  'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'ALTER', 'ADD',
  'CONSTRAINT', 'NOT', 'NULL', 'UNIQUE', 'DEFAULT', 'CHECK', 'CASCADE', 'ON',
  'DELETE', 'UPDATE', 'AND', 'OR', 'INDEX', 'IF', 'EXISTS',
  'AUTO_INCREMENT', 'AUTOINCREMENT', 'UNSIGNED',
])

const TYPES = new Set([
  'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'INTEGER', 'INT', 'INT2', 'INT4', 'INT8',
  'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'VARCHAR', 'CHARACTER',
  'VARYING', 'CHAR', 'TEXT', 'BOOLEAN', 'BOOL', 'DATE', 'DATETIME', 'TIMESTAMP',
  'TIME', 'WITH', 'WITHOUT', 'ZONE', 'NUMERIC', 'DECIMAL', 'REAL', 'DOUBLE',
  'PRECISION', 'FLOAT', 'UUID', 'JSON', 'JSONB', 'BLOB', 'LONGBLOB', 'BYTEA',
  'MONEY', 'INTERVAL', 'INET', 'CIDR',
])

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const TOKEN_RE =
  /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g

export function highlightSql(sql) {
  if (!sql) return ''
  return escapeHtml(sql).replace(
    TOKEN_RE,
    (match, comment, string, number, word) => {
      if (comment) return `<span class="sf-tok-comment">${comment}</span>`
      if (string) return `<span class="sf-tok-string">${string}</span>`
      if (number) return `<span class="sf-tok-number">${number}</span>`
      const upper = word.toUpperCase()
      if (KEYWORDS.has(upper))
        return `<span class="sf-tok-keyword">${word}</span>`
      if (TYPES.has(upper)) return `<span class="sf-tok-type">${word}</span>`
      return word
    },
  )
}
