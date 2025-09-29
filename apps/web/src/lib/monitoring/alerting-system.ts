import { Redis } from 'ioredis'

interface AlertRule {
  id: string
  name: string
  description: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains'
  threshold: number | string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  evaluationWindow: number // seconds
  consecutiveAlerts: number // number of consecutive failures before alerting
  cooldownPeriod: number // seconds before re-alerting
  tags: string[]
  channels: AlertChannel[]
  runbook?: string
}

interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty'
  config: Record<string, any>
  enabled: boolean
}

interface Alert {
  id: string
  ruleId: string
  ruleName: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metric: string
  currentValue: number | string
  threshold: number | string
  timestamp: Date
  status: 'firing' | 'resolved' | 'acknowledged'
  organizationId?: string
  userId?: string
  tags: string[]
  context: Record<string, any>
  resolvedAt?: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
}

interface AlertStats {
  totalAlerts: number
  alertsBySeverity: Record<string, number>
  alertsByRule: Record<string, number>
  meanTimeToResolution: number
  falsePositiveRate: number
  currentlyFiring: number
}

class AlertingSystem {
  private redis: Redis
  private rules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private alertHistory: Alert[] = []
  private evaluationInterval: NodeJS.Timeout | null = null

  constructor(redis: Redis) {
    this.redis = redis
    this.setupDefaultRules()
    this.startEvaluation()
  }

  private setupDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Performance alerts
      {
        id: 'high_response_time',
        name: 'High API Response Time',
        description: 'API response time is above acceptable threshold',
        metric: 'api.response_time.avg',
        condition: 'greater_than',
        threshold: 5000, // 5 seconds
        severity: 'high',
        enabled: true,
        evaluationWindow: 300, // 5 minutes
        consecutiveAlerts: 3,
        cooldownPeriod: 900, // 15 minutes
        tags: ['performance', 'api'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com'] }, enabled: true },
          { type: 'slack', config: { channel: '#alerts' }, enabled: true }
        ],
        runbook: 'https://docs.advisoros.com/runbooks/high-response-time'
      },

      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'API error rate is above acceptable threshold',
        metric: 'api.error_rate',
        condition: 'greater_than',
        threshold: 0.05, // 5%
        severity: 'critical',
        enabled: true,
        evaluationWindow: 180, // 3 minutes
        consecutiveAlerts: 2,
        cooldownPeriod: 600, // 10 minutes
        tags: ['reliability', 'api'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com', 'oncall@advisoros.com'] }, enabled: true },
          { type: 'pagerduty', config: { service_key: 'pd_service_key' }, enabled: true }
        ]
      },

      // Infrastructure alerts
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: 'System CPU usage is critically high',
        metric: 'system.cpu.usage',
        condition: 'greater_than',
        threshold: 85, // 85%
        severity: 'high',
        enabled: true,
        evaluationWindow: 300,
        consecutiveAlerts: 3,
        cooldownPeriod: 1800, // 30 minutes
        tags: ['infrastructure', 'cpu'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com'] }, enabled: true }
        ]
      },

      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'System memory usage is critically high',
        metric: 'system.memory.usage',
        condition: 'greater_than',
        threshold: 90, // 90%
        severity: 'critical',
        enabled: true,
        evaluationWindow: 180,
        consecutiveAlerts: 2,
        cooldownPeriod: 1200, // 20 minutes
        tags: ['infrastructure', 'memory'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com'] }, enabled: true },
          { type: 'slack', config: { channel: '#alerts' }, enabled: true }
        ]
      },

      // Database alerts
      {
        id: 'slow_database_queries',
        name: 'Slow Database Queries',
        description: 'Database queries are taking too long',
        metric: 'database.query_time.avg',
        condition: 'greater_than',
        threshold: 2000, // 2 seconds
        severity: 'medium',
        enabled: true,
        evaluationWindow: 600, // 10 minutes
        consecutiveAlerts: 3,
        cooldownPeriod: 1800,
        tags: ['database', 'performance'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com'] }, enabled: true }
        ]
      },

      {
        id: 'database_connection_limit',
        name: 'Database Connection Limit',
        description: 'Database connection pool is near capacity',
        metric: 'database.connections.active',
        condition: 'greater_than',
        threshold: 80, // 80% of max connections
        severity: 'high',
        enabled: true,
        evaluationWindow: 300,
        consecutiveAlerts: 2,
        cooldownPeriod: 900,
        tags: ['database', 'connections'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com'] }, enabled: true },
          { type: 'slack', config: { channel: '#alerts' }, enabled: true }
        ]
      },

      // Business metrics alerts
      {
        id: 'low_document_processing_rate',
        name: 'Low Document Processing Rate',
        description: 'Document processing rate has dropped significantly',
        metric: 'business.documents.processing_rate',
        condition: 'less_than',
        threshold: 10, // documents per minute
        severity: 'medium',
        enabled: true,
        evaluationWindow: 900, // 15 minutes
        consecutiveAlerts: 3,
        cooldownPeriod: 1800,
        tags: ['business', 'documents'],
        channels: [
          { type: 'email', config: { recipients: ['support@advisoros.com'] }, enabled: true }
        ]
      },

      {
        id: 'failed_quickbooks_syncs',
        name: 'Failed QuickBooks Syncs',
        description: 'Multiple QuickBooks sync failures detected',
        metric: 'integrations.quickbooks.sync_failures',
        condition: 'greater_than',
        threshold: 5, // failures in evaluation window
        severity: 'high',
        enabled: true,
        evaluationWindow: 3600, // 1 hour
        consecutiveAlerts: 1,
        cooldownPeriod: 7200, // 2 hours
        tags: ['integrations', 'quickbooks'],
        channels: [
          { type: 'email', config: { recipients: ['support@advisoros.com', 'devops@advisoros.com'] }, enabled: true }
        ]
      },

      // Security alerts
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        description: 'Potential brute force attack detected',
        metric: 'security.failed_logins.rate',
        condition: 'greater_than',
        threshold: 10, // attempts per minute
        severity: 'high',
        enabled: true,
        evaluationWindow: 300,
        consecutiveAlerts: 1,
        cooldownPeriod: 1800,
        tags: ['security', 'authentication'],
        channels: [
          { type: 'email', config: { recipients: ['security@advisoros.com'] }, enabled: true },
          { type: 'slack', config: { channel: '#security' }, enabled: true }
        ]
      },

      // Tax season specific alerts
      {
        id: 'tax_season_capacity_warning',
        name: 'Tax Season Capacity Warning',
        description: 'System approaching capacity during tax season',
        metric: 'system.capacity.utilization',
        condition: 'greater_than',
        threshold: 75, // 75% capacity
        severity: 'medium',
        enabled: false, // Enable during tax season
        evaluationWindow: 600,
        consecutiveAlerts: 2,
        cooldownPeriod: 3600,
        tags: ['capacity', 'tax_season'],
        channels: [
          { type: 'email', config: { recipients: ['devops@advisoros.com', 'management@advisoros.com'] }, enabled: true }
        ]
      }
    ]

    defaultRules.forEach(rule => this.rules.set(rule.id, rule))
  }

  private startEvaluation(): void {
    // Evaluate alerts every 30 seconds
    this.evaluationInterval = setInterval(async () => {
      await this.evaluateRules()
    }, 30000)
  }

  private async evaluateRules(): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      try {
        await this.evaluateRule(rule)
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.id}:`, error)
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Get current metric value
    const currentValue = await this.getMetricValue(rule.metric, rule.evaluationWindow)

    if (currentValue === null) return // Metric not available

    // Check if condition is met
    const conditionMet = this.evaluateCondition(currentValue, rule.condition, rule.threshold)

    if (conditionMet) {
      await this.handleRuleViolation(rule, currentValue)
    } else {
      await this.handleRuleResolution(rule)
    }
  }

  private async getMetricValue(metric: string, window: number): Promise<number | string | null> {
    try {
      // Check Redis for metric data
      const metricKey = `metrics:${metric}`
      const values = await this.redis.lrange(metricKey, 0, -1)

      if (values.length === 0) return null

      // Filter values within evaluation window
      const cutoff = Date.now() - (window * 1000)
      const recentValues = values
        .map(v => JSON.parse(v))
        .filter(v => v.timestamp > cutoff)

      if (recentValues.length === 0) return null

      // Calculate aggregate based on metric type
      if (metric.includes('.avg') || metric.includes('.response_time')) {
        return recentValues.reduce((sum, v) => sum + v.value, 0) / recentValues.length
      } else if (metric.includes('.rate') || metric.includes('.count')) {
        return recentValues.reduce((sum, v) => sum + v.value, 0)
      } else if (metric.includes('.usage') || metric.includes('.utilization')) {
        // Use the most recent value for usage metrics
        return recentValues[recentValues.length - 1].value
      }

      return recentValues[recentValues.length - 1].value
    } catch (error) {
      console.error(`Failed to get metric value for ${metric}:`, error)
      return null
    }
  }

  private evaluateCondition(
    currentValue: number | string,
    condition: string,
    threshold: number | string
  ): boolean {
    switch (condition) {
      case 'greater_than':
        return Number(currentValue) > Number(threshold)
      case 'less_than':
        return Number(currentValue) < Number(threshold)
      case 'equals':
        return currentValue === threshold
      case 'not_equals':
        return currentValue !== threshold
      case 'contains':
        return String(currentValue).includes(String(threshold))
      default:
        return false
    }
  }

  private async handleRuleViolation(rule: AlertRule, currentValue: number | string): Promise<void> {
    const alertKey = `alert_state:${rule.id}`
    const alertState = await this.redis.get(alertKey)

    let consecutiveCount = 1
    if (alertState) {
      const state = JSON.parse(alertState)
      consecutiveCount = state.consecutiveCount + 1
    }

    // Update alert state
    await this.redis.setex(alertKey, rule.evaluationWindow, JSON.stringify({
      consecutiveCount,
      lastViolation: Date.now(),
      currentValue
    }))

    // Fire alert if consecutive threshold is met
    if (consecutiveCount >= rule.consecutiveAlerts) {
      await this.fireAlert(rule, currentValue)
    }
  }

  private async handleRuleResolution(rule: AlertRule): Promise<void> {
    // Clear alert state
    await this.redis.del(`alert_state:${rule.id}`)

    // Resolve any active alerts for this rule
    const activeAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status === 'firing')

    if (activeAlert) {
      await this.resolveAlert(activeAlert.id)
    }
  }

  private async fireAlert(rule: AlertRule, currentValue: number | string): Promise<void> {
    // Check cooldown period
    const cooldownKey = `alert_cooldown:${rule.id}`
    const inCooldown = await this.redis.get(cooldownKey)

    if (inCooldown) return

    // Create alert
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      ruleName: rule.name,
      message: this.generateAlertMessage(rule, currentValue),
      severity: rule.severity,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      timestamp: new Date(),
      status: 'firing',
      tags: rule.tags,
      context: {
        runbook: rule.runbook,
        evaluationWindow: rule.evaluationWindow
      }
    }

    this.activeAlerts.set(alert.id, alert)
    this.alertHistory.push(alert)

    // Store in Redis
    await this.redis.setex(`alert:${alert.id}`, 86400, JSON.stringify(alert))

    // Set cooldown
    await this.redis.setex(cooldownKey, rule.cooldownPeriod, '1')

    // Send notifications
    await this.sendNotifications(alert, rule.channels)

    console.log(`Alert fired: ${alert.ruleName} - ${alert.message}`)
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number | string): string {
    return `${rule.description}. Current value: ${currentValue}, Threshold: ${rule.threshold}`
  }

  private async sendNotifications(alert: Alert, channels: AlertChannel[]): Promise<void> {
    const notifications = channels
      .filter(channel => channel.enabled)
      .map(channel => this.sendNotification(alert, channel))

    await Promise.allSettled(notifications)
  }

  private async sendNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel.config)
          break
        case 'slack':
          await this.sendSlackNotification(alert, channel.config)
          break
        case 'webhook':
          await this.sendWebhookNotification(alert, channel.config)
          break
        case 'sms':
          await this.sendSMSNotification(alert, channel.config)
          break
        case 'pagerduty':
          await this.sendPagerDutyNotification(alert, channel.config)
          break
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error)
    }
  }

  private async sendEmailNotification(alert: Alert, config: any): Promise<void> {
    // Mock implementation - integrate with your email service
    console.log(`Email notification sent to ${config.recipients.join(', ')}: ${alert.message}`)
  }

  private async sendSlackNotification(alert: Alert, config: any): Promise<void> {
    // Mock implementation - integrate with Slack API
    const color = this.getSeverityColor(alert.severity)
    console.log(`Slack notification sent to ${config.channel}: ${alert.message} (${color})`)
  }

  private async sendWebhookNotification(alert: Alert, config: any): Promise<void> {
    // Mock implementation - send HTTP POST to webhook URL
    console.log(`Webhook notification sent to ${config.url}: ${JSON.stringify(alert)}`)
  }

  private async sendSMSNotification(alert: Alert, config: any): Promise<void> {
    // Mock implementation - integrate with SMS service
    console.log(`SMS notification sent to ${config.phone}: ${alert.message}`)
  }

  private async sendPagerDutyNotification(alert: Alert, config: any): Promise<void> {
    // Mock implementation - integrate with PagerDuty API
    console.log(`PagerDuty incident created for service ${config.service_key}: ${alert.message}`)
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: 'danger'
    }
    return colors[severity as keyof typeof colors] || 'warning'
  }

  // Public methods for alert management
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert || alert.status !== 'firing') return

    alert.status = 'resolved'
    alert.resolvedAt = new Date()

    this.activeAlerts.set(alertId, alert)
    await this.redis.setex(`alert:${alertId}`, 86400, JSON.stringify(alert))

    console.log(`Alert resolved: ${alert.ruleName}`)
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert || alert.status !== 'firing') return

    alert.status = 'acknowledged'
    alert.acknowledgedAt = new Date()
    alert.acknowledgedBy = acknowledgedBy

    this.activeAlerts.set(alertId, alert)
    await this.redis.setex(`alert:${alertId}`, 86400, JSON.stringify(alert))

    console.log(`Alert acknowledged by ${acknowledgedBy}: ${alert.ruleName}`)
  }

  async addRule(rule: AlertRule): Promise<void> {
    this.rules.set(rule.id, rule)
    await this.redis.setex(`alert_rule:${rule.id}`, 86400, JSON.stringify(rule))
  }

  async updateRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.rules.get(ruleId)
    if (!rule) throw new Error(`Rule ${ruleId} not found`)

    const updatedRule = { ...rule, ...updates }
    this.rules.set(ruleId, updatedRule)
    await this.redis.setex(`alert_rule:${ruleId}`, 86400, JSON.stringify(updatedRule))
  }

  async deleteRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId)
    await this.redis.del(`alert_rule:${ruleId}`)
  }

  async enableTaxSeasonAlerts(): Promise<void> {
    console.log('Enabling tax season specific alerts...')

    const taxSeasonRules = Array.from(this.rules.values())
      .filter(rule => rule.tags.includes('tax_season'))

    for (const rule of taxSeasonRules) {
      await this.updateRule(rule.id, { enabled: true })
    }

    // Add temporary rules for tax season
    await this.addRule({
      id: 'tax_deadline_approaching',
      name: 'Tax Deadline Approaching',
      description: 'Tax filing deadline is approaching with high system load',
      metric: 'business.tax_deadline.days_remaining',
      condition: 'less_than',
      threshold: 7, // 7 days
      severity: 'medium',
      enabled: true,
      evaluationWindow: 86400, // Daily evaluation
      consecutiveAlerts: 1,
      cooldownPeriod: 86400, // Once per day
      tags: ['tax_season', 'deadline'],
      channels: [
        { type: 'email', config: { recipients: ['management@advisoros.com'] }, enabled: true }
      ]
    })

    console.log('Tax season alerts enabled')
  }

  // Analytics and reporting
  getAlertStats(): AlertStats {
    const alerts = this.alertHistory

    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const alertsByRule = alerts.reduce((acc, alert) => {
      acc[alert.ruleName] = (acc[alert.ruleName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolvedAt)
    const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
      return sum + (alert.resolvedAt!.getTime() - alert.timestamp.getTime())
    }, 0)
    const meanTimeToResolution = resolvedAlerts.length > 0 ? totalResolutionTime / resolvedAlerts.length : 0

    const currentlyFiring = Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'firing').length

    return {
      totalAlerts: alerts.length,
      alertsBySeverity,
      alertsByRule,
      meanTimeToResolution: meanTimeToResolution / 1000, // Convert to seconds
      falsePositiveRate: 0, // Would need manual classification
      currentlyFiring
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'firing')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getRecentAlerts(limit: number = 50): Alert[] {
    return this.alertHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async cleanup(): Promise<void> {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval)
    }
  }
}

export { AlertingSystem }
export type { AlertRule, AlertChannel, Alert, AlertStats }