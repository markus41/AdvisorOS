'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Users,
  SearchX,
  FolderOpen,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
  Database,
  Inbox,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    icon: 'w-8 h-8',
    title: 'text-lg',
    description: 'text-sm',
    spacing: 'space-y-3'
  },
  md: {
    container: 'py-12',
    icon: 'w-12 h-12',
    title: 'text-xl',
    description: 'text-base',
    spacing: 'space-y-4'
  },
  lg: {
    container: 'py-16',
    icon: 'w-16 h-16',
    title: 'text-2xl',
    description: 'text-lg',
    spacing: 'space-y-6'
  }
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md'
}: EmptyStateProps) {
  const config = sizeConfig[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.container,
        className
      )}
    >
      <div className={cn(config.spacing)}>
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Icon className={cn(config.icon, 'text-gray-400 dark:text-gray-500')} />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-md mx-auto space-y-2">
          <h3 className={cn(
            'font-semibold text-gray-900 dark:text-white',
            config.title
          )}>
            {title}
          </h3>
          <p className={cn(
            'text-gray-600 dark:text-gray-400',
            config.description
          )}>
            {description}
          </p>
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  action.variant === 'secondary'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                )}
              >
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Predefined empty states for common scenarios
export function NoClientsEmptyState({
  onAddClient,
  onImportClients,
  className
}: {
  onAddClient?: () => void
  onImportClients?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Users}
      title="No clients yet"
      description="Start building your client portfolio by adding your first client or importing from existing records."
      action={onAddClient ? {
        label: 'Add Client',
        onClick: onAddClient
      } : undefined}
      secondaryAction={onImportClients ? {
        label: 'Import Clients',
        onClick: onImportClients
      } : undefined}
      className={className}
    />
  )
}

export function NoDocumentsEmptyState({
  onUploadDocument,
  onCreateFolder,
  className
}: {
  onUploadDocument?: () => void
  onCreateFolder?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents found"
      description="Upload documents or create folders to organize your client files and important records."
      action={onUploadDocument ? {
        label: 'Upload Document',
        onClick: onUploadDocument
      } : undefined}
      secondaryAction={onCreateFolder ? {
        label: 'Create Folder',
        onClick: onCreateFolder
      } : undefined}
      className={className}
    />
  )
}

export function NoSearchResultsEmptyState({
  query,
  onClearSearch,
  className
}: {
  query?: string
  onClearSearch?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description={query ? `No results found for "${query}". Try adjusting your search terms or filters.` : 'No results found. Try adjusting your search terms or filters.'}
      action={onClearSearch ? {
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'secondary'
      } : undefined}
      size="sm"
      className={className}
    />
  )
}

export function NoReportsEmptyState({
  onCreateReport,
  onViewTemplates,
  className
}: {
  onCreateReport?: () => void
  onViewTemplates?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No reports generated"
      description="Create custom reports to analyze your firm's performance and client data insights."
      action={onCreateReport ? {
        label: 'Create Report',
        onClick: onCreateReport
      } : undefined}
      secondaryAction={onViewTemplates ? {
        label: 'View Templates',
        onClick: onViewTemplates
      } : undefined}
      className={className}
    />
  )
}

export function NoWorkflowsEmptyState({
  onCreateWorkflow,
  onViewTemplates,
  className
}: {
  onCreateWorkflow?: () => void
  onViewTemplates?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={CheckCircle}
      title="No workflows yet"
      description="Automate your firm's processes by creating custom workflows for common tasks and procedures."
      action={onCreateWorkflow ? {
        label: 'Create Workflow',
        onClick: onCreateWorkflow
      } : undefined}
      secondaryAction={onViewTemplates ? {
        label: 'Browse Templates',
        onClick: onViewTemplates
      } : undefined}
      className={className}
    />
  )
}

export function NoNotificationsEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Inbox}
      title="All caught up!"
      description="You have no new notifications. We'll let you know when something needs your attention."
      size="sm"
      className={className}
    />
  )
}

export function NoUpcomingEventsEmptyState({
  onScheduleEvent,
  className
}: {
  onScheduleEvent?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={Calendar}
      title="No upcoming events"
      description="Your calendar is clear. Schedule meetings, deadlines, or reminders to stay organized."
      action={onScheduleEvent ? {
        label: 'Schedule Event',
        onClick: onScheduleEvent
      } : undefined}
      size="sm"
      className={className}
    />
  )
}

// Error states
export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We encountered an error while loading this content. Please try again.",
  onRetry,
  className
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
        variant: 'secondary'
      } : undefined}
      className={className}
    />
  )
}

// Loading placeholder
export function LoadingEmptyState({
  title = "Loading...",
  description = "Please wait while we fetch your data.",
  className
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <EmptyState
      icon={Clock}
      title={title}
      description={description}
      size="sm"
      className={className}
    />
  )
}