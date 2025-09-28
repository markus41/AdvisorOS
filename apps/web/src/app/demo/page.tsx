"use client"

import { useState } from "react"
import { Navigation } from "@/components/marketing/navigation"
import { Footer } from "@/components/marketing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle,
  Video,
  Phone,
  Mail,
  ArrowRight
} from "lucide-react"

const demoFeatures = [
  "Complete platform walkthrough",
  "Live QuickBooks integration demo",
  "Document automation showcase",
  "Client portal demonstration",
  "Workflow automation examples",
  "Custom setup consultation",
  "ROI analysis for your firm",
  "Implementation timeline discussion"
]

const firmSizes = [
  "Solo practitioner (1 person)",
  "Small firm (2-5 people)",
  "Medium firm (6-15 people)",
  "Large firm (16-50 people)",
  "Enterprise (50+ people)"
]

const serviceTypes = [
  "Tax preparation",
  "Bookkeeping",
  "Audit services",
  "Advisory services",
  "Payroll services",
  "Financial planning",
  "Other"
]

const timeSlots = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM"
]

export default function DemoPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    firmSize: "",
    services: [] as string[],
    currentSoftware: "",
    challenges: "",
    preferredDate: "",
    preferredTime: "",
    demoType: "video",
    interests: [] as string[]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[]
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) }
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
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Demo Request Received!
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Thank you for your interest in AdvisorOS. Our team will contact you within 24 hours
              to schedule your personalized demo.
            </p>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                What happens next?
              </h2>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <span className="text-blue-800 dark:text-blue-200">Our team reviews your requirements</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
                  <span className="text-blue-800 dark:text-blue-200">We'll contact you to confirm your demo time</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
                  <span className="text-blue-800 dark:text-blue-200">Personalized demo tailored to your needs</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <a href="/">
                  Return to Homepage
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/resources">
                  Browse Resources
                </a>
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
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                See AdvisorOS in Action
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get a personalized demo tailored to your firm's specific needs and see how
                AdvisorOS can transform your practice operations.
              </p>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  What you'll see in your demo:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {demoFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">30 minutes</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Live demo</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Personalized</div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300">
                  Free, no-commitment consultation with our product experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request Form */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Request Your Personalized Demo
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Tell us about your firm so we can customize the demo to your specific needs
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demo Request Form</CardTitle>
              <CardDescription>
                All fields are required to help us prepare the best demo experience for you
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
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
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Company Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company">Company Name *</Label>
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

                <div>
                  <Label htmlFor="firmSize">Firm Size *</Label>
                  <Select value={formData.firmSize} onValueChange={(value) => handleInputChange("firmSize", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your firm size" />
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

                {/* Services */}
                <div>
                  <Label className="text-base font-medium">Services Offered (select all that apply) *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {serviceTypes.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={formData.services.includes(service)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("services", service, checked as boolean)
                          }
                        />
                        <Label htmlFor={service} className="text-sm">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentSoftware">Current Practice Management Software</Label>
                  <Input
                    id="currentSoftware"
                    value={formData.currentSoftware}
                    onChange={(e) => handleInputChange("currentSoftware", e.target.value)}
                    placeholder="e.g., Drake, Lacerte, ProConnect, etc."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="challenges">Current Challenges or Pain Points</Label>
                  <Textarea
                    id="challenges"
                    value={formData.challenges}
                    onChange={(e) => handleInputChange("challenges", e.target.value)}
                    placeholder="Tell us about your current challenges so we can focus the demo on solutions that matter to you..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                {/* Demo Preferences */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Demo Preferences
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="preferredDate">Preferred Date</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={formData.preferredDate}
                        onChange={(e) => handleInputChange("preferredDate", e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredTime">Preferred Time (EST)</Label>
                      <Select value={formData.preferredTime} onValueChange={(value) => handleInputChange("preferredTime", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select preferred time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Label className="text-base font-medium">Demo Type Preference</Label>
                    <div className="flex space-x-6 mt-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="video"
                          name="demoType"
                          value="video"
                          checked={formData.demoType === "video"}
                          onChange={(e) => handleInputChange("demoType", e.target.value)}
                          className="text-blue-600"
                        />
                        <Label htmlFor="video" className="flex items-center cursor-pointer">
                          <Video className="w-4 h-4 mr-2" />
                          Video Call (recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="phone"
                          name="demoType"
                          value="phone"
                          checked={formData.demoType === "phone"}
                          onChange={(e) => handleInputChange("demoType", e.target.value)}
                          className="text-blue-600"
                        />
                        <Label htmlFor="phone" className="flex items-center cursor-pointer">
                          <Phone className="w-4 h-4 mr-2" />
                          Phone Call
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Submitting Request..."
                  ) : (
                    <>
                      Request Demo
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  By requesting a demo, you agree to receive communications from AdvisorOS.
                  We respect your privacy and will never share your information.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alternative Contact Methods */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Prefer to Talk Directly?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Our team is ready to answer your questions and schedule your demo
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                  <Phone className="w-6 h-6" />
                </div>
                <CardTitle>Call Us</CardTitle>
                <CardDescription>
                  Speak directly with our sales team
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  1-800-CPA-DEMO
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monday - Friday, 9 AM - 6 PM EST
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <CardTitle>Email Us</CardTitle>
                <CardDescription>
                  Send us your questions anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  demo@advisoros.com
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll respond within 4 hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}