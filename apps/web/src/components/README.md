# CPA Platform UI Foundation

A comprehensive UI component library built with Next.js, Tremor UI, Tailwind CSS, and Framer Motion for the CPA Platform.

## Features

- 🎨 **Professional Design System** - CPA-appropriate colors and styling
- 🌙 **Dark Mode Support** - Complete dark/light/system theme support
- 📱 **Responsive Design** - Mobile-first approach with all breakpoints
- ♿ **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- ⚡ **Performance** - Optimized components with proper memoization
- 🔍 **Search Integration** - Global search with keyboard shortcuts (Cmd+K)
- 📊 **Tremor Components** - Charts, KPIs, and data visualization
- ✨ **Smooth Animations** - Framer Motion for micro-interactions

## Components

### Layout Components (`/layout/`)

- **DashboardLayout** - Main wrapper with sidebar, header, breadcrumbs, and error boundary
- **Sidebar** - Collapsible navigation with desktop and mobile support
- **Header** - Top bar with search, notifications, and user menu

### UI Components (`/ui/`)

#### Navigation & Search
- **SearchBar** - Global search with autocomplete and keyboard shortcuts
- **NotificationBell** - Real-time notifications with dropdown
- **UserMenu** - User profile menu with theme selector

#### Data Display
- **KPICard** - Tremor-based metrics cards
- **DataTable** - Advanced table with sorting, filtering, and pagination
- **ActivityFeed** - Real-time activity stream
- **StatusBadge** - Colored status indicators

#### Loading & Empty States
- **LoadingSpinner** - Multiple spinner variants (default, pulse, bar)
- **EmptyState** - Contextual empty states for different scenarios
- **LoadingSkeleton** - Skeleton loaders for various components

#### Form Components
- **Button, Input, Label, Checkbox** - Styled form controls
- **Select, Textarea, Tabs** - Advanced form components
- **Form** - Form wrapper with validation support

### Providers (`/providers/`)
- **ThemeProvider** - Enhanced theme system with accessibility preferences

## Usage Examples

### Basic Layout Setup

```tsx
import { DashboardLayout } from '@/components/layout'
import { ThemeProvider } from '@/components/providers'

export default function App({ children }) {
  return (
    <ThemeProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ThemeProvider>
  )
}
```

### Using Search Bar

```tsx
import { SearchBar } from '@/components/ui'

function MyComponent() {
  return (
    <SearchBar
      placeholder="Search clients, documents..."
      onResultSelect={(result) => {
        // Handle search result selection
        router.push(result.href)
      }}
    />
  )
}
```

### KPI Cards with Tremor

```tsx
import { KPICard } from '@/components/ui'
import { Users, DollarSign } from 'lucide-react'

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Active Clients"
        value="124"
        change={{ value: 12, type: 'increase', period: 'vs last month' }}
        icon={Users}
      />
      <KPICard
        title="Revenue"
        value="$47,392"
        change={{ value: 8.5, type: 'increase', period: 'vs last month' }}
        icon={DollarSign}
      />
    </div>
  )
}
```

### Notifications

```tsx
import { NotificationBell } from '@/components/ui'

function Header() {
  return (
    <div className="flex items-center space-x-4">
      <NotificationBell
        onNotificationClick={(notification) => {
          // Handle notification click
          markAsRead(notification.id)
        }}
      />
    </div>
  )
}
```

### Empty States

```tsx
import { NoClientsEmptyState } from '@/components/ui'

function ClientsList({ clients }) {
  if (clients.length === 0) {
    return (
      <NoClientsEmptyState
        onAddClient={() => router.push('/clients/new')}
        onImportClients={() => setImportModalOpen(true)}
      />
    )
  }

  return (
    // ... render clients
  )
}
```

### Theme Management

```tsx
import { useTheme, ThemeToggle } from '@/components/providers'

function Settings() {
  const { theme, preferences, updatePreferences } = useTheme()

  return (
    <div>
      <ThemeToggle />

      <div>
        <label>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
          />
          Reduce Motion
        </label>
      </div>
    </div>
  )
}
```

## Color System

The platform uses a professional color palette optimized for CPA workflows:

- **Primary**: Blue scale (cpa-500 to cpa-950)
- **Success**: Green scale
- **Warning**: Yellow scale
- **Error**: Red scale
- **Neutral**: Gray scale

## Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open global search
- **Escape**: Close modals/dropdowns
- **Arrow Keys**: Navigate search results and menus
- **Enter**: Select highlighted item

## Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Dark Mode

All components support dark mode with proper contrast ratios and accessibility considerations. The theme system includes:

- Light/Dark/System modes
- Auto-switching based on time
- High contrast mode
- Reduced motion preferences
- Custom font size scaling

## Performance

- Tree-shaking optimized exports
- Lazy loading for heavy components
- Memoized expensive calculations
- Optimized re-renders with React.memo
- Efficient animations with Framer Motion

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

When adding new components:

1. Follow the existing patterns and naming conventions
2. Include TypeScript types and interfaces
3. Add proper accessibility attributes
4. Support dark mode
5. Include responsive design
6. Add to the appropriate index file
7. Update documentation