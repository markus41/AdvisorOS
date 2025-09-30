# CPA Platform Design System - Components

## Component Library Overview
Our component library is built with React, TypeScript, and Tailwind CSS, focusing on accessibility and reusability.

## Core Components

### Layout Components

#### AppShell
Main application wrapper with sidebar navigation and header
```tsx
<AppShell user={user}>
  {children}
</AppShell>
```

#### PageHeader
Consistent page headers with breadcrumbs and actions
```tsx
<PageHeader
  title="Clients"
  breadcrumbs={[{ label: 'Home', href: '/' }]}
  actions={<Button>Add Client</Button>}
/>
```

### Form Components

#### FormField
Wrapper for form inputs with label and error handling
```tsx
<FormField
  label="Email"
  name="email"
  error={errors.email}
>
  <Input type="email" {...register('email')} />
</FormField>
```

#### Input
Standard text input with variants
```tsx
<Input
  type="text"
  placeholder="Enter name"
  variant="default" // default | error | success
  size="md" // sm | md | lg
/>
```

#### Select
Dropdown selection component
```tsx
<Select
  options={options}
  value={value}
  onChange={onChange}
  placeholder="Select option"
/>
```

### Data Display

#### DataTable
Advanced table with sorting, filtering, and pagination
```tsx
<DataTable
  columns={columns}
  data={data}
  pagination
  sortable
  searchable
/>
```

#### Card
Container component for content sections
```tsx
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

#### StatCard
Display metrics and KPIs
```tsx
<StatCard
  title="Total Clients"
  value="156"
  change={12}
  trend="up"
/>
```

### Navigation

#### Sidebar
Collapsible navigation sidebar
```tsx
<Sidebar
  items={navigationItems}
  collapsed={isCollapsed}
  onToggle={handleToggle}
/>
```

#### Tabs
Tab navigation component
```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="documents">Documents</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    {/* content */}
  </TabsContent>
</Tabs>
```

### Feedback

#### Alert
Display important messages
```tsx
<Alert variant="info"> // info | success | warning | error
  <AlertTitle>Information</AlertTitle>
  <AlertDescription>
    Your changes have been saved.
  </AlertDescription>
</Alert>
```

#### Toast
Non-blocking notifications
```tsx
toast({
  title: "Success",
  description: "Client added successfully",
  variant: "success"
});
```

#### Modal
Dialog overlay component
```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ModalHeader>Edit Client</ModalHeader>
  <ModalContent>
    {/* form content */}
  </ModalContent>
  <ModalFooter>
    <Button onClick={handleSave}>Save</Button>
  </ModalFooter>
</Modal>
```

### Actions

#### Button
Primary action component
```tsx
<Button
  variant="primary" // primary | secondary | outline | ghost | danger
  size="md" // sm | md | lg
  loading={isLoading}
  disabled={isDisabled}
  onClick={handleClick}
>
  Click me
</Button>
```

#### IconButton
Icon-only button for compact actions
```tsx
<IconButton
  icon={<EditIcon />}
  label="Edit"
  onClick={handleEdit}
/>
```

#### Dropdown
Action menu dropdown
```tsx
<Dropdown>
  <DropdownTrigger>
    <Button>Actions</Button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem onClick={handleEdit}>Edit</DropdownItem>
    <DropdownItem onClick={handleDelete}>Delete</DropdownItem>
  </DropdownMenu>
</Dropdown>
```

## Design Tokens

### Colors
```css
--primary: #2563eb (blue-600)
--secondary: #64748b (slate-500)
--success: #10b981 (emerald-500)
--warning: #f59e0b (amber-500)
--error: #ef4444 (red-500)
--background: #ffffff
--foreground: #0f172a (slate-900)
```

### Typography
```css
--font-sans: 'Inter', system-ui, sans-serif
--font-mono: 'JetBrains Mono', monospace

--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
```

### Spacing
```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
```

### Border Radius
```css
--radius-sm: 0.125rem (2px)
--radius-md: 0.375rem (6px)
--radius-lg: 0.5rem (8px)
--radius-xl: 0.75rem (12px)
--radius-2xl: 1rem (16px)
--radius-full: 9999px
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

## Accessibility Guidelines

### ARIA Labels
All interactive components must have proper ARIA labels
```tsx
<Button aria-label="Delete client">
  <TrashIcon />
</Button>
```

### Keyboard Navigation
- All interactive elements accessible via Tab
- Escape closes modals and dropdowns
- Enter/Space activates buttons
- Arrow keys navigate menus

### Focus Management
- Visible focus indicators on all interactive elements
- Focus trap in modals
- Return focus on modal close

### Color Contrast
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Don't rely solely on color for information

## Component Patterns

### Loading States
```tsx
if (isLoading) {
  return <Skeleton className="h-10 w-full" />;
}
```

### Error States
```tsx
if (error) {
  return (
    <Alert variant="error">
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

### Empty States
```tsx
if (data.length === 0) {
  return (
    <EmptyState
      icon={<UsersIcon />}
      title="No clients yet"
      description="Add your first client to get started"
      action={
        <Button onClick={handleAddClient}>
          Add Client
        </Button>
      }
    />
  );
}
```

### Responsive Design
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid layout */}
</div>
```

## Best Practices

1. **Composition over Inheritance**: Build complex components from simple ones
2. **Prop Validation**: Use TypeScript interfaces for all component props
3. **Default Props**: Provide sensible defaults for optional props
4. **Memoization**: Use React.memo for expensive components
5. **Accessibility First**: Design with keyboard and screen reader users in mind
6. **Consistent Naming**: Follow naming conventions for props and events
7. **Documentation**: Include JSDoc comments for complex components
8. **Testing**: Write tests for all interactive components