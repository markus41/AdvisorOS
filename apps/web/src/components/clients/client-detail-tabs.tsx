'use client'

import { useState } from 'react'
import {
  Building,
  FileText,
  DollarSign,
  ClipboardList,
  MessageSquare,
  CreditCard,
  Settings,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Globe,
  MapPin,
  User,
  Hash,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientWithRelations } from '@/types/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface ClientDetailTabsProps {
  client: ClientWithRelations
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
}

const riskLevelColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export function ClientDetailTabs({ client }: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="mt-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab client={client} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentsTab client={client} />
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <FinancialsTab client={client} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TasksTab client={client} />
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <CommunicationsTab client={client} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingTab client={client} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab client={client} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ client }: { client: ClientWithRelations }) {
  const counts = client._count || {
    documents: 0,
    engagements: 0,
    invoices: 0,
    notes: 0
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Engagements</p>
              <p className="text-2xl font-bold">{counts.engagements}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold">{counts.documents}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Open Invoices</p>
              <p className="text-2xl font-bold">{counts.invoices}</p>
            </div>
            <CreditCard className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Annual Revenue</p>
              <p className="text-2xl font-bold">
                {client.annualRevenue ? formatCurrency(client.annualRevenue) : 'N/A'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Client Information</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">{client.businessName}</p>
                {client.legalName && client.legalName !== client.businessName && (
                  <p className="text-sm text-gray-500">Legal: {client.legalName}</p>
                )}
              </div>
            </div>

            {client.businessType && (
              <div className="flex items-center space-x-3">
                <Hash className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium">{client.businessType}</p>
                </div>
              </div>
            )}

            {client.industry && (
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{client.industry}</p>
                </div>
              </div>
            )}

            {client.taxId && (
              <div className="flex items-center space-x-3">
                <Hash className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tax ID</p>
                  <p className="font-medium">{client.taxId}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Risk Level</p>
                <Badge className={riskLevelColors[client.riskLevel as keyof typeof riskLevelColors]}>
                  {client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">{client.primaryContactName}</p>
                <p className="text-sm text-gray-500">Primary Contact</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <a
                  href={`mailto:${client.primaryContactEmail}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {client.primaryContactEmail}
                </a>
                <p className="text-sm text-gray-500">Email</p>
              </div>
            </div>

            {client.primaryContactPhone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <a
                    href={`tel:${client.primaryContactPhone}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {client.primaryContactPhone}
                  </a>
                  <p className="text-sm text-gray-500">Phone</p>
                </div>
              </div>
            )}

            {client.website && (
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {client.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-sm text-gray-500">Website</p>
                </div>
              </div>
            )}

            {client.businessAddress && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium whitespace-pre-line">{client.businessAddress}</p>
                  <p className="text-sm text-gray-500">Business Address</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QuickBooks Status */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">QuickBooks Integration</h3>
            <p className="text-sm text-gray-500">
              {client.quickbooksId ? 'Connected and syncing' : 'Not connected'}
            </p>
          </div>
          {client.quickbooksId ? (
            <Badge className="bg-green-100 text-green-800">Connected</Badge>
          ) : (
            <Button variant="outline">Connect QuickBooks</Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentsTab({ client }: { client: ClientWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-gray-500 py-8">
          Document management will be implemented here.
          <br />
          This will show all client documents organized by year and type.
        </p>
      </div>
    </div>
  )
}

function FinancialsTab({ client }: { client: ClientWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Financial Information</h3>
        <Button variant="outline">
          Sync from QuickBooks
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-gray-500 py-8">
          Financial data from QuickBooks will be displayed here.
          <br />
          This will include P&L, Balance Sheet, and other financial reports.
        </p>
      </div>
    </div>
  )
}

function TasksTab({ client }: { client: ClientWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks & Workflows</h3>
        <Button>
          <ClipboardList className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-gray-500 py-8">
          Task management and workflow tracking will be implemented here.
          <br />
          This will show all active tasks, deadlines, and workflow progress.
        </p>
      </div>
    </div>
  )
}

function CommunicationsTab({ client }: { client: ClientWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Communications</h3>
        <Button>
          <MessageSquare className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-gray-500 py-8">
          Communication history and notes will be displayed here.
          <br />
          This will include emails, meeting notes, and internal comments.
        </p>
      </div>
    </div>
  )
}

function BillingTab({ client }: { client: ClientWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Billing History</h3>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-center text-gray-500 py-8">
          Billing history and invoice management will be implemented here.
          <br />
          This will show all invoices, payments, and billing preferences.
        </p>
      </div>
    </div>
  )
}

function SettingsTab({ client }: { client: ClientWithRelations }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Client Settings</h3>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h4 className="font-medium mb-4">Status & Risk Management</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Client Status</p>
                <p className="text-sm text-gray-500">Current client status</p>
              </div>
              <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Risk Level</p>
                <p className="text-sm text-gray-500">Client risk assessment</p>
              </div>
              <Badge className={riskLevelColors[client.riskLevel as keyof typeof riskLevelColors]}>
                {client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h4 className="font-medium mb-4">Data Management</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-gray-500">{formatDate(client.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Last Updated</p>
                <p className="text-sm text-gray-500">{formatDate(client.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h4 className="font-medium text-red-800 mb-4">Danger Zone</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-800">Archive Client</p>
                <p className="text-sm text-red-600">
                  Archive this client to hide from active lists
                </p>
              </div>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                Archive
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-800">Delete Client</p>
                <p className="text-sm text-red-600">
                  Permanently delete this client and all associated data
                </p>
              </div>
              <Button variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}