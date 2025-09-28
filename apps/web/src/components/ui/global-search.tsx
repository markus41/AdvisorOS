'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  Clock,
  ArrowRight,
  Command,
  Hash,
  User,
  Folder,
  CreditCard,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'client' | 'document' | 'invoice' | 'workflow' | 'report' | 'team' | 'setting'
  url: string
  icon: React.ComponentType<any>
  metadata?: Record<string, any>
  lastAccessed?: string
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
}

// Mock search results
const searchResults: SearchResult[] = [
  {
    id: '1',
    title: 'John Smith',
    description: 'Individual client - Tax return due February 15',
    type: 'client',
    url: '/dashboard/clients/john-smith',
    icon: User,
    metadata: { status: 'active', category: 'Individual' },
    lastAccessed: '2 hours ago',
  },
  {
    id: '2',
    title: 'ABC Corporation Tax Return 2023',
    description: 'Corporate tax return - Form 1120',
    type: 'document',
    url: '/dashboard/documents/abc-corp-tax-2023',
    icon: FileText,
    metadata: { size: '2.4 MB', status: 'completed' },
    lastAccessed: '1 day ago',
  },
  {
    id: '3',
    title: 'Invoice #INV-2024-001',
    description: 'TechStart Inc. - $4,500.00',
    type: 'invoice',
    url: '/dashboard/invoices/inv-2024-001',
    icon: CreditCard,
    metadata: { amount: 4500, status: 'paid' },
    lastAccessed: '3 hours ago',
  },
  {
    id: '4',
    title: 'Monthly Bookkeeping Workflow',
    description: 'Standard monthly reconciliation process',
    type: 'workflow',
    url: '/dashboard/workflows/monthly-bookkeeping',
    icon: TrendingUp,
    metadata: { status: 'active', steps: 15 },
    lastAccessed: '5 hours ago',
  },
  {
    id: '5',
    title: 'Q4 2023 Financial Report',
    description: 'Quarterly financial summary and analysis',
    type: 'report',
    url: '/dashboard/reports/q4-2023-financial',
    icon: TrendingUp,
    metadata: { period: 'Q4 2023', type: 'Financial' },
    lastAccessed: '1 week ago',
  },
  {
    id: '6',
    title: 'Sarah Johnson',
    description: 'Senior Partner - Team member',
    type: 'team',
    url: '/dashboard/team/sarah-johnson',
    icon: User,
    metadata: { role: 'Senior Partner', department: 'Leadership' },
    lastAccessed: '2 days ago',
  },
  {
    id: '7',
    title: 'Integration Settings',
    description: 'QuickBooks and Stripe configuration',
    type: 'setting',
    url: '/dashboard/settings#integrations',
    icon: Settings,
    metadata: { category: 'Integrations' },
    lastAccessed: '1 week ago',
  },
]

const quickActions = [
  { name: 'New Client', command: 'new client', url: '/dashboard/clients/new', icon: Users },
  { name: 'Upload Document', command: 'upload', url: '/dashboard/documents/upload', icon: FileText },
  { name: 'Create Invoice', command: 'invoice', url: '/dashboard/invoices/new', icon: DollarSign },
  { name: 'View Calendar', command: 'calendar', url: '/dashboard/calendar', icon: Calendar },
  { name: 'Team Overview', command: 'team', url: '/dashboard/team', icon: Users },
  { name: 'Settings', command: 'settings', url: '/dashboard/settings', icon: Settings },
]

const recentSearches = [
  'ABC Corporation',
  'tax return 2023',
  'monthly reconciliation',
  'client payments',
  'team schedule',
]

export function GlobalSearch({ isOpen, onClose, onOpen }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onOpen, onClose])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle search and filtering
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResults([])
      setSelectedIndex(0)
      return
    }

    let results = searchResults.filter(result => {
      const matchesSearch =
        result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = !activeFilter || result.type === activeFilter

      return matchesSearch && matchesFilter
    })

    // Sort by relevance (exact title match first, then description matches)
    results.sort((a, b) => {
      const aExactTitle = a.title.toLowerCase().includes(searchTerm.toLowerCase())
      const bExactTitle = b.title.toLowerCase().includes(searchTerm.toLowerCase())

      if (aExactTitle && !bExactTitle) return -1
      if (!aExactTitle && bExactTitle) return 1

      return 0
    })

    setFilteredResults(results.slice(0, 8)) // Limit to 8 results
    setSelectedIndex(0)
  }, [searchTerm, activeFilter])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredResults.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredResults.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev === 0 ? filteredResults.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredResults[selectedIndex]) {
          handleResultClick(filteredResults[selectedIndex])
        }
        break
    }
  }

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.url
    onClose()
    setSearchTerm('')
  }

  const handleQuickActionClick = (action: typeof quickActions[0]) => {
    window.location.href = action.url
    onClose()
    setSearchTerm('')
  }

  const handleRecentSearchClick = (search: string) => {
    setSearchTerm(search)
    searchInputRef.current?.focus()
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return User
      case 'document': return FileText
      case 'invoice': return CreditCard
      case 'workflow': return TrendingUp
      case 'report': return TrendingUp
      case 'team': return User
      case 'setting': return Settings
      default: return FileText
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'text-blue-600 dark:text-blue-400'
      case 'document': return 'text-green-600 dark:text-green-400'
      case 'invoice': return 'text-purple-600 dark:text-purple-400'
      case 'workflow': return 'text-orange-600 dark:text-orange-400'
      case 'report': return 'text-indigo-600 dark:text-indigo-400'
      case 'team': return 'text-pink-600 dark:text-pink-400'
      case 'setting': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTypeBadgeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'client': return 'blue'
      case 'document': return 'green'
      case 'invoice': return 'purple'
      case 'workflow': return 'orange'
      case 'report': return 'indigo'
      case 'team': return 'pink'
      case 'setting': return 'gray'
      default: return 'gray'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search clients, documents, workflows..."
                className="pl-10 pr-10 text-lg h-12 border-0 focus:ring-0"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 mt-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex space-x-1">
                {['client', 'document', 'invoice', 'workflow'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-full transition-colors',
                      activeFilter === filter
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {searchTerm.trim() ? (
              filteredResults.length > 0 ? (
                <div className="py-2">
                  {filteredResults.map((result, index) => {
                    const Icon = getTypeIcon(result.type)
                    const isSelected = index === selectedIndex

                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          'w-full flex items-center space-x-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                          isSelected && 'bg-gray-50 dark:bg-gray-700'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700', getTypeColor(result.type))}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </p>
                            <Badge color={getTypeBadgeColor(result.type)} size="sm" variant="light">
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.description}
                          </p>
                          {result.lastAccessed && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{result.lastAccessed}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms</p>
                </div>
              )
            ) : (
              <div className="py-4">
                {/* Quick Actions */}
                <div className="px-4 mb-4">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.slice(0, 6).map((action) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.command}
                          onClick={() => handleQuickActionClick(action)}
                          className="flex items-center space-x-2 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{action.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Recent Searches */}
                <div className="px-4 mt-4">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentSearchClick(search)}
                        className="flex items-center space-x-2 w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↑↓</kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↵</kbd>
                  <span>select</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">esc</kbd>
                  <span>close</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Command className="w-3 h-3" />
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">K</kbd>
                <span>to search</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}