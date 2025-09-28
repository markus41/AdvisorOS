'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Keyboard,
  Search,
  Plus,
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Command,
  Shift,
  Alt,
  X,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface KeyboardShortcut {
  id: string
  name: string
  description: string
  keys: string[]
  category: 'navigation' | 'actions' | 'general'
  action: () => void
}

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    keys: ['g', 'd'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard',
  },
  {
    id: 'clients',
    name: 'Go to Clients',
    description: 'Navigate to the clients page',
    keys: ['g', 'c'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard/clients',
  },
  {
    id: 'documents',
    name: 'Go to Documents',
    description: 'Navigate to the documents page',
    keys: ['g', 'f'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard/documents',
  },
  {
    id: 'analytics',
    name: 'Go to Analytics',
    description: 'Navigate to the analytics dashboard',
    keys: ['g', 'a'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard/analytics',
  },
  {
    id: 'workflows',
    name: 'Go to Workflows',
    description: 'Navigate to the workflows page',
    keys: ['g', 'w'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard/workflows',
  },
  {
    id: 'team',
    name: 'Go to Team',
    description: 'Navigate to the team management page',
    keys: ['g', 't'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard/team',
  },
  {
    id: 'settings',
    name: 'Go to Settings',
    description: 'Navigate to the settings page',
    keys: ['g', 's'],
    category: 'navigation',
    action: () => window.location.href = '/dashboard/settings',
  },

  // Actions
  {
    id: 'search',
    name: 'Global Search',
    description: 'Open the global search dialog',
    keys: ['cmd', 'k'],
    category: 'actions',
    action: () => {
      // This would be handled by the GlobalSearch component
      console.log('Opening global search')
    },
  },
  {
    id: 'new-client',
    name: 'New Client',
    description: 'Create a new client',
    keys: ['cmd', 'shift', 'c'],
    category: 'actions',
    action: () => window.location.href = '/dashboard/clients/new',
  },
  {
    id: 'upload-document',
    name: 'Upload Document',
    description: 'Upload a new document',
    keys: ['cmd', 'u'],
    category: 'actions',
    action: () => window.location.href = '/dashboard/documents/upload',
  },
  {
    id: 'new-invoice',
    name: 'New Invoice',
    description: 'Create a new invoice',
    keys: ['cmd', 'shift', 'i'],
    category: 'actions',
    action: () => window.location.href = '/dashboard/invoices/new',
  },
  {
    id: 'new-workflow',
    name: 'New Workflow',
    description: 'Create a new workflow',
    keys: ['cmd', 'shift', 'w'],
    category: 'actions',
    action: () => window.location.href = '/dashboard/workflows/new',
  },

  // General
  {
    id: 'help',
    name: 'Help',
    description: 'Show keyboard shortcuts',
    keys: ['?'],
    category: 'general',
    action: () => {
      // This would be handled by this component
      console.log('Opening help')
    },
  },
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open the command palette',
    keys: ['cmd', 'p'],
    category: 'general',
    action: () => {
      // This would open a command palette
      console.log('Opening command palette')
    },
  },
  {
    id: 'refresh',
    name: 'Refresh Page',
    description: 'Refresh the current page',
    keys: ['cmd', 'r'],
    category: 'general',
    action: () => window.location.reload(),
  },
]

export function KeyboardShortcuts({ isOpen, onClose, onOpen }: KeyboardShortcutsProps) {
  const [keySequence, setKeySequence] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)

  // Global keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Help shortcut
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        onOpen()
        return
      }

      // Command/Ctrl + K for search (handled by GlobalSearch component)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        return // Let GlobalSearch handle this
      }

      // Handle sequential shortcuts (like "g d" for dashboard)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setKeySequence(['g'])
        setIsListening(true)

        // Reset after 2 seconds
        setTimeout(() => {
          setKeySequence([])
          setIsListening(false)
        }, 2000)
        return
      }

      // Handle second key in sequence
      if (isListening && keySequence.length === 1 && keySequence[0] === 'g') {
        e.preventDefault()
        const fullSequence = ['g', e.key]

        const shortcut = shortcuts.find(s =>
          s.keys.length === 2 &&
          s.keys[0] === fullSequence[0] &&
          s.keys[1] === fullSequence[1]
        )

        if (shortcut) {
          shortcut.action()
        }

        setKeySequence([])
        setIsListening(false)
        return
      }

      // Handle single key shortcuts with modifiers
      const currentKeys = []
      if (e.metaKey || e.ctrlKey) currentKeys.push('cmd')
      if (e.shiftKey) currentKeys.push('shift')
      if (e.altKey) currentKeys.push('alt')
      currentKeys.push(e.key.toLowerCase())

      const shortcut = shortcuts.find(s => {
        if (s.keys.length !== currentKeys.length) return false
        return s.keys.every((key, index) => key === currentKeys[index])
      })

      if (shortcut && shortcut.id !== 'search' && shortcut.id !== 'help') {
        e.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [keySequence, isListening, onOpen])

  // Reset key sequence when modal closes
  useEffect(() => {
    if (!isOpen) {
      setKeySequence([])
      setIsListening(false)
    }
  }, [isOpen])

  const formatKey = (key: string) => {
    switch (key) {
      case 'cmd':
        return '⌘'
      case 'shift':
        return '⇧'
      case 'alt':
        return '⌥'
      case 'ctrl':
        return '⌃'
      default:
        return key.toUpperCase()
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return Home
      case 'actions':
        return Plus
      case 'general':
        return Settings
      default:
        return Keyboard
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'text-blue-600 dark:text-blue-400'
      case 'actions':
        return 'text-green-600 dark:text-green-400'
      case 'general':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  if (!isOpen) {
    return (
      <AnimatePresence>
        {(keySequence.length > 0 || isListening) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <Keyboard className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Press next key:
              </span>
              <div className="flex space-x-1">
                {keySequence.map((key, index) => (
                  <kbd key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
                    {formatKey(key)}
                  </kbd>
                ))}
                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-600 rounded text-xs font-mono animate-pulse">
                  ?
                </kbd>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Speed up your workflow with these keyboard shortcuts
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
                const Icon = getCategoryIcon(category)

                return (
                  <div key={category}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Icon className={cn('w-5 h-5', getCategoryColor(category))} />
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {category}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {categoryShortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {shortcut.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {shortcut.description}
                            </p>
                          </div>
                          <div className="flex space-x-1 ml-4">
                            {shortcut.keys.map((key, index) => (
                              <React.Fragment key={index}>
                                {index > 0 && shortcut.keys.length > 1 && (
                                  <span className="text-gray-400 text-xs">
                                    {shortcut.keys.includes('cmd') || shortcut.keys.includes('shift') || shortcut.keys.includes('alt') ? '+' : ' '}
                                  </span>
                                )}
                                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono min-w-[1.5rem] text-center">
                                  {formatKey(key)}
                                </kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">?</kbd>
                  <span>Show this dialog</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">esc</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span>Tip: Start with </span>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">g</kbd>
                <span> for quick navigation</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}