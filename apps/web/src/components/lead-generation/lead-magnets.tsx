"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  FileText,
  Calculator,
  CheckCircle,
  Users,
  TrendingUp,
  Clock,
  Shield,
  ArrowRight,
  Mail,
  Building,
  Star,
  BookOpen,
  BarChart3,
  Lightbulb
} from "lucide-react"
import { useConversionTracking } from "@/lib/conversion-optimization/conversion-tracking"

interface LeadMagnet {
  id: string
  title: string
  description: string
  type: 'guide' | 'checklist' | 'template' | 'calculator' | 'webinar' | 'report'
  icon: React.ReactNode
  downloadCount: number
  rating: number
  estimatedTime: string
  benefits: string[]
  targetAudience: string[]
  formFields: FormField[]
  gatedContent: {
    preview: string
    fullContent: string
  }
  featured?: boolean
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'select' | 'number'
  required: boolean
  options?: string[]
  placeholder?: string
}

const leadMagnets: LeadMagnet[] = [
  {
    id: 'tax-season-checklist',
    title: 'Ultimate Tax Season Preparation Checklist for CPA Firms',
    description: 'Complete 47-point checklist to ensure your firm is ready for tax season. Includes client communication templates and workflow optimization tips.',
    type: 'checklist',
    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    downloadCount: 1247,
    rating: 4.9,
    estimatedTime: '15 min read',
    benefits: [
      'Reduce tax season stress by 80%',
      'Improve client satisfaction scores',
      'Increase team productivity',
      'Minimize last-minute rushes'
    ],
    targetAudience: ['Managing Partners', 'Tax Managers', 'Senior CPAs'],
    featured: true,
    formFields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter your first name' },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter your last name' },
      { name: 'email', label: 'Work Email', type: 'email', required: true, placeholder: 'you@yourfirm.com' },
      { name: 'firmName', label: 'Firm Name', type: 'text', required: true, placeholder: 'Your CPA Firm' },
      { name: 'firmSize', label: 'Firm Size', type: 'select', required: true, options: ['Solo practitioner', '2-5 employees', '6-15 employees', '16-50 employees', '50+ employees'] },
      { name: 'role', label: 'Your Role', type: 'select', required: true, options: ['Owner/Partner', 'Managing Partner', 'Tax Manager', 'Senior CPA', 'Staff Accountant', 'Other'] }
    ],
    gatedContent: {
      preview: 'This comprehensive checklist covers client data collection, software preparation, team training, and more...',
      fullContent: 'Complete 47-point checklist with detailed action items, timelines, and best practices from top-performing CPA firms.'
    }
  },
  {
    id: 'roi-calculator',
    title: 'CPA Practice Management ROI Calculator',
    description: 'Calculate the exact ROI of implementing practice management software in your firm. Get personalized savings estimates based on your firm size.',
    type: 'calculator',
    icon: <Calculator className="w-6 h-6 text-blue-600" />,
    downloadCount: 892,
    rating: 4.8,
    estimatedTime: '5 min to complete',
    benefits: [
      'Calculate exact time savings',
      'Estimate revenue impact',
      'Compare software costs vs benefits',
      'Build business case for partners'
    ],
    targetAudience: ['Managing Partners', 'Practice Managers', 'IT Directors'],
    formFields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'firmName', label: 'Firm Name', type: 'text', required: true },
      { name: 'employees', label: 'Number of Employees', type: 'number', required: true },
      { name: 'currentSoftware', label: 'Current Software', type: 'select', required: false, options: ['Excel/Manual', 'QuickBooks only', 'Legacy software', 'Multiple tools', 'Other'] }
    ],
    gatedContent: {
      preview: 'Interactive calculator that estimates time savings, cost reduction, and revenue growth potential...',
      fullContent: 'Personalized ROI report with detailed breakdowns, implementation timeline, and comparison charts.'
    }
  },
  {
    id: 'automation-guide',
    title: 'Complete Guide to Automating Your CPA Practice',
    description: '52-page comprehensive guide covering workflow automation, client onboarding, document management, and more. Includes implementation templates.',
    type: 'guide',
    icon: <BookOpen className="w-6 h-6 text-purple-600" />,
    downloadCount: 673,
    rating: 4.9,
    estimatedTime: '45 min read',
    benefits: [
      'Identify automation opportunities',
      'Step-by-step implementation plans',
      'Ready-to-use workflow templates',
      'Measure automation success'
    ],
    targetAudience: ['Practice Managers', 'Operations Directors', 'Technology Managers'],
    formFields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'interest', label: 'Primary Interest', type: 'select', required: true, options: ['Workflow automation', 'Document management', 'Client onboarding', 'Billing automation', 'Reporting automation'] }
    ],
    gatedContent: {
      preview: 'Learn how top CPA firms are using automation to increase efficiency by 75% and reduce errors by 90%...',
      fullContent: 'Complete 52-page guide with case studies, implementation templates, and automation roadmaps.'
    }
  },
  {
    id: 'client-portal-template',
    title: 'Client Portal Implementation Templates',
    description: 'Ready-to-use templates for setting up client portals including welcome emails, training materials, and process documentation.',
    type: 'template',
    icon: <FileText className="w-6 h-6 text-orange-600" />,
    downloadCount: 534,
    rating: 4.7,
    estimatedTime: '30 min to implement',
    benefits: [
      'Reduce implementation time by 80%',
      'Improve client adoption rates',
      'Standardize client communication',
      'Enhance professional image'
    ],
    targetAudience: ['Client Relations Managers', 'Senior Associates', 'Practice Managers'],
    formFields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'firmName', label: 'Firm Name', type: 'text', required: true }
    ],
    gatedContent: {
      preview: 'Professional templates for client portal rollout including email sequences, training videos, and FAQ documents...',
      fullContent: 'Complete template package with customizable documents, email sequences, and implementation checklist.'
    }
  },
  {
    id: 'benchmark-report',
    title: '2024 CPA Practice Efficiency Benchmark Report',
    description: 'Industry benchmark data comparing practice efficiency metrics across 500+ CPA firms. Discover where your firm stands.',
    type: 'report',
    icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
    downloadCount: 1156,
    rating: 4.8,
    estimatedTime: '20 min read',
    benefits: [
      'Compare your metrics to industry leaders',
      'Identify improvement opportunities',
      'Benchmark compensation data',
      'Strategic planning insights'
    ],
    targetAudience: ['Managing Partners', 'Practice Managers', 'Business Development'],
    formFields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Work Email', type: 'email', required: true },
      { name: 'firmName', label: 'Firm Name', type: 'text', required: true },
      { name: 'firmSize', label: 'Firm Size', type: 'select', required: true, options: ['Solo', '2-10', '11-25', '26-50', '51-100', '100+'] }
    ],
    gatedContent: {
      preview: 'Comprehensive analysis of efficiency metrics, technology adoption, and profitability data from 500+ firms...',
      fullContent: '28-page report with detailed benchmarks, regional comparisons, and strategic recommendations.'
    }
  }
]

interface LeadMagnetFormProps {
  leadMagnet: LeadMagnet
  onSubmit: (data: Record<string, string>) => void
  isSubmitting: boolean
}

function LeadMagnetForm({ leadMagnet, onSubmit, isSubmitting }: LeadMagnetFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          {leadMagnet.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Get Your Free {leadMagnet.type.charAt(0).toUpperCase() + leadMagnet.type.slice(1)}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Enter your details below to download instantly
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {leadMagnet.formFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'select' && field.options ? (
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
              >
                <option value="">Select {field.label}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="w-full"
              />
            )}
          </div>
        ))}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            'Preparing Download...'
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Now (Free)
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          By downloading, you agree to receive helpful CPA practice management tips.
          Unsubscribe anytime.
        </p>
      </form>
    </Card>
  )
}

interface LeadMagnetCardProps {
  leadMagnet: LeadMagnet
  onClick: () => void
}

function LeadMagnetCard({ leadMagnet, onClick }: LeadMagnetCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full" onClick={onClick}>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            {leadMagnet.icon}
          </div>
          {leadMagnet.featured && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              Most Popular
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
            {leadMagnet.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {leadMagnet.description}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{leadMagnet.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{leadMagnet.downloadCount.toLocaleString()} downloads</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{leadMagnet.estimatedTime}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2 mb-4">
            {leadMagnet.benefits.slice(0, 3).map((benefit, index) => (
              <div key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Target Audience */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Perfect for:</p>
            <div className="flex flex-wrap gap-1">
              {leadMagnet.targetAudience.slice(0, 2).map((audience, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {audience}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button className="w-full group-hover:bg-blue-700 transition-colors" variant="default">
          Get Free {leadMagnet.type.charAt(0).toUpperCase() + leadMagnet.type.slice(1)}
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  )
}

export function LeadMagnetsSection() {
  const [selectedMagnet, setSelectedMagnet] = useState<LeadMagnet | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { track } = useConversionTracking()

  const handleMagnetClick = (magnet: LeadMagnet) => {
    setSelectedMagnet(magnet)
    track('lead_magnet_click', {
      magnetId: magnet.id,
      magnetTitle: magnet.title,
      magnetType: magnet.type
    })
  }

  const handleFormSubmit = async (data: Record<string, string>) => {
    if (!selectedMagnet) return

    setIsSubmitting(true)

    try {
      // Send lead data to your backend
      const response = await fetch('/api/lead-magnets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magnetId: selectedMagnet.id,
          magnetTitle: selectedMagnet.title,
          ...data
        })
      })

      if (response.ok) {
        track('lead_magnet_download', {
          magnetId: selectedMagnet.id,
          magnetTitle: selectedMagnet.title,
          leadScore: calculateLeadScore(data)
        })

        // Trigger download or redirect to thank you page
        window.location.href = `/thank-you?download=${selectedMagnet.id}`
      }
    } catch (error) {
      console.error('Failed to submit lead magnet form:', error)
    }

    setIsSubmitting(false)
  }

  const calculateLeadScore = (data: Record<string, string>): number => {
    let score = 0

    // Firm size scoring
    if (data.firmSize === '50+ employees' || data.firmSize === '100+') score += 30
    else if (data.firmSize === '16-50 employees' || data.firmSize === '26-50') score += 20
    else if (data.firmSize === '6-15 employees' || data.firmSize === '11-25') score += 10

    // Role scoring
    if (data.role?.includes('Partner') || data.role?.includes('Owner')) score += 25
    else if (data.role?.includes('Manager') || data.role?.includes('Director')) score += 15

    return Math.min(score, 100)
  }

  if (selectedMagnet) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedMagnet(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back to resources
            </button>
          </div>
          <LeadMagnetForm
            leadMagnet={selectedMagnet}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    )
  }

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Free Resources for CPA Firms
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Download our exclusive guides, templates, and tools to help your practice become more efficient and profitable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leadMagnets.map((magnet) => (
            <LeadMagnetCard
              key={magnet.id}
              leadMagnet={magnet}
              onClick={() => handleMagnetClick(magnet)}
            />
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Get Weekly CPA Practice Tips
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join 2,500+ CPA professionals who receive our weekly newsletter with practice management tips,
            industry insights, and exclusive resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white text-gray-900 border-white"
            />
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Mail className="w-4 h-4 mr-2" />
              Subscribe
            </Button>
          </div>
          <p className="text-xs text-blue-200 mt-3">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}