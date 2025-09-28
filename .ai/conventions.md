# Coding Conventions for AI Agents

## General Principles
1. **Clarity over cleverness**: Write code that is easy to understand
2. **Consistency**: Follow existing patterns in the codebase
3. **Type safety**: Leverage TypeScript to prevent runtime errors
4. **Error handling**: Always handle errors gracefully
5. **Performance**: Consider performance implications

## TypeScript Conventions

### Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Definitions
- Use interfaces for object shapes
- Use types for unions and primitives
- Export shared types from `@cpa-platform/shared`
- Avoid `any` - use `unknown` if type is truly unknown

### Naming
- Interfaces: PascalCase with "I" prefix for models (e.g., `IUser`)
- Types: PascalCase without prefix (e.g., `UserRole`)
- Enums: PascalCase for name, UPPER_SNAKE_CASE for values

## React/Next.js Conventions

### Component Structure
```typescript
// 1. Imports
import { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Types/Interfaces
interface ComponentProps {
  // props
}

// 3. Component
export const ComponentName: FC<ComponentProps> = ({ prop }) => {
  // 4. Hooks
  const router = useRouter();
  const [state, setState] = useState();

  // 5. Effects
  useEffect(() => {
    // effect logic
  }, []);

  // 6. Handlers
  const handleClick = () => {
    // handler logic
  };

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### File Organization
- Components: `/components/[domain]/ComponentName.tsx`
- Pages: `/app/[route]/page.tsx`
- API Routes: `/app/api/[resource]/route.ts`
- Utilities: `/lib/[category]/utility.ts`
- Types: `/types/[domain].ts`

### Naming Conventions
- Components: PascalCase (e.g., `ClientDashboard`)
- Files: kebab-case for pages, PascalCase for components
- Hooks: camelCase with "use" prefix (e.g., `useAuth`)
- Utils: camelCase (e.g., `formatCurrency`)

## API Conventions

### RESTful Routes
```typescript
// GET /api/clients - List all clients
// GET /api/clients/[id] - Get single client
// POST /api/clients - Create client
// PATCH /api/clients/[id] - Update client
// DELETE /api/clients/[id] - Delete client
```

### Response Format
```typescript
// Success
{
  "success": true,
  "data": { /* resource data */ }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Database Conventions

### Prisma Schema
- Models: PascalCase singular (e.g., `User`, `Client`)
- Fields: camelCase (e.g., `firstName`, `createdAt`)
- Relations: descriptive names (e.g., `organization`, `createdBy`)
- Always include: `id`, `createdAt`, `updatedAt`

### Query Patterns
```typescript
// Always include organizationId for multi-tenancy
const clients = await prisma.client.findMany({
  where: {
    organizationId: session.user.organizationId,
    // other filters
  },
  include: {
    // relations
  }
});
```

## Testing Conventions

### Test Structure
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // setup
  });

  it('should render correctly', () => {
    // test
  });

  it('should handle user interaction', () => {
    // test
  });
});
```

### Naming
- Test files: `ComponentName.test.tsx` or `utility.test.ts`
- Test descriptions: Start with "should"
- Use descriptive test names

## Security Conventions

### Authentication Checks
- Always verify session in API routes
- Check organization membership
- Validate role-based permissions
- Never trust client-side data

### Data Validation
- Use Zod for input validation
- Sanitize all user inputs
- Validate file uploads
- Check resource ownership

## Git Conventions

### Commit Messages
```
type(scope): description

- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance
```

### Branch Names
- Feature: `feature/description`
- Bug fix: `fix/description`
- Hotfix: `hotfix/description`

## CSS/Tailwind Conventions

### Class Organization
1. Layout (flex, grid, position)
2. Spacing (padding, margin)
3. Sizing (width, height)
4. Typography (font, text)
5. Colors (bg, text, border)
6. Effects (shadow, opacity)
7. Animations
8. Responsive modifiers

### Component Styling
```tsx
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  "base classes here",
  condition && "conditional classes",
  className // allow override from props
)} />
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  // operation
} catch (error) {
  console.error('Descriptive error context:', error);

  // User-friendly error
  return {
    success: false,
    error: {
      code: 'OPERATION_FAILED',
      message: 'Something went wrong. Please try again.'
    }
  };
}
```

### Loading States
- Always show loading indicators
- Handle error states gracefully
- Provide retry mechanisms
- Show helpful error messages

## Performance Guidelines

### React Optimization
- Use React.memo for expensive components
- Implement proper dependency arrays
- Lazy load heavy components
- Optimize images with Next.js Image

### Database Optimization
- Use pagination for lists
- Select only needed fields
- Implement proper indexes
- Use connection pooling

### Bundle Optimization
- Dynamic imports for large libraries
- Tree shaking unused code
- Minimize third-party dependencies
- Use production builds

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratios
- Alt text for images
- Focus management