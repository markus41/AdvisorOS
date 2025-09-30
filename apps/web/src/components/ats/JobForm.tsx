'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Briefcase,
  FileText,
  DollarSign,
  Save,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Validation schema matching backend
const jobFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  department: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
  description: z.string().min(1, 'Description is required'),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  salaryMin: z.number().int().positive().optional().or(z.literal(0)),
  salaryMax: z.number().int().positive().optional().or(z.literal(0)),
  compensationType: z.enum(['hourly', 'salary', 'commission']).default('salary'),
  benefits: z.array(z.string()).default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  openings: z.number().int().positive().default(1),
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax && data.salaryMin > 0 && data.salaryMax > 0) {
      return data.salaryMax >= data.salaryMin
    }
    return true
  },
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  }
)

export type JobFormData = z.infer<typeof jobFormSchema>

interface JobFormProps {
  initialData?: Partial<JobFormData>
  onSubmit: (data: JobFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

const steps = [
  { id: 1, name: 'Basic Info', icon: Briefcase },
  { id: 2, name: 'Description', icon: FileText },
  { id: 3, name: 'Compensation', icon: DollarSign },
]

export function JobForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Job',
  isLoading = false,
  mode = 'create',
}: JobFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [listInputs, setListInputs] = useState({
    responsibility: '',
    requirement: '',
    skill: '',
    benefit: '',
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      department: initialData?.department || '',
      location: initialData?.location || '',
      employmentType: initialData?.employmentType || 'full_time',
      experienceLevel: initialData?.experienceLevel || 'mid',
      description: initialData?.description || '',
      responsibilities: initialData?.responsibilities || [],
      requirements: initialData?.requirements || [],
      preferredSkills: initialData?.preferredSkills || [],
      salaryMin: initialData?.salaryMin || undefined,
      salaryMax: initialData?.salaryMax || undefined,
      compensationType: initialData?.compensationType || 'salary',
      benefits: initialData?.benefits || [],
      priority: initialData?.priority || 'normal',
      openings: initialData?.openings || 1,
    },
  })

  const responsibilities = watch('responsibilities') || []
  const requirements = watch('requirements') || []
  const skills = watch('preferredSkills') || []
  const benefits = watch('benefits') || []

  const handleAddListItem = (field: keyof typeof listInputs, arrayField: keyof JobFormData) => {
    const value = listInputs[field].trim()
    if (!value) return

    const currentArray = watch(arrayField) as string[]
    setValue(arrayField, [...currentArray, value] as any, { shouldDirty: true })
    setListInputs({ ...listInputs, [field]: '' })
  }

  const handleRemoveListItem = (arrayField: keyof JobFormData, index: number) => {
    const currentArray = watch(arrayField) as string[]
    setValue(
      arrayField,
      currentArray.filter((_, i) => i !== index) as any,
      { shouldDirty: true }
    )
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return !errors.title && !errors.location && !errors.employmentType && !errors.experienceLevel
      case 2:
        return !errors.description
      case 3:
        return !errors.salaryMin && !errors.salaryMax && !errors.compensationType
      default:
        return true
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          const isValid = isStepValid(step.id)

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-blue-600 text-white',
                    isCompleted && 'bg-green-600 text-white',
                    !isActive && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                  aria-label={`Step ${step.id}: ${step.name}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </button>
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isActive && 'text-blue-600 dark:text-blue-400',
                    !isActive && 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-4 rounded transition-colors',
                    isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    placeholder="e.g., Senior Accountant"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.title && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <input
                    {...register('department')}
                    type="text"
                    placeholder="e.g., Finance & Accounting"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    placeholder="e.g., New York, NY (Remote)"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.location && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employment Type *
                  </label>
                  <select
                    {...register('employmentType')}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      'cursor-pointer'
                    )}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience Level *
                  </label>
                  <select
                    {...register('experienceLevel')}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      'cursor-pointer'
                    )}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Openings
                  </label>
                  <input
                    {...register('openings', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      'cursor-pointer'
                    )}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job Description</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  rows={6}
                  placeholder="Provide a detailed description of the role..."
                  className={cn(
                    'w-full px-4 py-3 rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'border border-gray-300 dark:border-gray-600',
                    'text-gray-900 dark:text-white',
                    'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    errors.description && 'border-red-500 focus:ring-red-500'
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Responsibilities
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={listInputs.responsibility}
                    onChange={(e) => setListInputs({ ...listInputs, responsibility: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddListItem('responsibility', 'responsibilities')
                      }
                    }}
                    placeholder="Add a responsibility and press Enter"
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddListItem('responsibility', 'responsibilities')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {responsibilities.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm text-gray-900 dark:text-white">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveListItem('responsibilities', index)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Remove responsibility"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requirements
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={listInputs.requirement}
                    onChange={(e) => setListInputs({ ...listInputs, requirement: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddListItem('requirement', 'requirements')
                      }
                    }}
                    placeholder="Add a requirement and press Enter"
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddListItem('requirement', 'requirements')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {requirements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm text-gray-900 dark:text-white">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveListItem('requirements', index)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Remove requirement"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={listInputs.skill}
                    onChange={(e) => setListInputs({ ...listInputs, skill: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddListItem('skill', 'preferredSkills')
                      }
                    }}
                    placeholder="Add a skill and press Enter"
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddListItem('skill', 'preferredSkills')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveListItem('preferredSkills', index)}
                        className="text-blue-600 hover:text-blue-700"
                        aria-label="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compensation & Benefits</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compensation Type
                  </label>
                  <select
                    {...register('compensationType')}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      'cursor-pointer'
                    )}
                  >
                    <option value="salary">Salary</option>
                    <option value="hourly">Hourly</option>
                    <option value="commission">Commission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum {watch('compensationType') === 'hourly' ? 'Rate' : 'Salary'}
                  </label>
                  <input
                    {...register('salaryMin', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="e.g., 50000"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.salaryMin && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {errors.salaryMin && (
                    <p className="mt-1 text-sm text-red-600">{errors.salaryMin.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum {watch('compensationType') === 'hourly' ? 'Rate' : 'Salary'}
                  </label>
                  <input
                    {...register('salaryMax', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    placeholder="e.g., 80000"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.salaryMax && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {errors.salaryMax && (
                    <p className="mt-1 text-sm text-red-600">{errors.salaryMax.message}</p>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Benefits
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={listInputs.benefit}
                    onChange={(e) => setListInputs({ ...listInputs, benefit: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddListItem('benefit', 'benefits')
                      }
                    }}
                    placeholder="Add a benefit and press Enter"
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg',
                      'bg-white dark:bg-gray-800',
                      'border border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddListItem('benefit', 'benefits')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {benefits.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveListItem('benefits', index)}
                        className="text-green-600 hover:text-green-700"
                        aria-label="Remove benefit"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className={cn(
                'px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2',
                isStepValid(currentStep)
                  ? 'hover:bg-blue-700'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !isStepValid(currentStep)}
              className={cn(
                'px-6 py-2 bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2',
                !isLoading && isStepValid(currentStep)
                  ? 'hover:bg-green-700'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {submitLabel}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}