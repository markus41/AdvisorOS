'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  Square,
  MoreHorizontal,
  Trash2,
  Mail,
  Download,
  Edit,
  Archive,
  Tag,
  Users,
  Calendar,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  requiresConfirmation?: boolean
  confirmationMessage?: string
  disabled?: boolean
}

interface BulkOperationsProps {
  selectedItems: string[]
  totalItems: number
  onSelectAll: (checked: boolean) => void
  onSelectItem: (id: string, checked: boolean) => void
  onClearSelection: () => void
  actions?: BulkAction[]
  onAction: (actionId: string, selectedItems: string[]) => void
  className?: string
}

const defaultActions: BulkAction[] = [
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected items? This action cannot be undone.',
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'outline',
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    variant: 'outline',
  },
  {
    id: 'email',
    label: 'Send Email',
    icon: Mail,
    variant: 'outline',
  },
  {
    id: 'assign',
    label: 'Assign',
    icon: Users,
    variant: 'outline',
  },
  {
    id: 'tag',
    label: 'Add Tags',
    icon: Tag,
    variant: 'outline',
  },
]

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose: () => void
}

function Notification({ type, message, onClose }: NotificationProps) {
  const icons = {
    success: CheckCircle2,
    error: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-md',
        colors[type]
      )}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export function BulkOperations({
  selectedItems,
  totalItems,
  onSelectAll,
  onSelectItem,
  onClearSelection,
  actions = defaultActions,
  onAction,
  className,
}: BulkOperationsProps) {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null)

  const allSelected = selectedItems.length === totalItems && totalItems > 0
  const someSelected = selectedItems.length > 0
  const indeterminate = someSelected && !allSelected

  const handleSelectAll = () => {
    onSelectAll(!allSelected)
  }

  const handleAction = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action) return

    if (action.requiresConfirmation) {
      setConfirmingAction(actionId)
      return
    }

    await executeAction(actionId)
  }

  const executeAction = async (actionId: string) => {
    try {
      await onAction(actionId, selectedItems)

      // Show success notification
      const action = actions.find(a => a.id === actionId)
      setNotification({
        type: 'success',
        message: `Successfully ${action?.label.toLowerCase()}d ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}`,
      })

      // Clear selection after successful action
      onClearSelection()
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'An error occurred while performing the action. Please try again.',
      })
    }

    setConfirmingAction(null)
  }

  const confirmAction = () => {
    if (confirmingAction) {
      executeAction(confirmingAction)
    }
  }

  const cancelAction = () => {
    setConfirmingAction(null)
  }

  if (!someSelected) {
    return null
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Select All Checkbox */}
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : indeterminate ? (
                <div className="w-5 h-5 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-white" />
                </div>
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedItems.length} of {totalItems} selected
              </span>
            </button>

            <Separator orientation="vertical" className="h-6" />

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {actions.slice(0, 3).map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => handleAction(action.id)}
                    disabled={action.disabled}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                )
              })}

              {actions.length > 3 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.slice(3).map((action) => {
                      const Icon = action.icon
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => handleAction(action.id)}
                          disabled={action.disabled}
                          className={cn(
                            action.variant === 'destructive' && 'text-red-600 dark:text-red-400'
                          )}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {action.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {selectedItems.length} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmingAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {actions.find(a => a.id === confirmingAction)?.confirmationMessage ||
                     'Are you sure you want to perform this action?'}
                  </p>
                  <div className="flex items-center space-x-3 mt-3">
                    <Button size="sm" variant="destructive" onClick={confirmAction}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelAction}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Checkbox component for individual items
interface BulkSelectCheckboxProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function BulkSelectCheckbox({
  id,
  checked,
  onCheckedChange,
  className,
}: BulkSelectCheckboxProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCheckedChange(!checked)
      }}
      className={cn(
        'flex items-center justify-center w-5 h-5 rounded border-2 transition-colors',
        checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
        className
      )}
    >
      {checked && <CheckSquare className="w-3 h-3" />}
    </button>
  )
}

// Hook for managing bulk selection state
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id))
    }
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const isSelected = (id: string) => selectedItems.includes(id)

  const getSelectedItems = () => {
    return items.filter(item => selectedItems.includes(item.id))
  }

  return {
    selectedItems,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
    isSelected,
    getSelectedItems,
  }
}