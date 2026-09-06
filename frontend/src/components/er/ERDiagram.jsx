import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import TableNode from './TableNode'
import { buildGraph, schemaSignature } from './buildGraph'

const nodeTypes = { tableNode: TableNode }

function Flow({ schema }) {
  const signature = schemaSignature(schema)
  const graph = useMemo(() => buildGraph(schema), [signature]) // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)
  const { fitView } = useReactFlow()

  // Requirement: the diagram must update automatically on a new schema.
  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
    const id = requestAnimationFrame(() =>
      fitView({ padding: 0.15, duration: 300 }),
    )
    return () => cancelAnimationFrame(id)
  }, [signature]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      maxZoom={1.75}
      proOptions={{ hideAttribution: true }}
      className="bg-slate-950"
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#1e293b" />
      <Controls className="!border-slate-700 !bg-slate-900 [&_button]:!border-slate-700 [&_button]:!bg-slate-900 [&_button]:!fill-slate-300 [&_button:hover]:!bg-slate-800" />
      <MiniMap
        pannable
        zoomable
        className="!bg-slate-900"
        maskColor="rgba(2,6,23,0.7)"
        nodeColor="#334155"
      />
    </ReactFlow>
  )
}

// Interactive ER diagram: tables as draggable nodes, relationships as edges.
// Separate from the plain SchemaViewer.
export default function ERDiagram({ schema }) {
  if (!schema?.tables?.length) return null

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white">ER Diagram</h3>
        <span className="text-xs text-slate-500">drag · zoom · pan</span>
      </div>
      <div className="h-[560px] w-full">
        <ReactFlowProvider>
          <Flow schema={schema} />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
