'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Clock,
  FileText,
  Users,
  BarChart3,
  Command,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'client' | 'document' | 'report' | 'workflow' | 'team'
  href: string
  icon?: React.ElementType
  recent?: boolean
}

interface SearchBarProps {
  placeholder?: string
  className?: string
  onResultSelect?: (result: SearchResult) => void
  shortcut?: boolean
}

// Mock search results
const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'John Smith Corporation',
    description: 'Tax preparation client - Due: April 15',
    type: 'client',
    href: '/dashboard/clients/1',
    icon: Users,
  },
  {
    id: '2',
    title: 'Q4 2024 Tax Documents',
    description: 'Corporate tax filings and supporting docs',
    type: 'document',
    href: '/dashboard/documents/q4-2024',
    icon: FileText,
  },
  {
    id: '3',
    title: 'Monthly Revenue Report',
    description: 'Financial performance for March 2024',
    type: 'report',
    href: '/dashboard/reports/revenue-march',
    icon: BarChart3,
    recent: true,
  },
]

const recentSearches: SearchResult[] = [
  {
    id: 'recent-1',
    title: 'Sarah Johnson LLC',
    type: 'client',
    href: '/dashboard/clients/sarah-johnson',
    icon: Users,
    recent: true,
  },
  {
    id: 'recent-2',
    title: 'Expense Reports Template',
    type: 'document',
    href: '/dashboard/documents/expense-template',
    icon: FileText,
    recent: true,
  },
]

const typeIcons = {
  client: Users,
  document: FileText,
  report: BarChart3,
  workflow: Command,
  team: Users,
}

const typeColors = {
  client: 'text-blue-600 dark:text-blue-400',
  document: 'text-green-600 dark:text-green-400',
  report: 'text-purple-600 dark:text-purple-400',
  workflow: 'text-orange-600 dark:text-orange-400',
  team: 'text-cyan-600 dark:text-cyan-400',
}

export function SearchBar({
  placeholder = "Search clients, documents, reports...",
  className,
  onResultSelect,
  shortcut = true
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    if (shortcut) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcut])

  // Handle search
  useEffect(() => {
    if (!query.trim()) {
      setResults(recentSearches)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Simulate API call
    const timer = setTimeout(() => {
      const filtered = mockResults.filter(
        result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setIsLoading(false)
      setActiveIndex(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setQuery('')
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[activeIndex]) {
          handleResultSelect(results[activeIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-md', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-12 py-2 text-sm',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-sm',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'transition-all duration-200'
          )}
        />

        {/* Shortcut hint */}
        {shortcut && !isOpen && !query && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <span className="text-xs text-gray-400">⌘K</span>
          </div>
        )}

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg',
              'max-h-96 overflow-y-auto'
            )}
          >
            {isLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Searching...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {!query && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Recent
                  </div>
                )}

                {results.map((result, index) => {
                  const Icon = result.icon || typeIcons[result.type]
                  const isActive = index === activeIndex

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={cn(
                        'w-full px-3 py-2 text-left flex items-center space-x-3',
                        'hover:bg-gray-50 dark:hover:bg-gray-700',
                        'transition-colors duration-150',
                        isActive && 'bg-gray-50 dark:bg-gray-700'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', typeColors[result.type])} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </div>
                        {result.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </button>
                  )
                })}
              </div>
            ) : query ? (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Start typing to search...
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact version for header
export function HeaderSearchBar({ className }: { className?: string }) {
  return (
    <SearchBar
      placeholder="Search..."
      className={cn('max-w-xs', className)}
      shortcut={true}
    />
  )
}