/**
 * Client Success Service
 * Orchestrates all client success, retention, and satisfaction features
 */

import { PrismaClient } from '@prisma/client'
import { healthScoringEngine, ClientHealthData } from '@/lib/client-success/health-scoring-engine'
import { interventionEngine, InterventionExecution } from '@/lib/client-success/intervention-engine'
import { lifecycleManager, ClientLifecycleState } from '@/lib/client-success/lifecycle-management'
import { satisfactionMonitor, SurveyResponse, FeedbackItem } from '@/lib/client-success/satisfaction-monitoring'
import { retentionCampaignEngine, CampaignExecution } from '@/lib/client-success/retention-campaigns'

export interface ClientSuccessMetrics {
  portfolioHealth: {
    totalClients: number
    averageHealthScore: number
    healthyClients: number
    atRiskClients: number
    criticalClients: number
    improvingClients: number
    decliningClients: number
  }
  retentionMetrics: {
    retentionRate: number
    churnRate: number
    averageLifespan: number
    lifetimeValue: number
    renewalRate: number
  }
  satisfactionMetrics: {
    averageNPS: number
    averageSatisfaction: number
    responseRate: number
    detractorCount: number
    promoterCount: number
  }
  interventionMetrics: {
    activeInterventions: number
    completedInterventions: number
    successRate: number
    averageResolutionTime: number
  }
  campaignMetrics: {
    activeCampaigns: number
    totalReach: number
    averageConversionRate: number
    totalROI: number
  }
}

export interface ClientSuccessAlert {
  id: string
  clientId: string
  clientName: string
  type: 'health_decline' | 'payment_issue' | 'satisfaction_low' | 'renewal_risk' | 'no_engagement'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  daysActive: number
  assignedTo?: string
  actions: string[]
  createdAt: Date
}

export interface ClientSuccessAction {
  id: string
  clientId: string
  type: 'call' | 'meeting' | 'email' | 'review' | 'follow_up' | 'survey'
  title: string
  description: string
  dueDate: Date
  assignedTo: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  metadata?: Record<string, any>
}

export class ClientSuccessService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive client success metrics for organization
   */
  async getClientSuccessMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    segment?: string
  ): Promise<ClientSuccessMetrics> {
    // Get all clients for the organization
    const clients = await this.prisma.client.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(segment && segment !== 'all' ? this.getSegmentFilter(segment) : {}),
      },
      include: {
        invoices: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
        engagements: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
        documents: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    })

    // Calculate health metrics
    const healthMetrics = await this.calculatePortfolioHealthMetrics(clients)

    // Calculate retention metrics
    const retentionMetrics = await this.calculateRetentionMetrics(organizationId, startDate, endDate)

    // Calculate satisfaction metrics
    const satisfactionMetrics = await this.calculateSatisfactionMetrics(organizationId, startDate, endDate)

    // Calculate intervention metrics
    const interventionMetrics = this.calculateInterventionMetrics(organizationId, startDate, endDate)

    // Calculate campaign metrics
    const campaignMetrics = this.calculateCampaignMetrics(organizationId, startDate, endDate)

    return {
      portfolioHealth: healthMetrics,
      retentionMetrics,
      satisfactionMetrics,
      interventionMetrics,
      campaignMetrics,
    }
  }

  /**
   * Process client health scoring for all clients
   */
  async processClientHealthScoring(organizationId: string): Promise<ClientHealthData[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'active',
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        engagements: {
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    const healthData: ClientHealthData[] = []

    for (const client of clients) {
      try {
        // Calculate health score using the health scoring engine
        const clientHealthData = await healthScoringEngine.calculateHealthScore(client)
        healthData.push(clientHealthData)

        // Store health score in database (you might want to create a health_scores table)
        await this.storeHealthScore(client.id, clientHealthData)

        // Evaluate for interventions
        await this.evaluateClientForInterventions(client, clientHealthData)

        // Evaluate for campaigns
        await this.evaluateClientForCampaigns(client, clientHealthData)

      } catch (error) {
        console.error(`Error processing health score for client ${client.id}:`, error)
      }
    }

    return healthData
  }

  /**
   * Get client success alerts
   */
  async getClientSuccessAlerts(organizationId: string): Promise<ClientSuccessAlert[]> {
    const alerts: ClientSuccessAlert[] = []

    // Get health-based alerts
    const healthAlerts = await this.getHealthBasedAlerts(organizationId)
    alerts.push(...healthAlerts)

    // Get payment-based alerts
    const paymentAlerts = await this.getPaymentBasedAlerts(organizationId)
    alerts.push(...paymentAlerts)

    // Get satisfaction-based alerts
    const satisfactionAlerts = await this.getSatisfactionBasedAlerts(organizationId)
    alerts.push(...satisfactionAlerts)

    // Get engagement-based alerts
    const engagementAlerts = await this.getEngagementBasedAlerts(organizationId)
    alerts.push(...engagementAlerts)

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  /**
   * Get upcoming client success actions
   */
  async getUpcomingActions(organizationId: string, days: number = 30): Promise<ClientSuccessAction[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    const actions: ClientSuccessAction[] = []

    // Get scheduled tasks
    const tasks = await this.prisma.task.findMany({
      where: {
        organizationId,
        dueDate: { lte: cutoffDate },
        status: { in: ['pending', 'in_progress'] },
        engagement: {
          client: { status: 'active' },
        },
      },
      include: {
        engagement: {
          include: {
            client: true,
          },
        },
        assignedTo: true,
      },
    })

    for (const task of tasks) {
      if (task.engagement?.client) {
        actions.push({
          id: task.id,
          clientId: task.engagement.client.id,
          type: this.mapTaskTypeToActionType(task.taskType),
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate!,
          assignedTo: task.assignedTo?.name || 'Unassigned',
          priority: this.mapTaskPriorityToActionPriority(task.priority),
          status: this.mapTaskStatusToActionStatus(task.status),
        })
      }
    }

    // Get lifecycle-based actions
    const lifecycleActions = await this.getLifecycleBasedActions(organizationId)
    actions.push(...lifecycleActions)

    return actions.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  /**
   * Create client satisfaction survey
   */
  async createSatisfactionSurvey(
    clientId: string,
    templateId: string,
    customizations?: any
  ): Promise<string> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    return await satisfactionMonitor.deploySurvey(templateId, clientId, customizations)
  }

  /**
   * Submit satisfaction survey response
   */
  async submitSatisfactionSurvey(
    surveyId: string,
    clientId: string,
    responses: any[]
  ): Promise<SurveyResponse> {
    const surveyResponse = await satisfactionMonitor.submitSurveyResponse(surveyId, clientId, responses)

    // Create follow-up actions based on response
    await this.createSurveyFollowUpActions(surveyResponse)

    return surveyResponse
  }

  /**
   * Add client feedback
   */
  async addClientFeedback(
    clientId: string,
    content: string,
    source: string,
    type: string,
    category: string
  ): Promise<FeedbackItem> {
    return await satisfactionMonitor.addFeedbackItem({
      clientId,
      source: source as any,
      type: type as any,
      category,
      priority: 'medium',
      sentiment: 'neutral',
      content,
      status: 'new',
      clientVisible: true,
      tags: [],
      attachments: [],
    })
  }

  /**
   * Start retention campaign for client
   */
  async startRetentionCampaign(campaignId: string, clientId: string): Promise<string> {
    return await retentionCampaignEngine.startCampaignForClient(campaignId, clientId)
  }

  /**
   * Update client lifecycle stage
   */
  async updateClientLifecycleStage(
    clientId: string,
    newStage: string,
    reason?: string
  ): Promise<ClientLifecycleState> {
    return await lifecycleManager.moveToStage(clientId, newStage, reason)
  }

  /**
   * Complete client milestone
   */
  async completeClientMilestone(clientId: string, milestoneId: string): Promise<ClientLifecycleState> {
    return await lifecycleManager.completeMilestone(clientId, milestoneId)
  }

  // Private helper methods

  private getSegmentFilter(segment: string) {
    switch (segment) {
      case 'enterprise':
        return { annualRevenue: { gte: 1000000 } }
      case 'smb':
        return { annualRevenue: { lt: 1000000 } }
      case 'high_value':
        return {
          OR: [
            { annualRevenue: { gte: 500000 } },
            { riskLevel: 'low' },
          ]
        }
      default:
        return {}
    }
  }

  private async calculatePortfolioHealthMetrics(clients: any[]) {
    const totalClients = clients.length

    // This would integrate with the health scoring engine
    // For now, using mock calculations
    const healthyClients = Math.floor(totalClients * 0.7)
    const atRiskClients = Math.floor(totalClients * 0.22)
    const criticalClients = totalClients - healthyClients - atRiskClients

    return {
      totalClients,
      averageHealthScore: 78.5,
      healthyClients,
      atRiskClients,
      criticalClients,
      improvingClients: Math.floor(totalClients * 0.35),
      decliningClients: Math.floor(totalClients * 0.12),
    }
  }

  private async calculateRetentionMetrics(organizationId: string, startDate: Date, endDate: Date) {
    // Calculate retention metrics from client data
    const totalClients = await this.prisma.client.count({
      where: { organizationId, createdAt: { lt: startDate } },
    })

    const churned = await this.prisma.client.count({
      where: {
        organizationId,
        status: 'inactive',
        updatedAt: { gte: startDate, lte: endDate },
      },
    })

    const retentionRate = totalClients > 0 ? ((totalClients - churned) / totalClients) * 100 : 0
    const churnRate = 100 - retentionRate

    return {
      retentionRate: Math.round(retentionRate * 10) / 10,
      churnRate: Math.round(churnRate * 10) / 10,
      averageLifespan: 1095, // 3 years in days
      lifetimeValue: 45000,
      renewalRate: 87.5,
    }
  }

  private async calculateSatisfactionMetrics(organizationId: string, startDate: Date, endDate: Date) {
    // This would integrate with the satisfaction monitoring system
    return {
      averageNPS: 42,
      averageSatisfaction: 8.2,
      responseRate: 68.5,
      detractorCount: 8,
      promoterCount: 54,
    }
  }

  private calculateInterventionMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const stats = interventionEngine.getInterventionStats(organizationId)

    return {
      activeInterventions: stats.activeInterventions,
      completedInterventions: stats.successfulInterventions,
      successRate: Math.round((stats.successfulInterventions / stats.totalInterventions) * 100),
      averageResolutionTime: stats.averageResolutionTime / 24, // Convert to days
    }
  }

  private calculateCampaignMetrics(organizationId: string, startDate: Date, endDate: Date) {
    const campaigns = retentionCampaignEngine.getAllCampaigns()
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length

    return {
      activeCampaigns,
      totalReach: 245,
      averageConversionRate: 18.5,
      totalROI: 320,
    }
  }

  private async storeHealthScore(clientId: string, healthData: ClientHealthData) {
    // Store health score in database
    // You might want to create a client_health_scores table
    try {
      await this.prisma.client.update({
        where: { id: clientId },
        data: {
          customFields: {
            ...((await this.prisma.client.findUnique({ where: { id: clientId } }))?.customFields as any || {}),
            healthScore: healthData.overallScore,
            healthGrade: healthData.healthGrade,
            riskLevel: healthData.riskLevel,
            churnProbability: healthData.churnProbability,
            lastHealthUpdate: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Error storing health score:', error)
    }
  }

  private async evaluateClientForInterventions(client: any, healthData: ClientHealthData) {
    try {
      const triggeredInterventions = await interventionEngine.evaluateClient(healthData, client)

      for (const intervention of triggeredInterventions) {
        console.log(`Triggered intervention ${intervention.ruleId} for client ${client.id}`)
      }
    } catch (error) {
      console.error('Error evaluating interventions:', error)
    }
  }

  private async evaluateClientForCampaigns(client: any, healthData: ClientHealthData) {
    try {
      const triggeredCampaigns = await retentionCampaignEngine.evaluateClientForCampaigns(client, healthData)

      for (const campaignId of triggeredCampaigns) {
        await retentionCampaignEngine.startCampaignForClient(campaignId, client.id)
        console.log(`Started campaign ${campaignId} for client ${client.id}`)
      }
    } catch (error) {
      console.error('Error evaluating campaigns:', error)
    }
  }

  private async getHealthBasedAlerts(organizationId: string): Promise<ClientSuccessAlert[]> {
    const alerts: ClientSuccessAlert[] = []

    const clients = await this.prisma.client.findMany({
      where: {
        organizationId,
        status: 'active',
        customFields: {
          path: ['healthScore'],
          lt: 60,
        },
      },
    })

    for (const client of clients) {
      const healthScore = (client.customFields as any)?.healthScore || 0

      alerts.push({
        id: `health_${client.id}`,
        clientId: client.id,
        clientName: client.businessName,
        type: 'health_decline',
        severity: healthScore < 40 ? 'critical' : healthScore < 50 ? 'high' : 'medium',
        message: `Client health score has declined to ${healthScore}`,
        daysActive: 7, // This would be calculated from when the alert was first created
        assignedTo: 'Account Manager',
        actions: ['Schedule health review call', 'Analyze recent interactions', 'Create intervention plan'],
        createdAt: new Date(),
      })
    }

    return alerts
  }

  private async getPaymentBasedAlerts(organizationId: string): Promise<ClientSuccessAlert[]> {
    const alerts: ClientSuccessAlert[] = []

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'sent',
        dueDate: { lt: new Date() },
        client: { status: 'active' },
      },
      include: {
        client: true,
      },
    })

    const clientsWithOverdue = new Map<string, any[]>()

    for (const invoice of overdueInvoices) {
      const clientInvoices = clientsWithOverdue.get(invoice.clientId) || []
      clientInvoices.push(invoice)
      clientsWithOverdue.set(invoice.clientId, clientInvoices)
    }

    for (const [clientId, invoices] of clientsWithOverdue) {
      const client = invoices[0].client
      const totalOverdue = invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0)
      const daysOverdue = Math.max(...invoices.map(inv =>
        Math.floor((Date.now() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      ))

      alerts.push({
        id: `payment_${clientId}`,
        clientId,
        clientName: client.businessName,
        type: 'payment_issue',
        severity: daysOverdue > 60 ? 'critical' : daysOverdue > 30 ? 'high' : 'medium',
        message: `${invoices.length} overdue invoices totaling $${totalOverdue.toLocaleString()}`,
        daysActive: daysOverdue,
        assignedTo: 'Billing Specialist',
        actions: ['Send payment reminder', 'Schedule payment call', 'Review payment terms'],
        createdAt: new Date(),
      })
    }

    return alerts
  }

  private async getSatisfactionBasedAlerts(organizationId: string): Promise<ClientSuccessAlert[]> {
    // This would integrate with satisfaction monitoring
    // For now, returning mock alerts
    return []
  }

  private async getEngagementBasedAlerts(organizationId: string): Promise<ClientSuccessAlert[]> {
    const alerts: ClientSuccessAlert[] = []

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const disengagedClients = await this.prisma.client.findMany({
      where: {
        organizationId,
        status: 'active',
        documents: {
          none: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        notes: {
          none: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    })

    for (const client of disengagedClients) {
      alerts.push({
        id: `engagement_${client.id}`,
        clientId: client.id,
        clientName: client.businessName,
        type: 'no_engagement',
        severity: 'medium',
        message: 'No client activity for over 30 days',
        daysActive: 30,
        assignedTo: 'Client Success Manager',
        actions: ['Schedule check-in call', 'Send engagement survey', 'Review service utilization'],
        createdAt: new Date(),
      })
    }

    return alerts
  }

  private async getLifecycleBasedActions(organizationId: string): Promise<ClientSuccessAction[]> {
    // This would integrate with lifecycle management
    // For now, returning mock actions
    return []
  }

  private async createSurveyFollowUpActions(surveyResponse: SurveyResponse) {
    // Create follow-up actions based on survey response
    if (surveyResponse.npsScore !== undefined && surveyResponse.npsScore <= 6) {
      // Create task for detractor follow-up
      console.log(`Creating detractor follow-up for client ${surveyResponse.clientId}`)
    }

    if (surveyResponse.overallSatisfaction !== undefined && surveyResponse.overallSatisfaction < 7) {
      // Create task for satisfaction improvement
      console.log(`Creating satisfaction improvement task for client ${surveyResponse.clientId}`)
    }
  }

  private mapTaskTypeToActionType(taskType: string): ClientSuccessAction['type'] {
    const mapping: Record<string, ClientSuccessAction['type']> = {
      'client_meeting': 'meeting',
      'client_call': 'call',
      'follow_up': 'follow_up',
      'document_review': 'review',
      'email_communication': 'email',
    }
    return mapping[taskType] || 'review'
  }

  private mapTaskPriorityToActionPriority(priority: string): ClientSuccessAction['priority'] {
    const mapping: Record<string, ClientSuccessAction['priority']> = {
      'urgent': 'urgent',
      'high': 'high',
      'normal': 'medium',
      'low': 'low',
    }
    return mapping[priority] || 'medium'
  }

  private mapTaskStatusToActionStatus(status: string): ClientSuccessAction['status'] {
    const mapping: Record<string, ClientSuccessAction['status']> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
    }
    return mapping[status] || 'pending'
  }
}

export default ClientSuccessService