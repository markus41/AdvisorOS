import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  Plus,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from './utils/cn'
import { Button } from './Button'
import { Badge } from './Badge'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  dueDate?: Date
  tags?: string[]
  estimatedHours?: number
  actualHours?: number
}

export interface TaskColumn {
  id: string
  title: string
  status: Task['status']
  tasks: Task[]
  color?: string
  limit?: number
}

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'warning'
      case 'medium': return 'info'
      default: return 'secondary'
    }
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3" />
      case 'high': return <AlertCircle className="w-3 h-3" />
      case 'medium': return <Circle className="w-3 h-3" />
      default: return <Circle className="w-3 h-3" />
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in-progress': return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
      default: return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const isOverdue = task.dueDate && new Date() > task.dueDate && task.status !== 'completed'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-grab',
        isDragging && 'opacity-50 transform rotate-2',
        isOverdue && 'border-red-300 bg-red-50'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon(task.status)}
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
            {task.title}
          </h4>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
            <span className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <span className="capitalize">{task.priority}</span>
            </span>
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{task.tags.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {task.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span className={cn(isOverdue && 'text-red-600 font-medium')}>
                {task.dueDate.toLocaleDateString()}
              </span>
            </div>
          )}
          {task.estimatedHours && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}
        </div>

        {task.assignee && (
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
              {task.assignee.avatar ? (
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                task.assignee.name[0].toUpperCase()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface TaskColumnProps {
  column: TaskColumn
  onAddTask?: (columnId: string) => void
}

const TaskColumnComponent: React.FC<TaskColumnProps> = ({ column, onAddTask }) => {
  const taskCount = column.tasks.length
  const isAtLimit = column.limit && taskCount >= column.limit

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {taskCount}
            {column.limit && `/${column.limit}`}
          </Badge>
          {isAtLimit && (
            <Badge variant="warning" className="text-xs">
              At Limit
            </Badge>
          )}
        </div>
        {onAddTask && !isAtLimit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddTask(column.id)}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {taskCount === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Circle className="w-8 h-8 mb-2" />
          <p className="text-sm">No tasks</p>
        </div>
      )}
    </div>
  )
}

interface TaskBoardProps {
  columns: TaskColumn[]
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string, newIndex: number) => void
  onAddTask?: (columnId: string) => void
  className?: string
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  columns: initialColumns,
  onTaskMove,
  onAddTask,
  className,
}) => {
  const [columns, setColumns] = useState(initialColumns)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeTaskId = active.id as string
    const overTaskId = over.id as string

    // Find the task and its current column
    let activeTask: Task | undefined
    let activeColumnId: string | undefined
    let activeTaskIndex: number = -1

    for (const column of columns) {
      const taskIndex = column.tasks.findIndex((task) => task.id === activeTaskId)
      if (taskIndex !== -1) {
        activeTask = column.tasks[taskIndex]
        activeColumnId = column.id
        activeTaskIndex = taskIndex
        break
      }
    }

    if (!activeTask || !activeColumnId) return

    // Find the target column and position
    let targetColumnId: string | undefined
    let targetTaskIndex: number = -1

    for (const column of columns) {
      const taskIndex = column.tasks.findIndex((task) => task.id === overTaskId)
      if (taskIndex !== -1) {
        targetColumnId = column.id
        targetTaskIndex = taskIndex
        break
      }
    }

    if (!targetColumnId) {
      // If no specific task, try to find column by ID
      const targetColumn = columns.find((col) => col.id === overTaskId)
      if (targetColumn) {
        targetColumnId = targetColumn.id
        targetTaskIndex = targetColumn.tasks.length
      }
    }

    if (!targetColumnId) return

    // Check column limits
    const targetColumn = columns.find((col) => col.id === targetColumnId)
    if (
      targetColumn &&
      targetColumn.limit &&
      targetColumnId !== activeColumnId &&
      targetColumn.tasks.length >= targetColumn.limit
    ) {
      return // Don't allow move if target column is at limit
    }

    // Update state
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]

      // Remove task from source column
      const sourceColumnIndex = newColumns.findIndex((col) => col.id === activeColumnId)
      const sourceColumn = newColumns[sourceColumnIndex]
      const newSourceTasks = [...sourceColumn.tasks]
      newSourceTasks.splice(activeTaskIndex, 1)

      // Add task to target column
      const targetColumnIndex = newColumns.findIndex((col) => col.id === targetColumnId)
      const targetColumn = newColumns[targetColumnIndex]
      const newTargetTasks = [...targetColumn.tasks]

      if (targetColumnId === activeColumnId) {
        // Same column, just reorder
        const newTasks = arrayMove(sourceColumn.tasks, activeTaskIndex, targetTaskIndex)
        newColumns[sourceColumnIndex] = {
          ...sourceColumn,
          tasks: newTasks,
        }
      } else {
        // Different columns
        const updatedTask = {
          ...activeTask,
          status: targetColumn.status,
        }
        newTargetTasks.splice(targetTaskIndex, 0, updatedTask)

        newColumns[sourceColumnIndex] = {
          ...sourceColumn,
          tasks: newSourceTasks,
        }
        newColumns[targetColumnIndex] = {
          ...targetColumn,
          tasks: newTargetTasks,
        }
      }

      return newColumns
    })

    // Notify parent component
    if (onTaskMove) {
      onTaskMove(activeTaskId, activeColumnId, targetColumnId, targetTaskIndex)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <TaskColumnComponent
              key={column.id}
              column={column}
              onAddTask={onAddTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}