'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, ChevronLeft, Check, Building, Users, Briefcase, Link, FileText, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createClientSchema,
  updateClientSchema,
  ClientFormData,
  ClientFormStep,
  BusinessType,
  ServiceType,
  DEFAULT_CLIENT_FORM,
  type CreateClientInput,
  type UpdateClientInput
} from '@/types/client'
import { api } from '@/lib/trpc'
import { toast } from 'react-hot-toast'

const FORM_STEPS: Array<{
  id: ClientFormStep
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    id: 'basic',
    title: 'Basic Information',
    icon: Building,
    description: 'Company details and legal information'
  },
  {
    id: 'contacts',
    title: 'Contact Details',
    icon: Users,
    description: 'Primary contact and additional contacts'
  },
  {
    id: 'services',
    title: 'Services Selection',
    icon: Briefcase,
    description: 'Select services and rates'
  },
  {
    id: 'quickbooks',
    title: 'QuickBooks Connection',
    icon: Link,
    description: 'Integration setup and sync preferences'
  },
  {
    id: 'documents',
    title: 'Document Requirements',
    icon: FileText,
    description: 'Required documents and deadlines'
  },
  {
    id: 'billing',
    title: 'Billing Setup',
    icon: CreditCard,
    description: 'Payment terms and billing preferences'
  },
]

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  isEditing?: boolean
  clientId?: string
}

export function ClientForm({ initialData, isEditing = false, clientId }: ClientFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ClientFormStep>('basic')
  const [completedSteps, setCompletedSteps] = useState<Set<ClientFormStep>>(new Set())

  const form = useForm<ClientFormData>({
    resolver: zodResolver(isEditing ? updateClientSchema : createClientSchema),
    defaultValues: {
      ...DEFAULT_CLIENT_FORM,
      ...initialData,
    },
    mode: 'onChange',
  })

  const { handleSubmit, watch, trigger } = form

  // Mutations
  const createMutation = api.client.create.useMutation({
    onSuccess: (client) => {
      toast.success('Client created successfully!')
      router.push(`/clients/${client.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = api.client.update.useMutation({
    onSuccess: (client) => {
      toast.success('Client updated successfully!')
      router.push(`/clients/${client.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const currentStepIndex = FORM_STEPS.findIndex(step => step.id === currentStep)
  const isLastStep = currentStepIndex === FORM_STEPS.length - 1
  const isFirstStep = currentStepIndex === 0

  const goToNextStep = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && !isLastStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(FORM_STEPS[currentStepIndex + 1].id)
    }
  }

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setCurrentStep(FORM_STEPS[currentStepIndex - 1].id)
    }
  }

  const validateCurrentStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    return await trigger(fieldsToValidate as any)
  }

  const getFieldsForStep = (step: ClientFormStep): string[] => {
    switch (step) {
      case 'basic':
        return ['businessName', 'legalName', 'taxId', 'businessType', 'industry', 'website']
      case 'contacts':
        return ['primaryContactName', 'primaryContactEmail', 'primaryContactPhone', 'businessAddress', 'mailingAddress']
      case 'services':
        return ['services']
      case 'quickbooks':
        return ['quickbooksConnection']
      case 'documents':
        return ['documentRequirements']
      case 'billing':
        return ['billingSetup']
      default:
        return []
    }
  }

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEditing && clientId) {
        await updateMutation.mutateAsync({
          id: clientId,
          ...data
        } as UpdateClientInput)
      } else {
        await createMutation.mutateAsync(data as CreateClientInput)
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return <BasicInformationStep form={form} />
      case 'contacts':
        return <ContactDetailsStep form={form} />
      case 'services':
        return <ServicesSelectionStep form={form} />
      case 'quickbooks':
        return <QuickBooksConnectionStep form={form} />
      case 'documents':
        return <DocumentRequirementsStep form={form} />
      case 'billing':
        return <BillingSetupStep form={form} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {FORM_STEPS.map((step, index) => {
              const isCurrent = step.id === currentStep
              const isCompleted = completedSteps.has(step.id)
              const Icon = step.icon

              return (
                <li key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'border-green-500 bg-green-500'
                          : isCurrent
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Icon
                          className={`h-5 w-5 ${
                            isCurrent ? 'text-white' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div className="flex-1 mx-4 h-0.5 bg-gray-200 hidden sm:block" />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white rounded-lg border p-6 min-h-[500px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isFirstStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {!isLastStep ? (
                <Button type="button" onClick={goToNextStep}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Client'
                    : 'Create Client'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

// Step Components
function BasicInformationStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-sm text-gray-600">
          Enter the basic company details and legal information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corporation Inc." {...field} />
              </FormControl>
              <FormDescription>
                Legal business name if different from business name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax ID (EIN)</FormLabel>
              <FormControl>
                <Input placeholder="12-3456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(BusinessType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <FormControl>
                <Input placeholder="Technology" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://acme.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function ContactDetailsStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Contact Details</h3>
        <p className="text-sm text-gray-600">
          Primary contact information and business addresses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="primaryContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Contact Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryContactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Contact Email *</FormLabel>
              <FormControl>
                <Input placeholder="john@acme.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryContactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Contact Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="businessAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="123 Main St, Suite 100, Anytown, ST 12345"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mailingAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mailing Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="PO Box 123, Anytown, ST 12345"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                If different from business address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function ServicesSelectionStep({ form }: { form: any }) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Services Selection</h3>
        <p className="text-sm text-gray-600">
          Select the services you provide to this client.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(ServiceType).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`service-${key}`}
              checked={selectedServices.includes(value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedServices([...selectedServices, value])
                } else {
                  setSelectedServices(selectedServices.filter(s => s !== value))
                }
              }}
            />
            <Label
              htmlFor={`service-${key}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickBooksConnectionStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">QuickBooks Connection</h3>
        <p className="text-sm text-gray-600">
          Set up QuickBooks integration for this client.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Connect QuickBooks</h4>
            <p className="text-sm text-gray-600">
              Sync financial data and customer information
            </p>
          </div>
          <Button variant="outline">Connect</Button>
        </div>
      </div>
    </div>
  )
}

function DocumentRequirementsStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Document Requirements</h3>
        <p className="text-sm text-gray-600">
          Set up document collection requirements for this client.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Document requirements will be configured based on selected services.
        </p>
      </div>
    </div>
  )
}

function BillingSetupStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing Setup</h3>
        <p className="text-sm text-gray-600">
          Configure billing preferences and payment terms.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="billingSetup.billingMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="fixed">Fixed Fee</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingSetup.paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Terms</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingSetup.defaultRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Rate</FormLabel>
              <FormControl>
                <Input
                  placeholder="150.00"
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Hourly rate or default fee amount
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingSetup.currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input placeholder="USD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}