// One column line inside a TableCard.
// Shows a key indicator, the column name, and its data type.
export default function ColumnRow({ column }) {
  const { name, type, primary_key: pk, foreign_key: fk } = column
  const indicator = pk ? '🔑' : fk ? '🔗' : ''
  const title = pk ? 'Primary key' : fk ? 'Foreign key' : undefined

  return (
    <div className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2 px-4 py-2 text-sm">
      <span className="text-xs" title={title} aria-label={title}>
        {indicator}
      </span>
      <span className="truncate font-mono text-slate-100">{name}</span>
      <span className="font-mono text-xs text-slate-500">{type}</span>
    </div>
  )
}
