'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye } from 'lucide-react'
import { api } from '@/lib/trpc'
import { JobForm, type JobFormData } from '@/components/ats/JobForm'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function NewJobPage() {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [draftData, setDraftData] = useState<Partial<JobFormData> | null>(null)

  const createMutation = api.jobPosting.create.useMutation({
    onSuccess: (job) => {
      toast.success('Job posting created successfully')
      router.push(`/dashboard/jobs/${job.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create job: ${error.message}`)
    },
  })

  const handleSubmit = async (data: JobFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        salaryMin: data.salaryMin || undefined,
        salaryMax: data.salaryMax || undefined,
      })
    } catch (error) {
      // Error is handled by mutation
      console.error('Failed to create job:', error)
    }
  }

  const handleCancel = () => {
    if (
      window.confirm(
        'Are you sure you want to cancel? Any unsaved changes will be lost.'
      )
    ) {
      router.push('/dashboard/jobs')
    }
  }

  const handlePreview = (data: JobFormData) => {
    setDraftData(data)
    setShowPreview(true)
  }

  const handleSaveDraft = async (data: JobFormData) => {
    // Auto-save functionality
    setDraftData(data)
    toast.success('Draft saved', { duration: 2000 })
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create Job Posting
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Fill out the details to create a new job posting
              </p>
            </div>

            {draftData && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Draft saved
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Preview Before Publishing
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your job posting will be saved as a draft. You can review and edit it before
                publishing to candidates.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Job Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8"
        >
          <JobForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Create Job Posting"
            isLoading={createMutation.isLoading}
            mode="create"
          />
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
        >
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Tips for creating effective job postings:
          </h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Use clear, descriptive job titles that candidates will search for</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Include specific requirements and qualifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Be transparent about salary ranges to attract qualified candidates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Highlight your company culture and benefits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Keep descriptions concise and easy to scan</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}