"use client"

import React, { useState } from 'react'
import { Calculator, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ROICalculatorProps {
  className?: string
}

export function ROICalculator({ className }: ROICalculatorProps) {
  const [clients, setClients] = useState(50)
  const [hourlyRate, setHourlyRate] = useState(150)
  const [hoursPerClient, setHoursPerClient] = useState(10)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  // ROI Calculator
  const currentMonthlyCost = clients * hoursPerClient * hourlyRate
  const timeSaved = 0.75 // 75% time savings
  const monthlySavings = currentMonthlyCost * timeSaved
  const professionalPlanCost = billing === 'annual' ? 1890 / 12 : 189
  const roiMonthly = monthlySavings - professionalPlanCost
  const roiAnnual = roiMonthly * 12
  const roiPercentage = Math.round((roiMonthly / professionalPlanCost) * 100)

  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-start ${className}`}>
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Calculate Your ROI
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          See how much time and money AdvisorOS can save your firm.
          Our customers typically see 75% reduction in administrative tasks.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-6 h-6 mr-2 text-blue-600" />
              Firm Details
            </CardTitle>
            <CardDescription>
              Enter your current practice metrics to calculate potential savings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="clients">Number of Clients</Label>
              <Input
                id="clients"
                type="number"
                value={clients}
                onChange={(e) => setClients(Number(e.target.value))}
                className="mt-1"
                min="1"
                max="1000"
              />
            </div>

            <div>
              <Label htmlFor="hourlyRate">Average Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="mt-1"
                min="1"
                max="1000"
              />
            </div>

            <div>
              <Label htmlFor="hoursPerClient">Administrative Hours per Client/Month</Label>
              <Input
                id="hoursPerClient"
                type="number"
                value={hoursPerClient}
                onChange={(e) => setHoursPerClient(Number(e.target.value))}
                className="mt-1"
                min="1"
                max="100"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Your Potential Savings
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Based on 75% reduction in administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${monthlySavings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Time Savings
                </div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${professionalPlanCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Professional Plan Cost
                </div>
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg">
              <div className="text-3xl font-bold mb-2">
                ${roiMonthly.toLocaleString()}/month
              </div>
              <div className="text-sm opacity-90 mb-4">
                Net Monthly Savings
              </div>
              <div className="text-lg font-semibold">
                {roiPercentage}% ROI
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Annual Savings:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ${roiAnnual.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Hours Saved/Month:</span>
                <span className="font-semibold">
                  {Math.round(clients * hoursPerClient * timeSaved)} hours
                </span>
              </div>
            </div>

            <Button asChild className="w-full">
              <a href="/trial?plan=professional">
                Start Saving Today
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}