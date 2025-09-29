import React, { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Play,
  Pause,
  Save,
  FileText,
  Calculator,
  Send,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react'
import { cn } from './utils/cn'
import { Button } from './Button'
import { Badge } from './Badge'

// Custom node types for different workflow steps
interface CustomNodeData {
  label: string
  type: 'start' | 'action' | 'condition' | 'end'
  status?: 'pending' | 'running' | 'completed' | 'error'
  config?: Record<string, any>
}

const StartNode: React.FC<{ data: CustomNodeData }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-green-100 border-2 border-green-500">
    <div className="flex items-center">
      <Play className="w-4 h-4 mr-2 text-green-600" />
      <div className="ml-2">
        <div className="text-lg font-bold text-green-700">{data.label}</div>
      </div>
    </div>
  </div>
)

const ActionNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'border-blue-500 bg-blue-100'
      case 'completed': return 'border-green-500 bg-green-100'
      case 'error': return 'border-red-500 bg-red-100'
      default: return 'border-gray-300 bg-white'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running': return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className={cn('px-4 py-2 shadow-md rounded-md border-2', getStatusColor(data.status))}>
      <div className="flex items-center">
        {getStatusIcon(data.status)}
        <div className="ml-2">
          <div className="text-sm font-bold">{data.label}</div>
          {data.status && (
            <Badge variant={data.status === 'completed' ? 'success' : data.status === 'error' ? 'destructive' : 'default'} className="text-xs mt-1">
              {data.status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

const ConditionNode: React.FC<{ data: CustomNodeData }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 border-yellow-500">
    <div className="flex items-center">
      <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
      <div className="ml-2">
        <div className="text-sm font-bold text-yellow-700">{data.label}</div>
      </div>
    </div>
  </div>
)

const EndNode: React.FC<{ data: CustomNodeData }> = ({ data }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-red-100 border-2 border-red-500">
    <div className="flex items-center">
      <CheckCircle className="w-4 h-4 mr-2 text-red-600" />
      <div className="ml-2">
        <div className="text-lg font-bold text-red-700">{data.label}</div>
      </div>
    </div>
  </div>
)

const nodeTypes: NodeTypes = {
  start: StartNode,
  action: ActionNode,
  condition: ConditionNode,
  end: EndNode,
}

interface WorkflowDesignerProps {
  initialNodes?: Node<CustomNodeData>[]
  initialEdges?: Edge[]
  onSave?: (nodes: Node<CustomNodeData>[], edges: Edge[]) => void
  onExecute?: (nodes: Node<CustomNodeData>[], edges: Edge[]) => void
  readonly?: boolean
  className?: string
}

const defaultNodes: Node<CustomNodeData>[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Start Workflow', type: 'start' },
  },
]

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  initialNodes = defaultNodes,
  initialEdges = [],
  onSave,
  onExecute,
  readonly = false,
  className,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isExecuting, setIsExecuting] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const addNode = useCallback((type: CustomNodeData['type']) => {
    const newNode: Node<CustomNodeData> = {
      id: `${type}-${Date.now()}`,
      type: type === 'start' || type === 'end' ? type : type === 'condition' ? 'condition' : 'action',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type
      },
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const deleteSelectedNodes = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected))
    setEdges((eds) => eds.filter((edge) => !edge.selected))
  }, [setNodes, setEdges])

  const handleSave = useCallback(() => {
    onSave?.(nodes, edges)
  }, [nodes, edges, onSave])

  const handleExecute = useCallback(async () => {
    setIsExecuting(true)
    try {
      await onExecute?.(nodes, edges)
    } finally {
      setIsExecuting(false)
    }
  }, [nodes, edges, onExecute])

  const proOptions = { hideAttribution: true }

  return (
    <div className={cn('w-full h-full bg-gray-50 border border-gray-200 rounded-lg', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            switch (n.type) {
              case 'start': return '#10b981'
              case 'end': return '#ef4444'
              case 'condition': return '#f59e0b'
              default: return '#6b7280'
            }
          }}
          nodeColor={(n) => {
            switch (n.type) {
              case 'start': return '#d1fae5'
              case 'end': return '#fee2e2'
              case 'condition': return '#fef3c7'
              default: return '#f3f4f6'
            }
          }}
          nodeBorderRadius={2}
        />

        {!readonly && (
          <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-md border">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Add Nodes</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('action')}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('condition')}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Condition
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('end')}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  End
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteSelectedNodes}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Panel>
        )}

        <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-md border">
          <div className="flex space-x-2">
            {onSave && !readonly && (
              <Button size="sm" variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
            {onExecute && (
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <Pause className="w-4 h-4 mr-1" />
                ) : (
                  <Play className="w-4 h-4 mr-1" />
                )}
                {isExecuting ? 'Running...' : 'Execute'}
              </Button>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

// Workflow template interface
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: Node<CustomNodeData>[]
  edges: Edge[]
  tags: string[]
}

// Pre-built workflow templates
export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    description: 'Standard client onboarding process with document collection and verification',
    category: 'Client Management',
    tags: ['onboarding', 'documents', 'verification'],
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: { label: 'New Client Registration', type: 'start' },
      },
      {
        id: 'collect-docs',
        type: 'action',
        position: { x: 300, y: 100 },
        data: { label: 'Collect Required Documents', type: 'action' },
      },
      {
        id: 'verify-docs',
        type: 'condition',
        position: { x: 500, y: 100 },
        data: { label: 'Documents Complete?', type: 'condition' },
      },
      {
        id: 'setup-account',
        type: 'action',
        position: { x: 700, y: 100 },
        data: { label: 'Setup Client Account', type: 'action' },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 900, y: 100 },
        data: { label: 'Onboarding Complete', type: 'end' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'start', target: 'collect-docs' },
      { id: 'e2-3', source: 'collect-docs', target: 'verify-docs' },
      { id: 'e3-4', source: 'verify-docs', target: 'setup-account', label: 'Yes' },
      { id: 'e4-5', source: 'setup-account', target: 'end' },
      { id: 'e3-2', source: 'verify-docs', target: 'collect-docs', label: 'No' },
    ],
  },
  {
    id: 'tax-preparation',
    name: 'Tax Preparation Workflow',
    description: 'Automated tax preparation process with client data collection and review',
    category: 'Tax Services',
    tags: ['tax', 'preparation', 'review'],
    nodes: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: { label: 'Tax Season Start', type: 'start' },
      },
      {
        id: 'gather-docs',
        type: 'action',
        position: { x: 300, y: 100 },
        data: { label: 'Gather Tax Documents', type: 'action' },
      },
      {
        id: 'prepare-return',
        type: 'action',
        position: { x: 500, y: 100 },
        data: { label: 'Prepare Tax Return', type: 'action' },
      },
      {
        id: 'review',
        type: 'condition',
        position: { x: 700, y: 100 },
        data: { label: 'Review Required?', type: 'condition' },
      },
      {
        id: 'file-return',
        type: 'action',
        position: { x: 900, y: 100 },
        data: { label: 'File Tax Return', type: 'action' },
      },
      {
        id: 'end',
        type: 'end',
        position: { x: 1100, y: 100 },
        data: { label: 'Tax Filing Complete', type: 'end' },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'start', target: 'gather-docs' },
      { id: 'e2-3', source: 'gather-docs', target: 'prepare-return' },
      { id: 'e3-4', source: 'prepare-return', target: 'review' },
      { id: 'e4-5', source: 'review', target: 'file-return', label: 'Approved' },
      { id: 'e5-6', source: 'file-return', target: 'end' },
      { id: 'e4-3', source: 'review', target: 'prepare-return', label: 'Needs Changes' },
    ],
  },
]