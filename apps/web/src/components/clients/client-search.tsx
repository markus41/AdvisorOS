'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Users,
  Building,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ClientSearchProps {
  onSelect?: (client: any) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function ClientSearch({
  onSelect,
  placeholder = "Search clients...",
  className,
  autoFocus = false
}: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // tRPC search query
  const {
    data: searchResults,
    isLoading,
    error
  } = api.client.search.useQuery(
    {
      query: debouncedQuery,
      limit: 10
    },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000,
    }
  )

  const results = searchResults?.results || []

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setIsOpen(value.length >= 2)
    setSelectedIndex(-1)
  }

  const handleSelect = (client: any) => {
    setQuery(client.businessName)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect?.(client)
  }

  const clearSearch = () => {
    setQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Searching clients...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error searching clients. Please try again.
                </p>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && debouncedQuery.length >= 2 && results.length === 0 && (
              <div className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No clients found for "{debouncedQuery}"
                </p>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="py-2">
                {results.map((client, index) => (
                  <motion.button
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700",
                      selectedIndex === index && "bg-gray-50 dark:bg-gray-700"
                    )}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Client Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {client.businessName.split(' ').map((n: string) => n[0]).join('')}
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {client.businessName}
                          </h3>
                          <StatusBadge status={client.status} size="sm" variant="dot" />
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Building className="w-3 h-3" />
                            <span>{client.businessType}</span>
                          </div>
                          {client.primaryContactEmail && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">
                                {client.primaryContactEmail}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {client.annualRevenue && (
                              <Badge variant="outline" className="text-xs">
                                {formatCurrency(client.annualRevenue)}
                              </Badge>
                            )}
                            {client.quickbooksId && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                QB
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <span>{client._count?.engagements || 0} engagements</span>
                          </div>
                        </div>
                      </div>

                      {/* External Link Icon */}
                      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    </div>
                  </motion.button>
                ))}

                {/* View All Results Link */}
                {searchResults && searchResults.count > results.length && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                    <Link
                      href={`/dashboard/clients?search=${encodeURIComponent(debouncedQuery)}`}
                      className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      View all {searchResults.count} results
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Search Tips */}
            {debouncedQuery.length < 2 && query.length >= 1 && (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ClientSearch