// Core UI Components
export { KPICard } from './kpi-card'
export type { KPICardProps } from './kpi-card'

export {
  StatusBadge,
  ActiveBadge,
  InactiveBadge,
  PendingBadge,
  WarningBadge,
  ErrorBadge,
  SuccessBadge,
} from './status-badge'
export type { StatusBadgeProps, StatusType } from './status-badge'

export { ActivityFeed, mockActivities } from './activity-feed'
export type { ActivityItem } from './activity-feed'

export {
  Skeleton,
  KPICardSkeleton,
  ChartSkeleton,
  ActivityFeedSkeleton,
  ClientCardSkeleton,
  TableSkeleton,
  DashboardSkeleton,
} from './loading-skeleton'

// Navigation & Layout Components
export { SearchBar, HeaderSearchBar } from './search-bar'
export { NotificationBell } from './notification-bell'
export { UserMenu, CompactUserMenu } from './user-menu'

// Loading Components
export {
  LoadingSpinner,
  PulseSpinner,
  BarSpinner,
  PageLoadingSpinner,
  ComponentLoadingSpinner
} from './loading-spinner'

// Empty States
export {
  EmptyState,
  NoClientsEmptyState,
  NoDocumentsEmptyState,
  NoSearchResultsEmptyState,
  NoReportsEmptyState,
  NoWorkflowsEmptyState,
  NoNotificationsEmptyState,
  NoUpcomingEventsEmptyState,
  ErrorEmptyState,
  LoadingEmptyState
} from './empty-state'

// Form Components
export { Button } from './button'
export { Input } from './input'
export { Label } from './label'
export { Checkbox } from './checkbox'
export { Badge } from './badge'
export { Textarea } from './textarea'
export { Select } from './select'
export { Tabs } from './tabs'
export { Progress } from './progress'

// Data Display
export { DataTable } from './data-table'
export { Table } from './table'

// Utility Components
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './form'
export { DropdownMenu } from './dropdown-menu'
