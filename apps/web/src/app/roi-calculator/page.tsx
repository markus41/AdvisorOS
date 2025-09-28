"use client"

import { useState } from "react"
import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  Download,
  Mail,
  ArrowRight,
  CheckCircle
} from "lucide-react"

const industryBenchmarks = {
  "solo": { clients: 25, hourlyRate: 125, adminHours: 8 },
  "small": { clients: 75, hourlyRate: 150, adminHours: 12 },
  "medium": { clients: 200, hourlyRate: 175, adminHours: 20 },
  "large": { clients: 500, hourlyRate: 200, adminHours: 35 }
}

export default function ROICalculatorPage() {
  const [firmType, setFirmType] = useState("")
  const [clientCount, setClientCount] = useState(50)
  const [hourlyRate, setHourlyRate] = useState(150)
  const [adminHoursPerWeek, setAdminHoursPerWeek] = useState(15)
  const [currentSoftwareCost, setCurrentSoftwareCost] = useState(200)
  const [timeSavingsPercentage, setTimeSavingsPercentage] = useState([75])
  const [isCalculated, setIsCalculated] = useState(false)

  // Auto-populate based on firm type
  const handleFirmTypeChange = (type: string) => {
    setFirmType(type)
    if (type in industryBenchmarks) {
      const benchmark = industryBenchmarks[type as keyof typeof industryBenchmarks]
      setClientCount(benchmark.clients)
      setHourlyRate(benchmark.hourlyRate)
      setAdminHoursPerWeek(benchmark.adminHours)
    }
  }

  // Calculations
  const currentWeeklyCost = adminHoursPerWeek * hourlyRate
  const currentMonthlyCost = currentWeeklyCost * 4.33 // Average weeks per month
  const currentAnnualCost = currentMonthlyCost * 12

  const timeSavedPerWeek = adminHoursPerWeek * (timeSavingsPercentage[0] / 100)
  const weeklySavings = timeSavedPerWeek * hourlyRate
  const monthlySavings = weeklySavings * 4.33
  const annualSavings = monthlySavings * 12

  // AdvisorOS cost based on client count
  const getAdvisorOSCost = () => {
    if (clientCount <= 25) return 89 // Starter
    if (clientCount <= 100) return 189 // Professional
    return 389 // Enterprise
  }

  const monthlyAdvisorOSCost = getAdvisorOSCost()
  const annualAdvisorOSCost = monthlyAdvisorOSCost * 12

  const netMonthlySavings = monthlySavings - monthlyAdvisorOSCost - currentSoftwareCost
  const netAnnualSavings = netMonthlySavings * 12
  const roi = monthlyAdvisorOSCost > 0 ? Math.round((netMonthlySavings / monthlyAdvisorOSCost) * 100) : 0
  const paybackPeriod = netMonthlySavings > 0 ? Math.ceil(monthlyAdvisorOSCost / netMonthlySavings) : 0

  const additionalBenefits = [
    {
      title: "Increased Client Capacity",
      value: `+${Math.round(clientCount * 0.4)} clients`,
      description: "Typical 40% increase in client capacity without adding staff"
    },
    {
      title: "Revenue Growth Potential",
      value: `$${(Math.round(clientCount * 0.4) * hourlyRate * 10).toLocaleString()}`,
      description: "Annual revenue from additional clients (10 hours avg per client)"
    },
    {
      title: "Reduced Overtime Costs",
      value: `$${Math.round(hourlyRate * 1.5 * timeSavedPerWeek * 52).toLocaleString()}`,
      description: "Elimination of overtime during busy periods"
    },
    {
      title: "Client Satisfaction Improvement",
      value: "25%",
      description: "Average improvement in client satisfaction scores"
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            ROI Calculator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Calculate the return on investment for implementing AdvisorOS in your CPA firm.
            See exactly how much time and money you can save.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  Firm Information
                </CardTitle>
                <CardDescription>
                  Enter your firm's details to calculate potential savings
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="firmType">Firm Type (optional - auto-fills values)</Label>
                  <Select value={firmType} onValueChange={handleFirmTypeChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your firm type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Practitioner</SelectItem>
                      <SelectItem value="small">Small Firm (2-10 people)</SelectItem>
                      <SelectItem value="medium">Medium Firm (11-25 people)</SelectItem>
                      <SelectItem value="large">Large Firm (26+ people)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clientCount">Number of Clients</Label>
                  <Input
                    id="clientCount"
                    type="number"
                    value={clientCount}
                    onChange={(e) => setClientCount(Number(e.target.value))}
                    className="mt-1"
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
                  />
                </div>

                <div>
                  <Label htmlFor="adminHours">Administrative Hours per Week</Label>
                  <Input
                    id="adminHours"
                    type="number"
                    value={adminHoursPerWeek}
                    onChange={(e) => setAdminHoursPerWeek(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Hours spent on data entry, document management, client communication, etc.
                  </p>
                </div>

                <div>
                  <Label htmlFor="currentCost">Current Software Costs ($/month)</Label>
                  <Input
                    id="currentCost"
                    type="number"
                    value={currentSoftwareCost}
                    onChange={(e) => setCurrentSoftwareCost(Number(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total monthly cost for current practice management tools
                  </p>
                </div>

                <div>
                  <Label>Expected Time Savings: {timeSavingsPercentage[0]}%</Label>
                  <Slider
                    value={timeSavingsPercentage}
                    onValueChange={setTimeSavingsPercentage}
                    max={90}
                    min={30}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>Conservative (30%)</span>
                    <span>Typical (75%)</span>
                    <span>Aggressive (90%)</span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsCalculated(true)}
                  size="lg"
                  className="w-full"
                >
                  Calculate ROI
                  <Calculator className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {isCalculated && (
              <>
                {/* Main Results */}
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader>
                    <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                      <TrendingUp className="w-6 h-6 mr-2" />
                      Your ROI Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          ${netMonthlySavings.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Net Monthly Savings
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {roi}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Monthly ROI
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {paybackPeriod}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Months to Payback
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          ${netAnnualSavings.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Annual Savings
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-6 h-6 mr-2" />
                      Detailed Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Current monthly admin cost</span>
                      <span className="font-semibold">${currentMonthlyCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Monthly time savings ({timeSavingsPercentage[0]}%)</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${monthlySavings.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">AdvisorOS cost</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        -${monthlyAdvisorOSCost}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Current software costs</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        -${currentSoftwareCost}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Net Monthly Savings</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${netMonthlySavings.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Savings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-6 h-6 mr-2" />
                      Time Savings Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {timeSavedPerWeek.toFixed(1)} hrs
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Hours Saved Per Week
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {(timeSavedPerWeek * 52).toFixed(0)} hrs
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Hours Saved Per Year
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Benefits</CardTitle>
                    <CardDescription>
                      Beyond direct cost savings, AdvisorOS provides these additional value drivers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {additionalBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {benefit.title}:
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {benefit.value}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-4">
                  <Button size="lg" className="w-full">
                    Start Free Trial - See Results Yourself
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 w-4 h-4" />
                      Download Report
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 w-4 h-4" />
                      Email Results
                    </Button>
                  </div>
                </div>
              </>
            )}

            {!isCalculated && (
              <Card className="text-center py-12">
                <CardContent>
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Enter Your Firm Details
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Fill out the form on the left to see your personalized ROI calculation
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Industry Benchmarks */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Industry Benchmarks
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how your firm compares to industry averages
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(industryBenchmarks).map(([type, data]) => (
              <Card key={type} className="text-center">
                <CardHeader>
                  <CardTitle className="capitalize">
                    {type === "solo" ? "Solo Practice" : `${type} Firm`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {data.clients}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Clients
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      ${data.hourlyRate}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Hourly Rate
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {data.adminHours}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Admin Hours/Week
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Data based on CPA practice management industry surveys and our customer base analysis
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}