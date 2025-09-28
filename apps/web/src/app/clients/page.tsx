'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, Upload, Filter, Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/data-table'
import { clientTableColumns } from '@/components/clients/client-table-columns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/trpc'
import { ClientWithRelations, ClientFilterInput } from '@/types/client'
import { toast } from 'react-hot-toast'

export default function ClientsPage() {
  const router = useRouter()
  const [selectedClients, setSelectedClients] = useState<ClientWithRelations[]>([])
  const [filters, setFilters] = useState<ClientFilterInput>({})
  const [search, setSearch] = useState('')

  // Fetch clients with tRPC
  const {
    data: clientsData,
    isLoading,
    error,
    refetch
  } = api.client.list.useQuery({
    filters: {
      ...filters,
      search: search || undefined,
    },
    pagination: { page: 1, limit: 50 }
  })

  // Fetch client stats
  const { data: stats } = api.client.stats.useQuery()

  // Bulk delete mutation
  const bulkDeleteMutation = api.client.bulkOperation.useMutation({
    onSuccess: (result) => {
      toast.success(result.summary)
      setSelectedClients([])
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  // Export mutation
  const exportMutation = api.client.export.useMutation({
    onSuccess: (result) => {
      // Create and download file
      const blob = new Blob([result.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.fileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export completed successfully')
    },
    onError: (error) => {
      toast.error('Export failed: ' + error.message)
    }
  })

  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return

    if (confirm(`Are you sure you want to delete ${selectedClients.length} client(s)?`)) {
      bulkDeleteMutation.mutate({
        action: 'delete',
        clientIds: selectedClients.map(c => c.id)
      })
    }
  }

  const handleBulkExport = () => {
    exportMutation.mutate({
      format: 'csv',
      filters
    })
  }

  const handleFilterChange = (newFilters: Partial<ClientFilterInput>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800">Error loading clients</h3>
          <p className="text-red-600">{error.message}</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships and information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/clients/import')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkExport}
            disabled={exportMutation.isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push('/clients/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Clients
                </p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Clients
                </p>
                <p className="text-2xl font-bold">{stats.activeClients}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Prospects
                </p>
                <p className="text-2xl font-bold">{stats.prospectClients}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  QB Connected
                </p>
                <p className="text-2xl font-bold">{stats.quickBooksConnected}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 pb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge className="ml-2">{Object.keys(filters).length}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleFilterChange({ status: ['active'] })}>
              Active clients only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange({ status: ['prospect'] })}>
              Prospects only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange({ hasQuickBooks: true })}>
              QuickBooks connected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterChange({ riskLevel: ['high'] })}>
              High risk only
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilters({})}>
              Clear all filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted p-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedClients.length} client(s) selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportMutation.mutate({
                  format: 'csv',
                  filters: {
                    // Export only selected clients (would need to modify export to accept IDs)
                  }
                })
              }}
            >
              Export Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isLoading}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading clients...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={clientTableColumns}
            data={clientsData?.clients || []}
            searchKey="businessName"
            searchPlaceholder="Search by business name..."
            onRowSelectionChange={setSelectedClients}
          />
        )}
      </div>

      {/* Empty State */}
      {!isLoading && (!clientsData?.clients || clientsData.clients.length === 0) && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first client.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/clients/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}