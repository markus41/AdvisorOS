'use client'

import React from 'react'
import { DocumentManager } from '@/components/portal/DocumentManager'
import { PortalLayout } from '@/components/portal/layout/portal-layout'
import { useSession } from 'next-auth/react'

export default function EnhancedDocumentsPage() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access your documents.
            </p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <DocumentManager
        clientId={session.user.id}
        isClientView={true}
        currentUserId={session.user.id}
      />
    </PortalLayout>
  )
}