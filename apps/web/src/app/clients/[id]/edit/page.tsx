'use client'

import { use } from 'react'
import { ClientForm } from '@/components/clients/client-form'
import { api } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EditClientPageProps {
  params: {
    id: string
  }
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const clientId = params.id

  const {
    data: client,
    isLoading,
    error
  } = api.client.byId.useQuery({
    id: clientId,
    includeRelations: false
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading client...</p>
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

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update information for {client.businessName}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/clients/${client.id}`}>View Client</Link>
          </Button>
        </div>
      </div>

      <ClientForm
        initialData={client}
        isEditing={true}
        clientId={client.id}
      />
    </div>
  )
}