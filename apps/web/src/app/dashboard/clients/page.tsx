'use client'

import React, { useState, useEffect } from 'react'
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
import Link from 'next/link'

// Mock data - replace with actual API calls
const mockClients = [
  {
    id: '1',
    businessName: 'ABC Corporation',
    legalName: 'ABC Corp Inc.',
    primaryContactName: 'John Smith',
    primaryContactEmail: 'john@abccorp.com',
    primaryContactPhone: '(555) 123-4567',
    status: 'active',
    businessType: 'Corporation',
    riskLevel: 'low',
    annualRevenue: 1250000,
    quickbooksId: 'qb-123',
    website: 'https://abccorp.com',
    createdAt: new Date('2023-01-15'),
    _count: {
      engagements: 12,
      documents: 45,
      invoices: 8,
    },
  },
  {
    id: '2',
    businessName: 'Smith LLC',
    legalName: 'Smith Limited Liability Company',
    primaryContactName: 'Sarah Johnson',
    primaryContactEmail: 'sarah@smithllc.com',
    primaryContactPhone: '(555) 987-6543',
    status: 'active',
    businessType: 'LLC',
    riskLevel: 'medium',
    annualRevenue: 850000,
    quickbooksId: null,
    website: null,
    createdAt: new Date('2023-03-22'),
    _count: {
      engagements: 8,
      documents: 32,
      invoices: 6,
    },
  },
  {
    id: '3',
    businessName: 'XYZ Ventures',
    legalName: 'XYZ Ventures Inc.',
    primaryContactName: 'Mike Wilson',
    primaryContactEmail: 'mike@xyzventures.com',
    primaryContactPhone: '(555) 456-7890',
    status: 'prospect',
    businessType: 'Corporation',
    riskLevel: 'high',
    annualRevenue: 2100000,
    quickbooksId: 'qb-456',
    website: 'https://xyzventures.com',
    createdAt: new Date('2023-06-10'),
    _count: {
      engagements: 3,
      documents: 12,
      invoices: 1,
    },
  },
  {
    id: '4',
    businessName: 'Johnson & Associates',
    legalName: 'Johnson & Associates Professional Services',
    primaryContactName: 'Emily Davis',
    primaryContactEmail: 'emily@johnsonassoc.com',
    primaryContactPhone: '(555) 321-0987',
    status: 'active',
    businessType: 'Partnership',
    riskLevel: 'low',
    annualRevenue: 675000,
    quickbooksId: 'qb-789',
    website: 'https://johnsonassoc.com',
    createdAt: new Date('2023-02-28'),
    _count: {
      engagements: 15,
      documents: 67,
      invoices: 12,
    },
  },
]

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
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClients, setSelectedClients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [businessTypeFilter, setBusinessTypeFilter] = useState('')
  const [riskLevelFilter, setRiskLevelFilter] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleBulkExport = () => {
    console.log('Exporting clients:', selectedClients)
    // Implement bulk export logic
  }

  const handleBulkDelete = () => {
    console.log('Deleting clients:', selectedClients)
    // Implement bulk delete logic with confirmation
  }

  const clearFilters = () => {
    setStatusFilter('')
    setBusinessTypeFilter('')
    setRiskLevelFilter('')
    setSearchQuery('')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
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
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
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
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
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
            <DataTable
              columns={clientTableColumns}
              data={mockClients}
              searchKey="businessName"
              searchPlaceholder="Search clients..."
              onRowSelectionChange={setSelectedClients}
            />
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockClients.map((client) => (
                  <motion.div
                    key={client.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {client.businessName.split(' ').map(n => n[0]).join('')}
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
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {client._count.engagements} engagements
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
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {mockClients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No clients found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by adding your first client to the system.
            </p>
            <Button asChild>
              <Link href="/dashboard/clients/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}