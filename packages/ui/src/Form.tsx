import React from 'react'
import { useForm, Controller, type FieldPath, type FieldValues, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from './utils/cn'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Button } from './Button'
import { Label } from './Label'

// Form field wrapper with automatic error handling
interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  helperText?: string
  required?: boolean
  className?: string
  children: (field: any) => React.ReactNode
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  helperText,
  required = false,
  className,
  children,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          {label && (
            <Label htmlFor={name} className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {children(field)}
          {fieldState.error && (
            <p className="text-sm text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          )}
          {helperText && !fieldState.error && (
            <p className="text-sm text-muted-foreground">{helperText}</p>
          )}
        </div>
      )}
    />
  )
}

// Input field with form integration
interface FormInputProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  helperText?: string
  required?: boolean
  type?: string
  placeholder?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
}

export function FormInput<T extends FieldValues>(props: FormInputProps<T>) {
  return (
    <FormField {...props}>
      {(field) => (
        <Input
          {...field}
          type={props.type}
          placeholder={props.placeholder}
          leftIcon={props.leftIcon}
          rightIcon={props.rightIcon}
        />
      )}
    </FormField>
  )
}

// Textarea field with form integration
interface FormTextareaProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  helperText?: string
  required?: boolean
  placeholder?: string
  rows?: number
  className?: string
}

export function FormTextarea<T extends FieldValues>(props: FormTextareaProps<T>) {
  return (
    <FormField {...props}>
      {(field) => (
        <Textarea
          {...field}
          placeholder={props.placeholder}
          rows={props.rows}
        />
      )}
    </FormField>
  )
}

// Select field with form integration
interface FormSelectProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  helperText?: string
  required?: boolean
  placeholder?: string
  options: Array<{ value: string; label: string }>
  className?: string
}

export function FormSelect<T extends FieldValues>(props: FormSelectProps<T>) {
  return (
    <FormField {...props}>
      {(field) => (
        <Select onValueChange={field.onChange} value={field.value}>
          <SelectTrigger>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  )
}

// Multi-step form component
interface FormStep {
  id: string
  title: string
  description?: string
  fields: string[]
}

interface MultiStepFormProps {
  steps: FormStep[]
  currentStep: number
  onStepChange: (step: number) => void
  children: React.ReactNode
  className?: string
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  currentStep,
  onStepChange,
  children,
  className,
}) => {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Step {currentStep + 1} of {steps.length}
          </h2>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepChange(index)}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                index === currentStep
                  ? 'bg-primary/10 text-primary'
                  : index < currentStep
                  ? 'text-green-600'
                  : 'text-muted-foreground',
                'hover:bg-gray-100'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1',
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                )}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className="text-xs text-center">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current step content */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            {steps[currentStep]?.title}
          </h3>
          {steps[currentStep]?.description && (
            <p className="text-muted-foreground">
              {steps[currentStep].description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

// Complete form builder with validation schemas
export const createFormSchema = {
  client: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    company: z.string().optional(),
    address: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(2, 'State is required'),
      zipCode: z.string().min(5, 'ZIP code must be at least 5 digits'),
    }),
  }),

  engagement: z.object({
    title: z.string().min(1, 'Engagement title is required'),
    type: z.enum(['tax-preparation', 'audit', 'consultation', 'bookkeeping']),
    startDate: z.date({
      required_error: 'Start date is required',
    }),
    endDate: z.date().optional(),
    description: z.string().optional(),
    estimatedHours: z.number().min(0, 'Hours must be positive').optional(),
    hourlyRate: z.number().min(0, 'Rate must be positive').optional(),
  }),

  document: z.object({
    title: z.string().min(1, 'Document title is required'),
    type: z.enum(['tax-return', 'financial-statement', 'invoice', 'receipt', 'other']),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    confidentialityLevel: z.enum(['public', 'internal', 'confidential', 'restricted']),
  }),
}

// Example usage component
interface ClientFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
}

export const ClientForm: React.FC<{
  onSubmit: (data: ClientFormData) => void
  defaultValues?: Partial<ClientFormData>
}> = ({ onSubmit, defaultValues }) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(createFormSchema.client),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      ...defaultValues,
    },
  })

  const [currentStep, setCurrentStep] = React.useState(0)

  const steps: FormStep[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      description: 'Basic personal information',
      fields: ['firstName', 'lastName', 'email', 'phone'],
    },
    {
      id: 'company',
      title: 'Company Info',
      description: 'Company details (optional)',
      fields: ['company'],
    },
    {
      id: 'address',
      title: 'Address',
      description: 'Contact address information',
      fields: ['address.street', 'address.city', 'address.state', 'address.zipCode'],
    },
  ]

  const handleNext = async () => {
    const currentFields = steps[currentStep].fields
    const isValid = await form.trigger(currentFields as any)

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = form.handleSubmit(onSubmit)

  return (
    <form onSubmit={handleSubmit}>
      <MultiStepForm
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                name="firstName"
                control={form.control}
                label="First Name"
                required
              />
              <FormInput
                name="lastName"
                control={form.control}
                label="Last Name"
                required
              />
            </div>
            <FormInput
              name="email"
              control={form.control}
              label="Email"
              type="email"
              required
            />
            <FormInput
              name="phone"
              control={form.control}
              label="Phone"
              type="tel"
              required
            />
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <FormInput
              name="company"
              control={form.control}
              label="Company Name"
              helperText="Optional - leave blank if individual client"
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <FormInput
              name="address.street"
              control={form.control}
              label="Street Address"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                name="address.city"
                control={form.control}
                label="City"
                required
              />
              <FormInput
                name="address.state"
                control={form.control}
                label="State"
                required
              />
            </div>
            <FormInput
              name="address.zipCode"
              control={form.control}
              label="ZIP Code"
              required
            />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button type="submit">
              Create Client
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </MultiStepForm>
    </form>
  )
}