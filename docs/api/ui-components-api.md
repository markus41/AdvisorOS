# UI Components API Reference

Complete API documentation for all 6 market-leading UI features.

---

## 1. Context-Aware Dashboard Intelligence

### Component: `ContextAwareDashboard`

**Import:**
```typescript
import { ContextAwareDashboard } from '@/components/dashboard/ContextAwareDashboard';
```

**Props:**
```typescript
interface ContextAwareDashboardProps {
  context: DashboardContext;
  onWidgetClick?: (widgetId: string) => void;
  onRecommendationAction?: (recommendationId: string) => void;
}

interface DashboardContext {
  userId: string;
  role: 'owner' | 'admin' | 'cpa' | 'staff';
  currentSeason: 'tax_season' | 'audit_season' | 'normal';
  workloadCapacity: number; // 0-100
  upcomingDeadlines: number;
}
```

**Usage Example:**
```tsx
<ContextAwareDashboard
  context={{
    userId: 'user-123',
    role: 'cpa',
    currentSeason: 'tax_season',
    workloadCapacity: 87,
    upcomingDeadlines: 3
  }}
  onWidgetClick={(widgetId) => router.push(`/dashboard/${widgetId}`)}
  onRecommendationAction={(id) => trackAction(id)}
/>
```

**Service: `DashboardAIService`**

```typescript
import { dashboardAI } from '@/lib/services/dashboardAI';

// Generate personalized layout
const layout = await dashboardAI.generateLayout({
  userId: 'user-123',
  organizationId: 'org-456',
  role: 'cpa',
  currentSeason: 'tax_season',
  workloadCapacity: 87,
  upcomingDeadlines: 3
});

// Record user feedback
await dashboardAI.recordUserAction(
  'user-123',
  'recommendation-789',
  'accepted',
  120 // time spent in seconds
);
```

**Customization:**
```typescript
// Custom widget types
const customWidget: DashboardWidget = {
  id: 'custom-metric',
  type: 'revenue_forecast',
  title: 'Revenue Forecast',
  priority: 8,
  weight: 8,
  gridPosition: { x: 0, y: 2, w: 2, h: 1 },
  refreshInterval: 300000 // 5 minutes
};
```

---

## 2. Document Processing Visual Workflow

### Component: `DocumentProcessingPipeline`

**Import:**
```typescript
import { DocumentProcessingPipeline } from '@/components/documents/DocumentProcessingPipeline';
```

**Props:**
```typescript
interface DocumentProcessingPipelineProps {
  documentId: string;
  documentUrl: string;
  documentType?: string;
  onComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}
```

**Usage Example:**
```tsx
<DocumentProcessingPipeline
  documentId="doc-123"
  documentUrl="/uploads/w2-form.pdf"
  documentType="W-2"
  onComplete={(extractedData) => {
    console.log('Processing complete:', extractedData);
    saveToDatabase(extractedData);
  }}
  onError={(error) => {
    console.error('Processing failed:', error);
    showErrorNotification(error.message);
  }}
/>
```

**Processing Stages:**
```typescript
interface ProcessingStage {
  id: string;
  stage: 'classification' | 'extraction' | 'validation' | 'compliance' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'needs_review' | 'failed';
  confidence: number; // 0-1
  duration: number; // milliseconds
  details: string;
}
```

**Field Validation:**
```typescript
interface ExtractedField {
  name: string;
  value: any;
  confidence: number; // 0-1
  needsReview: boolean;
  historicalContext?: {
    previousValue?: any;
    anomalyScore?: number;
  };
}
```

**API Integration:**
```typescript
// Start OCR processing
POST /api/documents/{documentId}/process
{
  "documentType": "W-2",
  "options": {
    "enableAI": true,
    "autoValidate": true
  }
}

// Response
{
  "stages": ProcessingStage[],
  "extractedFields": ExtractedField[],
  "overallConfidence": 0.94
}
```

---

## 3. Conversational Client Portal

### Component: `ConversationalClientPortal`

**Import:**
```typescript
import { ConversationalClientPortal } from '@/components/portal/ConversationalClientPortal';
```

**Props:**
```typescript
interface ConversationalClientPortalProps {
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  overview: ClientOverview;
}

interface ClientOverview {
  taxReturnStatus: {
    year: number;
    status: 'filed' | 'in_progress' | 'pending';
    filedDate?: Date;
    refundAmount?: number;
  };
  documentsNeeded: Array<{
    name: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  balanceDue: number;
}
```

**Usage Example:**
```tsx
<ConversationalClientPortal
  clientId="client-123"
  clientName="Sarah Johnson"
  clientAvatar="/avatars/sarah.jpg"
  overview={{
    taxReturnStatus: {
      year: 2023,
      status: 'filed',
      filedDate: new Date('2024-03-15'),
      refundAmount: 2340
    },
    documentsNeeded: [
      { name: '2024 W-2', type: 'W-2', priority: 'high' },
      { name: '1099-INT', type: '1099-INT', priority: 'medium' }
    ],
    balanceDue: 0
  }}
/>
```

**Service: `ConversationalAIService`**

```typescript
import { conversationalAI } from '@/lib/services/conversationalAI';

// Process user message
const response = await conversationalAI.processUserMessage(
  'I need to upload my W-2',
  {
    clientId: 'client-123',
    conversationHistory: previousMessages,
    clientProfile: {
      name: 'Sarah Johnson',
      taxYear: 2024,
      documentsNeeded: ['W-2', '1099-INT'],
      recentActivity: ['viewed_invoice'],
      preferences: {
        communicationStyle: 'casual',
        timezone: 'America/New_York'
      }
    }
  }
);

// Response structure
{
  message: "Great! I'll help you upload your W-2...",
  intent: {
    intent: 'upload_document',
    confidence: 0.94,
    parameters: { documentType: 'W-2' }
  },
  entities: [
    { type: 'document_type', value: 'W-2' }
  ],
  actions: [
    { id: 'camera', label: '📷 Take Photo', action: 'open_camera' }
  ],
  requiresHumanCPA: false
}
```

**Intent Types:**
```typescript
type Intent =
  | 'upload_document'
  | 'check_status'
  | 'ask_question'
  | 'schedule_meeting'
  | 'view_invoice'
  | 'pay_bill';
```

**API Endpoints:**
```typescript
// Send message
POST /api/chat/message
{
  "message": "I need to upload my W-2",
  "clientId": "client-123",
  "conversationId": "conv-456"
}

// WebSocket for real-time typing
WS /api/chat/typing
{
  "clientId": "client-123",
  "isTyping": true
}
```

---

## 4. Timeline-Based Engagement View

### Component: `TimelineEngagementView`

**Import:**
```typescript
import { TimelineEngagementView } from '@/components/engagement/TimelineEngagementView';
```

**Props:**
```typescript
interface TimelineEngagementViewProps {
  clientId: string;
  clientName: string;
  events: TimelineEvent[];
  metrics: TimelineMetrics;
  onEventClick?: (event: TimelineEvent) => void;
}

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'tax_return' | 'payment' | 'meeting' | 'document' | 'communication';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  metadata?: {
    revenue?: number;
    documentCount?: number;
  };
  isPredicted?: boolean; // AI prediction
}

interface TimelineMetrics {
  totalEngagements: number;
  avgResponseTime: number; // hours
  clientSatisfaction: number; // 1-5
  revenueYTD: number;
  documentsProcessed: number;
  lastContact: Date;
}
```

**Usage Example:**
```tsx
<TimelineEngagementView
  clientId="client-123"
  clientName="Acme Corporation"
  events={[
    {
      id: '1',
      date: new Date('2024-03-15'),
      type: 'tax_return',
      title: '2024 Tax Return Filed',
      description: 'Form 1120-S e-filed and accepted',
      status: 'completed',
      metadata: { revenue: 8500 }
    },
    {
      id: '2',
      date: new Date('2024-06-15'),
      type: 'payment',
      title: 'Q2 Estimated Tax',
      description: 'Predicted payment based on YTD income',
      status: 'pending',
      isPredicted: true,
      metadata: { revenue: 4500 }
    }
  ]}
  metrics={{
    totalEngagements: 47,
    avgResponseTime: 2.3,
    clientSatisfaction: 4.8,
    revenueYTD: 127000,
    documentsProcessed: 234,
    lastContact: new Date('2024-03-20')
  }}
  onEventClick={(event) => {
    router.push(`/clients/${clientId}/events/${event.id}`);
  }}
/>
```

**Timeline Controls:**
```typescript
type TimelineScale = 'day' | 'week' | 'month' | 'quarter' | 'year';
type EventFilter = 'all' | 'tax' | 'audit' | 'advisory' | 'communication';
```

---

## 5. Visual Compliance Dashboard

### Component: `VisualComplianceDashboard`

**Import:**
```typescript
import { VisualComplianceDashboard } from '@/components/compliance/VisualComplianceDashboard';
```

**Props:**
```typescript
interface VisualComplianceDashboardProps {
  organizationId: string;
  score: ComplianceScore;
  risks: ComplianceRisk[];
  actionItems: ActionItem[];
  updates: RegulatoryUpdate[];
  auditTrail: AuditTrailMetrics;
}

interface ComplianceScore {
  overall: number; // 0-100
  sox: number;
  gaap: number;
  dataPrivacy: number;
  auditReadiness: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface ComplianceRisk {
  id: string;
  category: 'data_privacy' | 'financial_reporting' | 'access_controls' | 'audit_trail';
  area: 'client_data' | 'documents' | 'reports' | 'users';
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-10
  description: string;
  recommendation: string;
}
```

**Usage Example:**
```tsx
<VisualComplianceDashboard
  organizationId="org-123"
  score={{
    overall: 92,
    sox: 95,
    gaap: 94,
    dataPrivacy: 87,
    auditReadiness: 96,
    trend: 'up',
    trendPercentage: 3
  }}
  risks={[
    {
      id: 'risk-1',
      category: 'data_privacy',
      area: 'documents',
      level: 'medium',
      score: 5,
      description: 'Document retention policy requires update',
      recommendation: 'Update policy for CCPA compliance'
    }
  ]}
  actionItems={[...]}
  updates={[...]}
  auditTrail={{
    totalEvents: 1247394,
    eventsThisMonth: 52847,
    integrityStatus: 'verified',
    lastAudit: new Date('2024-03-01'),
    nextAudit: new Date('2024-09-01'),
    violations: 0
  }}
/>
```

**Risk Matrix:**
```typescript
// Risk levels by score
0-3: 'low'     // 🟢 Low Risk
4-6: 'medium'  // 🟡 Medium Risk
7-9: 'high'    // 🟠 High Risk
10:  'critical' // 🔴 Critical Risk
```

---

## 6. Proactive Error Prevention

### Component: `ProactiveErrorPrevention`

**Import:**
```typescript
import { ProactiveErrorPrevention } from '@/components/forms/ProactiveErrorPrevention';
```

**Props:**
```typescript
interface ProactiveErrorPreventionProps {
  formId: string;
  formType: 'tax_return' | 'invoice' | 'expense_report' | 'financial_statement';
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onSave: (values: Record<string, any>) => Promise<void>;
}
```

**Usage Example:**
```tsx
<ProactiveErrorPrevention
  formId="form-123"
  formType="tax_return"
  initialValues={{
    line1a: 427350,
    line1b: 0,
    line1c: 427350,
    officerComp: 285000,
    totalRevenue: 427350
  }}
  onSubmit={async (values) => {
    await api.taxReturns.submit(values);
    router.push('/dashboard/tax-returns');
  }}
  onSave={async (values) => {
    await api.taxReturns.saveDraft(values);
    showNotification('Draft saved');
  }}
/>
```

**Validation Rules:**
```typescript
interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'calculation' | 'consistency' | 'anomaly';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autoFix?: () => void;
}

interface FieldValidation {
  fieldName: string;
  value: any;
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  suggestions: ValidationRule[];
  confidence: number; // AI confidence 0-1
  historicalContext?: {
    lastYearValue?: any;
    typicalRange?: [number, number];
    anomalyScore?: number;
  };
}
```

**Real-time Validation:**
```typescript
// Automatic validation triggered on field change
// Debounced by 500ms to avoid excessive API calls

// Validation categories:
- Calculation errors (math doesn't add up)
- Anomaly detection (unusual values)
- Historical comparison (YoY changes)
- Industry benchmarks (peer comparison)
- IRS scrutiny prediction (high-risk areas)
```

---

## Common Patterns

### Error Handling
```typescript
try {
  await component.action();
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationErrors(error.errors);
  } else if (error instanceof APIError) {
    showErrorNotification(error.message);
  } else {
    captureException(error);
    showGenericError();
  }
}
```

### Loading States
```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  loadData().finally(() => setIsLoading(false));
}, []);

if (isLoading) return <LoadingSkeleton />;
```

### Accessibility
```typescript
// All components support:
- Keyboard navigation (Tab, Arrow, Enter, Esc)
- Screen readers (ARIA labels)
- Focus management
- Color contrast (WCAG 2.1 AA)
- Motion reduction (prefers-reduced-motion)
```

### Mobile Responsiveness
```typescript
// Breakpoints
sm: '640px'   // Large phones
md: '768px'   // Tablets
lg: '1024px'  // Laptops
xl: '1280px'  // Desktops

// All components are mobile-first
// Test on actual devices for best results
```

---

## Performance Optimization

### Code Splitting
```typescript
// Lazy load components
const Dashboard = lazy(() => import('@/components/dashboard/ContextAwareDashboard'));

// Use with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <Dashboard {...props} />
</Suspense>
```

### Memoization
```typescript
// Expensive computations
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callback functions
const memoizedCallback = useCallback(() => {
  doSomething(data);
}, [data]);
```

### Virtual Scrolling
```typescript
// For long lists (1000+ items)
import { VirtualList } from 'react-virtual';

<VirtualList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {(virtualRow) => <MessageItem message={messages[virtualRow.index]} />}
</VirtualList>
```

---

## Testing

### Unit Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('dashboard renders with correct data', () => {
  render(<ContextAwareDashboard context={mockContext} />);
  expect(screen.getByText('Priority Actions')).toBeInTheDocument();
});
```

### Integration Tests
```typescript
test('document processing workflow', async () => {
  const { getByText, getByRole } = render(
    <DocumentProcessingPipeline {...mockProps} />
  );

  await waitFor(() => {
    expect(getByText('OCR Results')).toBeInTheDocument();
  });

  await userEvent.click(getByRole('button', { name: /approve/i }));

  expect(mockOnComplete).toHaveBeenCalled();
});
```

---

## Migration Guide

### From v0.x to v1.0
```typescript
// Old (v0.x)
<Dashboard userId="123" />

// New (v1.0)
<ContextAwareDashboard
  context={{
    userId: '123',
    role: 'cpa',
    currentSeason: 'normal',
    workloadCapacity: 75,
    upcomingDeadlines: 5
  }}
/>
```

---

## Support

**Documentation:** `/docs/api/ui-components-api.md`
**Examples:** `/examples/ui-components/`
**Storybook:** `npm run storybook`
**Issues:** https://github.com/AdvisorOS/advisoros/issues

---

**Version:** 1.0.0
**Last Updated:** March 23, 2024