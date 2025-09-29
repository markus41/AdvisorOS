import { Redis } from 'ioredis'
import { prisma } from '../db'
import { z } from 'zod'
import { addDays, subDays, isBefore, differenceInDays, format } from 'date-fns'

// Client communication schemas
const CommunicationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'organizer_request', 'document_reminder', 'deadline_warning',
    'status_update', 'completion_notice', 'extension_notice',
    'payment_reminder', 'appointment_booking', 'emergency_notice'
  ]),
  channel: z.enum(['email', 'sms', 'portal_notification', 'phone_call']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  subject: z.string(),
  content: z.string(),
  variables: z.array(z.string()),
  sendConditions: z.object({
    daysBeforeDeadline: z.number().optional(),
    workflowStatus: z.array(z.string()).optional(),
    documentStatus: z.array(z.string()).optional(),
    clientType: z.array(z.string()).optional(),
    timeOfDay: z.object({
      start: z.string(),
      end: z.string()
    }).optional()
  }),
  active: z.boolean()
})

const CommunicationScheduleSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  organizationId: z.string(),
  templateId: z.string(),
  scheduledFor: z.date(),
  status: z.enum(['scheduled', 'sent', 'delivered', 'read', 'failed', 'cancelled']),
  channel: z.enum(['email', 'sms', 'portal_notification', 'phone_call']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  context: z.record(z.any()),
  createdAt: z.date(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional()
})

interface BulkCommunicationJob {
  id: string
  organizationId: string
  type: 'bulk_reminder' | 'bulk_update' | 'deadline_broadcast' | 'emergency_notice'
  targetClients: string[]
  templateId: string
  scheduledFor: Date
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: {
    total: number
    sent: number
    delivered: number
    failed: number
    errors: string[]
  }
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: Date
  completedAt?: Date
}

interface ClientPreferences {
  clientId: string
  emailEnabled: boolean
  smsEnabled: boolean
  portalEnabled: boolean
  phoneEnabled: boolean
  preferredChannel: 'email' | 'sms' | 'portal' | 'phone'
  timeZone: string
  preferredContactHours: {
    start: string
    end: string
  }
  language: string
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest'
  optOut: string[]
}

interface CommunicationMetrics {
  totalSent: number
  deliveryRate: number
  openRate: number
  responseRate: number
  optOutRate: number
  channelPerformance: Record<string, {
    sent: number
    delivered: number
    opened: number
    responded: number
    avgResponseTime: number
  }>
  templatePerformance: Record<string, {
    sent: number
    opened: number
    responded: number
    effectiveness: number
  }>
  timeOfDayOptimal: Record<string, number>
}

interface EscalationRule {
  id: string
  name: string
  triggerConditions: {
    noResponseDays: number
    missedDeadlines: number
    documentsPendingDays: number
    priority: string[]
  }
  escalationSteps: Array<{
    step: number
    action: 'send_reminder' | 'schedule_call' | 'assign_specialist' | 'notify_manager'
    delayHours: number
    templateId?: string
    assignTo?: string
  }>
  active: boolean
}

export class TaxSeasonClientCommunicationService {
  private readonly COMMUNICATION_TEMPLATES = [
    {
      id: 'organizer_initial',
      name: 'Initial Tax Organizer Request',
      type: 'organizer_request',
      channel: 'email',
      priority: 'normal',
      subject: 'Your {{taxYear}} Tax Organizer is Ready',
      content: `
        Dear {{clientName}},

        Tax season is approaching! We've prepared your personalized tax organizer for {{taxYear}}.

        Please complete and return it by {{organizerDeadline}} to ensure timely preparation of your return.

        Access your organizer: {{organizerLink}}

        If you have questions, please contact us at {{contactInfo}}.

        Best regards,
        {{preparerName}}
      `,
      variables: ['clientName', 'taxYear', 'organizerDeadline', 'organizerLink', 'contactInfo', 'preparerName'],
      sendConditions: {
        workflowStatus: ['organizer_sent']
      },
      active: true
    },
    {
      id: 'document_reminder_gentle',
      name: 'Gentle Document Reminder',
      type: 'document_reminder',
      channel: 'email',
      priority: 'normal',
      subject: 'Friendly Reminder: Tax Documents Needed',
      content: `
        Hi {{clientName}},

        We hope you're doing well! This is a friendly reminder that we're still waiting for some tax documents for your {{taxYear}} return.

        Missing documents:
        {{missingDocuments}}

        Please upload them to your secure portal: {{portalLink}}

        Your tax deadline is {{deadline}}. To ensure we have adequate time for preparation, please submit by {{submitDeadline}}.

        Thank you!
        {{preparerName}}
      `,
      variables: ['clientName', 'taxYear', 'missingDocuments', 'portalLink', 'deadline', 'submitDeadline', 'preparerName'],
      sendConditions: {
        daysBeforeDeadline: 21,
        workflowStatus: ['documents_pending']
      },
      active: true
    },
    {
      id: 'deadline_urgent',
      name: 'Urgent Deadline Warning',
      type: 'deadline_warning',
      channel: 'email',
      priority: 'urgent',
      subject: 'URGENT: Tax Deadline Approaching - {{daysLeft}} Days Left',
      content: `
        URGENT - {{clientName}},

        Your tax deadline is in {{daysLeft}} days ({{deadline}}).

        We still need:
        {{missingItems}}

        IMMEDIATE ACTION REQUIRED:
        1. Upload documents: {{portalLink}}
        2. Call us: {{phoneNumber}}
        3. Schedule appointment: {{scheduleLink}}

        Without immediate action, we may need to file an extension.

        {{preparerName}}
        {{firmName}}
      `,
      variables: ['clientName', 'daysLeft', 'deadline', 'missingItems', 'portalLink', 'phoneNumber', 'scheduleLink', 'preparerName', 'firmName'],
      sendConditions: {
        daysBeforeDeadline: 5,
        workflowStatus: ['documents_pending', 'documents_received']
      },
      active: true
    },
    {
      id: 'status_update_progress',
      name: 'Tax Return Progress Update',
      type: 'status_update',
      channel: 'email',
      priority: 'normal',
      subject: 'Update: Your {{taxYear}} Tax Return is {{status}}',
      content: `
        Dear {{clientName}},

        Great news! Your {{taxYear}} tax return is making progress.

        Current Status: {{statusDescription}}
        Estimated Completion: {{estimatedCompletion}}

        {{#if additionalInfo}}
        Additional Information:
        {{additionalInfo}}
        {{/if}}

        {{#if nextSteps}}
        Next Steps:
        {{nextSteps}}
        {{/if}}

        Track your progress: {{statusLink}}

        {{preparerName}}
      `,
      variables: ['clientName', 'taxYear', 'status', 'statusDescription', 'estimatedCompletion', 'additionalInfo', 'nextSteps', 'statusLink', 'preparerName'],
      sendConditions: {
        workflowStatus: ['in_preparation', 'ready_for_review']
      },
      active: true
    }
  ]

  private readonly ESCALATION_RULES: EscalationRule[] = [
    {
      id: 'document_escalation',
      name: 'Document Collection Escalation',
      triggerConditions: {
        noResponseDays: 7,
        missedDeadlines: 0,
        documentsPendingDays: 14,
        priority: ['normal', 'high']
      },
      escalationSteps: [
        {
          step: 1,
          action: 'send_reminder',
          delayHours: 0,
          templateId: 'document_reminder_urgent'
        },
        {
          step: 2,
          action: 'schedule_call',
          delayHours: 48,
          templateId: 'schedule_call_request'
        },
        {
          step: 3,
          action: 'assign_specialist',
          delayHours: 72,
          assignTo: 'client_success_team'
        },
        {
          step: 4,
          action: 'notify_manager',
          delayHours: 120
        }
      ],
      active: true
    },
    {
      id: 'deadline_escalation',
      name: 'Deadline Approach Escalation',
      triggerConditions: {
        noResponseDays: 3,
        missedDeadlines: 0,
        documentsPendingDays: 7,
        priority: ['high', 'urgent']
      },
      escalationSteps: [
        {
          step: 1,
          action: 'send_reminder',
          delayHours: 0,
          templateId: 'deadline_urgent'
        },
        {
          step: 2,
          action: 'schedule_call',
          delayHours: 24,
          templateId: 'urgent_call_request'
        },
        {
          step: 3,
          action: 'notify_manager',
          delayHours: 48
        }
      ],
      active: true
    }
  ]

  constructor(private redis: Redis) {
    this.initializeCommunicationEngine()
  }

  // TEMPLATE MANAGEMENT

  async createCommunicationTemplate(
    template: z.infer<typeof CommunicationTemplateSchema>
  ): Promise<string> {
    const validatedTemplate = CommunicationTemplateSchema.parse(template)

    await this.redis.setex(
      `comm_template:${template.id}`,
      86400 * 365, // Store for 1 year
      JSON.stringify(validatedTemplate)
    )

    await this.redis.sadd('communication_templates', template.id)

    console.log(`Created communication template: ${template.name}`)
    return template.id
  }

  async getTemplate(templateId: string): Promise<any | null> {
    const templateData = await this.redis.get(`comm_template:${templateId}`)
    return templateData ? JSON.parse(templateData) : null
  }

  // SCHEDULED COMMUNICATIONS

  async scheduleClientCommunication(
    communication: Partial<z.infer<typeof CommunicationScheduleSchema>>
  ): Promise<string> {
    const communicationId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const scheduledComm = {
      id: communicationId,
      ...communication,
      status: 'scheduled' as const,
      attempts: 0,
      createdAt: new Date()
    }

    // Store communication
    await this.redis.setex(
      `scheduled_comm:${communicationId}`,
      86400 * 30, // 30 days
      JSON.stringify(scheduledComm)
    )

    // Add to schedule queue
    const timestamp = scheduledComm.scheduledFor!.getTime()
    await this.redis.zadd('communication_queue', timestamp, communicationId)

    // Add to client communications index
    await this.redis.sadd(`client_communications:${communication.clientId}`, communicationId)

    return communicationId
  }

  async sendImmediateCommunication(
    clientId: string,
    templateId: string,
    context: Record<string, any>,
    channel?: 'email' | 'sms' | 'portal_notification'
  ): Promise<string> {
    const template = await this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const clientPrefs = await this.getClientPreferences(clientId)
    const selectedChannel = channel || clientPrefs?.preferredChannel || template.channel

    const communication = {
      clientId,
      organizationId: context.organizationId,
      templateId,
      scheduledFor: new Date(),
      channel: selectedChannel,
      priority: template.priority,
      context
    }

    const commId = await this.scheduleClientCommunication(communication)

    // Process immediately
    await this.processCommunication(commId)

    return commId
  }

  // BULK COMMUNICATIONS

  async createBulkCommunicationJob(
    organizationId: string,
    type: 'bulk_reminder' | 'bulk_update' | 'deadline_broadcast' | 'emergency_notice',
    targetClients: string[],
    templateId: string,
    scheduledFor: Date = new Date(),
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<BulkCommunicationJob> {
    const jobId = `bulk_comm_${Date.now()}`

    const job: BulkCommunicationJob = {
      id: jobId,
      organizationId,
      type,
      targetClients,
      templateId,
      scheduledFor,
      status: 'queued',
      progress: {
        total: targetClients.length,
        sent: 0,
        delivered: 0,
        failed: 0,
        errors: []
      },
      priority,
      createdAt: new Date()
    }

    // Store job
    await this.redis.setex(
      `bulk_comm_job:${jobId}`,
      86400 * 7, // 7 days
      JSON.stringify(job)
    )

    // Add to processing queue
    const timestamp = scheduledFor.getTime()
    await this.redis.zadd('bulk_communication_queue', timestamp, jobId)

    // Process if scheduled for now
    if (scheduledFor <= new Date()) {
      this.processBulkCommunicationJob(job)
    }

    return job
  }

  async sendDeadlineReminders(
    organizationId: string,
    daysBeforeDeadline: number,
    workflowStatuses: string[] = ['documents_pending', 'documents_received']
  ): Promise<BulkCommunicationJob> {
    // Get clients with approaching deadlines
    const targetClients = await this.getClientsWithApproachingDeadlines(
      organizationId,
      daysBeforeDeadline,
      workflowStatuses
    )

    // Select appropriate template based on urgency
    let templateId = 'document_reminder_gentle'
    if (daysBeforeDeadline <= 5) {
      templateId = 'deadline_urgent'
    } else if (daysBeforeDeadline <= 10) {
      templateId = 'document_reminder_urgent'
    }

    return await this.createBulkCommunicationJob(
      organizationId,
      'deadline_broadcast',
      targetClients,
      templateId,
      new Date(),
      daysBeforeDeadline <= 5 ? 'urgent' : 'high'
    )
  }

  async sendStatusUpdates(
    organizationId: string,
    workflowStatuses: string[],
    templateId: string = 'status_update_progress'
  ): Promise<BulkCommunicationJob> {
    const targetClients = await this.getClientsByWorkflowStatus(organizationId, workflowStatuses)

    return await this.createBulkCommunicationJob(
      organizationId,
      'bulk_update',
      targetClients,
      templateId,
      new Date(),
      'normal'
    )
  }

  // CLIENT PREFERENCES

  async updateClientPreferences(
    clientId: string,
    preferences: Partial<ClientPreferences>
  ): Promise<void> {
    const existingPrefs = await this.getClientPreferences(clientId)

    const updatedPrefs = {
      ...existingPrefs,
      ...preferences,
      clientId
    }

    await this.redis.setex(
      `client_preferences:${clientId}`,
      86400 * 365, // 1 year
      JSON.stringify(updatedPrefs)
    )
  }

  async getClientPreferences(clientId: string): Promise<ClientPreferences | null> {
    const prefsData = await this.redis.get(`client_preferences:${clientId}`)
    return prefsData ? JSON.parse(prefsData) : null
  }

  // ESCALATION MANAGEMENT

  async checkEscalationRules(): Promise<void> {
    for (const rule of this.ESCALATION_RULES) {
      if (!rule.active) continue

      const eligibleClients = await this.findClientsForEscalation(rule)

      for (const clientId of eligibleClients) {
        await this.executeEscalationRule(rule, clientId)
      }
    }
  }

  private async findClientsForEscalation(rule: EscalationRule): Promise<string[]> {
    // This would query the database for clients matching escalation conditions
    // For now, return mock data
    return ['client_1', 'client_2']
  }

  private async executeEscalationRule(rule: EscalationRule, clientId: string): Promise<void> {
    const escalationKey = `escalation:${rule.id}:${clientId}`
    const currentStep = await this.redis.get(escalationKey)
    const stepNumber = currentStep ? parseInt(currentStep) + 1 : 1

    const step = rule.escalationSteps.find(s => s.step === stepNumber)
    if (!step) return // No more escalation steps

    // Check if enough time has passed since last step
    const lastActionKey = `escalation_last:${rule.id}:${clientId}`
    const lastActionTime = await this.redis.get(lastActionKey)

    if (lastActionTime) {
      const hoursSinceLastAction = (Date.now() - parseInt(lastActionTime)) / (1000 * 60 * 60)
      if (hoursSinceLastAction < step.delayHours) {
        return // Not enough time has passed
      }
    }

    // Execute escalation step
    await this.executeEscalationStep(step, clientId, rule.id)

    // Update escalation state
    await this.redis.setex(escalationKey, 86400 * 30, stepNumber.toString())
    await this.redis.setex(lastActionKey, 86400 * 30, Date.now().toString())

    console.log(`Executed escalation step ${stepNumber} for client ${clientId} (rule: ${rule.name})`)
  }

  private async executeEscalationStep(
    step: any,
    clientId: string,
    ruleId: string
  ): Promise<void> {
    switch (step.action) {
      case 'send_reminder':
        if (step.templateId) {
          await this.sendImmediateCommunication(clientId, step.templateId, {
            escalationStep: step.step,
            ruleId
          })
        }
        break

      case 'schedule_call':
        await this.scheduleClientCall(clientId, step.templateId)
        break

      case 'assign_specialist':
        await this.assignSpecialist(clientId, step.assignTo)
        break

      case 'notify_manager':
        await this.notifyManager(clientId, ruleId, step.step)
        break
    }
  }

  // SELF-SERVICE PORTAL

  async updateClientPortalPreferences(
    clientId: string,
    portalPreferences: {
      notificationsEnabled: boolean
      digestFrequency: 'immediate' | 'daily' | 'weekly'
      categories: string[]
    }
  ): Promise<void> {
    await this.redis.setex(
      `portal_preferences:${clientId}`,
      86400 * 365,
      JSON.stringify(portalPreferences)
    )
  }

  async getClientCommunicationHistory(
    clientId: string,
    limit: number = 50
  ): Promise<any[]> {
    const communicationIds = await this.redis.smembers(`client_communications:${clientId}`)
    const communications = []

    for (const id of communicationIds.slice(0, limit)) {
      const commData = await this.redis.get(`scheduled_comm:${id}`)
      if (commData) {
        communications.push(JSON.parse(commData))
      }
    }

    return communications.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async markCommunicationAsRead(communicationId: string): Promise<void> {
    const commData = await this.redis.get(`scheduled_comm:${communicationId}`)
    if (commData) {
      const communication = JSON.parse(commData)
      communication.status = 'read'
      communication.readAt = new Date()

      await this.redis.setex(
        `scheduled_comm:${communicationId}`,
        86400 * 30,
        JSON.stringify(communication)
      )
    }
  }

  // ANALYTICS AND METRICS

  async getCommunicationMetrics(
    organizationId: string,
    timeframe: 'day' | 'week' | 'month' = 'month'
  ): Promise<CommunicationMetrics> {
    const endTime = new Date()
    let startTime: Date

    switch (timeframe) {
      case 'day':
        startTime = subDays(endTime, 1)
        break
      case 'week':
        startTime = subDays(endTime, 7)
        break
      case 'month':
        startTime = subDays(endTime, 30)
        break
    }

    // This would aggregate actual metrics from stored communications
    // For now, return mock metrics
    return {
      totalSent: 1250,
      deliveryRate: 0.96,
      openRate: 0.68,
      responseRate: 0.24,
      optOutRate: 0.02,
      channelPerformance: {
        email: {
          sent: 1000,
          delivered: 980,
          opened: 686,
          responded: 245,
          avgResponseTime: 4.5
        },
        sms: {
          sent: 200,
          delivered: 195,
          opened: 180,
          responded: 45,
          avgResponseTime: 0.5
        },
        portal_notification: {
          sent: 50,
          delivered: 50,
          opened: 40,
          responded: 10,
          avgResponseTime: 2.0
        }
      },
      templatePerformance: {
        document_reminder_gentle: {
          sent: 400,
          opened: 280,
          responded: 120,
          effectiveness: 0.3
        },
        deadline_urgent: {
          sent: 150,
          opened: 140,
          responded: 90,
          effectiveness: 0.6
        }
      },
      timeOfDayOptimal: {
        '09': 0.72, // 9 AM has 72% open rate
        '14': 0.68, // 2 PM has 68% open rate
        '19': 0.45  // 7 PM has 45% open rate
      }
    }
  }

  async getOptimalSendTime(clientId: string): Promise<Date> {
    const preferences = await this.getClientPreferences(clientId)
    const metrics = await this.getCommunicationMetrics('', 'month')

    // Find optimal hour based on metrics and client preferences
    let optimalHour = 9 // Default to 9 AM

    if (preferences?.preferredContactHours) {
      const startHour = parseInt(preferences.preferredContactHours.start.split(':')[0])
      const endHour = parseInt(preferences.preferredContactHours.end.split(':')[0])

      // Find best hour within client's preferred range
      for (let hour = startHour; hour <= endHour; hour++) {
        const hourKey = hour.toString().padStart(2, '0')
        if (metrics.timeOfDayOptimal[hourKey] > metrics.timeOfDayOptimal[optimalHour.toString().padStart(2, '0')]) {
          optimalHour = hour
        }
      }
    }

    // Schedule for optimal hour today or tomorrow
    const now = new Date()
    const optimalTime = new Date()
    optimalTime.setHours(optimalHour, 0, 0, 0)

    if (optimalTime <= now) {
      optimalTime.setDate(optimalTime.getDate() + 1)
    }

    return optimalTime
  }

  // PROCESSING ENGINE

  private async initializeCommunicationEngine(): void {
    // Process scheduled communications every minute
    setInterval(async () => {
      await this.processScheduledCommunications()
    }, 60000)

    // Process bulk communication jobs every 5 minutes
    setInterval(async () => {
      await this.processBulkCommunicationJobs()
    }, 300000)

    // Check escalation rules every hour
    setInterval(async () => {
      await this.checkEscalationRules()
    }, 3600000)

    // Daily communication analytics
    setInterval(async () => {
      await this.updateCommunicationAnalytics()
    }, 86400000)
  }

  private async processScheduledCommunications(): Promise<void> {
    const now = Date.now()
    const dueCommIds = await this.redis.zrangebyscore('communication_queue', 0, now)

    for (const commId of dueCommIds) {
      try {
        await this.processCommunication(commId)
        await this.redis.zrem('communication_queue', commId)
      } catch (error) {
        console.error(`Failed to process communication ${commId}:`, error)
      }
    }
  }

  private async processCommunication(communicationId: string): Promise<void> {
    const commData = await this.redis.get(`scheduled_comm:${communicationId}`)
    if (!commData) return

    const communication = JSON.parse(commData)
    if (communication.status !== 'scheduled') return

    const template = await this.getTemplate(communication.templateId)
    if (!template) {
      communication.status = 'failed'
      await this.redis.setex(`scheduled_comm:${communicationId}`, 86400 * 30, JSON.stringify(communication))
      return
    }

    // Check client preferences and optimal timing
    const clientPrefs = await this.getClientPreferences(communication.clientId)
    if (!this.shouldSendNow(clientPrefs, communication)) {
      // Reschedule for optimal time
      const optimalTime = await this.getOptimalSendTime(communication.clientId)
      communication.scheduledFor = optimalTime
      await this.redis.zadd('communication_queue', optimalTime.getTime(), communicationId)
      return
    }

    try {
      // Process the actual sending
      const success = await this.sendCommunication(communication, template)

      if (success) {
        communication.status = 'sent'
        communication.sentAt = new Date()
      } else {
        communication.status = 'failed'
        communication.attempts++
      }

    } catch (error) {
      communication.status = 'failed'
      communication.attempts++
      console.error(`Communication send failed:`, error)
    }

    // Update communication record
    await this.redis.setex(
      `scheduled_comm:${communicationId}`,
      86400 * 30,
      JSON.stringify(communication)
    )

    // Retry if failed and under max attempts
    if (communication.status === 'failed' && communication.attempts < communication.maxAttempts) {
      const retryTime = new Date(Date.now() + (communication.attempts * 3600000)) // Exponential backoff
      await this.redis.zadd('communication_queue', retryTime.getTime(), communicationId)
    }
  }

  private async sendCommunication(communication: any, template: any): Promise<boolean> {
    // Render template with context
    const content = this.renderTemplate(template.content, communication.context)
    const subject = this.renderTemplate(template.subject, communication.context)

    // Send via appropriate channel
    switch (communication.channel) {
      case 'email':
        return await this.sendEmail(communication.clientId, subject, content)
      case 'sms':
        return await this.sendSMS(communication.clientId, content)
      case 'portal_notification':
        return await this.sendPortalNotification(communication.clientId, subject, content)
      default:
        return false
    }
  }

  private renderTemplate(template: string, context: Record<string, any>): string {
    let rendered = template

    // Simple template variable replacement
    for (const [key, value] of Object.entries(context)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(placeholder, String(value))
    }

    return rendered
  }

  private shouldSendNow(clientPrefs: ClientPreferences | null, communication: any): boolean {
    if (!clientPrefs?.preferredContactHours) return true

    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(clientPrefs.preferredContactHours.start.split(':')[0])
    const endHour = parseInt(clientPrefs.preferredContactHours.end.split(':')[0])

    return currentHour >= startHour && currentHour <= endHour
  }

  private async processBulkCommunicationJobs(): Promise<void> {
    const now = Date.now()
    const dueJobIds = await this.redis.zrangebyscore('bulk_communication_queue', 0, now)

    for (const jobId of dueJobIds) {
      try {
        const jobData = await this.redis.get(`bulk_comm_job:${jobId}`)
        if (jobData) {
          const job = JSON.parse(jobData)
          await this.processBulkCommunicationJob(job)
          await this.redis.zrem('bulk_communication_queue', jobId)
        }
      } catch (error) {
        console.error(`Failed to process bulk job ${jobId}:`, error)
      }
    }
  }

  private async processBulkCommunicationJob(job: BulkCommunicationJob): Promise<void> {
    job.status = 'processing'

    for (const clientId of job.targetClients) {
      try {
        const context = await this.getBulkCommunicationContext(clientId, job.organizationId)

        await this.sendImmediateCommunication(
          clientId,
          job.templateId,
          context
        )

        job.progress.sent++
        job.progress.delivered++ // Assume delivery for now

      } catch (error) {
        job.progress.failed++
        job.progress.errors.push(`Client ${clientId}: ${error}`)
      }
    }

    job.status = 'completed'
    job.completedAt = new Date()

    // Update job
    await this.redis.setex(
      `bulk_comm_job:${job.id}`,
      86400 * 7,
      JSON.stringify(job)
    )

    console.log(`Completed bulk communication job ${job.id}: ${job.progress.sent}/${job.progress.total} sent`)
  }

  // UTILITY METHODS

  private async getClientsWithApproachingDeadlines(
    organizationId: string,
    daysBeforeDeadline: number,
    workflowStatuses: string[]
  ): Promise<string[]> {
    // This would query the database for clients with approaching deadlines
    // For now, return mock data
    return ['client_1', 'client_2', 'client_3']
  }

  private async getClientsByWorkflowStatus(
    organizationId: string,
    workflowStatuses: string[]
  ): Promise<string[]> {
    // This would query the database for clients by workflow status
    return ['client_4', 'client_5', 'client_6']
  }

  private async getBulkCommunicationContext(
    clientId: string,
    organizationId: string
  ): Promise<Record<string, any>> {
    // This would fetch relevant context for the client
    return {
      clientName: 'John Doe',
      taxYear: 2024,
      deadline: '2025-04-15',
      organizationId,
      preparerName: 'Jane Smith'
    }
  }

  private async scheduleClientCall(clientId: string, templateId?: string): Promise<void> {
    // Schedule a follow-up call
    console.log(`Scheduling call for client ${clientId}`)
  }

  private async assignSpecialist(clientId: string, specialistType?: string): Promise<void> {
    // Assign a specialist to handle the client
    console.log(`Assigning ${specialistType} specialist to client ${clientId}`)
  }

  private async notifyManager(clientId: string, ruleId: string, step: number): Promise<void> {
    // Notify manager about escalation
    console.log(`Notifying manager about client ${clientId} escalation (rule: ${ruleId}, step: ${step})`)
  }

  private async sendEmail(clientId: string, subject: string, content: string): Promise<boolean> {
    // Send actual email
    console.log(`Sending email to client ${clientId}: ${subject}`)
    return true
  }

  private async sendSMS(clientId: string, content: string): Promise<boolean> {
    // Send SMS
    console.log(`Sending SMS to client ${clientId}: ${content.substring(0, 50)}...`)
    return true
  }

  private async sendPortalNotification(clientId: string, subject: string, content: string): Promise<boolean> {
    // Send portal notification
    console.log(`Sending portal notification to client ${clientId}: ${subject}`)
    return true
  }

  private async updateCommunicationAnalytics(): Promise<void> {
    // Update daily communication analytics
    console.log('Updating communication analytics...')
  }
}

export type {
  CommunicationTemplateSchema,
  CommunicationScheduleSchema,
  BulkCommunicationJob,
  ClientPreferences,
  CommunicationMetrics,
  EscalationRule
}