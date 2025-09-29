# AdvisorOS UI Component Library

A comprehensive, accessible, and modern React component library built specifically for CPA platforms and financial advisory applications.

## Features

### 🎨 **Modern Design System**
- Built with Tailwind CSS and CSS-in-JS
- Consistent color palette and typography
- Dark mode support
- Responsive design patterns

### ♿ **Accessibility First**
- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- High contrast mode detection
- Focus management utilities

### 🚀 **Performance Optimized**
- Tree-shakeable exports
- Lazy loading support
- Optimized bundle size
- Reduced motion support

### 💼 **CPA-Specific Components**
- Financial charts and KPIs
- Document annotation system
- Workflow designer
- Task management boards
- Real-time collaboration tools

## Installation

```bash
npm install @cpa-platform/ui
```

## Components Overview

### Core Components
- `Button` - Enhanced button with multiple variants and accessibility features
- `Input` - Form input with validation states and icons
- `Textarea` - Multi-line text input with auto-resize
- `Select` - Dropdown selection with search and keyboard navigation
- `Badge` - Status and category indicators
- `Label` - Accessible form labels

### Form Components
- `FormField` - Wrapper with automatic error handling
- `FormInput`, `FormTextarea`, `FormSelect` - Form-integrated inputs
- `MultiStepForm` - Wizard-style multi-step forms
- `ClientForm` - Pre-built client onboarding form

### Dashboard Components
- `DashboardLayout` - Complete dashboard shell with navigation
- `KPICard` - Financial metrics display cards
- `ChartContainer` - Wrapper for charts with loading states

### Charts & Visualization
- `RevenueChart` - Area chart for financial data
- `ClientDistributionChart` - Pie chart for client segmentation
- `PerformanceMetricsChart` - Bar chart for KPIs
- `FinancialTrendsChart` - Line chart for trend analysis

### Workflow Components
- `WorkflowDesigner` - Visual workflow builder with React Flow
- `TaskBoard` - Kanban-style task management with drag & drop

### Real-time Collaboration
- `DocumentAnnotations` - Document annotation system
- `PresenceIndicator` - Live user presence display
- `LiveCursor` - Real-time cursor tracking
- `LiveSelection` - Collaborative text selection

### Layout Components
- `Container` - Responsive container with max-width constraints
- `Grid` - CSS Grid wrapper with responsive breakpoints
- `Flex` - Flexbox utilities
- `Stack`, `HStack` - Vertical and horizontal stacks
- `CardGrid` - Auto-sizing card layout
- `Masonry` - Pinterest-style masonry layout

### Accessibility Components
- `SkipLink` - Skip navigation for screen readers
- `FocusTrap` - Focus management for modals
- `ScreenReaderOnly` - Content for screen readers only
- `AccessibleField` - Form field with proper ARIA attributes
- `LoadingIndicator` - Accessible loading states

## Usage Examples

### Basic Form with Validation

```tsx
import { FormInput, FormSelect, Button, MultiStepForm } from '@cpa-platform/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFormSchema } from '@cpa-platform/ui'

const ClientForm = () => {
  const form = useForm({
    resolver: zodResolver(createFormSchema.client),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormInput
        name="firstName"
        control={form.control}
        label="First Name"
        required
      />
      <FormInput
        name="email"
        control={form.control}
        label="Email"
        type="email"
        required
      />
      <Button type="submit">Save Client</Button>
    </form>
  )
}
```

### Dashboard with Charts

```tsx
import {
  DashboardLayout,
  KPICard,
  RevenueChart,
  Grid,
  ChartContainer
} from '@cpa-platform/ui'

const Dashboard = () => {
  const revenueData = [
    { month: 'Jan', revenue: 12000, expenses: 8000, profit: 4000 },
    { month: 'Feb', revenue: 15000, expenses: 9000, profit: 6000 },
    // ... more data
  ]

  return (
    <DashboardLayout
      navigationItems={defaultNavigationItems}
      currentUser={currentUser}
    >
      <Grid cols={{ default: 1, md: 2, lg: 4 }} gap={6}>
        <KPICard
          title="Monthly Revenue"
          value={125000}
          format="currency"
          trend={{ value: 12.5, isPositive: true, period: "last month" }}
        />
        <KPICard
          title="Active Clients"
          value={87}
          trend={{ value: 8, isPositive: true, period: "last month" }}
        />
        <KPICard
          title="Tasks Completed"
          value={142}
          trend={{ value: 15, isPositive: true, period: "this week" }}
        />
        <KPICard
          title="Revenue Growth"
          value={12.5}
          format="percentage"
          trend={{ value: 3.2, isPositive: true, period: "vs last quarter" }}
        />
      </Grid>

      <ChartContainer title="Revenue Overview" className="mt-8">
        <RevenueChart data={revenueData} height={400} />
      </ChartContainer>
    </DashboardLayout>
  )
}
```

### Workflow Designer

```tsx
import { WorkflowDesigner, workflowTemplates } from '@cpa-platform/ui'

const WorkflowPage = () => {
  const handleSave = (nodes, edges) => {
    // Save workflow logic
    console.log('Saving workflow:', { nodes, edges })
  }

  const handleExecute = async (nodes, edges) => {
    // Execute workflow logic
    console.log('Executing workflow:', { nodes, edges })
  }

  return (
    <div className="h-screen">
      <WorkflowDesigner
        initialNodes={workflowTemplates[0].nodes}
        initialEdges={workflowTemplates[0].edges}
        onSave={handleSave}
        onExecute={handleExecute}
      />
    </div>
  )
}
```

### Task Management

```tsx
import { TaskBoard } from '@cpa-platform/ui'

const TasksPage = () => {
  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      status: 'todo' as const,
      tasks: [
        {
          id: '1',
          title: 'Review client documents',
          status: 'todo' as const,
          priority: 'high' as const,
          dueDate: new Date('2024-01-15'),
          assignee: { id: '1', name: 'John Doe' }
        }
      ]
    },
    // ... more columns
  ]

  const handleTaskMove = (taskId, fromColumn, toColumn, newIndex) => {
    // Handle task movement logic
    console.log('Moving task:', { taskId, fromColumn, toColumn, newIndex })
  }

  return (
    <TaskBoard
      columns={columns}
      onTaskMove={handleTaskMove}
      onAddTask={(columnId) => console.log('Add task to', columnId)}
    />
  )
}
```

## Accessibility Features

### WCAG 2.1 Compliance
- All components include proper ARIA attributes
- Keyboard navigation support
- Screen reader compatible
- Color contrast ratios meet AA standards

### Accessibility Hooks
```tsx
import { useHighContrast, useReducedMotion } from '@cpa-platform/ui'

const MyComponent = () => {
  const isHighContrast = useHighContrast()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'transition-all',
        prefersReducedMotion ? 'transition-none' : 'duration-300'
      )}
    >
      Content
    </div>
  )
}
```

## Responsive Design

### Breakpoint System
- `xs`: < 640px
- `sm`: ≥ 640px
- `md`: ≥ 768px
- `lg`: ≥ 1024px
- `xl`: ≥ 1280px
- `2xl`: ≥ 1536px

### Responsive Utilities
```tsx
import { Grid, Show, Hide, useBreakpoint } from '@cpa-platform/ui'

const ResponsiveComponent = () => {
  const { isMobile, isDesktop } = useBreakpoint()

  return (
    <>
      <Show above="md">
        <Grid cols={{ md: 2, lg: 3 }}>
          {/* Desktop layout */}
        </Grid>
      </Show>

      <Hide above="md">
        <div>
          {/* Mobile layout */}
        </div>
      </Hide>
    </>
  )
}
```

## Theming

### CSS Custom Properties
The component library uses CSS custom properties for theming:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  /* ... more variables */
}
```

### Dark Mode
All components automatically support dark mode when the `dark` class is applied to the root element.

## Development

### Storybook
View and test components in isolation:

```bash
npm run storybook
```

### Building
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

## Contributing

1. Follow the existing code style and patterns
2. Ensure all components are accessible
3. Add comprehensive tests
4. Update documentation
5. Create Storybook stories for new components

## Integration with AdvisorOS

This component library is specifically designed for the AdvisorOS platform and integrates seamlessly with:

- **tRPC** for type-safe API calls
- **Next.js** App Router
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Zod** for schema validation
- **Framer Motion** for animations

## Performance Considerations

- All components are tree-shakeable
- Use `React.lazy()` for code splitting when needed
- Charts use virtualization for large datasets
- Images are optimized with Next.js Image component
- Bundle size is monitored and optimized

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Accessibility tools and screen readers

## License

Private - AdvisorOS Platform Components