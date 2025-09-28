"use client"

import { useState } from "react"
import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Clock,
  Shield,
  CreditCard,
  Users,
  ArrowRight,
  Zap,
  Star,
  Gift
} from "lucide-react"

const trialBenefits = [
  "Full platform access for 14 days",
  "All premium features included",
  "Live QuickBooks integration",
  "Unlimited document uploads",
  "Complete client portal setup",
  "AI-powered automation tools",
  "Dedicated onboarding support",
  "No credit card required"
]

const planOptions = [
  {
    value: "starter",
    name: "Starter",
    description: "Perfect for solo practitioners",
    monthlyPrice: 89,
    features: ["Up to 25 clients", "Basic QuickBooks sync", "5GB storage"]
  },
  {
    value: "professional",
    name: "Professional",
    description: "Ideal for growing firms",
    monthlyPrice: 189,
    features: ["Up to 100 clients", "Advanced features", "25GB storage"],
    popular: true
  },
  {
    value: "enterprise",
    name: "Enterprise",
    description: "For large firms",
    monthlyPrice: 389,
    features: ["Unlimited clients", "All features", "100GB storage"]
  }
]

const firmSizes = [
  "Solo practitioner (1 person)",
  "Small firm (2-5 people)",
  "Medium firm (6-15 people)",
  "Large firm (16-50 people)",
  "Enterprise (50+ people)"
]

const currentSoftware = [
  "QuickBooks only",
  "Drake",
  "Lacerte",
  "ProConnect",
  "Thomson Reuters",
  "CCH Axcess",
  "Sage",
  "Xero",
  "Other",
  "No current software"
]

export default function TrialPage() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState("professional")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    firmSize: "",
    currentSoftware: "",
    clientCount: "",
    primaryGoals: [] as string[],
    password: "",
    confirmPassword: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFormData(prev => {
      const currentGoals = prev.primaryGoals
      if (checked) {
        return { ...prev, primaryGoals: [...currentGoals, value] }
      } else {
        return { ...prev, primaryGoals: currentGoals.filter(goal => goal !== value) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to AdvisorOS!
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Your 14-day free trial has been activated. Check your email for login instructions
              and getting started guide.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-8 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-6">
                Next Steps to Get Started
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">1</div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Check Your Email</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Login credentials and setup guide sent to {formData.email}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">2</div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Schedule Onboarding</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Book a free setup session with our team
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">3</div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Start Exploring</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Connect QuickBooks and upload your first documents
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Access Your Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Schedule Onboarding Call
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-green-600 text-white mb-4 px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              Free 14-Day Trial
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Start Your Free Trial Today
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get full access to AdvisorOS for 14 days. No credit card required,
              no commitment. Experience the difference our platform can make for your firm.
            </p>
          </div>

          {/* Trial Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trialBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Choose Your Trial Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your firm size. You can change plans anytime during or after your trial.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {planOptions.map((plan) => (
                  <div
                    key={plan.value}
                    className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      selectedPlan === plan.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    } ${plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                    onClick={() => setSelectedPlan(plan.value)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        {plan.description}
                      </p>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        ${plan.monthlyPrice}
                        <span className="text-lg text-gray-500 dark:text-gray-400">/month</span>
                      </div>

                      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 ${
                      selectedPlan === plan.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedPlan === plan.value && (
                        <CheckCircle className="w-5 h-5 text-white -m-0.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button size="lg" onClick={() => setStep(2)} className="px-8">
                  Continue with {planOptions.find(p => p.value === selectedPlan)?.name} Plan
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Tell us about your firm so we can customize your trial experience
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Company Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company">Firm Name *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Your Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firmSize">Firm Size *</Label>
                    <Select value={formData.firmSize} onValueChange={(value) => handleInputChange("firmSize", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select firm size" />
                      </SelectTrigger>
                      <SelectContent>
                        {firmSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="clientCount">Approximate Client Count</Label>
                    <Input
                      id="clientCount"
                      type="number"
                      value={formData.clientCount}
                      onChange={(e) => handleInputChange("clientCount", e.target.value)}
                      placeholder="e.g., 50"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentSoftware">Current Practice Management Software</Label>
                  <Select value={formData.currentSoftware} onValueChange={(value) => handleInputChange("currentSoftware", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select current software" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSoftware.map((software) => (
                        <SelectItem key={software} value={software}>
                          {software}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Primary Goals */}
                <div>
                  <Label className="text-base font-medium">Primary Goals (select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {[
                      "Reduce manual data entry",
                      "Improve client communication",
                      "Automate workflows",
                      "Better document management",
                      "Enhance client portals",
                      "Increase efficiency",
                      "Scale operations",
                      "Better reporting",
                      "Improve compliance"
                    ].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={formData.primaryGoals.includes(goal)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(goal, checked as boolean)
                          }
                        />
                        <Label htmlFor={goal} className="text-sm">
                          {goal}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="password">Create Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back to Plan Selection
                  </Button>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                    Your trial will automatically expire after 14 days with no charges.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trust Indicators */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Credit Card Required
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start your trial instantly without any payment information
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                14 Full Days
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete access to all features for two full weeks
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Expert Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dedicated onboarding and support throughout your trial
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Cancel Anytime
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No commitment - cancel before trial ends with no charges
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}