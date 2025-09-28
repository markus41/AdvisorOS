# AdvisorOS Developer Setup & Architecture Guide

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Architecture Overview](#project-architecture-overview)
3. [Database Architecture](#database-architecture)
4. [API Architecture](#api-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Development Workflow](#development-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Debugging and Monitoring](#debugging-and-monitoring)
9. [Performance Optimization](#performance-optimization)
10. [Security Best Practices](#security-best-practices)
11. [Deployment Process](#deployment-process)
12. [Contributing Guidelines](#contributing-guidelines)

---

## Development Environment Setup

### Prerequisites

#### Required Software
- **Node.js**: Version 18.17.0 or higher
- **npm**: Version 9.0.0 or higher (or yarn/pnpm)
- **PostgreSQL**: Version 14 or higher
- **Git**: Latest version
- **Docker**: Optional but recommended for containerized development

#### Recommended Tools
- **VS Code**: With recommended extensions
- **Postman**: For API testing
- **pgAdmin**: PostgreSQL administration
- **Prisma Studio**: Database visualization
- **Redis**: For caching and sessions (optional in development)

### Initial Setup

#### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-org/advisoros.git
cd advisoros

# Install dependencies
npm install

# Install Turbo globally (optional but recommended)
npm install -g turbo
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
nano .env.local
```

#### 3. Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/advisoros_dev"

# NextAuth.js
NEXTAUTH_SECRET="your-development-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# External Services (Development/Sandbox)
QUICKBOOKS_CLIENT_ID="your-sandbox-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="your-sandbox-qb-client-secret"
QUICKBOOKS_ENVIRONMENT="sandbox"

STRIPE_SECRET_KEY="sk_test_your_stripe_test_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_test_key"

OPENAI_API_KEY="your-openai-api-key"

# Azure Storage (Development)
AZURE_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true"

# Optional Development Tools
REDIS_URL="redis://localhost:6379"
LOG_LEVEL="debug"
```

#### 4. Database Setup
```bash
# Start PostgreSQL (if using Docker)
docker run --name advisoros-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=advisoros_dev \
  -p 5432:5432 \
  -d postgres:14

# Or install locally and create database
createdb advisoros_dev

# Run migrations
npm run db:push

# Seed development data
npm run db:seed
```

#### 5. Start Development Server
```bash
# Start all services
npm run dev

# Or start specific packages
npm run dev --filter=web
npm run dev --filter=@advisoros/database
```

### VS Code Configuration

#### Recommended Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-playwright.playwright"
  ]
}
```

#### Workspace Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### Docker Development Environment

#### Docker Compose Setup
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: advisoros_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"
    volumes:
      - azurite_data:/data

volumes:
  postgres_data:
  azurite_data:
```

```bash
# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down
```

---

## Project Architecture Overview

### Monorepo Structure

```
advisoros/
├── apps/
│   └── web/                     # Next.js 14 application
│       ├── src/
│       │   ├── app/            # App Router pages and API routes
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/           # Utilities and configurations
│       │   ├── server/        # Server-side utilities
│       │   └── types/         # TypeScript type definitions
│       ├── public/            # Static assets
│       ├── prisma/           # Database schema and migrations
│       └── package.json
├── packages/
│   ├── database/              # Prisma client and utilities
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema
│   │   │   └── migrations/    # Database migrations
│   │   ├── src/
│   │   │   ├── client.ts      # Prisma client configuration
│   │   │   └── seed.ts        # Database seeding
│   │   └── package.json
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── hooks/         # Shared hooks
│   │   │   └── utils/         # UI utilities
│   │   └── package.json
│   ├── ai-agents/             # AI service integrations
│   │   ├── src/
│   │   │   ├── openai/        # OpenAI integration
│   │   │   ├── azure/         # Azure AI services
│   │   │   └── types/         # AI-related types
│   │   └── package.json
│   └── types/                 # Shared TypeScript types
│       ├── src/
│       │   ├── api.ts         # API types
│       │   ├── database.ts    # Database types
│       │   └── index.ts       # Exported types
│       └── package.json
├── infrastructure/            # Infrastructure as Code
│   ├── azure/                # Azure Terraform configurations
│   └── docker/               # Docker configurations
├── scripts/                  # Build and deployment scripts
├── docs/                     # Documentation
└── package.json             # Root package.json with workspace config
```

### Technology Stack

#### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Tremor**: React components for dashboards
- **React Hook Form**: Form state management
- **Zustand**: Lightweight state management
- **React Query**: Server state management

#### Backend Stack
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Database toolkit
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication solution
- **Zod**: Runtime type validation
- **Redis**: Caching and session storage

#### External Integrations
- **QuickBooks Online API**: Financial data synchronization
- **Stripe**: Payment processing
- **Azure Storage**: File storage and management
- **OpenAI**: AI-powered document analysis
- **SendGrid**: Email delivery

### Architecture Patterns

#### Multi-Tenant Architecture
```typescript
// Tenant isolation at database level
export const withTenant = <T extends { organizationId: string }>(
  query: T
) => {
  const session = getServerSession();
  return {
    ...query,
    organizationId: session.user.organizationId
  };
};

// Usage in API routes
export async function GET(request: Request) {
  const clients = await prisma.client.findMany(
    withTenant({
      where: { status: 'active' }
    })
  );
  return Response.json(clients);
}
```

#### Service Layer Pattern
```typescript
// services/clientService.ts
export class ClientService {
  constructor(
    private prisma: PrismaClient,
    private organizationId: string
  ) {}

  async createClient(data: CreateClientInput): Promise<Client> {
    return this.prisma.client.create({
      data: {
        ...data,
        organizationId: this.organizationId
      }
    });
  }

  async updateClient(id: string, data: UpdateClientInput): Promise<Client> {
    return this.prisma.client.update({
      where: {
        id,
        organizationId: this.organizationId
      },
      data
    });
  }
}
```

#### Repository Pattern
```typescript
// repositories/clientRepository.ts
export class ClientRepository {
  constructor(private prisma: PrismaClient) {}

  async findByOrganization(organizationId: string): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: { organizationId },
      include: {
        documents: true,
        quickbooksData: true
      }
    });
  }

  async findById(id: string, organizationId: string): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: { id, organizationId }
    });
  }
}
```

---

## Database Architecture

### Schema Design Principles

#### 1. Multi-Tenant Data Isolation
Every tenant-specific table includes `organizationId` for data isolation:

```prisma
model Client {
  id             String       @id @default(cuid())
  organizationId String       // Tenant isolation
  businessName   String
  // ... other fields

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@map("clients")
}
```

#### 2. Audit Trail Implementation
```prisma
model AuditLog {
  id             String    @id @default(cuid())
  organizationId String
  userId         String?
  action         String    // CREATE, UPDATE, DELETE
  resourceType   String    // client, document, etc.
  resourceId     String
  oldValues      Json?
  newValues      Json?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime  @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User?        @relation(fields: [userId], references: [id])

  @@index([organizationId, createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_logs")
}
```

#### 3. Optimized Indexing Strategy
```prisma
model Document {
  id             String   @id @default(cuid())
  organizationId String
  clientId       String
  fileName       String
  category       String
  createdAt      DateTime @default(now())

  // Strategic indexes for common query patterns
  @@index([organizationId, clientId])
  @@index([organizationId, category, createdAt])
  @@index([organizationId, createdAt])
  @@fulltext([fileName, description])
  @@map("documents")
}
```

### Database Relationships

#### Entity Relationship Diagram
```mermaid
erDiagram
    Organization ||--o{ User : has
    Organization ||--o{ Client : contains
    Organization ||--o{ Document : stores
    Organization ||--o{ Workflow : defines

    User ||--o{ Task : assigned
    User ||--o{ Document : uploads
    User ||--o{ Note : creates

    Client ||--o{ Document : owns
    Client ||--o{ Note : has
    Client ||--|| QuickBooksToken : syncs
    Client ||--o{ Engagement : involves

    Document ||--o{ DocumentAnnotation : has
    Document ||--o{ DocumentComment : contains

    Workflow ||--o{ WorkflowExecution : instantiates
    WorkflowExecution ||--o{ TaskExecution : contains

    Subscription ||--|| Organization : belongs_to
    Subscription ||--o{ Invoice : generates
```

### Data Access Patterns

#### 1. Prisma Client Configuration
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### 2. Type-Safe Query Builder
```typescript
// lib/queryBuilder.ts
export function buildClientQuery(params: ClientQueryParams) {
  const where: Prisma.ClientWhereInput = {
    organizationId: params.organizationId,
  };

  if (params.status) {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { businessName: { contains: params.search, mode: 'insensitive' } },
      { primaryContactEmail: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  return {
    where,
    include: {
      documents: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      quickbooksData: true
    },
    orderBy: { [params.sortBy]: params.sortOrder }
  };
}
```

#### 3. Transaction Management
```typescript
// services/clientService.ts
export async function createClientWithDocuments(
  clientData: CreateClientInput,
  documents: DocumentInput[]
) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: clientData
    });

    const documentPromises = documents.map(doc =>
      tx.document.create({
        data: {
          ...doc,
          clientId: client.id,
          organizationId: client.organizationId
        }
      })
    );

    await Promise.all(documentPromises);

    return client;
  });
}
```

---

## API Architecture

### REST API Design

#### 1. Consistent Response Format
```typescript
// lib/apiResponse.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
  };
}

export function createApiResponse<T>(
  data: T,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...meta
    }
  };
}
```

#### 2. Error Handling Middleware
```typescript
// middleware/errorHandler.ts
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const result = await handler(...args);
      return Response.json(createApiResponse(result));
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ValidationError) {
        return Response.json(
          createErrorResponse('VALIDATION_ERROR', error.message, error.details),
          { status: 400 }
        );
      }

      if (error instanceof AuthorizationError) {
        return Response.json(
          createErrorResponse('UNAUTHORIZED', 'Access denied'),
          { status: 403 }
        );
      }

      return Response.json(
        createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
        { status: 500 }
      );
    }
  };
}
```

#### 3. Authentication & Authorization
```typescript
// middleware/auth.ts
export async function withAuth(
  handler: (request: Request, context: AuthContext) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json(
        createErrorResponse('AUTHENTICATION_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    const context: AuthContext = {
      user: session.user,
      organizationId: session.user.organizationId
    };

    return handler(request, context);
  };
}

// Usage in API routes
export const GET = withAuth(withErrorHandler(async (request, context) => {
  const clients = await clientService.findByOrganization(context.organizationId);
  return clients;
}));
```

#### 4. Input Validation
```typescript
// schemas/clientSchemas.ts
import { z } from 'zod';

export const createClientSchema = z.object({
  businessName: z.string().min(1).max(255),
  legalName: z.string().optional(),
  taxId: z.string().regex(/^\d{2}-\d{7}$/).optional(),
  primaryContactEmail: z.string().email(),
  businessType: z.enum(['LLC', 'Corporation', 'Partnership', 'Sole_Proprietorship']),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  customFields: z.record(z.any()).optional()
});

export const updateClientSchema = createClientSchema.partial();

// Usage in API route
export const POST = withAuth(withErrorHandler(async (request, context) => {
  const body = await request.json();
  const validatedData = createClientSchema.parse(body);

  const client = await clientService.create(validatedData, context.organizationId);
  return client;
}));
```

### Real-Time Features

#### WebSocket Integration
```typescript
// lib/websocket.ts
import { Server } from 'socket.io';

export function initializeWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const session = await verifyJwtToken(token);

    if (session) {
      socket.data.user = session.user;
      socket.data.organizationId = session.user.organizationId;
      next();
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // Join organization room for tenant isolation
    socket.join(`org:${socket.data.organizationId}`);

    socket.on('document:upload:progress', (data) => {
      socket.to(`org:${socket.data.organizationId}`).emit('document:upload:progress', data);
    });
  });

  return io;
}
```

#### Server-Sent Events for Real-Time Updates
```typescript
// app/api/events/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Subscribe to organization-specific events
      const unsubscribe = eventEmitter.on(`org:${organizationId}`, (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### API Rate Limiting

#### Rate Limiting Implementation
```typescript
// middleware/rateLimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export function withRateLimit(
  requests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return function middleware(
    handler: (request: Request) => Promise<Response>
  ) {
    return async (request: Request): Promise<Response> => {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const key = `rate_limit:${ip}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      if (current > requests) {
        return Response.json(
          createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': requests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Date.now() + windowMs).toString()
            }
          }
        );
      }

      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', requests.toString());
      response.headers.set('X-RateLimit-Remaining', (requests - current).toString());

      return response;
    };
  };
}
```

---

## Frontend Architecture

### Component Architecture

#### 1. Component Structure
```
src/components/
├── ui/                    # Base UI components (buttons, inputs, etc.)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts
├── forms/                 # Form components
│   ├── ClientForm.tsx
│   ├── DocumentUpload.tsx
│   └── index.ts
├── layout/                # Layout components
│   ├── Navigation.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── index.ts
├── features/              # Feature-specific components
│   ├── clients/
│   │   ├── ClientList.tsx
│   │   ├── ClientCard.tsx
│   │   └── ClientDetails.tsx
│   ├── documents/
│   │   ├── DocumentViewer.tsx
│   │   ├── DocumentList.tsx
│   │   └── OCRResults.tsx
│   └── workflows/
└── charts/                # Data visualization components
    ├── RevenueChart.tsx
    ├── ClientGrowthChart.tsx
    └── index.ts
```

#### 2. Component Design Patterns

**Container/Presentation Pattern:**
```typescript
// components/features/clients/ClientListContainer.tsx
export function ClientListContainer() {
  const { data: clients, isLoading, error } = useClients();
  const [filters, setFilters] = useState<ClientFilters>({});

  if (isLoading) return <ClientListSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ClientListPresentation
      clients={clients}
      filters={filters}
      onFiltersChange={setFilters}
    />
  );
}

// components/features/clients/ClientListPresentation.tsx
interface ClientListPresentationProps {
  clients: Client[];
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
}

export function ClientListPresentation({
  clients,
  filters,
  onFiltersChange
}: ClientListPresentationProps) {
  return (
    <div className="space-y-4">
      <ClientFilters filters={filters} onChange={onFiltersChange} />
      <ClientGrid clients={clients} />
    </div>
  );
}
```

**Compound Component Pattern:**
```typescript
// components/ui/Modal.tsx
interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ children, isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

Modal.Header = function ModalHeader({ children }: { children: React.ReactNode }) {
  return <div className="modal-header">{children}</div>;
};

Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="modal-footer">{children}</div>;
};

// Usage
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <h2>Edit Client</h2>
  </Modal.Header>
  <Modal.Body>
    <ClientForm client={client} />
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={onSave}>Save</Button>
    <Button onClick={onClose}>Cancel</Button>
  </Modal.Footer>
</Modal>
```

#### 3. State Management

**Global State with Zustand:**
```typescript
// stores/useClientStore.ts
interface ClientStore {
  clients: Client[];
  selectedClient: Client | null;
  filters: ClientFilters;
  setClients: (clients: Client[]) => void;
  setSelectedClient: (client: Client | null) => void;
  updateFilters: (filters: Partial<ClientFilters>) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  selectedClient: null,
  filters: {},

  setClients: (clients) => set({ clients }),

  setSelectedClient: (selectedClient) => set({ selectedClient }),

  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),

  addClient: (client) =>
    set((state) => ({
      clients: [...state.clients, client]
    })),

  updateClient: (id, updates) =>
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === id ? { ...client, ...updates } : client
      )
    })),

  removeClient: (id) =>
    set((state) => ({
      clients: state.clients.filter(client => client.id !== id)
    }))
}));
```

**Server State with React Query:**
```typescript
// hooks/useClients.ts
export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientApi.getClients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientApi.createClient,
    onSuccess: (newClient) => {
      // Update cache
      queryClient.setQueryData(['clients'], (oldData: Client[]) =>
        oldData ? [...oldData, newClient] : [newClient]
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
```

#### 4. Form Management

**React Hook Form Integration:**
```typescript
// components/forms/ClientForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Business Name"
        {...register('businessName')}
        error={errors.businessName?.message}
      />

      <Input
        label="Primary Contact Email"
        type="email"
        {...register('primaryContactEmail')}
        error={errors.primaryContactEmail?.message}
      />

      <Select
        label="Business Type"
        {...register('businessType')}
        error={errors.businessType?.message}
      >
        <option value="">Select business type</option>
        <option value="LLC">LLC</option>
        <option value="Corporation">Corporation</option>
        <option value="Partnership">Partnership</option>
      </Select>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
```

---

## Development Workflow

### Git Workflow

#### Branch Strategy
```bash
# Feature branch workflow
git checkout main
git pull origin main
git checkout -b feature/client-management-improvements

# Make changes, commit frequently
git add .
git commit -m "feat: add client search functionality"

# Push feature branch
git push origin feature/client-management-improvements

# Create pull request
gh pr create --title "Add client search functionality" --body "Implements search and filtering for client list"
```

#### Commit Message Convention
```bash
# Format: type(scope): description
feat(clients): add advanced search functionality
fix(auth): resolve session timeout issue
docs(api): update authentication documentation
refactor(database): optimize client queries
test(components): add tests for ClientForm
chore(deps): update dependencies to latest versions
```

### Code Quality Tools

#### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Husky Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run type-check && npm run test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Development Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage",
    "db:push": "turbo run db:push",
    "db:studio": "turbo run db:studio",
    "db:seed": "turbo run db:seed",
    "db:migrate": "turbo run db:migrate",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

#### Turbo Configuration
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:push": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Testing Strategy

### Testing Pyramid

#### Unit Tests (Jest + Testing Library)
```typescript
// __tests__/components/ClientForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientForm } from '@/components/forms/ClientForm';

describe('ClientForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all required fields', () => {
    render(
      <ClientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary contact email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business type/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <ClientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <ClientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    fireEvent.change(screen.getByLabelText(/business name/i), {
      target: { value: 'Test Company' }
    });

    fireEvent.change(screen.getByLabelText(/primary contact email/i), {
      target: { value: 'test@example.com' }
    });

    fireEvent.change(screen.getByLabelText(/business type/i), {
      target: { value: 'LLC' }
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        businessName: 'Test Company',
        primaryContactEmail: 'test@example.com',
        businessType: 'LLC'
      });
    });
  });
});
```

#### Integration Tests
```typescript
// __tests__/api/clients.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/clients';
import { prismaMock } from '@/lib/prisma-mock';

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}));

describe('/api/clients', () => {
  it('GET returns clients for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    });

    const mockClients = [
      { id: '1', businessName: 'Test Company', organizationId: 'org-1' }
    ];

    prismaMock.client.findMany.mockResolvedValue(mockClients);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: mockClients
    });
  });

  it('POST creates new client', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {
        businessName: 'New Company',
        primaryContactEmail: 'contact@newcompany.com',
        businessType: 'LLC'
      }
    });

    const mockClient = {
      id: '2',
      businessName: 'New Company',
      organizationId: 'org-1'
    };

    prismaMock.client.create.mockResolvedValue(mockClient);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: mockClient
    });
  });
});
```

#### End-to-End Tests (Playwright)
```typescript
// e2e/client-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new client', async ({ page }) => {
    await page.goto('/clients');
    await page.click('text=Add Client');

    await page.fill('[name="businessName"]', 'Test Company');
    await page.fill('[name="primaryContactEmail"]', 'test@company.com');
    await page.selectOption('[name="businessType"]', 'LLC');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Client created successfully')).toBeVisible();
    await expect(page.locator('text=Test Company')).toBeVisible();
  });

  test('should search clients', async ({ page }) => {
    await page.goto('/clients');
    await page.fill('[placeholder="Search clients..."]', 'Acme');

    await expect(page.locator('[data-testid="client-list"]')).toContainText('Acme');
    await expect(page.locator('[data-testid="client-list"] >> text=Other Company')).not.toBeVisible();
  });
});
```

### Test Configuration

#### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Debugging and Monitoring

### Development Debugging

#### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

#### Logging Configuration
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'advisoros' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

### Production Monitoring

#### Application Performance Monitoring
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null;
      }
    }
    return event;
  },
});

// Custom metrics
export function trackCustomMetric(name: string, value: number, tags?: Record<string, string>) {
  if (process.env.NODE_ENV === 'production') {
    // Send to your monitoring service
    console.log(`Metric: ${name} = ${value}`, tags);
  }
}
```

#### Database Query Monitoring
```typescript
// lib/prisma-monitoring.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query detected:', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});

prisma.$on('error', (e) => {
  console.error('Database error:', e);
});
```

---

## Performance Optimization

### Frontend Performance

#### Code Splitting and Lazy Loading
```typescript
// Dynamic imports for route-based code splitting
import dynamic from 'next/dynamic';

const ClientDetails = dynamic(() => import('@/components/features/clients/ClientDetails'), {
  loading: () => <ClientDetailsSkeleton />,
});

const DocumentViewer = dynamic(() => import('@/components/features/documents/DocumentViewer'), {
  ssr: false, // Disable SSR for heavy components
});

// Lazy loading with intersection observer
import { lazy, Suspense } from 'react';

const ExpensiveChart = lazy(() => import('@/components/charts/ExpensiveChart'));

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <ExpensiveChart />
      </Suspense>
    </div>
  );
}
```

#### Image Optimization
```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width, height, priority = false }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      className="rounded-lg"
    />
  );
}
```

#### Virtual Scrolling for Large Lists
```typescript
// components/ui/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem
}: VirtualizedListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
    >
      {Row}
    </List>
  );
}
```

### Backend Performance

#### Database Query Optimization
```typescript
// Optimized queries with proper indexing
export async function getClientsWithDocuments(organizationId: string) {
  return prisma.client.findMany({
    where: { organizationId },
    include: {
      documents: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          category: true,
          createdAt: true,
        }
      },
      _count: {
        select: {
          documents: true,
          notes: true,
        }
      }
    },
    orderBy: { businessName: 'asc' },
  });
}

// Use dataloader for N+1 query prevention
import DataLoader from 'dataloader';

const clientDocumentLoader = new DataLoader(async (clientIds: string[]) => {
  const documents = await prisma.document.findMany({
    where: { clientId: { in: clientIds } },
    orderBy: { createdAt: 'desc' },
  });

  // Group by clientId
  const grouped = documents.reduce((acc, doc) => {
    if (!acc[doc.clientId]) acc[doc.clientId] = [];
    acc[doc.clientId].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  return clientIds.map(id => grouped[id] || []);
});
```

#### Caching Strategy
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

// Usage in API routes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = `clients:${searchParams.toString()}`;

  let clients = await CacheService.get<Client[]>(cacheKey);

  if (!clients) {
    clients = await getClients(searchParams);
    await CacheService.set(cacheKey, clients, 300); // 5 minutes
  }

  return Response.json(clients);
}
```

---

## Security Best Practices

### Input Validation and Sanitization

#### Zod Schema Validation
```typescript
// schemas/validation.ts
import { z } from 'zod';

export const clientSchema = z.object({
  businessName: z.string()
    .min(1, 'Business name is required')
    .max(255, 'Business name too long')
    .regex(/^[a-zA-Z0-9\s\-&.,]+$/, 'Invalid characters in business name'),

  primaryContactEmail: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long'),

  taxId: z.string()
    .regex(/^\d{2}-\d{7}$/, 'Tax ID must be in format XX-XXXXXXX')
    .optional(),

  website: z.string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),

  customFields: z.record(z.any())
    .optional()
    .refine((data) => {
      if (!data) return true;
      return Object.keys(data).length <= 20; // Limit custom fields
    }, 'Too many custom fields')
});
```

#### SQL Injection Prevention
```typescript
// Always use Prisma's type-safe queries
export async function searchClients(searchTerm: string, organizationId: string) {
  // SAFE: Prisma handles parameterization
  return prisma.client.findMany({
    where: {
      organizationId,
      OR: [
        { businessName: { contains: searchTerm, mode: 'insensitive' } },
        { primaryContactEmail: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }
  });
}

// NEVER do raw SQL with user input
// const results = await prisma.$queryRaw`SELECT * FROM clients WHERE name = ${searchTerm}`; // DANGEROUS!
```

### Authentication and Authorization

#### Role-Based Access Control
```typescript
// lib/rbac.ts
export enum Permission {
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_DELETE = 'document:delete',
  USER_MANAGE = 'user:manage',
  BILLING_MANAGE = 'billing:manage',
}

export const rolePermissions: Record<string, Permission[]> = {
  owner: Object.values(Permission),
  admin: [
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.DOCUMENT_UPLOAD,
    Permission.USER_MANAGE,
  ],
  cpa: [
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.DOCUMENT_UPLOAD,
  ],
  staff: [
    Permission.CLIENT_READ,
    Permission.DOCUMENT_UPLOAD,
  ],
};

export function hasPermission(userRole: string, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

// Middleware for API routes
export function requirePermission(permission: Permission) {
  return function middleware(
    handler: (request: Request, context: AuthContext) => Promise<Response>
  ) {
    return async (request: Request, context: AuthContext): Promise<Response> => {
      if (!hasPermission(context.user.role, permission)) {
        return Response.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(request, context);
    };
  };
}
```

#### Secure Session Management
```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
  events: {
    signIn: async ({ user, account, isNewUser }) => {
      // Log security event
      await prisma.authEvent.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          type: 'SIGN_IN',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });
    },
  },
};
```

### Data Protection

#### Encryption at Rest
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('AdvisorOS', 'utf8'));

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('AdvisorOS', 'utf8'));
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage for sensitive data
const encryptedTaxId = encrypt(client.taxId);
```

#### Data Sanitization
```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars
    .replace(/_{2,}/g, '_') // Replace multiple underscores
    .substring(0, 255); // Limit length
}

export function sanitizeSearchTerm(term: string): string {
  return term
    .trim()
    .substring(0, 100) // Limit length
    .replace(/[<>]/g, ''); // Remove potentially dangerous chars
}
```

---

## Deployment Process

### Environment Configuration

#### Production Environment Variables
```bash
# .env.production
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/advisoros_prod"
NEXTAUTH_SECRET="super-secure-secret-key"
NEXTAUTH_URL="https://advisoros.com"

# External Services
QUICKBOOKS_CLIENT_ID="prod-qb-client-id"
QUICKBOOKS_CLIENT_SECRET="prod-qb-secret"
QUICKBOOKS_ENVIRONMENT="production"

STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Azure Services
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."

# Monitoring
SENTRY_DSN="https://..."
NEW_RELIC_LICENSE_KEY="..."

# Security
ENCRYPTION_KEY="32-byte-encryption-key"
```

### Docker Configuration

#### Multi-stage Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/*/package.json ./packages/*/
RUN npm ci --only=production

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### Docker Compose for Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: advisoros_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d
            docker image prune -f
```

### Health Checks and Monitoring

#### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    redis: false,
    storage: false,
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Redis check
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // Storage check
    await azure.storage.test();
    checks.storage = true;
  } catch (error) {
    console.error('Storage health check failed:', error);
  }

  const healthy = Object.values(checks).every(Boolean);

  return Response.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
```

---

## Contributing Guidelines

### Code Review Process

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Updated documentation

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No new warnings or errors
```

#### Code Review Checklist
- **Functionality**: Does the code work as intended?
- **Security**: Are there any security vulnerabilities?
- **Performance**: Are there any performance issues?
- **Maintainability**: Is the code easy to understand and maintain?
- **Testing**: Are there adequate tests?
- **Documentation**: Is documentation updated?

### Development Standards

#### TypeScript Guidelines
```typescript
// Use explicit return types for functions
export function calculateTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// Use proper error handling
export async function createClient(data: CreateClientInput): Promise<Result<Client, Error>> {
  try {
    const client = await clientService.create(data);
    return { success: true, data: client };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Use branded types for IDs
type ClientId = string & { readonly brand: unique symbol };
type OrganizationId = string & { readonly brand: unique symbol };

export function getClient(id: ClientId): Promise<Client | null> {
  return prisma.client.findUnique({ where: { id } });
}
```

#### Component Guidelines
```typescript
// Use proper prop interfaces
interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
  className?: string;
}

// Use default props appropriately
export function ClientCard({
  client,
  onEdit,
  onDelete,
  className = ''
}: ClientCardProps) {
  // Component implementation
}

// Export components with display names
ClientCard.displayName = 'ClientCard';
```

### Release Process

#### Semantic Versioning
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

#### Release Checklist
1. **Pre-release**:
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] Changelog updated
   - [ ] Version bumped

2. **Release**:
   - [ ] Tagged release in Git
   - [ ] Deployed to staging
   - [ ] Smoke tests passed
   - [ ] Deployed to production

3. **Post-release**:
   - [ ] Monitor for errors
   - [ ] Update documentation
   - [ ] Notify stakeholders

---

This comprehensive developer guide should provide your team with everything needed to work effectively with the AdvisorOS codebase. The architecture patterns, coding standards, and workflows outlined here will help maintain code quality and development velocity as the project scales.

Remember to keep this documentation updated as the project evolves, and encourage team members to contribute improvements and clarifications based on their experiences.