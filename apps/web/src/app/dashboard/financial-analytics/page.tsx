'use client'

import React from 'react'
import { FinancialAnalyticsDashboard } from '@/components/analytics/FinancialAnalyticsDashboard'

export default function FinancialAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <FinancialAnalyticsDashboard view="portfolio" />
    </div>
  )
}