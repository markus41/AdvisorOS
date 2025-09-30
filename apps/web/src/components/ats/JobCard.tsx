'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  MapPin,
  Briefcase,
  DollarSign,
  Eye,
  Users,
  MoreVertical,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface JobCardProps {
  job: {
    id: string
    title: string
    department?: string | null
    location: string
    employmentType: string
    status: 'draft' | 'active' | 'paused' | 'closed' | 'cancelled'
    salaryMin?: number | null
    salaryMax?: number | null
    compensationType: string
    viewCount: number
    applicationCount: number
    createdAt: Date
    publishedAt?: Date | null
    _count?: {
      applications: number
    }
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onPublish?: (id: string) => void
  onClick?: (id: string) => void
}

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  temporary: 'Temporary',
  internship: 'Internship',
}

const formatSalary = (min?: number | null, max?: number | null, type?: string) => {
  if (!min && !max) return 'Salary not specified'

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const period = type === 'hourly' ? '/hr' : '/yr'

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}${period}`
  }
  return `${formatter.format(min || max || 0)}${period}`
}

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'active':
      return 'success'
    case 'paused':
      return 'warning'
    case 'closed':
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

export function JobCard({ job, onEdit, onDelete, onPublish, onClick }: JobCardProps) {
  const applicationCount = job._count?.applications ?? job.applicationCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:shadow-lg transition-all duration-200 cursor-pointer',
        'overflow-hidden'
      )}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-3 mb-2">
              <h3
                className="text-lg font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 transition-colors"
                onClick={() => onClick?.(job.id)}
              >
                {job.title}
              </h3>
              <StatusBadge
                status={getStatusColor(job.status)}
                label={job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                variant="soft"
                size="sm"
              />
            </div>
            {job.department && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job.department}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label="Job actions"
              >
                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onClick?.(job.id)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(job.id)}>
                Edit Job
              </DropdownMenuItem>
              {job.status === 'draft' && (
                <DropdownMenuItem onClick={() => onPublish?.(job.id)}>
                  Publish Job
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(job.id)}
                className="text-red-600 focus:text-red-600"
              >
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Job Details */}
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>{employmentTypeLabels[job.employmentType] || job.employmentType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>{formatSalary(job.salaryMin, job.salaryMax, job.compensationType)}</span>
            </div>
          </div>

          {job.publishedAt && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Published {new Date(job.publishedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Views</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {job.viewCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Applications</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {applicationCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Rate Indicator */}
      {job.viewCount > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Conversion Rate</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {((applicationCount / job.viewCount) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}