'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  Edit,
  ExternalLink,
  Mail,
  Phone,
  Building,
  ArrowLeft,
  MoreHorizontal,
  Download,
  Archive,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientDetailTabs } from '@/components/clients/client-detail-tabs'
import { api } from '@/lib/trpc'
import { formatCurrency } from '@/lib/utils'

interface ClientDetailPageProps {
  params: {
    id: string
  }
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

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const clientId = params.id

  const {
    data: client,
    isLoading,
    error
  } = api.client.byId.useQuery({
    id: clientId,
    includeRelations: true
  })

  // Delete mutation
  const deleteMutation = api.client.delete.useMutation({
    onSuccess: () => {
      // Redirect to clients list after successful deletion
      window.location.href = '/clients'
    },
    onError: (error) => {
      alert('Error deleting client: ' + error.message)
    }
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading client details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800">Error loading client</h3>
          <p className="text-red-600">{error.message}</p>
          <div className="mt-4 flex space-x-2">
            <Button asChild variant="outline">
              <Link href="/clients">Back to Clients</Link>
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Client not found</h2>
          <p className="text-gray-600 mt-2">
            The client you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      deleteMutation.mutate({ id: client.id })
    }
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/clients" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <Building className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {client.businessName}
              </h1>
              {client.legalName && client.legalName !== client.businessName && (
                <p className="text-lg text-gray-600">Legal: {client.legalName}</p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </Badge>
                <Badge className={riskLevelColors[client.riskLevel as keyof typeof riskLevelColors]}>
                  {client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1)} Risk
                </Badge>
                {client.quickbooksId && (
                  <Badge className="bg-green-100 text-green-800">
                    QuickBooks Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button asChild variant="outline">
              <Link href={`/clients/${client.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
                  Copy client ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export data
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive client
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleDelete}
                  disabled={deleteMutation.isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete client'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="rounded-lg border bg-card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <a
                href={`mailto:${client.primaryContactEmail}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {client.primaryContactEmail}
              </a>
            </div>

            {client.primaryContactPhone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${client.primaryContactPhone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {client.primaryContactPhone}
                </a>
              </div>
            )}

            {client.website && (
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Website
                </a>
              </div>
            )}
          </div>

          {client.annualRevenue && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Annual Revenue</p>
              <p className="text-lg font-semibold">
                {formatCurrency(client.annualRevenue)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ClientDetailTabs client={client} />
    </div>
  )
}