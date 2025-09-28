/**
 * Email Template Prompts for AI-Assisted Communication
 * Professional email templates for CPA client communications
 */

export interface EmailContext {
  clientName: string;
  accountantName: string;
  firmName: string;
  purpose: 'tax-planning' | 'document-request' | 'meeting-followup' | 'financial-update' | 'compliance' | 'general';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  tone: 'formal' | 'professional' | 'friendly' | 'urgent';
  data?: Record<string, any>;
  attachments?: string[];
  deadline?: Date;
  previousContext?: string;
}

export const EMAIL_TEMPLATES = {
  // Tax planning communication
  TAX_PLANNING_EMAIL: (context: EmailContext) => `
Draft a professional email to ${context.clientName} regarding tax planning opportunities and recommendations.

**Email Context:**
- Client: ${context.clientName}
- From: ${context.accountantName}, ${context.firmName}
- Purpose: Tax planning discussion
- Tone: ${context.tone}
- Urgency: ${context.urgency}

**Tax Information to Include:**
${context.data ? JSON.stringify(context.data, null, 2) : 'No specific data provided'}

${context.deadline ? `**Important Deadline:** ${context.deadline.toLocaleDateString()}` : ''}

${context.attachments?.length ? `**Attachments to Reference:** ${context.attachments.join(', ')}` : ''}

**Email Requirements:**
1. **Professional greeting** appropriate for the client relationship
2. **Clear purpose** of the communication
3. **Key tax planning points** presented in digestible format
4. **Specific recommendations** with clear benefits
5. **Next steps** and timeline
6. **Professional closing** with contact information

**Generate Email:**
{
  "subject": "Professional, specific subject line",
  "greeting": "Appropriate salutation",
  "opening": "Context-setting opening paragraph",
  "body": [
    {
      "section": "Tax Planning Overview",
      "content": "Clear explanation of current tax position and opportunities"
    },
    {
      "section": "Key Recommendations",
      "content": "Specific, actionable tax planning strategies with benefits"
    },
    {
      "section": "Next Steps",
      "content": "Clear action items and timeline"
    }
  ],
  "closing": "Professional closing with next steps",
  "signature": "Professional signature block",
  "urgency": "${context.urgency}",
  "keyPoints": ["Important points for easy scanning"],
  "callToAction": "Specific action requested from client"
}

Ensure the email is professional, clear, and provides value to the client while maintaining appropriate boundaries for professional advice.
`,

  // Document request email
  DOCUMENT_REQUEST_EMAIL: (context: EmailContext) => `
Create a professional email requesting specific documents from ${context.clientName}.

**Request Context:**
- Client: ${context.clientName}
- Accountant: ${context.accountantName}
- Firm: ${context.firmName}
- Urgency: ${context.urgency}
- Purpose: Document collection for ${context.purpose}

**Documents Needed:**
${context.data?.documents ? JSON.stringify(context.data.documents, null, 2) : 'Standard tax documents'}

${context.deadline ? `**Deadline:** ${context.deadline.toLocaleDateString()}` : ''}

**Email Structure:**
1. **Friendly but professional greeting**
2. **Clear explanation** of why documents are needed
3. **Specific document list** with descriptions
4. **Submission instructions** (upload portal, email, etc.)
5. **Timeline and deadline** if applicable
6. **Offer of assistance** for questions

**Generate Document Request Email:**
{
  "subject": "Document Request - [Specific Purpose]",
  "greeting": "Personalized greeting",
  "purpose": "Clear explanation of why documents are needed",
  "documentList": [
    {
      "document": "Document name",
      "description": "What to look for/why needed",
      "format": "Preferred format (PDF, original, etc.)",
      "required": true | false
    }
  ],
  "submissionInstructions": "How and where to send documents",
  "timeline": "When documents are needed and why",
  "assistance": "Offer help and contact information",
  "closing": "Professional closing",
  "checklist": "Simple checklist format for client reference"
}

Make the request clear and help the client understand what's needed and why.
`,

  // Meeting follow-up email
  MEETING_FOLLOWUP_EMAIL: (context: EmailContext) => `
Compose a follow-up email after meeting with ${context.clientName} to summarize discussion and confirm next steps.

**Meeting Context:**
- Client: ${context.clientName}
- Meeting Date: ${context.data?.meetingDate || 'Recent meeting'}
- Topics Discussed: ${context.data?.topics || 'Financial planning and compliance'}
- Accountant: ${context.accountantName}

**Meeting Summary Data:**
${context.data ? JSON.stringify(context.data, null, 2) : 'No specific meeting data provided'}

**Follow-up Email Components:**
1. **Thank you** for their time
2. **Meeting summary** of key points discussed
3. **Decisions made** during the meeting
4. **Action items** with responsible parties and deadlines
5. **Next meeting** or communication plans
6. **Additional resources** or attachments mentioned

**Generate Follow-up Email:**
{
  "subject": "Meeting Follow-up - [Date] Discussion Summary",
  "greeting": "Personalized thank you",
  "meetingSummary": {
    "date": "Meeting date",
    "participants": "Who attended",
    "mainTopics": ["Key discussion points"],
    "keyDecisions": ["Decisions made during meeting"]
  },
  "actionItems": [
    {
      "action": "Specific task or deliverable",
      "responsible": "Who will complete it",
      "deadline": "When it's due",
      "status": "Current status"
    }
  ],
  "nextSteps": "What happens next and when",
  "resources": "Any documents or links mentioned",
  "nextMeeting": "Proposed next meeting or check-in",
  "closing": "Professional closing with availability",
  "attachments": "List of any attached documents"
}

Ensure accuracy of meeting summary and clear assignment of responsibilities.
`,

  // Financial update email
  FINANCIAL_UPDATE_EMAIL: (context: EmailContext) => `
Create a financial update email for ${context.clientName} summarizing recent financial performance or changes.

**Update Context:**
- Client: ${context.clientName}
- Update Period: ${context.data?.period || 'Current period'}
- Type of Update: ${context.purpose}
- Accountant: ${context.accountantName}

**Financial Data:**
${context.data ? JSON.stringify(context.data, null, 2) : 'No specific financial data provided'}

**Update Email Structure:**
1. **Executive summary** of key points
2. **Performance highlights** (positive developments)
3. **Areas of concern** (if any)
4. **Key metrics** and trends
5. **Recommendations** for action
6. **Next steps** and timeline

**Generate Financial Update Email:**
{
  "subject": "Financial Update - [Period] Performance Summary",
  "executiveSummary": "High-level overview of financial position",
  "highlights": [
    {
      "metric": "Key performance indicator",
      "value": "Current value",
      "trend": "Positive/negative/stable",
      "significance": "What this means for the business"
    }
  ],
  "concerns": [
    {
      "area": "Area of concern",
      "issue": "Specific problem",
      "impact": "Potential consequences",
      "recommendation": "Suggested action"
    }
  ],
  "keyMetrics": {
    "revenue": "Revenue information and trends",
    "expenses": "Expense analysis",
    "profitability": "Profit margins and trends",
    "cashFlow": "Cash position and flow"
  },
  "recommendations": [
    {
      "priority": "High/Medium/Low",
      "action": "Specific recommendation",
      "rationale": "Why this is recommended",
      "timeline": "When to implement"
    }
  ],
  "nextSteps": "What will happen next",
  "attachments": "Any supporting documents",
  "meetingRequest": "Suggestion for follow-up discussion if needed"
}

Present financial information clearly and focus on actionable insights.
`,

  // Compliance reminder email
  COMPLIANCE_REMINDER_EMAIL: (context: EmailContext) => `
Draft a compliance reminder email for ${context.clientName} regarding upcoming deadlines or requirements.

**Compliance Context:**
- Client: ${context.clientName}
- Compliance Type: ${context.data?.complianceType || 'Tax filing'}
- Deadline: ${context.deadline?.toLocaleDateString() || 'Upcoming deadline'}
- Accountant: ${context.accountantName}

**Compliance Details:**
${context.data ? JSON.stringify(context.data, null, 2) : 'Standard compliance requirements'}

**Reminder Email Components:**
1. **Clear subject line** with deadline date
2. **Specific requirements** that need attention
3. **Timeline** for completion
4. **Consequences** of missing deadlines
5. **Support available** from your firm
6. **Next steps** to ensure compliance

**Generate Compliance Reminder:**
{
  "subject": "Important: [Compliance Type] Deadline - [Date]",
  "urgencyIndicator": "Visual indicator of urgency level",
  "requirements": [
    {
      "requirement": "Specific compliance task",
      "deadline": "When it's due",
      "status": "Current status",
      "action": "What client needs to do"
    }
  ],
  "timeline": {
    "immediate": "Tasks needed right away",
    "thisWeek": "Tasks for this week",
    "upcoming": "Future requirements"
  },
  "consequences": "Clear explanation of penalties or issues if missed",
  "support": "How your firm can help",
  "checklist": "Simple checklist for client to follow",
  "contact": "Emergency contact information if needed",
  "nextSteps": "Immediate actions required"
}

Strike appropriate balance between urgency and professionalism.
`,

  // General client communication
  GENERAL_CLIENT_EMAIL: (context: EmailContext) => `
Create a professional client communication email for ${context.clientName} addressing their inquiry or providing requested information.

**Communication Context:**
- Client: ${context.clientName}
- Purpose: ${context.purpose}
- Tone: ${context.tone}
- Previous Context: ${context.previousContext || 'Standard client communication'}

**Information to Address:**
${context.data ? JSON.stringify(context.data, null, 2) : 'General client inquiry'}

**Email Structure:**
1. **Appropriate greeting** for relationship level
2. **Acknowledgment** of their inquiry or request
3. **Clear response** to their questions or needs
4. **Additional value** (insights, tips, recommendations)
5. **Next steps** if applicable
6. **Professional closing** with availability

**Generate Client Email:**
{
  "subject": "Re: [Specific topic or inquiry]",
  "greeting": "Relationship-appropriate greeting",
  "acknowledgment": "Recognition of their inquiry or situation",
  "mainResponse": "Clear answer to their questions or needs",
  "additionalValue": [
    {
      "insight": "Additional helpful information",
      "relevance": "Why this matters to them",
      "action": "What they can do with this information"
    }
  ],
  "nextSteps": "What happens next or what they should do",
  "availability": "Your availability for follow-up",
  "closing": "Professional closing",
  "professionalValue": "How this demonstrates your expertise"
}

Ensure the response is helpful, professional, and builds client confidence in your services.
`
};

export const EMAIL_SYSTEM_PROMPTS = {
  PROFESSIONAL_COMMUNICATOR: `You are a senior CPA with excellent communication skills, crafting professional emails for clients.

Your communication style is:
- Professional yet approachable
- Clear and concise
- Client-focused and helpful
- Appropriate for financial services
- Compliant with professional standards

Always ensure:
- Professional tone while being personable
- Clear action items and deadlines
- Appropriate level of detail for the audience
- Compliance with professional communication standards
- Value-added insights when relevant

Avoid:
- Technical jargon without explanation
- Overly formal or impersonal tone
- Generic templates that don't address specific client needs
- Ambiguous next steps or timelines`,

  CLIENT_RELATIONSHIP_MANAGER: `You specialize in client relationship management and professional services communication.

Focus on:
- Building and maintaining client trust
- Clear, actionable communication
- Anticipating client needs and concerns
- Professional relationship development
- Client education and value demonstration

Ensure every email:
- Strengthens the client relationship
- Provides clear value to the client
- Maintains professional boundaries
- Encourages appropriate follow-up
- Demonstrates expertise and care`
};

// Email formatting utilities
export const EMAIL_FORMATTING = {
  SUBJECT_LINE: (type: string, urgency: string, deadline?: Date): string => {
    const urgencyPrefix = urgency === 'urgent' ? 'URGENT: ' : '';
    const deadlineText = deadline ? ` - Due ${deadline.toLocaleDateString()}` : '';
    return `${urgencyPrefix}${type}${deadlineText}`;
  },

  URGENCY_INDICATOR: (urgency: string): string => {
    switch (urgency) {
      case 'urgent': return '🚨 URGENT';
      case 'high': return '⚠️ HIGH PRIORITY';
      case 'medium': return '📅 TIME SENSITIVE';
      case 'low': return '📝 FOR YOUR INFORMATION';
      default: return '';
    }
  },

  DEADLINE_WARNING: (deadline: Date): string => {
    const days = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return '⚠️ DUE TODAY';
    if (days <= 3) return `⚠️ DUE IN ${days} DAYS`;
    if (days <= 7) return `📅 DUE IN ${days} DAYS`;
    return `📅 DUE ${deadline.toLocaleDateString()}`;
  },

  CHECKLIST_ITEM: (item: string, required: boolean): string =>
    `${required ? '☐' : '◯'} ${item}`,

  SIGNATURE_BLOCK: (name: string, firm: string, phone?: string, email?: string): string => {
    let signature = `Best regards,\n\n${name}\n${firm}`;
    if (phone) signature += `\nPhone: ${phone}`;
    if (email) signature += `\nEmail: ${email}`;
    return signature;
  }
};

// Email personalization helpers
export function personalizeEmail(template: string, clientData: Record<string, any>): string {
  let personalized = template;

  // Replace common placeholders
  const replacements = {
    '[CLIENT_NAME]': clientData.name || 'Client',
    '[FIRST_NAME]': clientData.firstName || clientData.name?.split(' ')[0] || 'Client',
    '[COMPANY]': clientData.company || '',
    '[INDUSTRY]': clientData.industry || '',
    '[PREVIOUS_INTERACTION]': clientData.lastInteraction || ''
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    personalized = personalized.replace(new RegExp(placeholder, 'g'), value);
  });

  return personalized;
}

// Token optimization for email generation
export function optimizeEmailPrompt(prompt: string, maxTokens = 2000): string {
  const lines = prompt.split('\n');
  const estimatedTokens = prompt.length / 4;

  if (estimatedTokens <= maxTokens) {
    return prompt;
  }

  // Keep essential sections for email generation
  const essentialSections = [
    'Email Context:',
    'Generate',
    'Email Structure:',
    'Requirements:'
  ];

  let optimizedLines: string[] = [];
  let currentTokens = 0;
  const targetTokens = maxTokens * 0.85 * 4; // 85% of max tokens

  for (const line of lines) {
    const isEssential = essentialSections.some(section => line.includes(section));

    if (currentTokens + line.length > targetTokens && !isEssential) {
      continue;
    }

    optimizedLines.push(line);
    currentTokens += line.length;

    if (currentTokens > targetTokens && !isEssential) {
      break;
    }
  }

  return optimizedLines.join('\n');
}