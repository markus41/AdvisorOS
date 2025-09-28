'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Tag,
  FileText,
  Building,
  DollarSign,
  Clock,
  ChevronDown,
  History,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SearchFilter {
  id: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  label: string
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  icon?: React.ComponentType<any>
}

interface SearchQuery {
  text: string
  filters: Record<string, any>
}

interface AdvancedSearchProps {
  placeholder?: string
  filters?: SearchFilter[]
  recentSearches?: string[]
  onSearch: (query: SearchQuery) => void
  onClear?: () => void
  className?: string
}

const defaultFilters: SearchFilter[] = [
  {
    id: 'client',
    type: 'text',
    label: 'Client',
    placeholder: 'Search by client name...',
    icon: User,
  },
  {
    id: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    icon: Tag,
  },
  {
    id: 'dateRange',
    type: 'date',
    label: 'Date Range',
    icon: Calendar,
  },
  {
    id: 'amount',
    type: 'number',
    label: 'Amount',
    placeholder: 'Min amount...',
    icon: DollarSign,
  },
  {
    id: 'category',
    type: 'select',
    label: 'Category',
    options: [
      { value: 'tax', label: 'Tax Services' },
      { value: 'bookkeeping', label: 'Bookkeeping' },
      { value: 'audit', label: 'Audit' },
      { value: 'consulting', label: 'Consulting' },
    ],
    icon: Building,
  },
]

export function AdvancedSearch({
  placeholder = 'Search...',
  filters = defaultFilters,
  recentSearches = [],
  onSearch,
  onClear,
  className,
}: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mock search suggestions
  const [suggestions] = useState([
    { type: 'client', text: 'ABC Corporation', icon: User },
    { type: 'document', text: 'Tax Return 2023', icon: FileText },
    { type: 'quick', text: 'Overdue invoices', icon: Clock },
    { type: 'quick', text: 'Active clients', icon: User },
    { type: 'quick', text: 'Recent uploads', icon: FileText },
  ])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    const query: SearchQuery = {
      text: searchText,
      filters: activeFilters,
    }
    onSearch(query)
    setShowSuggestions(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setShowSuggestions(false)
    }
  }

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters }
    if (value === '' || value === null || value === undefined) {
      delete newFilters[filterId]
    } else {
      newFilters[filterId] = value
    }
    setActiveFilters(newFilters)
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchText('')
    onClear?.()
  }

  const activeFilterCount = Object.keys(activeFilters).length
  const hasActiveFilters = activeFilterCount > 0 || searchText.length > 0

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 relative"
              >
                <Filter className="w-3 h-3" />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <AdvancedFilters
                filters={filters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onApply={() => {
                  handleSearch()
                  setIsOpen(false)
                }}
                onClear={clearFilters}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && (searchText.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          >
            <div className="p-3 space-y-2">
              {/* Quick Suggestions */}
              {searchText.length > 0 && (
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Suggestions
                  </div>
                  {suggestions
                    .filter(s => s.text.toLowerCase().includes(searchText.toLowerCase()))
                    .slice(0, 5)
                    .map((suggestion, index) => {
                      const Icon = suggestion.icon
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchText(suggestion.text)
                            setShowSuggestions(false)
                            handleSearch()
                          }}
                          className="w-full flex items-center space-x-3 px-2 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span>{suggestion.text}</span>
                          <Badge variant="outline" size="sm">
                            {suggestion.type}
                          </Badge>
                        </button>
                      )
                    })}
                </>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  {searchText.length > 0 && <Separator />}
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Recent Searches
                  </div>
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchText(search)
                        setShowSuggestions(false)
                        handleSearch()
                      }}
                      className="w-full flex items-center space-x-3 px-2 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <History className="w-4 h-4 text-gray-400" />
                      <span>{search}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Quick Actions */}
              <Separator />
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Quick Actions
              </div>
              <button
                onClick={() => {
                  setSearchText('')
                  setActiveFilters({ status: 'overdue' })
                  handleSearch()
                  setShowSuggestions(false)
                }}
                className="w-full flex items-center space-x-3 px-2 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Show overdue items</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {searchText && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Search className="w-3 h-3" />
              <span>{searchText}</span>
              <button
                onClick={() => setSearchText('')}
                className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find(f => f.id === key)
            if (!filter || !value) return null

            const Icon = filter.icon
            const displayValue = filter.type === 'select'
              ? filter.options?.find(o => o.value === value)?.label || value
              : value

            return (
              <Badge key={key} variant="secondary" className="flex items-center space-x-1">
                {Icon && <Icon className="w-3 h-3" />}
                <span>{filter.label}: {displayValue}</span>
                <button
                  onClick={() => handleFilterChange(key, null)}
                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

interface AdvancedFiltersProps {
  filters: SearchFilter[]
  activeFilters: Record<string, any>
  onFilterChange: (filterId: string, value: any) => void
  onApply: () => void
  onClear: () => void
}

function AdvancedFilters({
  filters,
  activeFilters,
  onFilterChange,
  onApply,
  onClear,
}: AdvancedFiltersProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear All
        </Button>
      </div>

      <div className="space-y-4 mb-4">
        {filters.map((filter) => {
          const Icon = filter.icon
          return (
            <div key={filter.id} className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{filter.label}</span>
              </label>

              {filter.type === 'text' && (
                <Input
                  value={activeFilters[filter.id] || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  placeholder={filter.placeholder}
                />
              )}

              {filter.type === 'select' && (
                <Select
                  value={activeFilters[filter.id] || ''}
                  onValueChange={(value) => onFilterChange(filter.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${filter.label.toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filter.type === 'number' && (
                <Input
                  type="number"
                  value={activeFilters[filter.id] || ''}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  placeholder={filter.placeholder}
                />
              )}

              {filter.type === 'date' && (
                <DateRangePicker
                  value={activeFilters[filter.id]}
                  onChange={(value) => onFilterChange(filter.id, value)}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex space-x-2">
        <Button onClick={onApply} className="flex-1">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  )
}