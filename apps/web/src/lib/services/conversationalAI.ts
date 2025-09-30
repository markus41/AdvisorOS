/**
 * Conversational AI Service
 * Natural Language Processing for client portal interactions
 */

export interface DetectedIntent {
  intent: 'upload_document' | 'check_status' | 'ask_question' | 'schedule_meeting' | 'view_invoice' | 'pay_bill' | 'general_inquiry';
  confidence: number; // 0-1
  parameters: Record<string, any>;
}

export interface ExtractedEntity {
  type: 'document_type' | 'tax_year' | 'amount' | 'date' | 'person' | 'organization';
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface ConversationContext {
  clientId: string;
  conversationHistory: ConversationMessage[];
  clientProfile: ClientProfile;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: DetectedIntent;
  entities?: ExtractedEntity[];
}

export interface ClientProfile {
  name: string;
  taxYear: number;
  documentsNeeded: string[];
  recentActivity: string[];
  preferences: {
    communicationStyle: 'formal' | 'casual';
    timezone: string;
  };
}

export interface AIResponse {
  message: string;
  intent: DetectedIntent;
  entities: ExtractedEntity[];
  actions?: ActionButton[];
  requiresHumanCPA: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
}

export class ConversationalAIService {
  private readonly intentPatterns: Record<string, RegExp[]> = {
    upload_document: [
      /upload/i,
      /send/i,
      /attach/i,
      /w-?2/i,
      /1099/i,
      /document/i,
      /file/i,
      /photo/i,
      /picture/i,
    ],
    check_status: [
      /status/i,
      /where.*my/i,
      /when.*due/i,
      /deadline/i,
      /filed/i,
      /refund/i,
      /progress/i,
      /how.*going/i,
    ],
    schedule_meeting: [
      /meet/i,
      /schedule/i,
      /appointment/i,
      /call/i,
      /talk.*cpa/i,
      /available/i,
      /book/i,
    ],
    view_invoice: [
      /invoice/i,
      /bill/i,
      /balance/i,
      /owe/i,
      /payment/i,
      /cost/i,
      /price/i,
      /fee/i,
    ],
    pay_bill: [
      /pay/i,
      /payment/i,
      /charge/i,
      /credit.*card/i,
      /bank/i,
    ],
    ask_question: [
      /what.*is/i,
      /how.*do/i,
      /why/i,
      /can.*i/i,
      /question/i,
      /help.*with/i,
      /explain/i,
    ],
  };

  private readonly documentTypes = [
    'W-2',
    'W-4',
    '1099',
    '1099-INT',
    '1099-DIV',
    '1099-MISC',
    'Schedule C',
    'Schedule K-1',
    '1040',
    '1120',
    'mortgage statement',
    'property tax',
    'charitable donation',
    'receipt',
  ];

  /**
   * Process user message and generate AI response
   */
  async processUserMessage(
    message: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    // Step 1: Detect intent
    const intent = this.detectIntent(message);

    // Step 2: Extract entities
    const entities = this.extractEntities(message);

    // Step 3: Generate contextual response
    const response = await this.generateResponse(intent, entities, context);

    // Step 4: Generate action buttons
    const actions = this.generateActions(intent, entities, context);

    // Step 5: Determine if human CPA is needed
    const requiresHumanCPA = this.shouldEscalateToCPA(intent, message, context);

    return {
      message: response,
      intent,
      entities,
      actions,
      requiresHumanCPA,
    };
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): DetectedIntent {
    const lowerMessage = message.toLowerCase();
    let maxScore = 0;
    let detectedIntent = 'general_inquiry';

    // Check each intent pattern
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(lowerMessage)) {
          score++;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    // Calculate confidence based on pattern matches
    const confidence = Math.min(maxScore * 0.2 + 0.5, 1.0);

    return {
      intent: detectedIntent as DetectedIntent['intent'],
      confidence,
      parameters: {},
    };
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extract document types
    for (const docType of this.documentTypes) {
      const regex = new RegExp(`\\b${docType.replace(/[-\/]/g, '[-\\/]?')}\\b`, 'gi');
      const match = regex.exec(message);
      if (match) {
        entities.push({
          type: 'document_type',
          value: docType,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Extract tax years
    const yearPattern = /\b(20\d{2}|'\d{2})\b/g;
    let yearMatch;
    while ((yearMatch = yearPattern.exec(message)) !== null) {
      let year = yearMatch[1];
      if (year.startsWith("'")) {
        year = '20' + year.slice(1);
      }
      entities.push({
        type: 'tax_year',
        value: year,
        startIndex: yearMatch.index,
        endIndex: yearMatch.index + yearMatch[0].length,
      });
    }

    // Extract amounts
    const amountPattern = /\$[\d,]+(?:\.\d{2})?/g;
    let amountMatch;
    while ((amountMatch = amountPattern.exec(message)) !== null) {
      entities.push({
        type: 'amount',
        value: amountMatch[0],
        startIndex: amountMatch.index,
        endIndex: amountMatch.index + amountMatch[0].length,
      });
    }

    // Extract dates
    const datePattern = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,\s*\d{4})?\b/gi;
    let dateMatch;
    while ((dateMatch = datePattern.exec(message)) !== null) {
      entities.push({
        type: 'date',
        value: dateMatch[0],
        startIndex: dateMatch.index,
        endIndex: dateMatch.index + dateMatch[0].length,
      });
    }

    return entities;
  }

  /**
   * Generate contextual response based on intent
   */
  private async generateResponse(
    intent: DetectedIntent,
    entities: ExtractedEntity[],
    context: ConversationContext
  ): Promise<string> {
    const { clientProfile } = context;
    const isCasual = clientProfile.preferences.communicationStyle === 'casual';

    switch (intent.intent) {
      case 'upload_document':
        return this.generateUploadResponse(entities, clientProfile, isCasual);

      case 'check_status':
        return this.generateStatusResponse(entities, clientProfile, isCasual);

      case 'schedule_meeting':
        return this.generateScheduleResponse(isCasual);

      case 'view_invoice':
        return this.generateInvoiceResponse(isCasual);

      case 'pay_bill':
        return this.generatePaymentResponse(isCasual);

      case 'ask_question':
        return this.generateQuestionResponse(entities, isCasual);

      default:
        return this.generateDefaultResponse(isCasual);
    }
  }

  private generateUploadResponse(
    entities: ExtractedEntity[],
    profile: ClientProfile,
    casual: boolean
  ): string {
    const documentType = entities.find((e) => e.type === 'document_type')?.value || 'document';
    const taxYear = entities.find((e) => e.type === 'tax_year')?.value || profile.taxYear;

    if (casual) {
      return `Great! I'll help you upload your ${documentType} for ${taxYear}. You can take a photo or choose a file from your device.`;
    } else {
      return `I'd be happy to assist you with uploading your ${documentType} for tax year ${taxYear}. Please select your preferred upload method below.`;
    }
  }

  private generateStatusResponse(
    entities: ExtractedEntity[],
    profile: ClientProfile,
    casual: boolean
  ): string {
    if (casual) {
      return `Let me check your current status! One moment...`;
    } else {
      return `I will retrieve your current tax return status. Please allow me a moment to gather this information.`;
    }
  }

  private generateScheduleResponse(casual: boolean): string {
    if (casual) {
      return `I'd be happy to help you schedule a meeting with your CPA! What day works best for you?`;
    } else {
      return `I would be pleased to assist you in scheduling a consultation with your CPA. May I suggest some available time slots?`;
    }
  }

  private generateInvoiceResponse(casual: boolean): string {
    if (casual) {
      return `Let me pull up your invoice information...`;
    } else {
      return `I will retrieve your current billing information and invoices.`;
    }
  }

  private generatePaymentResponse(casual: boolean): string {
    if (casual) {
      return `Sure! Let me help you make a payment.`;
    } else {
      return `I would be pleased to assist you with processing a payment. Let me retrieve your current balance.`;
    }
  }

  private generateQuestionResponse(entities: ExtractedEntity[], casual: boolean): string {
    if (casual) {
      return `Great question! Let me help you with that. For complex tax questions, I can connect you with your CPA directly.`;
    } else {
      return `Thank you for your inquiry. I will do my best to assist you. For detailed tax advice, I recommend scheduling a consultation with your CPA.`;
    }
  }

  private generateDefaultResponse(casual: boolean): string {
    if (casual) {
      return `I'm here to help! You can ask me about:\n\n• Uploading documents\n• Tax return status\n• Invoices and payments\n• Scheduling meetings\n• General tax questions`;
    } else {
      return `I am available to assist you with various tasks including document uploads, status inquiries, invoice management, appointment scheduling, and answering general questions. How may I help you today?`;
    }
  }

  /**
   * Generate action buttons based on intent
   */
  private generateActions(
    intent: DetectedIntent,
    entities: ExtractedEntity[],
    context: ConversationContext
  ): ActionButton[] {
    const actions: ActionButton[] = [];

    switch (intent.intent) {
      case 'upload_document':
        actions.push(
          { id: 'camera', label: '📷 Take Photo', action: 'open_camera' },
          { id: 'file', label: '📁 Choose File', action: 'open_file_picker' },
          { id: 'manual', label: '📋 Manual Entry', action: 'open_manual_entry' }
        );
        break;

      case 'check_status':
        actions.push(
          { id: 'details', label: 'View Details', action: 'view_tax_return_details' },
          { id: 'timeline', label: 'View Timeline', action: 'view_timeline' }
        );
        break;

      case 'schedule_meeting':
        actions.push(
          { id: 'calendar', label: '📅 View Available Times', action: 'open_calendar' },
          { id: 'request', label: 'Request Specific Time', action: 'open_meeting_request' }
        );
        break;

      case 'view_invoice':
        actions.push(
          { id: 'view', label: 'View Invoices', action: 'open_invoices' },
          { id: 'download', label: 'Download PDF', action: 'download_invoice' }
        );
        break;

      case 'pay_bill':
        actions.push(
          { id: 'pay', label: 'Pay Now', action: 'open_payment' },
          { id: 'setup', label: 'Setup Auto-Pay', action: 'setup_autopay' }
        );
        break;
    }

    return actions;
  }

  /**
   * Determine if the query should be escalated to a human CPA
   */
  private shouldEscalateToCPA(
    intent: DetectedIntent,
    message: string,
    context: ConversationContext
  ): boolean {
    // Low confidence requires human review
    if (intent.confidence < 0.6) {
      return true;
    }

    // Complex tax questions
    const complexKeywords = [
      'complicated',
      'complex',
      'specific',
      'detailed advice',
      'tax strategy',
      'tax planning',
      'deduction',
      'audit',
      'irs notice',
      'amendment',
    ];

    const lowerMessage = message.toLowerCase();
    if (complexKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return true;
    }

    // Multiple failed attempts in conversation history
    const recentMessages = context.conversationHistory.slice(-5);
    const failedAttempts = recentMessages.filter(
      (m) => m.role === 'user' && m.content.toLowerCase().includes('not what i meant')
    );
    if (failedAttempts.length >= 2) {
      return true;
    }

    return false;
  }

  /**
   * Learn from user feedback to improve intent detection
   */
  async recordFeedback(
    messageId: string,
    predictedIntent: string,
    actualIntent: string,
    helpful: boolean
  ): Promise<void> {
    // In production, this would update ML model with user feedback
    console.log('Feedback recorded:', {
      messageId,
      predictedIntent,
      actualIntent,
      helpful,
      timestamp: new Date(),
    });

    // TODO: Send to analytics service for model retraining
  }

  /**
   * Suggest smart replies based on context
   */
  generateSmartReplies(context: ConversationContext): string[] {
    const { clientProfile } = context;
    const replies: string[] = [];

    // Suggest based on documents needed
    if (clientProfile.documentsNeeded.length > 0) {
      replies.push(`Upload my ${clientProfile.documentsNeeded[0]}`);
    }

    // Common queries
    replies.push('When is my tax due?');
    replies.push('What do I owe?');
    replies.push('Schedule a meeting');

    return replies.slice(0, 3);
  }
}

// Singleton instance
export const conversationalAI = new ConversationalAIService();