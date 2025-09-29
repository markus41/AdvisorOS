'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { FinancialAnalyticsDashboard } from '@/components/analytics/FinancialAnalyticsDashboard'

export default function ClientFinancialAnalyticsPage() {
  const params = useParams()
  const clientId = params.clientId as string

  return (
    <div className="container mx-auto p-6">
      <FinancialAnalyticsDashboard
        clientId={clientId}
        view="client"
        initialTab="overview"
      />
    </div>
  )
}