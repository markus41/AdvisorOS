'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Grid3x3,
  List,
  RefreshCw,
  Download,
  AlertTriangle,
  Briefcase,
} from 'lucide-react'
import { api } from '@/lib/trpc'
import { JobCard } from '@/components/ats/JobCard'
import { JobFilters } from '@/components/ats/JobFilters'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ViewMode = 'grid' | 'list'

export default function JobsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null)

  // Fetch jobs with filters
  const {
    data: jobsData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.jobPosting.list.useInfiniteQuery(
    {
      status: statusFilter as any,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: 30000,
    }
  )

  // Mutations
  const deleteMutation = api.jobPosting.delete.useMutation({
    onSuccess: () => {
      toast.success('Job posting deleted successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to delete job: ${error.message}`)
    },
  })

  const publishMutation = api.jobPosting.publish.useMutation({
    onSuccess: () => {
      toast.success('Job posting published successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to publish job: ${error.message}`)
    },
  })

  // Flatten paginated results
  const jobs = useMemo(() => {
    return jobsData?.pages.flatMap((page) => page.jobs) ?? []
  }, [jobsData])

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = jobs
      .map((job) => job.department)
      .filter((dept): dept is string => !!dept)
    return Array.from(new Set(depts)).sort()
  }, [jobs])

  // Filter jobs based on search query and department
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDepartment =
        !departmentFilter || job.department === departmentFilter

      return matchesSearch && matchesDepartment
    })
  }, [jobs, searchQuery, departmentFilter])

  // Handlers
  const handleCreateJob = () => {
    router.push('/dashboard/jobs/new')
  }

  const handleJobClick = (id: string) => {
    router.push(`/dashboard/jobs/${id}`)
  }

  const handleEditJob = (id: string) => {
    router.push(`/dashboard/jobs/${id}/edit`)
  }

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      await deleteMutation.mutateAsync({ id })
    }
  }

  const handlePublishJob = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to publish this job posting? It will be visible to candidates.'
      )
    ) {
      await publishMutation.mutateAsync({ id, distributeTo: [] })
    }
  }

  const handleRefresh = async () => {
    await refetch()
    toast.success('Jobs refreshed')
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export feature coming soon')
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
        />
      ))}
    </div>
  )

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load jobs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Job Postings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your open positions and recruitment pipeline
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Refresh jobs"
            >
              <RefreshCw
                className={cn('w-5 h-5', isLoading && 'animate-spin')}
              />
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleCreateJob}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {jobs.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {jobs.filter((j) => j.status === 'active').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Draft</p>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
              {jobs.filter((j) => j.status === 'draft').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {jobs.reduce((sum, j) => sum + j.viewCount, 0).toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <JobFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            departmentFilter={departmentFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            departments={departments}
          />
        </motion.div>

        {/* Job List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Briefcase className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {jobs.length === 0 ? 'No job postings yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                {jobs.length === 0
                  ? 'Get started by creating your first job posting'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {jobs.length === 0 && (
                <button
                  onClick={handleCreateJob}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Job
                </button>
              )}
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'flex flex-col gap-4'
                  )}
                >
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={handleJobClick}
                      onEdit={handleEditJob}
                      onDelete={handleDeleteJob}
                      onPublish={handlePublishJob}
                    />
                  ))}
                </div>
              </AnimatePresence>

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      'Load More Jobs'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}