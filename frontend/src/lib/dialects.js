// The SQL dialects the backend generates, in display order.
export const DIALECTS = [
  { key: 'postgresql', label: 'PostgreSQL' },
  { key: 'mysql', label: 'MySQL' },
  { key: 'sqlite', label: 'SQLite' },
]

export const dialectLabel = (key) =>
  DIALECTS.find((d) => d.key === key)?.label ?? key
