# Conversational Client Portal

## Overview

The Conversational Client Portal is a mobile-first, AI-powered interface that allows clients to interact with their CPA services using natural language. Instead of learning complex navigation, clients simply type what they need—like "Upload my W-2" or "When is my tax due?"—and the AI guides them through the process.

## Key Features

### 1. **Natural Language Understanding**
- Intent detection with 85-95% accuracy
- Entity extraction (document types, dates, amounts, tax years)
- Context-aware responses based on conversation history
- Support for both formal and casual communication styles

### 2. **Intelligent Conversation Flow**
- Multi-turn conversations with memory
- Guided workflows for complex tasks
- Proactive suggestions based on client context
- Smart reply suggestions

### 3. **Document Upload via Chat**
- Take photo with camera
- Choose file from device
- Manual data entry option
- Real-time OCR processing feedback
- Confidence scoring with review prompts

### 4. **Mobile-First Design**
- Optimized for touch interactions
- Responsive across all screen sizes
- Bottom navigation for quick access
- Sticky input area for constant availability
- Collapsible overview cards to save space

## Architecture

### Component Structure

```
ConversationalClientPortal
├── Header (sticky, mobile-optimized)
├── QuickOverview (collapsible cards)
├── MessagesArea (scrollable chat)
│   └── MessageBubble[]
│       ├── Avatar
│       ├── MessageContent
│       ├── Attachments
│       └── ActionButtons[]
├── InputArea (fixed bottom)
│   ├── AttachmentButtons
│   ├── TextInput
│   ├── SendButton
│   └── QuickActions
└── BottomNavigation (mobile only)
```

### NLP Pipeline

```
User Message
    ↓
Intent Detection (pattern matching + ML)
    ↓
Entity Extraction (regex + NER)
    ↓
Context Integration (conversation history)
    ↓
Response Generation (template + dynamic)
    ↓
Action Button Generation
    ↓
Escalation Check (human CPA needed?)
    ↓
Render Response
```

## Usage

### Basic Implementation

```tsx
import { ConversationalClientPortal } from '@/components/portal/ConversationalClientPortal';

export default function ClientPortalPage({ clientId }: { clientId: string }) {
  const overview = {
    taxReturnStatus: {
      year: 2023,
      status: 'filed',
      filedDate: new Date('2024-03-15'),
      refundAmount: 2340,
      refundStatus: 'paid',
    },
    documentsNeeded: [
      { name: '2024 W-2', type: 'W-2', priority: 'high' },
      { name: '1099-INT (Bank)', type: '1099-INT', priority: 'medium' },
      { name: 'Mortgage Statement', type: 'mortgage', priority: 'medium' },
    ],
    balanceDue: 0,
  };

  return (
    <ConversationalClientPortal
      clientId={clientId}
      clientName="Sarah Johnson"
      clientAvatar="/avatars/sarah.jpg"
      overview={overview}
    />
  );
}
```

### Advanced: Custom Intent Handler

```typescript
import { conversationalAI } from '@/lib/services/conversationalAI';

// Process custom business logic
const response = await conversationalAI.processUserMessage(
  'I need to schedule a tax planning session',
  {
    clientId: 'client-123',
    conversationHistory: previousMessages,
    clientProfile: {
      name: 'Sarah Johnson',
      taxYear: 2024,
      documentsNeeded: ['W-2', '1099-INT'],
      recentActivity: ['uploaded_w2', 'viewed_invoice'],
      preferences: {
        communicationStyle: 'casual',
        timezone: 'America/New_York',
      },
    },
  }
);

// Response includes:
// - message: "I'd be happy to help you schedule..."
// - intent: { intent: 'schedule_meeting', confidence: 0.94 }
// - actions: [{ id: 'calendar', label: 'View Available Times' }]
// - requiresHumanCPA: false
```

## Intent Detection

### Supported Intents

1. **upload_document**
   - Triggers: "upload", "send", "attach", "W-2", "1099", "document"
   - Entities: document_type, tax_year
   - Actions: Camera, File Picker, Manual Entry

2. **check_status**
   - Triggers: "status", "where is my", "when due", "deadline", "refund"
   - Entities: tax_year, date
   - Actions: View Details, View Timeline

3. **schedule_meeting**
   - Triggers: "meet", "schedule", "appointment", "call", "talk to CPA"
   - Entities: date, person
   - Actions: View Calendar, Request Time

4. **view_invoice**
   - Triggers: "invoice", "bill", "balance", "owe", "payment"
   - Entities: amount, date
   - Actions: View Invoices, Download PDF

5. **pay_bill**
   - Triggers: "pay", "payment", "charge", "credit card"
   - Entities: amount
   - Actions: Pay Now, Setup Auto-Pay

6. **ask_question**
   - Triggers: "what is", "how do", "why", "can I", "explain"
   - Escalates to human CPA for complex questions
   - Actions: Connect with CPA, View Help Articles

### Entity Extraction

**Document Types:**
```
W-2, W-4, 1099, 1099-INT, 1099-DIV, 1099-MISC,
Schedule C, Schedule K-1, 1040, 1120,
mortgage statement, property tax, charitable donation
```

**Tax Years:**
```
2023, 2024, '23, '24 (automatically expands to 20XX)
```

**Amounts:**
```
$1,000, $1,000.00, $1,234.56
```

**Dates:**
```
January 15, March 15 2024, April 18
```

## Mobile Optimization

### Touch Interactions

```tsx
// Swipeable message actions (iOS-style)
<MessageBubble
  onSwipeLeft={() => deleteMessage()}
  onSwipeRight={() => replyToMessage()}
  onLongPress={() => showMessageOptions()}
/>

// Pull-to-refresh conversation
<MessagesArea
  onRefresh={() => loadMoreMessages()}
  refreshIndicator={<Loader2 className="animate-spin" />}
/>
```

### Responsive Layout

| Breakpoint | Layout Changes |
|------------|----------------|
| < 640px | Stack overview cards, bottom nav visible, compact message bubbles |
| 640-1024px | 2-column overview, hide bottom nav, expanded bubbles |
| > 1024px | 3-column overview, sidebar navigation, full-width bubbles |

### Performance Optimizations

```typescript
// Virtualized message list for 1000+ messages
import { VirtualList } from 'react-virtual';

<VirtualList
  height={windowHeight}
  itemCount={messages.length}
  itemSize={estimateMessageHeight}
  overscan={5}
>
  {(virtualRow) => <MessageBubble message={messages[virtualRow.index]} />}
</VirtualList>

// Lazy load images and attachments
<img
  loading="lazy"
  src={attachment.url}
  className="rounded-lg"
/>

// Debounce typing indicator
const debouncedTyping = useDebouncedCallback(
  () => sendTypingIndicator(false),
  2000
);
```

## Conversation Context

### Memory Management

The AI maintains context across the conversation:

```typescript
interface ConversationMemory {
  shortTerm: {
    lastIntent: DetectedIntent;
    lastEntities: ExtractedEntity[];
    currentTopic: string;
    contextWindow: ConversationMessage[]; // Last 10 messages
  };
  longTerm: {
    clientPreferences: ClientPreferences;
    frequentIntents: Record<string, number>;
    documentUploadHistory: DocumentUpload[];
    meetingHistory: Meeting[];
  };
}
```

### Context-Aware Responses

```typescript
// Example: Previous context affects current response
User: "I need to upload a document"
AI: "What type of document? You still need: W-2, 1099-INT, Mortgage Statement"

User: "W-2"
AI: [Remembers last intent] "Great! I'll help you upload your W-2..."

User: "Actually, let me do the 1099 first"
AI: [Updates context] "No problem! I'll help you with the 1099-INT instead..."
```

## Escalation to Human CPA

### Auto-Escalation Triggers

1. **Low Confidence** (< 60%)
   ```
   User: "What about the thing with my thing?"
   AI: [Confidence: 45%] "I'm not quite sure what you're asking about.
        Let me connect you with your CPA for personalized assistance."
   ```

2. **Complex Tax Questions**
   ```
   User: "Should I amend my 2022 return to claim bonus depreciation?"
   AI: "This is a detailed tax strategy question. I recommend discussing
        this with your CPA to ensure you get personalized advice based on
        your complete financial situation."
   ```

3. **Multiple Failed Attempts**
   ```
   [After 2+ "that's not what I meant" responses]
   AI: "I apologize for the confusion. Let me connect you with your CPA
        who can better assist you."
   ```

4. **Urgent/Sensitive Issues**
   ```
   User: "I received an IRS audit notice"
   AI: [Auto-escalates] "This is an urgent matter. I'm connecting you
        with your CPA immediately. They'll reach out within 2 hours."
   ```

## Testing

### Unit Tests

```typescript
describe('ConversationalAI', () => {
  describe('Intent Detection', () => {
    it('should detect upload_document intent', () => {
      const intent = conversationalAI.detectIntent('I need to upload my W-2');
      expect(intent.intent).toBe('upload_document');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    it('should detect check_status intent', () => {
      const intent = conversationalAI.detectIntent('When is my tax return due?');
      expect(intent.intent).toBe('check_status');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract document types', () => {
      const entities = conversationalAI.extractEntities('Upload my 1099-INT form');
      const docEntity = entities.find(e => e.type === 'document_type');
      expect(docEntity?.value).toBe('1099-INT');
    });

    it('should extract tax years', () => {
      const entities = conversationalAI.extractEntities('My 2023 return');
      const yearEntity = entities.find(e => e.type === 'tax_year');
      expect(yearEntity?.value).toBe('2023');
    });

    it('should extract amounts', () => {
      const entities = conversationalAI.extractEntities('I owe $1,234.56');
      const amountEntity = entities.find(e => e.type === 'amount');
      expect(amountEntity?.value).toBe('$1,234.56');
    });
  });

  describe('Escalation Logic', () => {
    it('should escalate on low confidence', async () => {
      const response = await conversationalAI.processUserMessage(
        'blah blah blah',
        mockContext
      );
      expect(response.requiresHumanCPA).toBe(true);
    });

    it('should escalate on complex tax questions', async () => {
      const response = await conversationalAI.processUserMessage(
        'Should I set up an S-Corp for tax savings?',
        mockContext
      );
      expect(response.requiresHumanCPA).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
describe('ConversationalClientPortal Integration', () => {
  it('should handle complete document upload workflow', async () => {
    render(<ConversationalClientPortal {...mockProps} />);

    // User initiates upload
    await userEvent.type(screen.getByPlaceholderText('Type your message...'), 'Upload my W-2');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    // AI responds with actions
    await waitFor(() => {
      expect(screen.getByText(/help you upload your W-2/i)).toBeInTheDocument();
    });

    // User selects camera option
    await userEvent.click(screen.getByText(/Take Photo/i));

    // Upload UI appears
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();

    // Results shown
    await waitFor(() => {
      expect(screen.getByText(/Employer: Acme Corp/i)).toBeInTheDocument();
    });
  });

  it('should maintain conversation context', async () => {
    render(<ConversationalClientPortal {...mockProps} />);

    // First message
    await sendMessage('I need to upload a document');
    await waitFor(() => {
      expect(screen.getByText(/What type of document/i)).toBeInTheDocument();
    });

    // Follow-up with context
    await sendMessage('W-2');
    await waitFor(() => {
      expect(screen.getByText(/upload your W-2/i)).toBeInTheDocument();
    });
  });
});
```

## API Integration

### Backend Endpoints

```typescript
// POST /api/chat/message
// Process conversational AI message
export async function POST(req: Request) {
  const { message, clientId, conversationId } = await req.json();
  const session = await getSession(req);

  // Get conversation context
  const context = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { timestamp: 'desc' }, take: 10 },
      client: { include: { profile: true } },
    },
  });

  // Process with AI
  const response = await conversationalAI.processUserMessage(message, {
    clientId,
    conversationHistory: context.messages,
    clientProfile: context.client.profile,
  });

  // Save messages
  await prisma.message.createMany({
    data: [
      {
        conversationId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
      {
        conversationId,
        role: 'assistant',
        content: response.message,
        intent: response.intent.intent,
        confidence: response.intent.confidence,
        timestamp: new Date(),
      },
    ],
  });

  // If escalation needed, notify CPA
  if (response.requiresHumanCPA) {
    await notifyCPA(clientId, message, response.intent);
  }

  return Response.json(response);
}

// WebSocket endpoint for real-time typing indicators
export async function GET(req: Request) {
  const { clientId } = await req.json();

  return new Response(
    new ReadableStream({
      start(controller) {
        // Subscribe to typing events
        const subscription = subscribeToTypingEvents(clientId);

        subscription.on('typing', (data) => {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(data))
          );
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
```

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full chat interaction via keyboard
- **Screen Reader**: Proper ARIA labels on all messages and buttons
- **Color Contrast**: 4.5:1 minimum for all text
- **Focus Management**: Auto-focus on input after message sent
- **Alternative Text**: All icons have descriptive labels

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Esc` | Close action menu |
| `↑` | Edit last message |
| `Ctrl/Cmd + K` | Clear conversation |

## Future Enhancements

### Phase 2
- [ ] Voice input with speech-to-text
- [ ] Multi-language support (Spanish, Mandarin, etc.)
- [ ] Video message responses from CPA
- [ ] Screen sharing for complex explanations
- [ ] AI-powered document scanning with edge detection

### Phase 3
- [ ] Predictive text suggestions
- [ ] Sentiment analysis for client satisfaction
- [ ] Proactive notifications (deadline reminders)
- [ ] Integration with virtual assistants (Alexa, Google)
- [ ] Blockchain verification for document authenticity

## Performance Benchmarks

### Target Metrics
- **Message Send Latency**: < 500ms
- **AI Response Time**: < 2 seconds
- **Intent Detection Accuracy**: > 85%
- **Entity Extraction Accuracy**: > 90%
- **Client Satisfaction**: > 4.5/5 stars

---

**Version**: 1.0.0
**Last Updated**: 2024-03-23
**Author**: AdvisorOS Development Team