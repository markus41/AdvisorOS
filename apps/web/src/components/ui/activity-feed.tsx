'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Users,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Settings,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from './status-badge'

export interface ActivityItem {
  id: string
  type: 'upload' | 'client' | 'task' | 'payment' | 'comment' | 'system'
  title: string
  description: string
  timestamp: string
  user?: {
    name: string
    avatar?: string
  }
  metadata?: {
    status?: 'success' | 'warning' | 'error' | 'pending'
    amount?: string
    clientName?: string
    documentCount?: number
  }
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  className?: string
  maxItems?: number
  showTimestamp?: boolean
  compact?: boolean
}

const activityIcons: Record<ActivityItem['type'], LucideIcon> = {
  upload: Upload,
  client: Users,
  task: CheckCircle,
  payment: DollarSign,
  comment: MessageSquare,
  system: Settings,
}

const activityColors: Record<ActivityItem['type'], string> = {
  upload: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
  client: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
  task: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
  payment: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
  comment: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
  system: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

interface ActivityItemComponentProps {
  activity: ActivityItem
  compact?: boolean
  showTimestamp?: boolean
  index: number
}

function ActivityItemComponent({
  activity,
  compact = false,
  showTimestamp = true,
  index
}: ActivityItemComponentProps) {
  const Icon = activityIcons[activity.type]
  const colorClasses = activityColors[activity.type]

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }
    },
  }

  return (
    <motion.div
      className={cn(
        'flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        compact && 'py-2'
      )}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        colorClasses,
        compact && 'w-6 h-6'
      )}>
        <Icon className={cn('w-4 h-4', compact && 'w-3 h-3')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={cn(
              'font-medium text-gray-900 dark:text-white',
              compact ? 'text-sm' : 'text-sm'
            )}>
              {activity.title}
            </h4>
            <p className={cn(
              'text-gray-600 dark:text-gray-400 mt-0.5',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {activity.description}
            </p>

            {/* Metadata */}
            {activity.metadata && (
              <div className="flex items-center space-x-2 mt-2">
                {activity.metadata.status && (
                  <StatusBadge
                    status={activity.metadata.status}
                    size="sm"
                    variant="soft"
                  />
                )}
                {activity.metadata.amount && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {activity.metadata.amount}
                  </span>
                )}
                {activity.metadata.clientName && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.metadata.clientName}
                  </span>
                )}
                {activity.metadata.documentCount && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.metadata.documentCount} files
                  </span>
                )}
              </div>
            )}

            {/* User info */}
            {activity.user && (
              <div className="flex items-center space-x-1 mt-1">
                <span className={cn(
                  'text-gray-500 dark:text-gray-400',
                  compact ? 'text-xs' : 'text-xs'
                )}>
                  by {activity.user.name}
                </span>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {showTimestamp && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(activity.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ActivityFeedSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}

export function ActivityFeed({
  activities,
  className,
  maxItems,
  showTimestamp = true,
  compact = false,
}: ActivityFeedProps) {
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities

  if (activities.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No recent activity
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <AnimatePresence mode="popLayout">
        {displayedActivities.map((activity, index) => (
          <ActivityItemComponent
            key={activity.id}
            activity={activity}
            compact={compact}
            showTimestamp={showTimestamp}
            index={index}
          />
        ))}
      </AnimatePresence>

      {maxItems && activities.length > maxItems && (
        <motion.div
          className="text-center pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus-ring rounded">
            View all activities ({activities.length - maxItems} more)
          </button>
        </motion.div>
      )}
    </div>
  )
}

// Example usage with mock data
export const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'upload',
    title: 'Documents uploaded',
    description: 'Tax documents for Q4 2024 have been uploaded',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    user: { name: 'John Doe' },
    metadata: {
      status: 'success',
      clientName: 'ABC Corp',
      documentCount: 3,
    },
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment received',
    description: 'Invoice #1234 has been paid',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user: { name: 'Sarah Johnson' },
    metadata: {
      status: 'success',
      amount: '$2,500.00',
      clientName: 'Smith LLC',
    },
  },
  {
    id: '3',
    type: 'task',
    title: 'Task completed',
    description: 'Tax preparation for Smith LLC has been completed',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: { name: 'Mike Wilson' },
    metadata: {
      status: 'success',
      clientName: 'Smith LLC',
    },
  },
  {
    id: '4',
    type: 'client',
    title: 'New client added',
    description: 'XYZ Inc has been added as a new client',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: { name: 'Sarah Johnson' },
    metadata: {
      status: 'success',
      clientName: 'XYZ Inc',
    },
  },
  {
    id: '5',
    type: 'system',
    title: 'QuickBooks sync',
    description: 'Financial data has been synchronized with QuickBooks',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: {
      status: 'success',
    },
  },
]