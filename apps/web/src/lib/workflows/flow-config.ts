import { Node, Edge, NodeTypes, EdgeTypes, ConnectionLineType, MarkerType } from 'reactflow';
import { NodeType, EdgeType } from './types';

// Custom node style configurations
export const nodeStyleConfig = {
  [NodeType.TIME_TRIGGER]: {
    background: '#10B981',
    color: 'white',
    border: '2px solid #059669',
    borderRadius: '8px',
    minWidth: '150px',
    minHeight: '60px'
  },
  [NodeType.EVENT_TRIGGER]: {
    background: '#3B82F6',
    color: 'white',
    border: '2px solid #2563EB',
    borderRadius: '8px',
    minWidth: '150px',
    minHeight: '60px'
  },
  [NodeType.MANUAL_TRIGGER]: {
    background: '#8B5CF6',
    color: 'white',
    border: '2px solid #7C3AED',
    borderRadius: '8px',
    minWidth: '150px',
    minHeight: '60px'
  },
  [NodeType.WEBHOOK_TRIGGER]: {
    background: '#F59E0B',
    color: 'white',
    border: '2px solid #D97706',
    borderRadius: '8px',
    minWidth: '150px',
    minHeight: '60px'
  },
  [NodeType.TASK_ACTION]: {
    background: '#6366F1',
    color: 'white',
    border: '2px solid #4F46E5',
    borderRadius: '6px',
    minWidth: '140px',
    minHeight: '50px'
  },
  [NodeType.EMAIL_ACTION]: {
    background: '#EC4899',
    color: 'white',
    border: '2px solid #DB2777',
    borderRadius: '6px',
    minWidth: '140px',
    minHeight: '50px'
  },
  [NodeType.DOCUMENT_ACTION]: {
    background: '#84CC16',
    color: 'white',
    border: '2px solid #65A30D',
    borderRadius: '6px',
    minWidth: '140px',
    minHeight: '50px'
  },
  [NodeType.UPDATE_RECORD_ACTION]: {
    background: '#06B6D4',
    color: 'white',
    border: '2px solid #0891B2',
    borderRadius: '6px',
    minWidth: '140px',
    minHeight: '50px'
  },
  [NodeType.IF_CONDITION]: {
    background: '#F97316',
    color: 'white',
    border: '2px solid #EA580C',
    borderRadius: '12px',
    minWidth: '100px',
    minHeight: '100px',
    transform: 'rotate(45deg)'
  },
  [NodeType.SWITCH_CONDITION]: {
    background: '#EF4444',
    color: 'white',
    border: '2px solid #DC2626',
    borderRadius: '12px',
    minWidth: '120px',
    minHeight: '80px'
  },
  [NodeType.APPROVAL_NODE]: {
    background: '#FBBF24',
    color: '#92400E',
    border: '2px solid #F59E0B',
    borderRadius: '6px',
    minWidth: '140px',
    minHeight: '50px'
  },
  [NodeType.QUICKBOOKS_INTEGRATION]: {
    background: '#22C55E',
    color: 'white',
    border: '2px solid #16A34A',
    borderRadius: '6px',
    minWidth: '160px',
    minHeight: '50px'
  },
  [NodeType.DOCUMENT_PROCESSING_INTEGRATION]: {
    background: '#A855F7',
    color: 'white',
    border: '2px solid #9333EA',
    borderRadius: '6px',
    minWidth: '160px',
    minHeight: '50px'
  },
  [NodeType.DELAY_NODE]: {
    background: '#64748B',
    color: 'white',
    border: '2px solid #475569',
    borderRadius: '50%',
    minWidth: '60px',
    minHeight: '60px'
  },
  [NodeType.PARALLEL_NODE]: {
    background: '#0EA5E9',
    color: 'white',
    border: '2px solid #0284C7',
    borderRadius: '4px',
    minWidth: '120px',
    minHeight: '40px'
  },
  [NodeType.JOIN_NODE]: {
    background: '#14B8A6',
    color: 'white',
    border: '2px solid #0D9488',
    borderRadius: '4px',
    minWidth: '120px',
    minHeight: '40px'
  }
};

// Edge style configurations
export const edgeStyleConfig = {
  [EdgeType.DEFAULT]: {
    stroke: '#374151',
    strokeWidth: 2,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#374151'
    }
  },
  [EdgeType.CONDITIONAL]: {
    stroke: '#F59E0B',
    strokeWidth: 2,
    strokeDasharray: '5,5',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#F59E0B'
    }
  },
  [EdgeType.SUCCESS]: {
    stroke: '#10B981',
    strokeWidth: 2,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#10B981'
    }
  },
  [EdgeType.ERROR]: {
    stroke: '#EF4444',
    strokeWidth: 2,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#EF4444'
    }
  }
};

// Connection validation rules
export const connectionRules = {
  // Triggers can only be source nodes
  triggers: [
    NodeType.TIME_TRIGGER,
    NodeType.EVENT_TRIGGER,
    NodeType.MANUAL_TRIGGER,
    NodeType.WEBHOOK_TRIGGER
  ],

  // Nodes that can have multiple inputs
  multiInputNodes: [
    NodeType.JOIN_NODE,
    NodeType.PARALLEL_NODE
  ],

  // Nodes that can have multiple outputs
  multiOutputNodes: [
    NodeType.IF_CONDITION,
    NodeType.SWITCH_CONDITION,
    NodeType.PARALLEL_NODE
  ],

  // Nodes that must have exactly one input
  singleInputNodes: [
    NodeType.TASK_ACTION,
    NodeType.EMAIL_ACTION,
    NodeType.DOCUMENT_ACTION,
    NodeType.UPDATE_RECORD_ACTION,
    NodeType.APPROVAL_NODE,
    NodeType.DELAY_NODE
  ],

  // Nodes that cannot be target nodes (only sources)
  sourceOnlyNodes: [
    NodeType.TIME_TRIGGER,
    NodeType.EVENT_TRIGGER,
    NodeType.MANUAL_TRIGGER,
    NodeType.WEBHOOK_TRIGGER
  ]
};

// Validation function for connections
export function isValidConnection(source: Node, target: Node, sourceHandle?: string, targetHandle?: string): boolean {
  // Source-only nodes cannot be targets
  if (connectionRules.sourceOnlyNodes.includes(source.type as NodeType) &&
      connectionRules.sourceOnlyNodes.includes(target.type as NodeType)) {
    return false;
  }

  // Check if target node allows multiple inputs
  if (!connectionRules.multiInputNodes.includes(target.type as NodeType)) {
    // Single input nodes should not have existing connections
    const existingConnections = target.data?.connections?.inputs || 0;
    if (existingConnections > 0) {
      return false;
    }
  }

  // Prevent self-connections
  if (source.id === target.id) {
    return false;
  }

  // Conditional nodes need specific handle validation
  if (source.type === NodeType.IF_CONDITION) {
    return sourceHandle === 'true' || sourceHandle === 'false';
  }

  if (source.type === NodeType.SWITCH_CONDITION) {
    return sourceHandle !== undefined;
  }

  return true;
}

// Layout algorithms
export const layoutConfig = {
  // Dagre layout for auto-arrangement
  dagre: {
    rankdir: 'TB', // Top to bottom
    align: 'UL',   // Upper left
    nodesep: 100,  // Node separation
    ranksep: 150,  // Rank separation
    marginx: 50,
    marginy: 50
  },

  // Grid layout for manual arrangement
  grid: {
    cellSize: 200,
    snapToGrid: true,
    gridGap: 20
  }
};

// Node categories for the palette
export const nodeCategories = {
  triggers: {
    label: 'Triggers',
    nodes: [
      {
        type: NodeType.TIME_TRIGGER,
        label: 'Schedule',
        description: 'Trigger on a schedule',
        icon: 'Clock'
      },
      {
        type: NodeType.EVENT_TRIGGER,
        label: 'Event',
        description: 'Trigger on system events',
        icon: 'Zap'
      },
      {
        type: NodeType.MANUAL_TRIGGER,
        label: 'Manual',
        description: 'Start manually',
        icon: 'Play'
      },
      {
        type: NodeType.WEBHOOK_TRIGGER,
        label: 'Webhook',
        description: 'HTTP endpoint trigger',
        icon: 'Globe'
      }
    ]
  },
  actions: {
    label: 'Actions',
    nodes: [
      {
        type: NodeType.TASK_ACTION,
        label: 'Create Task',
        description: 'Create a new task',
        icon: 'CheckSquare'
      },
      {
        type: NodeType.EMAIL_ACTION,
        label: 'Send Email',
        description: 'Send an email',
        icon: 'Mail'
      },
      {
        type: NodeType.DOCUMENT_ACTION,
        label: 'Document',
        description: 'Generate or process documents',
        icon: 'FileText'
      },
      {
        type: NodeType.UPDATE_RECORD_ACTION,
        label: 'Update Record',
        description: 'Update database record',
        icon: 'Database'
      }
    ]
  },
  conditions: {
    label: 'Conditions',
    nodes: [
      {
        type: NodeType.IF_CONDITION,
        label: 'If/Else',
        description: 'Conditional branching',
        icon: 'GitBranch'
      },
      {
        type: NodeType.SWITCH_CONDITION,
        label: 'Switch',
        description: 'Multiple conditions',
        icon: 'Filter'
      }
    ]
  },
  approvals: {
    label: 'Approvals',
    nodes: [
      {
        type: NodeType.APPROVAL_NODE,
        label: 'Approval',
        description: 'Require approval',
        icon: 'UserCheck'
      }
    ]
  },
  integrations: {
    label: 'Integrations',
    nodes: [
      {
        type: NodeType.QUICKBOOKS_INTEGRATION,
        label: 'QuickBooks',
        description: 'QuickBooks integration',
        icon: 'DollarSign'
      },
      {
        type: NodeType.DOCUMENT_PROCESSING_INTEGRATION,
        label: 'Document AI',
        description: 'Process documents with AI',
        icon: 'Brain'
      }
    ]
  },
  utilities: {
    label: 'Utilities',
    nodes: [
      {
        type: NodeType.DELAY_NODE,
        label: 'Delay',
        description: 'Add a delay',
        icon: 'Pause'
      },
      {
        type: NodeType.PARALLEL_NODE,
        label: 'Parallel',
        description: 'Run in parallel',
        icon: 'Layers'
      },
      {
        type: NodeType.JOIN_NODE,
        label: 'Join',
        description: 'Wait for multiple paths',
        icon: 'Merge'
      }
    ]
  }
};

// Default React Flow options
export const defaultFlowOptions = {
  connectionLineType: ConnectionLineType.SmoothStep,
  defaultEdgeOptions: {
    type: 'smoothstep',
    animated: false,
    style: edgeStyleConfig[EdgeType.DEFAULT]
  },
  fitView: true,
  fitViewOptions: {
    padding: 0.2,
    minZoom: 0.1,
    maxZoom: 2
  },
  snapToGrid: true,
  snapGrid: [20, 20] as [number, number],
  attributionPosition: 'bottom-left' as const,
  panOnScroll: true,
  selectionOnDrag: true,
  panOnDrag: [1, 2] as [number, number],
  zoomOnScroll: true,
  zoomOnPinch: true,
  zoomOnDoubleClick: true,
  preventScrolling: true,
  nodesDraggable: true,
  nodesConnectable: true,
  nodesFocusable: true,
  edgesFocusable: true,
  elementsSelectable: true,
  selectNodesOnDrag: false,
  multiSelectionKeyCode: 'Meta'
};

// Export configuration
export {
  nodeStyleConfig,
  edgeStyleConfig,
  connectionRules,
  isValidConnection,
  layoutConfig,
  nodeCategories,
  defaultFlowOptions
};