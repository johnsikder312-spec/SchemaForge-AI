import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeSchema } from '../lib/api'

const EMPTY_COUNTS = { error: 0, warning: 0, suggestion: 0 }

// A signature of the schema's *structure* only (ignores the generated sql),
// so analysis re-runs when tables / columns / relationships change but not
// when only the SQL is refreshed.
function structureSignature(schema) {
  if (!schema?.tables) return ''
  return JSON.stringify({
    t: schema.tables.map((t) => [
      t.name,
      (t.columns ?? []).map((c) => [
        c.name,
        c.type,
        c.primary_key,
        c.foreign_key,
      ]),
    ]),
    r: (schema.relationships ?? []).map((r) => [
      r.source_table,
      r.source_column,
      r.target_table,
      r.target_column,
      r.relationship_type,
    ]),
  })
}

/**
 * Runs the schema analyzer whenever the schema structure changes.
 * Separate from schema generation and the manual editor.
 */
export default function useSchemaAnalysis(schema) {
  const [findings, setFindings] = useState([])
  const [counts, setCounts] = useState(EMPTY_COUNTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const seqRef = useRef(0)
  const signature = structureSignature(schema)

  const run = useCallback(async () => {
    if (!schema?.tables?.length) {
      setFindings([])
      setCounts(EMPTY_COUNTS)
      setError('')
      return
    }
    const seq = ++seqRef.current
    setLoading(true)
    setError('')
    try {
      const result = await analyzeSchema(schema)
      if (seq === seqRef.current) {
        setFindings(result.findings ?? [])
        setCounts({ ...EMPTY_COUNTS, ...(result.counts ?? {}) })
      }
    } catch (err) {
      if (seq === seqRef.current) {
        setError(err.message || 'Could not analyze the schema.')
      }
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  useEffect(() => {
    run()
  }, [run])

  return { findings, counts, loading, error, refresh: run }
}
