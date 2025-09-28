'use client'

import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Client</h1>
        <p className="text-muted-foreground">
          Add a new client to your CPA platform
        </p>
      </div>

      <ClientForm />
    </div>
  )
}