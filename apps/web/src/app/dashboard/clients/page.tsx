'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Filter,
  Download,
  Upload,
  Search,
  Grid3X3,
  List,
  Eye,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  RefreshCw,
  FileText,
  Archive,
  Trash2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { clientTableColumns } from '@/components/clients/client-table-columns'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { api } from '@/lib/trpc'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

const filterOptions = {
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
  ],
  businessType: [
    { value: 'Corporation', label: 'Corporation' },
    { value: 'LLC', label: 'LLC' },
    { value: 'Partnership', label: 'Partnership' },
    { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
  ],
  riskLevel: [
    { value: 'low', label: 'Low Risk' },
    { value: 'medium', label: 'Medium Risk' },
    { value: 'high', label: 'High Risk' },
  ],
}

export default function ClientsPage() {
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [businessTypeFilter, setBusinessTypeFilter] = useState('')
  const [riskLevelFilter, setRiskLevelFilter] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Build filters object
  const filters = useMemo(() => {
    const result: any = {}
    if (searchQuery) result.search = searchQuery
    if (statusFilter) result.status = [statusFilter]
    if (businessTypeFilter) result.businessType = [businessTypeFilter]
    if (riskLevelFilter) result.riskLevel = [riskLevelFilter]
    return result
  }, [searchQuery, statusFilter, businessTypeFilter, riskLevelFilter])

  // tRPC queries
  const {
    data: clientsData,
    isLoading,
    error,
    refetch: refetchClients
  } = api.client.list.useQuery(
    {
      filters,
      pagination: {
        page,
        limit: pageSize,
      },
      sort: {
        field: 'businessName',
        direction: 'asc'
      }
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  )

  const {
    data: clientStats,
    isLoading: isStatsLoading
  } = api.client.stats.useQuery()

  // Mutations
  const bulkOperationMutation = api.client.bulkOperation.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully processed ${result.processed} clients`)
      setSelectedClients([])
      refetchClients()
    },
    onError: (error) => {
      toast.error(`Failed to process clients: ${error.message}`)
    }
  })

  const exportMutation = api.client.export.useMutation({
    onSuccess: (result) => {
      // Create download link
      const blob = new Blob([result.data], { type: result.contentType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Client data exported successfully')
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`)
    }
  })

  const clients = clientsData?.data || []

  const handleBulkExport = async () => {
    try {
      await exportMutation.mutateAsync({
        filters: selectedClients.length > 0 ? { id: selectedClients } : filters,
        fields: ['businessName', 'primaryContactName', 'primaryContactEmail', 'status', 'businessType']
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleBulkArchive = async () => {
    if (selectedClients.length === 0) return

    try {
      await bulkOperationMutation.mutateAsync({
        action: 'archive',
        clientIds: selectedClients,
        data: {
          reason: 'Bulk archive operation'
        }
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedClients.length} client(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await bulkOperationMutation.mutateAsync({
        action: 'delete',
        clientIds: selectedClients,
        data: {}
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchClients()
      toast.success('Client list refreshed')
    } catch (error) {
      toast.error('Failed to refresh client list')
    } finally {
      setIsRefreshing(false)
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setBusinessTypeFilter('')
    setRiskLevelFilter('')
    setSearchQuery('')
  }

  if (isLoading && !clientsData) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to load clients
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error.message}
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Clients
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your client relationships and information
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Stats Display */}
              {clientStats && (
                <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{clientStats.totalClients} Total</span>
                  <span>{clientStats.activeClients} Active</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={exportMutation.isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button asChild>
                <Link href="/dashboard/clients/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search clients by name, email, or business type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.status.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Business Type" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.businessType.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.riskLevel.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(statusFilter || businessTypeFilter || riskLevelFilter || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        {selectedClients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedClients.length} client(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={exportMutation.isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkArchive}
                  disabled={bulkOperationMutation.isLoading}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkOperationMutation.isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {viewMode === 'table' ? (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
              <DataTable
                columns={clientTableColumns}
                data={clients}
                searchKey="businessName"
                searchPlaceholder="Search clients..."
                onRowSelectionChange={setSelectedClients}
              />
              {/* Pagination */}
              {clientsData && clientsData.pagination && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, clientsData.pagination.total)} of {clientsData.pagination.total} clients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {clientsData.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= (clientsData.pagination.totalPages || 1) || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              {isLoading && clients.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {clients.map((client: any) => (
                    <motion.div
                      key={client.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {client.businessName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {client.businessName}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {client.businessType}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={client.status} size="sm" />
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{client.primaryContactEmail}</span>
                        </div>
                        {client.primaryContactPhone && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{client.primaryContactPhone}</span>
                          </div>
                        )}
                        {client.quickbooksId && (
                          <div className="flex items-center space-x-2 text-xs text-green-600">
                            <FileText className="w-3 h-3" />
                            <span>QB Connected</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {client._count?.engagements || 0} engagements
                          </Badge>
                        </div>
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {!isLoading && clients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {Object.keys(filters).length > 0 ? 'No clients match your filters' : 'No clients found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {Object.keys(filters).length > 0
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Get started by adding your first client to the system.'
              }
            </p>
            {Object.keys(filters).length > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/clients/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Link>
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}