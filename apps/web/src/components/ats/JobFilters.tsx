'use client'

import React from 'react'
import { Search, X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string | null
  onStatusFilterChange: (status: string | null) => void
  departmentFilter: string | null
  onDepartmentFilterChange: (department: string | null) => void
  departments?: string[]
  className?: string
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function JobFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments = [],
  className,
}: JobFiltersProps) {
  const hasActiveFilters = searchQuery || statusFilter || departmentFilter

  const handleClearFilters = () => {
    onSearchChange('')
    onStatusFilterChange(null)
    onDepartmentFilterChange(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs by title, keywords, or location..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-lg',
            'bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'placeholder:text-gray-500 dark:placeholder:text-gray-400',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors'
          )}
          aria-label="Search jobs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter || 'all'}
          onChange={(e) => onStatusFilterChange(e.target.value === 'all' ? null : e.target.value)}
          className={cn(
            'px-3 py-2 rounded-lg text-sm',
            'bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600',
            'text-gray-900 dark:text-white',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors',
            'cursor-pointer'
          )}
          aria-label="Filter by status"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        {departments.length > 0 && (
          <select
            value={departmentFilter || 'all'}
            onChange={(e) =>
              onDepartmentFilterChange(e.target.value === 'all' ? null : e.target.value)
            }
            className={cn(
              'px-3 py-2 rounded-lg text-sm',
              'bg-white dark:bg-gray-800',
              'border border-gray-300 dark:border-gray-600',
              'text-gray-900 dark:text-white',
              'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-colors',
              'cursor-pointer'
            )}
            aria-label="Filter by department"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'transition-colors',
              'flex items-center gap-1.5'
            )}
            aria-label="Clear all filters"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Active filters:</span>
          {searchQuery && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md">
              Search: "{searchQuery}"
            </span>
          )}
          {statusFilter && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-md">
              Status: {statusFilter}
            </span>
          )}
          {departmentFilter && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md">
              Department: {departmentFilter}
            </span>
          )}
        </div>
      )}
    </div>
  )
}