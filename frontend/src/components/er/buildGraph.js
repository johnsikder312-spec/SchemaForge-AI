import { MarkerType } from '@xyflow/react'

// Deterministic grid layout so the same schema always lays out the same way.
// React Flow's fitView then frames whatever this produces.
const NODE_WIDTH = 300
const H_GAP = 90
const V_GAP = 80
const ROW_HEIGHT_BASE = 96 // header + padding; per-column height added below
const COLUMN_ROW_HEIGHT = 30

function estimateHeight(table) {
  return ROW_HEIGHT_BASE + (table.columns?.length ?? 0) * COLUMN_ROW_HEIGHT
}

/**
 * Turn a generated schema into React Flow nodes + edges.
 * - one "tableNode" per table
 * - one edge per relationship (source table -> target table)
 */
export function buildGraph(schema) {
  const tables = schema?.tables ?? []
  const relationships = schema?.relationships ?? []

  const perRow = Math.max(1, Math.ceil(Math.sqrt(tables.length)))
  const columnBottoms = new Array(perRow).fill(0)

  const nodes = tables.map((table, index) => {
    const col = index % perRow
    const x = col * (NODE_WIDTH + H_GAP)
    const y = columnBottoms[col]
    columnBottoms[col] = y + estimateHeight(table) + V_GAP

    return {
      id: table.name,
      type: 'tableNode',
      position: { x, y },
      data: { table },
    }
  })

  const nodeIds = new Set(nodes.map((n) => n.id))

  const edges = relationships
    .filter((rel) => nodeIds.has(rel.source_table) && nodeIds.has(rel.target_table))
    .map((rel, index) => ({
      id: `rel-${index}-${rel.source_table}-${rel.target_table}`,
      source: rel.source_table,
      target: rel.target_table,
      label: `${rel.source_column} → ${rel.target_column}`,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      labelStyle: { fill: '#cbd5e1', fontSize: 11 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
      labelBgPadding: [4, 2],
      style: { stroke: '#6366f1', strokeWidth: 1.5 },
    }))

  return { nodes, edges }
}

/**
 * A cheap signature that changes whenever the schema's shape changes,
 * used to re-run layout / re-fit the view on a new generation.
 */
export function schemaSignature(schema) {
  if (!schema) return 'none'
  const tables = (schema.tables ?? [])
    .map((t) => `${t.name}:${(t.columns ?? []).map((c) => c.name).join(',')}`)
    .join('|')
  const rels = (schema.relationships ?? [])
    .map((r) => `${r.source_table}.${r.source_column}>${r.target_table}.${r.target_column}`)
    .join('|')
  return `${schema.project_name}#${tables}#${rels}`
}
