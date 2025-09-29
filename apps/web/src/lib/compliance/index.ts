// SOC 2 Type II Compliance
export { SOC2ComplianceService } from './soc2-compliance'
export type { SOC2Dashboard, ComplianceReport } from './soc2-compliance'

// Data Privacy Compliance (GDPR/CCPA)
export { DataPrivacyComplianceService } from './data-privacy-compliance'
export type { PrivacyDashboard, DataExportPackage } from './data-privacy-compliance'

// Financial Data Security (PCI DSS, DLP, Encryption)
export { FinancialDataSecurityService } from './financial-data-security'
export type { PCIDSSAssessment, DLPIncident } from './financial-data-security'

// CPA Professional Standards
export { CPAProfessionalStandardsService } from './cpa-professional-standards'
export type { CPAComplianceDashboard } from './cpa-professional-standards'

// Regulatory Monitoring
export { RegulatoryMonitoringService } from './regulatory-monitoring'
export type { ComplianceDashboard } from './regulatory-monitoring'

// Unified Compliance Integration
export { ComplianceIntegrationService } from './compliance-integration'
export type { UnifiedComplianceDashboard, ComplianceOrchestrationPlan } from './compliance-integration'

// Compliance Factory - Central service factory for dependency injection
import { Redis } from 'ioredis'
import { SecurityMonitoringService } from '../../server/services/security-monitoring.service'
import { SOC2ComplianceService } from './soc2-compliance'
import { DataPrivacyComplianceService } from './data-privacy-compliance'
import { FinancialDataSecurityService } from './financial-data-security'
import { CPAProfessionalStandardsService } from './cpa-professional-standards'
import { RegulatoryMonitoringService } from './regulatory-monitoring'
import { ComplianceIntegrationService } from './compliance-integration'

export class ComplianceServiceFactory {
  private static instance: ComplianceServiceFactory
  private services: Map<string, any> = new Map()

  private constructor(
    private redis: Redis,
    private securityMonitoring: SecurityMonitoringService
  ) {}

  public static getInstance(
    redis: Redis,
    securityMonitoring: SecurityMonitoringService
  ): ComplianceServiceFactory {
    if (!ComplianceServiceFactory.instance) {
      ComplianceServiceFactory.instance = new ComplianceServiceFactory(redis, securityMonitoring)
    }
    return ComplianceServiceFactory.instance
  }

  public getSOC2Service(): SOC2ComplianceService {
    if (!this.services.has('soc2')) {
      this.services.set('soc2', new SOC2ComplianceService(this.redis, this.securityMonitoring))
    }
    return this.services.get('soc2')
  }

  public getDataPrivacyService(): DataPrivacyComplianceService {
    if (!this.services.has('privacy')) {
      this.services.set('privacy', new DataPrivacyComplianceService(this.redis, this.securityMonitoring))
    }
    return this.services.get('privacy')
  }

  public getFinancialSecurityService(): FinancialDataSecurityService {
    if (!this.services.has('financial')) {
      this.services.set('financial', new FinancialDataSecurityService(this.redis, this.securityMonitoring))
    }
    return this.services.get('financial')
  }

  public getCPAStandardsService(): CPAProfessionalStandardsService {
    if (!this.services.has('cpa')) {
      this.services.set('cpa', new CPAProfessionalStandardsService(this.redis, this.securityMonitoring))
    }
    return this.services.get('cpa')
  }

  public getRegulatoryService(): RegulatoryMonitoringService {
    if (!this.services.has('regulatory')) {
      const soc2Service = this.getSOC2Service()
      const privacyService = this.getDataPrivacyService()
      const financialService = this.getFinancialSecurityService()
      const cpaService = this.getCPAStandardsService()

      this.services.set('regulatory', new RegulatoryMonitoringService(
        this.redis,
        this.securityMonitoring,
        soc2Service,
        privacyService,
        financialService,
        cpaService
      ))
    }
    return this.services.get('regulatory')
  }

  public getIntegrationService(): ComplianceIntegrationService {
    if (!this.services.has('integration')) {
      const soc2Service = this.getSOC2Service()
      const privacyService = this.getDataPrivacyService()
      const financialService = this.getFinancialSecurityService()
      const cpaService = this.getCPAStandardsService()
      const regulatoryService = this.getRegulatoryService()

      this.services.set('integration', new ComplianceIntegrationService(
        this.redis,
        this.securityMonitoring,
        soc2Service,
        privacyService,
        financialService,
        cpaService,
        regulatoryService
      ))
    }
    return this.services.get('integration')
  }

  // Convenience method to get all services
  public getAllServices() {
    return {
      soc2: this.getSOC2Service(),
      privacy: this.getDataPrivacyService(),
      financial: this.getFinancialSecurityService(),
      cpa: this.getCPAStandardsService(),
      regulatory: this.getRegulatoryService(),
      integration: this.getIntegrationService()
    }
  }

  // Initialize all compliance frameworks for an organization
  public async initializeComplianceFramework(
    organizationId: string,
    frameworks: Array<'soc2' | 'privacy' | 'financial' | 'cpa' | 'regulatory'>,
    options: {
      merchantLevel?: 1 | 2 | 3 | 4
      serviceTypes?: string[]
      dataTypes?: string[]
      jurisdictions?: string[]
    } = {}
  ): Promise<{
    initialized: string[]
    errors: Array<{ framework: string; error: string }>
  }> {
    const initialized: string[] = []
    const errors: Array<{ framework: string; error: string }> = []

    for (const framework of frameworks) {
      try {
        switch (framework) {
          case 'soc2':
            await this.getSOC2Service().implementSOC2Controls(organizationId)
            initialized.push('SOC 2 Type II')
            break

          case 'privacy':
            // Initialize data inventory scanning
            await this.getDataPrivacyService().scanDataInventory(organizationId)
            initialized.push('GDPR/CCPA Privacy Compliance')
            break

          case 'financial':
            if (options.merchantLevel) {
              await this.getFinancialSecurityService().implementPCIDSSFramework(organizationId, options.merchantLevel)
            }
            await this.getFinancialSecurityService().scanDatabaseForFinancialData(organizationId)
            initialized.push('Financial Data Security (PCI DSS)')
            break

          case 'cpa':
            const serviceTypes = options.serviceTypes || ['audit', 'review', 'compilation', 'tax']
            await this.getCPAStandardsService().implementProfessionalStandards(organizationId, serviceTypes)
            initialized.push('CPA Professional Standards')
            break

          case 'regulatory':
            await this.getRegulatoryService().monitorRegulatoryChanges()
            initialized.push('Regulatory Monitoring')
            break
        }
      } catch (error) {
        errors.push({
          framework,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Initialize cross-system integration if multiple frameworks are enabled
    if (initialized.length > 1) {
      try {
        await this.getIntegrationService().synchronizeComplianceData(organizationId)
        await this.getIntegrationService().automateComplianceChecks(organizationId)
        initialized.push('Cross-System Integration')
      } catch (error) {
        errors.push({
          framework: 'integration',
          error: error instanceof Error ? error.message : 'Integration setup failed'
        })
      }
    }

    return { initialized, errors }
  }

  // Generate comprehensive compliance assessment
  public async generateComprehensiveAssessment(organizationId: string): Promise<any> {
    const integrationService = this.getIntegrationService()
    return await integrationService.generateUnifiedComplianceDashboard(organizationId)
  }

  // Prepare for audit across all frameworks
  public async prepareForComprehensiveAudit(
    organizationId: string,
    auditDate: Date,
    auditScope: Array<'soc2' | 'pci' | 'privacy' | 'professional'>
  ): Promise<any> {
    const integrationService = this.getIntegrationService()

    const preparationPlans = []

    for (const scope of auditScope) {
      const plan = await integrationService.prepareForAudit(organizationId, scope, auditDate)
      preparationPlans.push(plan)
    }

    return {
      organizationId,
      auditDate,
      auditScope,
      preparationPlans,
      overallReadiness: await this.calculateOverallAuditReadiness(organizationId, auditScope),
      criticalActions: await this.getCriticalPreAuditActions(organizationId, auditScope),
      timeline: this.generateAuditPreparationTimeline(auditDate, preparationPlans)
    }
  }

  // Private helper methods
  private async calculateOverallAuditReadiness(
    organizationId: string,
    auditScope: string[]
  ): Promise<number> {
    const dashboard = await this.generateComprehensiveAssessment(organizationId)
    return dashboard.executiveSummary.auditReadiness
  }

  private async getCriticalPreAuditActions(
    organizationId: string,
    auditScope: string[]
  ): Promise<Array<{ action: string; dueDate: Date; responsible: string }>> {
    const dashboard = await this.generateComprehensiveAssessment(organizationId)
    return dashboard.actionItems.critical.map((item: any) => ({
      action: item.description,
      dueDate: item.dueDate,
      responsible: item.responsible
    }))
  }

  private generateAuditPreparationTimeline(
    auditDate: Date,
    preparationPlans: any[]
  ): Array<{ phase: string; startDate: Date; endDate: Date; deliverables: string[] }> {
    const now = new Date()
    const timeUntilAudit = auditDate.getTime() - now.getTime()
    const totalDays = Math.floor(timeUntilAudit / (24 * 60 * 60 * 1000))

    return [
      {
        phase: 'Initial Assessment and Gap Analysis',
        startDate: now,
        endDate: new Date(now.getTime() + Math.floor(totalDays * 0.2) * 24 * 60 * 60 * 1000),
        deliverables: ['Gap analysis report', 'Risk assessment', 'Remediation plan']
      },
      {
        phase: 'Control Implementation and Testing',
        startDate: new Date(now.getTime() + Math.floor(totalDays * 0.2) * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + Math.floor(totalDays * 0.7) * 24 * 60 * 60 * 1000),
        deliverables: ['Control documentation', 'Testing results', 'Evidence collection']
      },
      {
        phase: 'Final Validation and Documentation',
        startDate: new Date(now.getTime() + Math.floor(totalDays * 0.7) * 24 * 60 * 60 * 1000),
        endDate: new Date(auditDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before audit
        deliverables: ['Final testing', 'Documentation review', 'Audit readiness certification']
      },
      {
        phase: 'Pre-Audit Review',
        startDate: new Date(auditDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: auditDate,
        deliverables: ['Management review', 'Final preparations', 'Audit kickoff']
      }
    ]
  }
}

// Export singleton pattern for easy usage
export const createComplianceServices = (redis: Redis, securityMonitoring: SecurityMonitoringService) => {
  return ComplianceServiceFactory.getInstance(redis, securityMonitoring)
}

// Compliance constants and enums
export const COMPLIANCE_FRAMEWORKS = {
  SOC2: 'soc2',
  GDPR: 'gdpr',
  CCPA: 'ccpa',
  PCI_DSS: 'pci_dss',
  SOX: 'sox',
  AICPA: 'aicpa',
  GAAS: 'gaas'
} as const

export const COMPLIANCE_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  IMPLEMENTED: 'implemented',
  VALIDATED: 'validated',
  NON_COMPLIANT: 'non_compliant'
} as const

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

export const AUDIT_TYPES = {
  SOC2_TYPE_I: 'soc2_type_i',
  SOC2_TYPE_II: 'soc2_type_ii',
  PCI_DSS: 'pci_dss',
  PRIVACY_AUDIT: 'privacy_audit',
  PEER_REVIEW: 'peer_review',
  REGULATORY_EXAMINATION: 'regulatory_examination'
} as const