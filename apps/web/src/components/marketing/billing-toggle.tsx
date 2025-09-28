"use client"

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface BillingToggleProps {
  onBillingChange?: (billing: 'monthly' | 'annual') => void
  className?: string
}

export function BillingToggle({ onBillingChange, className }: BillingToggleProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  const handleBillingChange = (checked: boolean) => {
    const newBilling = checked ? 'annual' : 'monthly'
    setBilling(newBilling)
    onBillingChange?.(newBilling)
  }

  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      <span className={`text-sm ${billing === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
        Monthly
      </span>
      <Switch
        checked={billing === 'annual'}
        onCheckedChange={handleBillingChange}
        className="data-[state=checked]:bg-blue-600"
      />
      <span className={`text-sm ${billing === 'annual' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
        Annual
      </span>
      {billing === 'annual' && (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Save 16%
        </Badge>
      )}
    </div>
  )
}