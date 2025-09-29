import { Redis } from 'ioredis'
import { prisma } from '../db'
import { z } from 'zod'
import { addDays, subDays, isBefore, isAfter, differenceInDays } from 'date-fns'

// Tax workflow schemas
const TaxDocumentSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  organizationId: z.string(),
  documentType: z.enum([
    'W2', '1099_MISC', '1099_NEC', '1099_INT', '1099_DIV', '1099_B', '1099_R',
    'K1_PARTNERSHIP', 'K1_S_CORP', '1098_T', '1098_E', '1095_A', '5498',
    'RECEIPT', 'PRIOR_YEAR_RETURN', 'ORGANIZER', 'OTHER'
  ]),
  taxYear: z.number(),
  status: z.enum(['pending', 'processing', 'reviewed', 'approved', 'missing']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  deadlineDate: z.date(),
  uploadedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  metadata: z.record(z.any()).optional()
})

const TaxWorkflowSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  organizationId: z.string(),
  taxYear: z.number(),
  status: z.enum([
    'organizer_sent', 'documents_pending', 'documents_received',
    'in_preparation', 'ready_for_review', 'client_review',
    'ready_to_file', 'filed', 'completed'
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  deadlineType: z.enum(['standard', 'extension', 'amended']),
  deadlineDate: z.date(),
  estimatedCompletion: z.date().optional(),
  clientCommunication: z.object({
    lastContact: z.date().optional(),
    pendingRequests: z.array(z.string()),
    automatedReminders: z.boolean().default(true)
  }),
  documents: z.array(TaxDocumentSchema),
  checklist: z.array(z.object({
    item: z.string(),
    completed: z.boolean(),
    completedAt: z.date().optional(),
    assignedTo: z.string().optional()
  })),
  timeTracking: z.object({
    estimatedHours: z.number(),
    actualHours: z.number(),
    billableHours: z.number()
  }),
  qualityControl: z.object({
    reviewPassed: z.boolean().optional(),
    reviewNotes: z.string().optional(),
    reviewedBy: z.string().optional(),
    reviewedAt: z.date().optional()
  })
})

interface WorkflowAutomationRule {
  id: string
  name: string
  trigger: {
    event: 'document_uploaded' | 'deadline_approaching' | 'status_change' | 'time_based'
    conditions: Record<string, any>
  }
  actions: Array<{
    type: 'send_email' | 'create_task' | 'update_status' | 'assign_preparer' | 'escalate'
    config: Record<string, any>
  }>
  active: boolean
  priority: number
}

interface TaxSeasonMetrics {
  totalWorkflows: number
  completedWorkflows: number
  pendingWorkflows: number
  overdueBu
  averageCompletionTime: number
  preparerWorkload: Record<string, {
    assigned: number
    completed: number
    overdue: number
    efficiency: number
  }>
  documentProcessingStats: {
    totalDocuments: number
    processedDocuments: number
    averageProcessingTime: number
    errorRate: number
  }
  clientCommunicationStats: {
    responseRate: number
    averageResponseTime: number
    escalatedRequests: number
  }
}

interface BulkProcessingJob {
  id: string
  type: 'bulk_reminder' | 'bulk_status_update' | 'bulk_assignment' | 'bulk_document_request'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  targetWorkflows: string[]
  config: Record<string, any>
  progress: {
    total: number
    processed: number
    errors: number
  }
  createdAt: Date
  completedAt?: Date
}

export class TaxSeasonWorkflowAutomationService {
  private readonly STANDARD_TAX_DEADLINE = '04-15'
  private readonly EXTENSION_DEADLINE = '10-15'

  private readonly WORKFLOW_PRIORITIES = {
    URGENT: { daysBeforeDeadline: 3, multiplier: 4 },
    HIGH: { daysBeforeDeadline: 7, multiplier: 3 },
    NORMAL: { daysBeforeDeadline: 14, multiplier: 2 },
    LOW: { daysBeforeDeadline: 30, multiplier: 1 }
  }

  private readonly AUTOMATION_RULES: WorkflowAutomationRule[] = [
    {
      id: 'deadline_reminder_urgent',
      name: 'Urgent Deadline Reminder',
      trigger: {
        event: 'time_based',
        conditions: { daysBeforeDeadline: 3, status: ['documents_pending', 'in_preparation'] }
      },
      actions: [
        { type: 'send_email', config: { template: 'urgent_deadline_reminder' } },
        { type: 'escalate', config: { to: 'manager', reason: 'urgent_deadline' } }
      ],
      active: true,
      priority: 1
    },
    {
      id: 'document_auto_classification',
      name: 'Auto-classify Tax Documents',
      trigger: {
        event: 'document_uploaded',
        conditions: { documentType: 'unknown' }
      },
      actions: [
        { type: 'create_task', config: { action: 'classify_document', assignTo: 'ai_processor' } }
      ],
      active: true,
      priority: 2
    },
    {
      id: 'auto_assign_preparer',
      name: 'Auto-assign Preparer',
      trigger: {
        event: 'status_change',
        conditions: { newStatus: 'documents_received', assignedTo: null }
      },
      actions: [
        { type: 'assign_preparer', config: { algorithm: 'load_balancing' } }
      ],
      active: true,
      priority: 3
    }
  ]

  constructor(private redis: Redis) {
    this.initializeWorkflowAutomation()
  }

  // WORKFLOW MANAGEMENT

  async createTaxWorkflow(workflowData: Partial<z.infer<typeof TaxWorkflowSchema>>): Promise<string> {
    const workflowId = `tax_workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Set appropriate deadline based on tax year and current date
    const deadlineDate = this.calculateDeadline(workflowData.taxYear!, workflowData.deadlineType || 'standard')

    // Generate standard checklist based on client type and complexity
    const checklist = await this.generateWorkflowChecklist(workflowData)

    // Calculate priority based on deadline proximity
    const priority = this.calculateWorkflowPriority(deadlineDate)

    const workflow = {
      id: workflowId,
      clientId: workflowData.clientId!,
      organizationId: workflowData.organizationId!,
      taxYear: workflowData.taxYear!,
      status: 'organizer_sent' as const,
      priority,
      deadlineType: workflowData.deadlineType || 'standard' as const,
      deadlineDate,
      clientCommunication: {
        pendingRequests: [],
        automatedReminders: true
      },
      documents: [],
      checklist,
      timeTracking: {
        estimatedHours: await this.estimateWorkflowHours(workflowData),
        actualHours: 0,
        billableHours: 0
      },
      qualityControl: {}
    }

    // Store workflow
    await this.redis.setex(
      `tax_workflow:${workflowId}`,
      86400 * 365, // Store for 1 year
      JSON.stringify(workflow)
    )

    // Add to organization workflow index
    await this.redis.sadd(`org_workflows:${workflowData.organizationId}`, workflowId)

    // Trigger automation rules
    await this.executeAutomationRules('status_change', {
      workflowId,
      newStatus: 'organizer_sent',
      workflow
    })

    return workflowId
  }

  async updateWorkflowStatus(
    workflowId: string,
    newStatus: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error('Workflow not found')
    }

    const oldStatus = workflow.status
    workflow.status = newStatus as any

    // Update metadata if provided
    if (metadata) {
      workflow.metadata = { ...workflow.metadata, ...metadata }
    }

    // Auto-assign preparer if moving to documents_received and no assignee
    if (newStatus === 'documents_received' && !workflow.assignedTo) {
      const assignedPreparer = await this.autoAssignPreparer(workflow)
      if (assignedPreparer) {
        workflow.assignedTo = assignedPreparer
      }
    }

    // Update estimated completion date
    if (newStatus === 'in_preparation') {
      workflow.estimatedCompletion = this.calculateEstimatedCompletion(workflow)
    }

    // Store updated workflow
    await this.redis.setex(
      `tax_workflow:${workflowId}`,
      86400 * 365,
      JSON.stringify(workflow)
    )

    // Trigger automation rules
    await this.executeAutomationRules('status_change', {
      workflowId,
      oldStatus,
      newStatus,
      workflow
    })

    // Update metrics
    await this.updateWorkflowMetrics(workflow.organizationId, oldStatus, newStatus)
  }

  async bulkUpdateWorkflows(
    workflowIds: string[],
    updates: Partial<z.infer<typeof TaxWorkflowSchema>>
  ): Promise<BulkProcessingJob> {
    const jobId = `bulk_update_${Date.now()}`

    const job: BulkProcessingJob = {
      id: jobId,
      type: 'bulk_status_update',
      status: 'queued',
      targetWorkflows: workflowIds,
      config: updates,
      progress: {
        total: workflowIds.length,
        processed: 0,
        errors: 0
      },
      createdAt: new Date()
    }

    // Store job
    await this.redis.setex(
      `bulk_job:${jobId}`,
      86400, // 24 hours
      JSON.stringify(job)
    )

    // Process in background
    this.processBulkJob(job)

    return job
  }

  // DOCUMENT PROCESSING

  async processDocumentUpload(
    workflowId: string,
    documentData: Partial<z.infer<typeof TaxDocumentSchema>>
  ): Promise<string> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error('Workflow not found')
    }

    const documentId = `tax_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const document = {
      id: documentId,
      clientId: workflow.clientId,
      organizationId: workflow.organizationId,
      documentType: documentData.documentType || 'OTHER' as const,
      taxYear: workflow.taxYear,
      status: 'processing' as const,
      priority: workflow.priority,
      deadlineDate: workflow.deadlineDate,
      uploadedAt: new Date(),
      metadata: documentData.metadata || {}
    }

    // Add document to workflow
    workflow.documents.push(document)

    // Auto-classify document if type is unknown
    if (document.documentType === 'OTHER') {
      const classifiedType = await this.classifyDocument(document)
      document.documentType = classifiedType
    }

    // Check if this completes document requirements
    const documentRequirements = await this.getDocumentRequirements(workflow)
    const completionStatus = this.checkDocumentCompletion(workflow.documents, documentRequirements)

    // Update workflow status if all documents received
    if (completionStatus.allReceived && workflow.status === 'documents_pending') {
      await this.updateWorkflowStatus(workflowId, 'documents_received')
    }

    // Store updated workflow
    await this.redis.setex(
      `tax_workflow:${workflowId}`,
      86400 * 365,
      JSON.stringify(workflow)
    )

    // Trigger automation rules
    await this.executeAutomationRules('document_uploaded', {
      workflowId,
      documentId,
      document,
      workflow
    })

    return documentId
  }

  async bulkDocumentProcessing(documentIds: string[]): Promise<BulkProcessingJob> {
    const jobId = `bulk_doc_process_${Date.now()}`

    const job: BulkProcessingJob = {
      id: jobId,
      type: 'bulk_document_request',
      status: 'queued',
      targetWorkflows: [], // Will be populated based on documents
      config: { documentIds },
      progress: {
        total: documentIds.length,
        processed: 0,
        errors: 0
      },
      createdAt: new Date()
    }

    // Store job
    await this.redis.setex(
      `bulk_job:${jobId}`,
      86400,
      JSON.stringify(job)
    )

    // Process in background
    this.processBulkDocumentJob(job)

    return job
  }

  // PRIORITY AND WORKLOAD MANAGEMENT

  async rebalanceWorkloads(organizationId: string): Promise<void> {
    const workflows = await this.getOrganizationWorkflows(organizationId)
    const preparers = await this.getAvailablePreparers(organizationId)

    // Calculate current workloads
    const workloads = new Map<string, {
      assigned: number
      estimatedHours: number
      overdue: number
    }>()

    for (const workflow of workflows) {
      if (workflow.assignedTo) {
        const current = workloads.get(workflow.assignedTo) || {
          assigned: 0,
          estimatedHours: 0,
          overdue: 0
        }

        current.assigned++
        current.estimatedHours += workflow.timeTracking.estimatedHours
        if (isBefore(workflow.deadlineDate, new Date())) {
          current.overdue++
        }

        workloads.set(workflow.assignedTo, current)
      }
    }

    // Redistribute overloaded workflows
    const redistributions: Array<{ workflowId: string; from: string; to: string }> = []

    for (const [preparerId, workload] of workloads) {
      if (workload.estimatedHours > 40) { // Overloaded threshold
        // Find workflows to redistribute
        const preparerWorkflows = workflows.filter(w => w.assignedTo === preparerId)
        const lowestPriorityWorkflows = preparerWorkflows
          .filter(w => w.status === 'documents_received' || w.status === 'in_preparation')
          .sort((a, b) => {
            // Sort by priority and deadline
            const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          })

        // Find least loaded preparer
        const leastLoaded = Array.from(workloads.entries())
          .sort((a, b) => a[1].estimatedHours - b[1].estimatedHours)[0]

        if (leastLoaded && leastLoaded[1].estimatedHours < 30) {
          for (const workflow of lowestPriorityWorkflows.slice(0, 2)) {
            redistributions.push({
              workflowId: workflow.id,
              from: preparerId,
              to: leastLoaded[0]
            })

            // Update workload tracking
            workload.estimatedHours -= workflow.timeTracking.estimatedHours
            leastLoaded[1].estimatedHours += workflow.timeTracking.estimatedHours

            if (workload.estimatedHours <= 35) break // Stop when balanced
          }
        }
      }
    }

    // Apply redistributions
    for (const redistribution of redistributions) {
      await this.reassignWorkflow(
        redistribution.workflowId,
        redistribution.to,
        `Workload rebalancing: ${redistribution.from} -> ${redistribution.to}`
      )
    }

    console.log(`Rebalanced ${redistributions.length} workflows for organization ${organizationId}`)
  }

  async getPriorityQueue(organizationId: string): Promise<any[]> {
    const workflows = await this.getOrganizationWorkflows(organizationId)

    // Calculate priority scores
    const prioritizedWorkflows = workflows.map(workflow => {
      const daysToDeadline = differenceInDays(workflow.deadlineDate, new Date())
      const complexityScore = workflow.timeTracking.estimatedHours / 10 // Normalize to 0-1 scale
      const documentCompleteness = workflow.documents.length / 5 // Assume 5 documents average

      // Priority scoring algorithm
      let priorityScore = 0

      // Deadline urgency (50% weight)
      if (daysToDeadline <= 0) priorityScore += 100 // Overdue
      else if (daysToDeadline <= 3) priorityScore += 80 // Critical
      else if (daysToDeadline <= 7) priorityScore += 60 // High
      else if (daysToDeadline <= 14) priorityScore += 40 // Medium
      else priorityScore += 20 // Low

      // Document readiness (30% weight)
      priorityScore += documentCompleteness * 30

      // Complexity factor (20% weight)
      priorityScore += (1 - complexityScore) * 20 // Lower complexity = higher priority

      return {
        ...workflow,
        priorityScore,
        daysToDeadline,
        documentCompleteness: Math.round(documentCompleteness * 100)
      }
    })

    return prioritizedWorkflows
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 50) // Top 50 priority items
  }

  // AUTOMATION RULES ENGINE

  private async executeAutomationRules(
    triggerEvent: string,
    context: Record<string, any>
  ): Promise<void> {
    const applicableRules = this.AUTOMATION_RULES
      .filter(rule => rule.active && rule.trigger.event === triggerEvent)
      .sort((a, b) => a.priority - b.priority)

    for (const rule of applicableRules) {
      if (await this.evaluateRuleConditions(rule.trigger.conditions, context)) {
        await this.executeRuleActions(rule.actions, context)
      }
    }
  }

  private async evaluateRuleConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): Promise<boolean> {
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'daysBeforeDeadline':
          if (context.workflow) {
            const days = differenceInDays(context.workflow.deadlineDate, new Date())
            if (days !== value) return false
          }
          break
        case 'status':
          if (Array.isArray(value)) {
            if (!value.includes(context.newStatus || context.workflow?.status)) return false
          } else {
            if (context.newStatus !== value && context.workflow?.status !== value) return false
          }
          break
        case 'documentType':
          if (context.document?.documentType !== value) return false
          break
        case 'assignedTo':
          if (context.workflow?.assignedTo !== value) return false
          break
      }
    }

    return true
  }

  private async executeRuleActions(
    actions: Array<{ type: string; config: Record<string, any> }>,
    context: Record<string, any>
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_email':
            await this.sendAutomatedEmail(action.config, context)
            break
          case 'create_task':
            await this.createAutomatedTask(action.config, context)
            break
          case 'update_status':
            await this.updateWorkflowStatus(context.workflowId, action.config.status)
            break
          case 'assign_preparer':
            await this.autoAssignPreparer(context.workflow)
            break
          case 'escalate':
            await this.escalateWorkflow(context.workflowId, action.config)
            break
        }
      } catch (error) {
        console.error(`Failed to execute automation action ${action.type}:`, error)
      }
    }
  }

  // CLIENT COMMUNICATION AUTOMATION

  async sendBulkReminders(
    organizationId: string,
    reminderType: 'document_request' | 'deadline_reminder' | 'status_update',
    targetWorkflows?: string[]
  ): Promise<BulkProcessingJob> {
    const workflowIds = targetWorkflows || await this.getEligibleWorkflowsForReminder(organizationId, reminderType)

    const jobId = `bulk_reminder_${Date.now()}`

    const job: BulkProcessingJob = {
      id: jobId,
      type: 'bulk_reminder',
      status: 'queued',
      targetWorkflows: workflowIds,
      config: { reminderType },
      progress: {
        total: workflowIds.length,
        processed: 0,
        errors: 0
      },
      createdAt: new Date()
    }

    // Store job
    await this.redis.setex(
      `bulk_job:${jobId}`,
      86400,
      JSON.stringify(job)
    )

    // Process in background
    this.processBulkReminderJob(job)

    return job
  }

  // METRICS AND REPORTING

  async getTaxSeasonMetrics(organizationId: string): Promise<TaxSeasonMetrics> {
    const workflows = await this.getOrganizationWorkflows(organizationId)

    const totalWorkflows = workflows.length
    const completedWorkflows = workflows.filter(w => w.status === 'completed').length
    const pendingWorkflows = workflows.filter(w =>
      ['organizer_sent', 'documents_pending', 'documents_received', 'in_preparation'].includes(w.status)
    ).length
    const overdueWorkflows = workflows.filter(w =>
      isBefore(w.deadlineDate, new Date()) && w.status !== 'completed'
    ).length

    // Calculate average completion time
    const completedWithTimes = workflows.filter(w =>
      w.status === 'completed' && w.timeTracking.actualHours > 0
    )
    const averageCompletionTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, w) => sum + w.timeTracking.actualHours, 0) / completedWithTimes.length
      : 0

    // Preparer workload analysis
    const preparerWorkload: Record<string, any> = {}
    const preparers = [...new Set(workflows.map(w => w.assignedTo).filter(Boolean))]

    for (const preparerId of preparers) {
      const preparerWorkflows = workflows.filter(w => w.assignedTo === preparerId)
      const completed = preparerWorkflows.filter(w => w.status === 'completed')
      const overdue = preparerWorkflows.filter(w =>
        isBefore(w.deadlineDate, new Date()) && w.status !== 'completed'
      )

      preparerWorkload[preparerId] = {
        assigned: preparerWorkflows.length,
        completed: completed.length,
        overdue: overdue.length,
        efficiency: completed.length > 0
          ? completed.reduce((sum, w) => sum + w.timeTracking.billableHours, 0) /
            completed.reduce((sum, w) => sum + w.timeTracking.actualHours, 1)
          : 0
      }
    }

    // Document processing stats
    const allDocuments = workflows.flatMap(w => w.documents)
    const processedDocuments = allDocuments.filter(d => d.status === 'approved')

    const documentProcessingStats = {
      totalDocuments: allDocuments.length,
      processedDocuments: processedDocuments.length,
      averageProcessingTime: 2.5, // Mock value - would calculate from actual data
      errorRate: 0.02 // Mock value
    }

    // Client communication stats
    const clientCommunicationStats = {
      responseRate: 0.85, // Mock value
      averageResponseTime: 24, // Hours
      escalatedRequests: workflows.filter(w => w.priority === 'urgent').length
    }

    return {
      totalWorkflows,
      completedWorkflows,
      pendingWorkflows,
      overdueWorkflows,
      averageCompletionTime,
      preparerWorkload,
      documentProcessingStats,
      clientCommunicationStats
    }
  }

  // UTILITY METHODS

  private async initializeWorkflowAutomation(): void {
    // Start daily automation checks
    setInterval(async () => {
      await this.runDailyAutomationChecks()
    }, 86400000) // Every 24 hours

    // Process pending automation rules every hour
    setInterval(async () => {
      await this.processTimeBasedRules()
    }, 3600000) // Every hour
  }

  private async runDailyAutomationChecks(): Promise<void> {
    // Get all active organizations
    const organizationIds = await this.redis.smembers('active_organizations')

    for (const orgId of organizationIds) {
      try {
        // Check for deadline-approaching workflows
        await this.checkDeadlineApproaching(orgId)

        // Rebalance workloads if needed
        await this.rebalanceWorkloads(orgId)

        // Send automated reminders
        await this.sendScheduledReminders(orgId)
      } catch (error) {
        console.error(`Daily automation check failed for org ${orgId}:`, error)
      }
    }
  }

  private async processTimeBasedRules(): Promise<void> {
    const timeBasedRules = this.AUTOMATION_RULES.filter(rule => rule.trigger.event === 'time_based')

    for (const rule of timeBasedRules) {
      await this.executeTimeBased鎴勮ule(rule)
    }
  }

  private async executeTimeBasedRule(rule: WorkflowAutomationRule): Promise<void> {
    // This would query workflows that match the time-based conditions
    // and execute the rule actions
    console.log(`Executing time-based rule: ${rule.name}`)
  }

  private calculateDeadline(taxYear: number, deadlineType: string): Date {
    const year = taxYear + 1 // Tax deadline is in the year after tax year

    if (deadlineType === 'extension') {
      return new Date(year, 9, 15) // October 15
    }

    return new Date(year, 3, 15) // April 15
  }

  private calculateWorkflowPriority(deadlineDate: Date): 'low' | 'normal' | 'high' | 'urgent' {
    const daysToDeadline = differenceInDays(deadlineDate, new Date())

    if (daysToDeadline <= 3) return 'urgent'
    if (daysToDeadline <= 7) return 'high'
    if (daysToDeadline <= 14) return 'normal'
    return 'low'
  }

  private async generateWorkflowChecklist(workflowData: any): Promise<any[]> {
    // Generate standard checklist based on client type and complexity
    return [
      { item: 'Send tax organizer to client', completed: false },
      { item: 'Receive all required documents', completed: false },
      { item: 'Review and verify document completeness', completed: false },
      { item: 'Prepare tax return', completed: false },
      { item: 'Quality review', completed: false },
      { item: 'Client review and approval', completed: false },
      { item: 'File tax return', completed: false }
    ]
  }

  private async estimateWorkflowHours(workflowData: any): Promise<number> {
    // Estimate hours based on client complexity and document types
    // This would use ML models in production
    return 8 // Mock estimate
  }

  private calculateEstimatedCompletion(workflow: any): Date {
    const hoursRemaining = workflow.timeTracking.estimatedHours - workflow.timeTracking.actualHours
    const businessDaysNeeded = Math.ceil(hoursRemaining / 8) // 8 hours per day

    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + businessDaysNeeded)

    return completionDate
  }

  private async getWorkflow(workflowId: string): Promise<any> {
    const workflowData = await this.redis.get(`tax_workflow:${workflowId}`)
    return workflowData ? JSON.parse(workflowData) : null
  }

  private async getOrganizationWorkflows(organizationId: string): Promise<any[]> {
    const workflowIds = await this.redis.smembers(`org_workflows:${organizationId}`)
    const workflows = []

    for (const id of workflowIds) {
      const workflow = await this.getWorkflow(id)
      if (workflow) workflows.push(workflow)
    }

    return workflows
  }

  private async autoAssignPreparer(workflow: any): Promise<string | null> {
    // Implement load-balancing algorithm to assign preparer
    // This would consider current workload, expertise, and availability
    return 'preparer_123' // Mock assignment
  }

  private async classifyDocument(document: any): Promise<string> {
    // Use AI/ML to classify document type
    // For now, return mock classification
    return 'W2'
  }

  private async getDocumentRequirements(workflow: any): Promise<string[]> {
    // Return required document types based on client situation
    return ['W2', '1099_INT', '1098_E']
  }

  private checkDocumentCompletion(documents: any[], requirements: string[]): { allReceived: boolean; missing: string[] } {
    const receivedTypes = documents.map(d => d.documentType)
    const missing = requirements.filter(req => !receivedTypes.includes(req))

    return {
      allReceived: missing.length === 0,
      missing
    }
  }

  private async updateWorkflowMetrics(organizationId: string, oldStatus: string, newStatus: string): Promise<void> {
    // Update Redis metrics counters
    const metricsKey = `workflow_metrics:${organizationId}`

    await this.redis.hincrby(metricsKey, `status_${oldStatus}`, -1)
    await this.redis.hincrby(metricsKey, `status_${newStatus}`, 1)
  }

  private async processBulkJob(job: BulkProcessingJob): Promise<void> {
    // Process bulk job in background
    job.status = 'processing'

    for (const workflowId of job.targetWorkflows) {
      try {
        // Apply updates to workflow
        await this.applyBulkUpdates(workflowId, job.config)
        job.progress.processed++
      } catch (error) {
        job.progress.errors++
        console.error(`Bulk job error for workflow ${workflowId}:`, error)
      }
    }

    job.status = 'completed'
    job.completedAt = new Date()

    // Update job status
    await this.redis.setex(
      `bulk_job:${job.id}`,
      86400,
      JSON.stringify(job)
    )
  }

  private async processBulkDocumentJob(job: BulkProcessingJob): Promise<void> {
    // Similar to processBulkJob but for document operations
    console.log(`Processing bulk document job: ${job.id}`)
  }

  private async processBulkReminderJob(job: BulkProcessingJob): Promise<void> {
    // Process bulk reminder job
    console.log(`Processing bulk reminder job: ${job.id}`)
  }

  private async applyBulkUpdates(workflowId: string, updates: any): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) return

    // Apply updates
    Object.assign(workflow, updates)

    // Store updated workflow
    await this.redis.setex(
      `tax_workflow:${workflowId}`,
      86400 * 365,
      JSON.stringify(workflow)
    )
  }

  private async getAvailablePreparers(organizationId: string): Promise<string[]> {
    // Mock preparer list
    return ['preparer_1', 'preparer_2', 'preparer_3']
  }

  private async reassignWorkflow(workflowId: string, newAssignee: string, reason: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)
    if (workflow) {
      workflow.assignedTo = newAssignee
      workflow.reassignmentHistory = workflow.reassignmentHistory || []
      workflow.reassignmentHistory.push({
        timestamp: new Date(),
        reason,
        newAssignee
      })

      await this.redis.setex(
        `tax_workflow:${workflowId}`,
        86400 * 365,
        JSON.stringify(workflow)
      )
    }
  }

  private async sendAutomatedEmail(config: any, context: any): Promise<void> {
    // Send automated email
    console.log(`Sending automated email: ${config.template}`)
  }

  private async createAutomatedTask(config: any, context: any): Promise<void> {
    // Create automated task
    console.log(`Creating automated task: ${config.action}`)
  }

  private async escalateWorkflow(workflowId: string, config: any): Promise<void> {
    // Escalate workflow to manager
    console.log(`Escalating workflow ${workflowId} to ${config.to}`)
  }

  private async getEligibleWorkflowsForReminder(organizationId: string, reminderType: string): Promise<string[]> {
    // Get workflows eligible for specific reminder type
    const workflows = await this.getOrganizationWorkflows(organizationId)

    return workflows
      .filter(w => this.isEligibleForReminder(w, reminderType))
      .map(w => w.id)
  }

  private isEligibleForReminder(workflow: any, reminderType: string): boolean {
    const daysToDeadline = differenceInDays(workflow.deadlineDate, new Date())

    switch (reminderType) {
      case 'document_request':
        return workflow.status === 'documents_pending' && daysToDeadline <= 14
      case 'deadline_reminder':
        return daysToDeadline <= 7 && workflow.status !== 'completed'
      case 'status_update':
        return workflow.status === 'in_preparation' && daysToDeadline <= 10
      default:
        return false
    }
  }

  private async checkDeadlineApproaching(organizationId: string): Promise<void> {
    const workflows = await this.getOrganizationWorkflows(organizationId)

    for (const workflow of workflows) {
      const daysToDeadline = differenceInDays(workflow.deadlineDate, new Date())

      if (daysToDeadline <= 3 && workflow.status !== 'completed') {
        await this.executeAutomationRules('time_based', {
          workflowId: workflow.id,
          workflow,
          daysBeforeDeadline: daysToDeadline
        })
      }
    }
  }

  private async sendScheduledReminders(organizationId: string): Promise<void> {
    // Send scheduled daily reminders
    console.log(`Sending scheduled reminders for org: ${organizationId}`)
  }
}

export type {
  TaxWorkflowSchema,
  TaxDocumentSchema,
  WorkflowAutomationRule,
  TaxSeasonMetrics,
  BulkProcessingJob
}