/**
 * Email Marketing Automation and Lead Nurturing System
 *
 * This system manages automated email sequences, lead scoring,
 * and content marketing workflows for converting prospects into customers.
 */

export interface EmailSequence {
  id: string
  name: string
  description: string
  trigger: SequenceTrigger
  emails: EmailTemplate[]
  segmentation: LeadSegmentation[]
  goals: ConversionGoal[]
  metrics: SequenceMetrics
}

export interface EmailTemplate {
  id: string
  subject: string
  preview: string
  content: string
  sendDelay: number // hours after previous email or trigger
  conditions?: SendCondition[]
  cta: {
    primary: string
    secondary?: string
  }
  personalizations: PersonalizationField[]
}

export interface SequenceTrigger {
  type: 'lead_magnet_download' | 'trial_signup' | 'demo_request' | 'pricing_page_visit' | 'content_engagement'
  parameters?: Record<string, any>
}

export interface LeadSegmentation {
  id: string
  name: string
  criteria: {
    firmSize?: string[]
    role?: string[]
    industry?: string[]
    leadScore?: { min: number; max: number }
    behavior?: string[]
  }
  emailVariations: Record<string, EmailTemplate>
}

export interface ConversionGoal {
  name: string
  description: string
  trackingEvents: string[]
  value: number
}

export interface SequenceMetrics {
  sent: number
  opened: number
  clicked: number
  converted: number
  unsubscribed: number
  openRate: number
  clickRate: number
  conversionRate: number
}

export interface PersonalizationField {
  field: string
  fallback: string
}

export interface SendCondition {
  type: 'lead_score' | 'engagement' | 'firm_size' | 'role' | 'behavior'
  operator: 'gt' | 'lt' | 'eq' | 'in' | 'not_in'
  value: any
}

// Pre-built email sequences for different conversion paths
export const emailSequences: EmailSequence[] = [
  {
    id: 'trial-signup-sequence',
    name: 'Free Trial Onboarding Sequence',
    description: 'Welcome and onboard new trial users to maximize activation',
    trigger: {
      type: 'trial_signup'
    },
    goals: [
      {
        name: 'Trial Activation',
        description: 'User completes key onboarding actions',
        trackingEvents: ['quickbooks_connected', 'first_client_added', 'first_document_uploaded'],
        value: 50
      },
      {
        name: 'Paid Conversion',
        description: 'User converts to paid plan',
        trackingEvents: ['subscription_created'],
        value: 500
      }
    ],
    segmentation: [
      {
        id: 'solo-practitioners',
        name: 'Solo Practitioners',
        criteria: {
          firmSize: ['Solo practitioner'],
          role: ['Owner/Partner', 'CPA']
        },
        emailVariations: {}
      },
      {
        id: 'medium-firms',
        name: 'Medium Firms',
        criteria: {
          firmSize: ['6-15 employees', '16-50 employees']
        },
        emailVariations: {}
      }
    ],
    emails: [
      {
        id: 'welcome-email',
        subject: 'Welcome to AdvisorOS! Let\'s get you set up in 15 minutes',
        preview: 'Your trial is ready. Here\'s how to get the most value quickly.',
        content: `
          <h1>Welcome to AdvisorOS, {{firstName}}!</h1>

          <p>Thank you for starting your free trial. You're about to discover how 500+ CPA firms are saving 20+ hours per week with our platform.</p>

          <h2>Get started in 3 easy steps:</h2>
          <ol>
            <li><strong>Connect QuickBooks</strong> - Sync your financial data in real-time</li>
            <li><strong>Add your first client</strong> - See how client management works</li>
            <li><strong>Upload a document</strong> - Experience our AI-powered processing</li>
          </ol>

          <p><a href="{{dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Setup Now</a></p>

          <p>Need help? Reply to this email or call us at 1-800-CPA-HELP.</p>

          <p>Best regards,<br>The AdvisorOS Team</p>
        `,
        sendDelay: 0,
        cta: {
          primary: 'Start Setup Now',
          secondary: 'Schedule Onboarding Call'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'dashboardUrl', fallback: 'https://app.advisoros.com/dashboard' }
        ]
      },
      {
        id: 'setup-reminder',
        subject: '{{firstName}}, need help getting started?',
        preview: 'I noticed you haven\'t completed your setup yet. Let me help.',
        content: `
          <h1>Hi {{firstName}},</h1>

          <p>I noticed you started your AdvisorOS trial but haven't completed the initial setup yet. No worries - this happens to the best of us!</p>

          <p>To help you get the most from your 14-day trial, I wanted to share what most successful firms do first:</p>

          <ul>
            <li><strong>Connect QuickBooks first</strong> - This usually takes 2-3 minutes and immediately shows you the power of real-time sync</li>
            <li><strong>Import 3-5 existing clients</strong> - You'll see how much easier client management becomes</li>
            <li><strong>Try the document scanner</strong> - Upload a tax document and watch our AI extract the data</li>
          </ul>

          <p>These three steps typically take 15 minutes and show you exactly why firms like {{firmName}} save 20+ hours per week.</p>

          <p><a href="{{dashboardUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Complete Setup (15 min)</a></p>

          <p>If you'd prefer a guided walkthrough, I'm happy to hop on a quick 15-minute call: <a href="{{calendlyUrl}}">Schedule here</a></p>

          <p>Best,<br>Sarah Chen<br>Customer Success Manager</p>
        `,
        sendDelay: 24,
        conditions: [
          {
            type: 'behavior',
            operator: 'not_in',
            value: ['quickbooks_connected', 'first_client_added']
          }
        ],
        cta: {
          primary: 'Complete Setup',
          secondary: 'Schedule Call'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'dashboardUrl', fallback: 'https://app.advisoros.com/dashboard' },
          { field: 'calendlyUrl', fallback: 'https://calendly.com/advisoros/setup-call' }
        ]
      },
      {
        id: 'success-story',
        subject: 'How Chen & Associates saved 25 hours per week',
        preview: 'Real results from a firm just like yours.',
        content: `
          <h1>Hi {{firstName}},</h1>

          <p>I wanted to share a quick success story that might resonate with you.</p>

          <p>Chen & Associates is a {{firmSize}} CPA firm that was drowning in administrative work. Sound familiar?</p>

          <blockquote style="border-left: 4px solid #2563eb; padding-left: 16px; margin: 20px 0;">
            "Before AdvisorOS, I was spending 25+ hours per week on client onboarding, document collection, and data entry. Now those same tasks take me 3 hours. I can focus on what I love - providing strategic advice to my clients."
            <br><br>
            - Sarah Chen, Managing Partner
          </blockquote>

          <p><strong>Here's exactly what they did:</strong></p>
          <ol>
            <li><strong>Automated client onboarding</strong> - Reduced from 3 hours to 20 minutes per client</li>
            <li><strong>Implemented document workflows</strong> - Clients now upload documents directly to secure portals</li>
            <li><strong>Connected QuickBooks</strong> - Eliminated manual data entry and reconciliation</li>
          </ol>

          <p><strong>The result?</strong> They increased their client capacity by 40% without hiring additional staff, and their clients are happier than ever.</p>

          <p>Want to see how this applies to {{firmName}}? I'd love to show you:</p>

          <p><a href="{{demoUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Book Your Demo</a></p>

          <p>Best,<br>Mike Rodriguez<br>AdvisorOS Team</p>
        `,
        sendDelay: 72,
        cta: {
          primary: 'Book Your Demo',
          secondary: 'Read Full Case Study'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'firmSize', fallback: 'small' },
          { field: 'demoUrl', fallback: 'https://advisoros.com/demo' }
        ]
      },
      {
        id: 'roi-calculator',
        subject: 'Calculate your exact ROI with AdvisorOS',
        preview: 'See how much time and money you could save with our ROI calculator.',
        content: `
          <h1>Hi {{firstName}},</h1>

          <p>You've been exploring AdvisorOS for a few days now, and I'm curious - what would it mean for {{firmName}} if you could save 20+ hours per week?</p>

          <p>I built a simple calculator that shows the exact ROI of implementing practice management software based on your firm's specific situation.</p>

          <p><strong>Here's what it calculates:</strong></p>
          <ul>
            <li>Time savings across different processes</li>
            <li>Cost reduction from automation</li>
            <li>Revenue increase from capacity improvements</li>
            <li>Total ROI and payback period</li>
          </ul>

          <p>For a firm like yours, most see an ROI of 300-400% in the first year.</p>

          <p><a href="{{roiCalculatorUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Calculate Your ROI</a></p>

          <p>It takes 2 minutes and gives you a personalized report you can share with partners.</p>

          <p>Questions? Just reply to this email.</p>

          <p>Best,<br>Jennifer Walsh<br>AdvisorOS Team</p>
        `,
        sendDelay: 120,
        cta: {
          primary: 'Calculate Your ROI',
          secondary: 'Schedule ROI Discussion'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'roiCalculatorUrl', fallback: 'https://advisoros.com/roi-calculator' }
        ]
      },
      {
        id: 'trial-ending',
        subject: 'Your trial ends tomorrow - don\'t lose your setup!',
        preview: 'Continue your AdvisorOS journey with 50% off your first 3 months.',
        content: `
          <h1>Hi {{firstName}},</h1>

          <p>Your AdvisorOS trial ends tomorrow, and I wanted to reach out personally.</p>

          <p>Over the past 14 days, you've experienced how AdvisorOS can transform your practice:</p>
          <ul>
            <li>✅ Connected QuickBooks for real-time sync</li>
            <li>✅ Set up client portals for secure collaboration</li>
            <li>✅ Automated workflows to save time</li>
          </ul>

          <p><strong>Don't lose all your setup work!</strong> Continue seamlessly with a paid plan and keep everything exactly as you've configured it.</p>

          <p><strong>Special offer for {{firmName}}:</strong> Get 50% off your first 3 months when you upgrade before midnight tomorrow.</p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Professional Plan - Perfect for firms like yours</h3>
            <p style="margin: 0 0 10px 0;"><del>$189/month</del> <strong style="color: #2563eb;">$94.50/month</strong> for your first 3 months</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Then $189/month. Cancel anytime.</p>
          </div>

          <p><a href="{{upgradeUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Claim 50% Discount</a></p>

          <p>Questions? Reply to this email or call me directly at 1-800-CPA-HELP.</p>

          <p>Best,<br>Sarah Chen<br>Your Customer Success Manager</p>

          <p style="font-size: 12px; color: #6b7280;">This special offer expires at midnight tomorrow.</p>
        `,
        sendDelay: 312, // 13 days
        conditions: [
          {
            type: 'behavior',
            operator: 'not_in',
            value: ['subscription_created']
          }
        ],
        cta: {
          primary: 'Claim 50% Discount',
          secondary: 'Talk to Customer Success'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'upgradeUrl', fallback: 'https://app.advisoros.com/upgrade?discount=TRIAL50' }
        ]
      }
    ],
    metrics: {
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0
    }
  },
  {
    id: 'lead-magnet-nurture',
    name: 'Lead Magnet Download Nurture Sequence',
    description: 'Nurture leads who downloaded guides/resources toward trial signup',
    trigger: {
      type: 'lead_magnet_download'
    },
    goals: [
      {
        name: 'Trial Signup',
        description: 'Lead converts to free trial',
        trackingEvents: ['trial_signup'],
        value: 100
      },
      {
        name: 'Demo Request',
        description: 'Lead requests a demo',
        trackingEvents: ['demo_request'],
        value: 150
      }
    ],
    segmentation: [
      {
        id: 'high-value-leads',
        name: 'High Value Leads',
        criteria: {
          leadScore: { min: 70, max: 100 },
          firmSize: ['16-50 employees', '50+ employees']
        },
        emailVariations: {}
      },
      {
        id: 'nurture-leads',
        name: 'Nurture Required Leads',
        criteria: {
          leadScore: { min: 0, max: 69 }
        },
        emailVariations: {}
      }
    ],
    emails: [
      {
        id: 'resource-delivery',
        subject: 'Your {{resourceName}} is ready for download',
        preview: 'Here\'s your free resource plus bonus implementation tips.',
        content: `
          <h1>Here's your {{resourceName}}, {{firstName}}!</h1>

          <p>Thank you for downloading our {{resourceName}}. You can access it here:</p>

          <p><a href="{{downloadUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Download {{resourceName}}</a></p>

          <p><strong>Bonus:</strong> I've also included our implementation checklist that shows you exactly how to put these strategies into practice at {{firmName}}.</p>

          <p>This checklist has helped 500+ CPA firms implement these best practices and see results within 30 days.</p>

          <p>Questions about implementation? Reply to this email - I personally read and respond to every message.</p>

          <p>Best,<br>The AdvisorOS Team</p>

          <p>P.S. Keep an eye out for my next email where I'll share how {{competitorFirm}} implemented these exact strategies to grow their practice by 40%.</p>
        `,
        sendDelay: 0,
        cta: {
          primary: 'Download Resource',
          secondary: 'Get Implementation Help'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'resourceName', fallback: 'guide' },
          { field: 'downloadUrl', fallback: 'https://advisoros.com/downloads' },
          { field: 'competitorFirm', fallback: 'Chen & Associates' }
        ]
      },
      {
        id: 'implementation-tips',
        subject: 'How to implement these strategies in your firm',
        preview: 'Step-by-step implementation guide with real examples.',
        content: `
          <h1>Hi {{firstName}},</h1>

          <p>I hope you found the {{resourceName}} helpful! Today I want to share exactly how successful firms like {{firmName}} implement these strategies.</p>

          <h2>The 3-Step Implementation Framework:</h2>

          <h3>Step 1: Audit Current Processes (Week 1)</h3>
          <ul>
            <li>Document your current client onboarding process</li>
            <li>Track time spent on administrative tasks</li>
            <li>Identify the biggest bottlenecks</li>
          </ul>

          <h3>Step 2: Implement Quick Wins (Week 2-3)</h3>
          <ul>
            <li>Set up automated email templates</li>
            <li>Create standardized document requests</li>
            <li>Implement client portal for document sharing</li>
          </ul>

          <h3>Step 3: Scale and Optimize (Week 4+)</h3>
          <ul>
            <li>Connect practice management with QuickBooks</li>
            <li>Build advanced workflows for complex processes</li>
            <li>Train team on new procedures</li>
          </ul>

          <p><strong>Want to see this in action?</strong> I'd love to show you how AdvisorOS makes this implementation 10x easier.</p>

          <p><a href="{{demoUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">See Implementation Demo</a></p>

          <p>The demo takes 15 minutes and you'll see exactly how to implement everything from the {{resourceName}}.</p>

          <p>Best,<br>Mike Rodriguez<br>AdvisorOS Team</p>
        `,
        sendDelay: 48,
        cta: {
          primary: 'See Implementation Demo',
          secondary: 'Get Implementation Checklist'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'resourceName', fallback: 'guide' },
          { field: 'demoUrl', fallback: 'https://advisoros.com/demo' }
        ]
      },
      {
        id: 'case-study-follow-up',
        subject: 'How {{competitorFirm}} grew 40% with these strategies',
        preview: 'Real results from implementing the strategies you downloaded.',
        content: `
          <h1>Hi {{firstName}},</h1>

          <p>Remember when I mentioned how {{competitorFirm}} used the strategies from {{resourceName}} to grow their practice by 40%?</p>

          <p>I wanted to share their full story because it's exactly what we see from firms like {{firmName}} who implement these best practices.</p>

          <h2>The Challenge:</h2>
          <p>{{competitorFirm}} was a {{firmSize}} firm struggling with:</p>
          <ul>
            <li>Manual client onboarding taking 3+ hours per client</li>
            <li>Constant back-and-forth for document collection</li>
            <li>No visibility into client project status</li>
            <li>Staff spending 60% of time on administrative tasks</li>
          </ul>

          <h2>The Solution:</h2>
          <p>They implemented the exact strategies from your {{resourceName}} using AdvisorOS:</p>
          <ul>
            <li>Automated client onboarding workflows</li>
            <li>Client portals for secure document sharing</li>
            <li>Real-time QuickBooks integration</li>
            <li>Automated status updates and reminders</li>
          </ul>

          <h2>The Results (after 6 months):</h2>
          <ul>
            <li>✅ 40% increase in client capacity</li>
            <li>✅ 75% reduction in onboarding time</li>
            <li>✅ 90% fewer document collection emails</li>
            <li>✅ Staff now spend 80% of time on high-value work</li>
          </ul>

          <blockquote style="border-left: 4px solid #2563eb; padding-left: 16px; margin: 20px 0;">
            "The strategies in that guide were exactly what we needed, but AdvisorOS made implementation effortless. We saw results within the first month."
            <br><br>
            - Sarah Chen, Managing Partner
          </blockquote>

          <p>Want to see how this applies to {{firmName}}? I'd love to show you:</p>

          <p><a href="{{demoUrl}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Get Your Custom Demo</a></p>

          <p>The demo is personalized for firms like yours and shows exactly how to implement these strategies.</p>

          <p>Best,<br>Jennifer Walsh<br>AdvisorOS Team</p>
        `,
        sendDelay: 120,
        cta: {
          primary: 'Get Your Custom Demo',
          secondary: 'Read Full Case Study'
        },
        personalizations: [
          { field: 'firstName', fallback: 'there' },
          { field: 'firmName', fallback: 'your firm' },
          { field: 'firmSize', fallback: 'small' },
          { field: 'resourceName', fallback: 'guide' },
          { field: 'competitorFirm', fallback: 'Chen & Associates' },
          { field: 'demoUrl', fallback: 'https://advisoros.com/demo' }
        ]
      }
    ],
    metrics: {
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0
    }
  }
]

// Email automation management class
export class EmailAutomationManager {
  private sequences: Map<string, EmailSequence> = new Map()
  private activeSubscriptions: Map<string, string[]> = new Map() // userId -> sequenceIds

  constructor() {
    emailSequences.forEach(sequence => {
      this.sequences.set(sequence.id, sequence)
    })
  }

  /**
   * Subscribe a user to an email sequence
   */
  subscribeToSequence(userId: string, sequenceId: string, triggerData?: Record<string, any>): void {
    const sequence = this.sequences.get(sequenceId)
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`)
    }

    // Add to active subscriptions
    if (!this.activeSubscriptions.has(userId)) {
      this.activeSubscriptions.set(userId, [])
    }
    this.activeSubscriptions.get(userId)!.push(sequenceId)

    // Schedule emails
    this.scheduleSequenceEmails(userId, sequence, triggerData)
  }

  /**
   * Unsubscribe user from a sequence
   */
  unsubscribeFromSequence(userId: string, sequenceId: string): void {
    const userSequences = this.activeSubscriptions.get(userId)
    if (userSequences) {
      const index = userSequences.indexOf(sequenceId)
      if (index > -1) {
        userSequences.splice(index, 1)
      }
    }

    // Cancel scheduled emails
    this.cancelScheduledEmails(userId, sequenceId)
  }

  /**
   * Get personalized email content
   */
  personalizeEmail(template: EmailTemplate, userData: Record<string, any>): string {
    let content = template.content

    template.personalizations.forEach(field => {
      const value = userData[field.field] || field.fallback
      const regex = new RegExp(`{{${field.field}}}`, 'g')
      content = content.replace(regex, value)
    })

    return content
  }

  /**
   * Check if user should receive email based on conditions
   */
  shouldSendEmail(template: EmailTemplate, userData: Record<string, any>): boolean {
    if (!template.conditions) return true

    return template.conditions.every(condition => {
      const userValue = userData[condition.type]

      switch (condition.operator) {
        case 'gt':
          return userValue > condition.value
        case 'lt':
          return userValue < condition.value
        case 'eq':
          return userValue === condition.value
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(userValue)
        case 'not_in':
          return !Array.isArray(condition.value) || !condition.value.includes(userValue)
        default:
          return true
      }
    })
  }

  /**
   * Track email metrics
   */
  trackEmailEvent(sequenceId: string, emailId: string, event: 'sent' | 'opened' | 'clicked' | 'converted' | 'unsubscribed'): void {
    const sequence = this.sequences.get(sequenceId)
    if (!sequence) return

    sequence.metrics[event]++

    // Recalculate rates
    const { sent, opened, clicked, converted } = sequence.metrics
    sequence.metrics.openRate = sent > 0 ? (opened / sent) * 100 : 0
    sequence.metrics.clickRate = opened > 0 ? (clicked / opened) * 100 : 0
    sequence.metrics.conversionRate = sent > 0 ? (converted / sent) * 100 : 0

    // Store metrics
    this.persistMetrics(sequenceId, sequence.metrics)
  }

  /**
   * Get sequence performance analytics
   */
  getSequenceAnalytics(sequenceId: string): SequenceMetrics | null {
    const sequence = this.sequences.get(sequenceId)
    return sequence ? sequence.metrics : null
  }

  private scheduleSequenceEmails(userId: string, sequence: EmailSequence, triggerData?: Record<string, any>): void {
    sequence.emails.forEach((email, index) => {
      const sendTime = new Date()
      sendTime.setHours(sendTime.getHours() + email.sendDelay)

      // In a real implementation, you would use a job queue system
      setTimeout(() => {
        this.sendEmail(userId, sequence.id, email, triggerData)
      }, email.sendDelay * 60 * 60 * 1000) // Convert hours to milliseconds
    })
  }

  private async sendEmail(userId: string, sequenceId: string, template: EmailTemplate, userData?: Record<string, any>): Promise<void> {
    // Get user data for personalization
    const fullUserData = await this.getUserData(userId, userData)

    // Check send conditions
    if (!this.shouldSendEmail(template, fullUserData)) {
      return
    }

    // Personalize content
    const personalizedContent = this.personalizeEmail(template, fullUserData)
    const personalizedSubject = this.personalizeSubject(template.subject, fullUserData)

    // Send email via email service
    try {
      await this.sendViaEmailService({
        to: fullUserData.email,
        subject: personalizedSubject,
        content: personalizedContent,
        templateId: template.id,
        sequenceId,
        userId
      })

      this.trackEmailEvent(sequenceId, template.id, 'sent')
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  private personalizeSubject(subject: string, userData: Record<string, any>): string {
    let personalizedSubject = subject

    // Replace common personalization tokens
    Object.keys(userData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      personalizedSubject = personalizedSubject.replace(regex, userData[key] || '')
    })

    return personalizedSubject
  }

  private async getUserData(userId: string, additionalData?: Record<string, any>): Promise<Record<string, any>> {
    // In a real implementation, fetch from database
    const baseUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      firmName: 'Example CPA Firm',
      firmSize: '6-15 employees',
      role: 'Managing Partner'
    }

    return { ...baseUserData, ...additionalData }
  }

  private async sendViaEmailService(emailData: any): Promise<void> {
    // Integration with email service provider (SendGrid, Mailchimp, etc.)
    console.log('Sending email:', emailData)

    // Example SendGrid integration:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: emailData.to,
      from: 'hello@advisoros.com',
      subject: emailData.subject,
      html: emailData.content,
    }

    await sgMail.send(msg)
    */
  }

  private cancelScheduledEmails(userId: string, sequenceId: string): void {
    // In a real implementation, cancel jobs in the queue system
    console.log(`Cancelling scheduled emails for user ${userId} in sequence ${sequenceId}`)
  }

  private persistMetrics(sequenceId: string, metrics: SequenceMetrics): void {
    // Store metrics in database
    console.log(`Persisting metrics for sequence ${sequenceId}:`, metrics)
  }
}

// Singleton instance
export const emailAutomation = new EmailAutomationManager()

// React hook for email automation
export function useEmailAutomation() {
  const subscribe = (userId: string, sequenceId: string, triggerData?: Record<string, any>) => {
    emailAutomation.subscribeToSequence(userId, sequenceId, triggerData)
  }

  const unsubscribe = (userId: string, sequenceId: string) => {
    emailAutomation.unsubscribeFromSequence(userId, sequenceId)
  }

  const trackEvent = (sequenceId: string, emailId: string, event: 'opened' | 'clicked' | 'converted') => {
    emailAutomation.trackEmailEvent(sequenceId, emailId, event)
  }

  const getAnalytics = (sequenceId: string) => {
    return emailAutomation.getSequenceAnalytics(sequenceId)
  }

  return {
    subscribe,
    unsubscribe,
    trackEvent,
    getAnalytics
  }
}