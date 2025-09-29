import { prisma } from '../../server/db'
import { Redis } from 'ioredis'
import { z } from 'zod'
import crypto from 'crypto'
import { SecurityMonitoringService } from '../../server/services/security-monitoring.service'

// SOC 2 Control Schemas
const SOC2ControlSchema = z.object({
  controlId: z.string(),
  category: z.enum(['CC', 'A', 'PI', 'C', 'P']), // Common Criteria, Availability, Processing Integrity, Confidentiality, Privacy
  subCategory: z.string(),
  controlTitle: z.string(),
  controlDescription: z.string(),
  controlType: z.enum(['preventive', 'detective', 'corrective']),
  automatedControl: z.boolean(),
  frequency: z.enum(['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  controlOwner: z.string(),
  status: z.enum(['implemented', 'partially_implemented', 'not_implemented', 'not_applicable']),
  evidenceRequired: z.array(z.string()),
  testingProcedure: z.string(),
  lastTested: z.date().optional(),
  nextTestDue: z.date().optional(),
  exceptions: z.array(z.string()).optional(),
  remediationPlan: z.string().optional()
})

const AuditEvidenceSchema = z.object({
  evidenceId: z.string(),
  controlId: z.string(),
  evidenceType: z.enum([
    'system_configuration',
    'access_log',
    'policy_document',
    'training_record',
    'monitoring_report',
    'testing_result',
    'change_record',
    'incident_report',
    'certification',
    'contract'
  ]),
  evidenceTitle: z.string(),
  description: z.string(),
  collectionMethod: z.enum(['automated', 'manual', 'observation', 'inquiry']),
  frequency: z.string(),
  retentionPeriod: z.number(), // days
  location: z.string(),
  collectingParty: z.string(),
  reviewedBy: z.string().optional(),
  reviewDate: z.date().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected', 'needs_revision']),
  metadata: z.record(z.any()).optional()
})

const ComplianceTestingSchema = z.object({
  testId: z.string(),
  controlId: z.string(),
  testType: z.enum(['walkthrough', 'inspection', 'observation', 'reperformance', 'analytical']),
  testObjective: z.string(),
  testProcedure: z.string(),
  sampleSize: z.number().optional(),
  populationSize: z.number().optional(),
  testDate: z.date(),
  tester: z.string(),
  reviewer: z.string(),
  testResult: z.enum(['effective', 'ineffective', 'partially_effective']),
  findings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  managementResponse: z.string().optional(),
  remediationDeadline: z.date().optional(),
  retestRequired: z.boolean(),
  evidence: z.array(z.string())
})

interface SOC2Dashboard {
  organizationId: string
  assessmentPeriod: { start: Date; end: Date }
  overallReadiness: number // percentage
  controlImplementation: {
    implemented: number
    partiallyImplemented: number
    notImplemented: number
    notApplicable: number
  }
  controlsByCategory: Record<string, any>
  riskAssessment: {
    criticalFindings: number
    highRiskControls: number
    mediumRiskControls: number
    lowRiskControls: number
  }
  auditReadiness: {
    evidenceCollected: number
    evidenceReviewed: number
    controlsTested: number
    controlsEffective: number
  }
  remediation: {
    openFindings: number
    overdueTasks: number
    completedRemediation: number
  }
  timeline: {
    readinessAssessment: Date
    preAuditReview: Date
    auditFieldwork: Date
    reportDelivery: Date
  }
}

interface ComplianceReport {
  reportId: string
  reportType: 'readiness_assessment' | 'gap_analysis' | 'control_testing' | 'management_letter'
  organizationId: string
  reportingPeriod: { start: Date; end: Date }
  preparedBy: string
  reviewedBy: string
  approvedBy: string
  executiveSummary: string
  scope: string[]
  methodology: string
  keyFindings: Array<{
    finding: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    controlsAffected: string[]
    recommendation: string
    managementResponse: string
    timeline: Date
  }>
  controlsAssessed: number
  controlsEffective: number
  materialsWeaknesses: number
  significantDeficiencies: number
  recommendations: string[]
  managementLetterPoints: string[]
  nextSteps: string[]
  attachments: string[]
}

export class SOC2ComplianceService {
  private soc2Controls = new Map<string, any>()
  private auditEvidence = new Map<string, any>()
  private complianceMetrics = new Map<string, any>()

  constructor(
    private redis: Redis,
    private securityMonitoring: SecurityMonitoringService
  ) {
    this.initializeSOC2Controls()
  }

  // SOC 2 CONTROL FRAMEWORK MANAGEMENT

  async implementSOC2Controls(organizationId: string): Promise<void> {
    const standardControls = this.getStandardSOC2Controls()

    for (const control of standardControls) {
      await this.createControl({
        ...control,
        organizationId,
        implementationDate: new Date(),
        status: 'partially_implemented' // Start with partial implementation
      })
    }

    // Initialize compliance monitoring
    await this.initializeComplianceMonitoring(organizationId)
  }

  async createControl(controlData: z.infer<typeof SOC2ControlSchema> & { organizationId: string }): Promise<string> {
    const validatedControl = SOC2ControlSchema.parse(controlData)

    // Store in database
    const control = await prisma.complianceControl.create({
      data: {
        controlId: validatedControl.controlId,
        organizationId: controlData.organizationId,
        category: validatedControl.category,
        subCategory: validatedControl.subCategory,
        title: validatedControl.controlTitle,
        description: validatedControl.controlDescription,
        controlType: validatedControl.controlType,
        automatedControl: validatedControl.automatedControl,
        frequency: validatedControl.frequency,
        riskLevel: validatedControl.riskLevel,
        controlOwner: validatedControl.controlOwner,
        status: validatedControl.status,
        evidenceRequired: validatedControl.evidenceRequired,
        testingProcedure: validatedControl.testingProcedure,
        lastTested: validatedControl.lastTested,
        nextTestDue: validatedControl.nextTestDue,
        exceptions: validatedControl.exceptions || [],
        remediationPlan: validatedControl.remediationPlan,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    })

    // Cache for fast access
    this.soc2Controls.set(validatedControl.controlId, validatedControl)
    await this.redis.setex(
      `soc2_control:${controlData.organizationId}:${validatedControl.controlId}`,
      3600,
      JSON.stringify(validatedControl)
    )

    // Schedule automated testing if applicable
    if (validatedControl.automatedControl) {
      await this.scheduleAutomatedTesting(validatedControl.controlId, validatedControl.frequency)
    }

    return control.id
  }

  async updateControlStatus(
    organizationId: string,
    controlId: string,
    status: 'implemented' | 'partially_implemented' | 'not_implemented' | 'not_applicable',
    evidence?: string[],
    notes?: string
  ): Promise<void> {
    await prisma.complianceControl.update({
      where: {
        controlId_organizationId: {
          controlId,
          organizationId
        }
      },
      data: {
        status,
        lastUpdated: new Date(),
        ...(evidence && { evidenceCollected: evidence }),
        ...(notes && { implementationNotes: notes }),
        metadata: {
          updatedAt: new Date(),
          updatedBy: 'system' // This would be the actual user ID
        }
      }
    })

    // Update cache
    const control = this.soc2Controls.get(controlId)
    if (control) {
      control.status = status
      this.soc2Controls.set(controlId, control)
      await this.redis.setex(
        `soc2_control:${organizationId}:${controlId}`,
        3600,
        JSON.stringify(control)
      )
    }

    // Log compliance event
    await this.securityMonitoring.logSecurityEvent({
      eventType: 'compliance_update',
      severity: 'medium',
      description: `SOC 2 control ${controlId} status updated to ${status}`,
      organizationId,
      metadata: {
        controlId,
        newStatus: status,
        evidence,
        notes
      }
    })
  }

  // AUDIT EVIDENCE MANAGEMENT

  async collectAuditEvidence(
    organizationId: string,
    evidenceData: z.infer<typeof AuditEvidenceSchema>
  ): Promise<string> {
    const validatedEvidence = AuditEvidenceSchema.parse(evidenceData)

    // Store in database
    const evidence = await prisma.auditEvidence.create({
      data: {
        evidenceId: validatedEvidence.evidenceId,
        organizationId,
        controlId: validatedEvidence.controlId,
        evidenceType: validatedEvidence.evidenceType,
        title: validatedEvidence.evidenceTitle,
        description: validatedEvidence.description,
        collectionMethod: validatedEvidence.collectionMethod,
        frequency: validatedEvidence.frequency,
        retentionPeriod: validatedEvidence.retentionPeriod,
        location: validatedEvidence.location,
        collectingParty: validatedEvidence.collectingParty,
        reviewedBy: validatedEvidence.reviewedBy,
        reviewDate: validatedEvidence.reviewDate,
        approvalStatus: validatedEvidence.approvalStatus,
        metadata: validatedEvidence.metadata || {}
      }
    })

    // Cache evidence
    this.auditEvidence.set(validatedEvidence.evidenceId, validatedEvidence)

    // Auto-approve system-generated evidence
    if (validatedEvidence.collectionMethod === 'automated') {
      await this.approveEvidence(organizationId, validatedEvidence.evidenceId, 'system', 'Auto-approved system evidence')
    }

    return evidence.id
  }

  async approveEvidence(
    organizationId: string,
    evidenceId: string,
    reviewedBy: string,
    reviewNotes: string
  ): Promise<void> {
    await prisma.auditEvidence.update({
      where: {
        evidenceId_organizationId: {
          evidenceId,
          organizationId
        }
      },
      data: {
        approvalStatus: 'approved',
        reviewedBy,
        reviewDate: new Date(),
        reviewNotes
      }
    })

    // Update cache
    const evidence = this.auditEvidence.get(evidenceId)
    if (evidence) {
      evidence.approvalStatus = 'approved'
      evidence.reviewedBy = reviewedBy
      evidence.reviewDate = new Date()
      this.auditEvidence.set(evidenceId, evidence)
    }
  }

  async generateEvidenceReport(organizationId: string, controlId?: string): Promise<any> {
    const where: any = { organizationId }
    if (controlId) where.controlId = controlId

    const evidence = await prisma.auditEvidence.findMany({
      where,
      include: {
        control: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const summary = {
      totalEvidence: evidence.length,
      evidenceByType: evidence.reduce((acc, ev) => {
        acc[ev.evidenceType] = (acc[ev.evidenceType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      evidenceByStatus: evidence.reduce((acc, ev) => {
        acc[ev.approvalStatus] = (acc[ev.approvalStatus] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      evidenceByControl: evidence.reduce((acc, ev) => {
        acc[ev.controlId] = (acc[ev.controlId] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      coverageGaps: await this.identifyEvidenceGaps(organizationId, controlId)
    }

    return {
      summary,
      evidence: evidence.map(ev => ({
        id: ev.evidenceId,
        controlId: ev.controlId,
        type: ev.evidenceType,
        title: ev.title,
        status: ev.approvalStatus,
        collectedDate: ev.createdAt,
        reviewedBy: ev.reviewedBy,
        location: ev.location
      }))
    }
  }

  // CONTROL TESTING

  async performControlTesting(
    organizationId: string,
    testingData: z.infer<typeof ComplianceTestingSchema>
  ): Promise<string> {
    const validatedTesting = ComplianceTestingSchema.parse(testingData)

    // Store testing results
    const testing = await prisma.complianceTesting.create({
      data: {
        testId: validatedTesting.testId,
        organizationId,
        controlId: validatedTesting.controlId,
        testType: validatedTesting.testType,
        testObjective: validatedTesting.testObjective,
        testProcedure: validatedTesting.testProcedure,
        sampleSize: validatedTesting.sampleSize,
        populationSize: validatedTesting.populationSize,
        testDate: validatedTesting.testDate,
        tester: validatedTesting.tester,
        reviewer: validatedTesting.reviewer,
        testResult: validatedTesting.testResult,
        findings: validatedTesting.findings || [],
        recommendations: validatedTesting.recommendations || [],
        managementResponse: validatedTesting.managementResponse,
        remediationDeadline: validatedTesting.remediationDeadline,
        retestRequired: validatedTesting.retestRequired,
        evidence: validatedTesting.evidence
      }
    })

    // Update control status based on test results
    if (validatedTesting.testResult === 'effective') {
      await this.updateControlStatus(
        organizationId,
        validatedTesting.controlId,
        'implemented',
        validatedTesting.evidence,
        `Control tested effective on ${validatedTesting.testDate.toISOString()}`
      )
    } else {
      await this.updateControlStatus(
        organizationId,
        validatedTesting.controlId,
        'partially_implemented',
        validatedTesting.evidence,
        `Control testing identified deficiencies: ${validatedTesting.findings?.join(', ')}`
      )
    }

    // Log testing event
    await this.securityMonitoring.logSecurityEvent({
      eventType: 'compliance_testing',
      severity: validatedTesting.testResult === 'effective' ? 'low' : 'medium',
      description: `SOC 2 control ${validatedTesting.controlId} testing completed with result: ${validatedTesting.testResult}`,
      organizationId,
      metadata: {
        testId: validatedTesting.testId,
        controlId: validatedTesting.controlId,
        testResult: validatedTesting.testResult,
        findings: validatedTesting.findings
      }
    })

    return testing.id
  }

  async scheduleControlTesting(organizationId: string, controlId: string, testDate: Date): Promise<void> {
    // Schedule testing reminder
    const testingKey = `control_testing:${organizationId}:${controlId}`
    const testingData = {
      organizationId,
      controlId,
      scheduledDate: testDate,
      status: 'scheduled'
    }

    await this.redis.setex(testingKey, 86400 * 30, JSON.stringify(testingData)) // 30 days

    // Add to testing queue
    const queueKey = `testing_queue:${organizationId}`
    await this.redis.zadd(queueKey, testDate.getTime(), controlId)
  }

  // COMPLIANCE DASHBOARD AND REPORTING

  async generateSOC2Dashboard(organizationId: string): Promise<SOC2Dashboard> {
    // Get all controls for the organization
    const controls = await prisma.complianceControl.findMany({
      where: { organizationId },
      include: {
        evidence: true,
        testing: {
          orderBy: { testDate: 'desc' },
          take: 1
        }
      }
    })

    // Calculate implementation status
    const controlImplementation = controls.reduce((acc, control) => {
      acc[control.status] = (acc[control.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate overall readiness
    const implementedWeight = (controlImplementation.implemented || 0) * 1
    const partialWeight = (controlImplementation.partially_implemented || 0) * 0.5
    const totalControls = controls.length
    const overallReadiness = totalControls > 0 ? Math.round(((implementedWeight + partialWeight) / totalControls) * 100) : 0

    // Group by category
    const controlsByCategory = controls.reduce((acc, control) => {
      if (!acc[control.category]) {
        acc[control.category] = { total: 0, implemented: 0, partiallyImplemented: 0, notImplemented: 0 }
      }
      acc[control.category].total++
      if (control.status === 'implemented') acc[control.category].implemented++
      else if (control.status === 'partially_implemented') acc[control.category].partiallyImplemented++
      else if (control.status === 'not_implemented') acc[control.category].notImplemented++
      return acc
    }, {} as Record<string, any>)

    // Risk assessment
    const riskAssessment = controls.reduce((acc, control) => {
      acc[`${control.riskLevel}RiskControls`] = (acc[`${control.riskLevel}RiskControls`] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Audit readiness metrics
    const evidenceCount = controls.reduce((sum, control) => sum + control.evidence.length, 0)
    const reviewedEvidence = controls.reduce((sum, control) =>
      sum + control.evidence.filter(e => e.approvalStatus === 'approved').length, 0)
    const testedControls = controls.filter(control => control.testing.length > 0).length
    const effectiveControls = controls.filter(control =>
      control.testing.length > 0 && control.testing[0].testResult === 'effective').length

    return {
      organizationId,
      assessmentPeriod: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        end: new Date()
      },
      overallReadiness,
      controlImplementation: {
        implemented: controlImplementation.implemented || 0,
        partiallyImplemented: controlImplementation.partially_implemented || 0,
        notImplemented: controlImplementation.not_implemented || 0,
        notApplicable: controlImplementation.not_applicable || 0
      },
      controlsByCategory,
      riskAssessment: {
        criticalFindings: riskAssessment.criticalRiskControls || 0,
        highRiskControls: riskAssessment.highRiskControls || 0,
        mediumRiskControls: riskAssessment.mediumRiskControls || 0,
        lowRiskControls: riskAssessment.lowRiskControls || 0
      },
      auditReadiness: {
        evidenceCollected: evidenceCount,
        evidenceReviewed: reviewedEvidence,
        controlsTested: testedControls,
        controlsEffective: effectiveControls
      },
      remediation: {
        openFindings: await this.getOpenFindings(organizationId),
        overdueTasks: await this.getOverdueTasks(organizationId),
        completedRemediation: await this.getCompletedRemediation(organizationId)
      },
      timeline: {
        readinessAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        preAuditReview: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        auditFieldwork: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        reportDelivery: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) // 120 days
      }
    }
  }

  async generateComplianceReport(
    organizationId: string,
    reportType: 'readiness_assessment' | 'gap_analysis' | 'control_testing' | 'management_letter'
  ): Promise<ComplianceReport> {
    const reportId = crypto.randomUUID()
    const dashboard = await this.generateSOC2Dashboard(organizationId)

    let executiveSummary = ''
    let keyFindings: any[] = []
    let recommendations: string[] = []

    switch (reportType) {
      case 'readiness_assessment':
        executiveSummary = `SOC 2 Type II readiness assessment shows ${dashboard.overallReadiness}% implementation. ${dashboard.controlImplementation.implemented} controls fully implemented, ${dashboard.controlImplementation.partiallyImplemented} partially implemented.`

        if (dashboard.overallReadiness < 80) {
          keyFindings.push({
            finding: 'Insufficient control implementation for SOC 2 Type II audit readiness',
            severity: 'high',
            controlsAffected: ['Multiple controls across categories'],
            recommendation: 'Accelerate control implementation and testing program',
            managementResponse: 'Management agrees to prioritize control implementation',
            timeline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          })
        }

        recommendations = [
          'Complete implementation of partially implemented controls',
          'Establish formal testing procedures for all controls',
          'Enhance evidence collection and documentation processes',
          'Conduct pre-audit testing with external auditor'
        ]
        break

      case 'gap_analysis':
        const gaps = await this.identifyComplianceGaps(organizationId)
        executiveSummary = `Gap analysis identified ${gaps.length} areas requiring attention before SOC 2 Type II audit.`
        keyFindings = gaps.map(gap => ({
          finding: gap.description,
          severity: gap.severity,
          controlsAffected: gap.controlsAffected,
          recommendation: gap.recommendation,
          managementResponse: 'To be determined',
          timeline: gap.targetDate
        }))
        break
    }

    return {
      reportId,
      reportType,
      organizationId,
      reportingPeriod: dashboard.assessmentPeriod,
      preparedBy: 'System',
      reviewedBy: 'Compliance Officer',
      approvedBy: 'Chief Information Officer',
      executiveSummary,
      scope: ['CC', 'A', 'PI', 'C', 'P'], // All SOC 2 categories
      methodology: 'Automated control assessment with manual review and testing',
      keyFindings,
      controlsAssessed: Object.values(dashboard.controlsByCategory).reduce((sum: number, cat: any) => sum + cat.total, 0),
      controlsEffective: dashboard.auditReadiness.controlsEffective,
      materialsWeaknesses: keyFindings.filter(f => f.severity === 'critical').length,
      significantDeficiencies: keyFindings.filter(f => f.severity === 'high').length,
      recommendations,
      managementLetterPoints: [],
      nextSteps: [
        'Review and approve report findings',
        'Implement recommended controls',
        'Schedule follow-up testing',
        'Prepare for external audit'
      ],
      attachments: []
    }
  }

  // HELPER METHODS

  private getStandardSOC2Controls(): any[] {
    return [
      // Common Criteria Controls
      {
        controlId: 'CC1.1',
        category: 'CC',
        subCategory: 'Control Environment',
        controlTitle: 'Board and Management Oversight',
        controlDescription: 'The entity demonstrates a commitment to integrity and ethical values through board and management oversight',
        controlType: 'preventive',
        automatedControl: false,
        frequency: 'quarterly',
        riskLevel: 'high',
        controlOwner: 'Chief Executive Officer',
        evidenceRequired: ['Board resolutions', 'Code of conduct', 'Ethics training records'],
        testingProcedure: 'Review board minutes and management oversight documentation'
      },
      {
        controlId: 'CC2.1',
        category: 'CC',
        subCategory: 'Communication and Information',
        controlTitle: 'Communication of Information',
        controlDescription: 'Information relevant to internal control is communicated throughout the entity',
        controlType: 'preventive',
        automatedControl: false,
        frequency: 'quarterly',
        riskLevel: 'medium',
        controlOwner: 'Chief Information Officer',
        evidenceRequired: ['Communication policies', 'Training materials', 'Acknowledgment records'],
        testingProcedure: 'Review communication procedures and test effectiveness'
      },
      {
        controlId: 'CC3.1',
        category: 'CC',
        subCategory: 'Risk Assessment',
        controlTitle: 'Risk Identification and Assessment',
        controlDescription: 'The entity identifies risks and analyzes their impact on system objectives',
        controlType: 'detective',
        automatedControl: true,
        frequency: 'continuous',
        riskLevel: 'high',
        controlOwner: 'Chief Information Security Officer',
        evidenceRequired: ['Risk assessment reports', 'Risk registers', 'Mitigation plans'],
        testingProcedure: 'Review risk assessment process and test automated monitoring'
      },
      {
        controlId: 'CC4.1',
        category: 'CC',
        subCategory: 'Monitoring Activities',
        controlTitle: 'Monitoring Controls',
        controlDescription: 'The entity monitors the system of internal control through ongoing evaluations',
        controlType: 'detective',
        automatedControl: true,
        frequency: 'continuous',
        riskLevel: 'high',
        controlOwner: 'Internal Audit',
        evidenceRequired: ['Monitoring reports', 'Dashboards', 'Exception reports'],
        testingProcedure: 'Test monitoring systems and review exception handling'
      },
      {
        controlId: 'CC5.1',
        category: 'CC',
        subCategory: 'Control Activities',
        controlTitle: 'Access Controls',
        controlDescription: 'Logical and physical access controls restrict unauthorized access',
        controlType: 'preventive',
        automatedControl: true,
        frequency: 'continuous',
        riskLevel: 'critical',
        controlOwner: 'IT Security Team',
        evidenceRequired: ['Access control matrices', 'User access reports', 'Authentication logs'],
        testingProcedure: 'Test access controls and review user provisioning/deprovisioning'
      },
      // Add more standard controls as needed...
    ]
  }

  private async initializeComplianceMonitoring(organizationId: string): Promise<void> {
    // Set up automated monitoring for controls
    const monitoringConfig = {
      organizationId,
      monitoringEnabled: true,
      alertThresholds: {
        controlFailures: 3,
        evidenceGaps: 5,
        testingOverdue: 7
      },
      reportingFrequency: 'weekly',
      escalationMatrix: {
        lowRisk: ['compliance_officer'],
        mediumRisk: ['compliance_officer', 'ciso'],
        highRisk: ['compliance_officer', 'ciso', 'ceo'],
        criticalRisk: ['compliance_officer', 'ciso', 'ceo', 'board']
      }
    }

    await this.redis.setex(
      `compliance_monitoring:${organizationId}`,
      86400 * 365, // 1 year
      JSON.stringify(monitoringConfig)
    )
  }

  private async scheduleAutomatedTesting(controlId: string, frequency: string): Promise<void> {
    let intervalMs = 0

    switch (frequency) {
      case 'continuous':
        intervalMs = 3600000 // 1 hour
        break
      case 'daily':
        intervalMs = 86400000 // 24 hours
        break
      case 'weekly':
        intervalMs = 604800000 // 7 days
        break
      case 'monthly':
        intervalMs = 2592000000 // 30 days
        break
    }

    if (intervalMs > 0) {
      const testingKey = `automated_testing:${controlId}`
      await this.redis.setex(testingKey, intervalMs / 1000, JSON.stringify({
        controlId,
        frequency,
        nextRun: new Date(Date.now() + intervalMs)
      }))
    }
  }

  private async identifyEvidenceGaps(organizationId: string, controlId?: string): Promise<string[]> {
    const gaps: string[] = []

    const where: any = { organizationId }
    if (controlId) where.controlId = controlId

    const controls = await prisma.complianceControl.findMany({
      where,
      include: { evidence: true }
    })

    for (const control of controls) {
      const requiredEvidence = control.evidenceRequired || []
      const collectedEvidence = control.evidence.map(e => e.evidenceType)

      for (const required of requiredEvidence) {
        if (!collectedEvidence.includes(required as any)) {
          gaps.push(`${control.controlId}: Missing ${required} evidence`)
        }
      }
    }

    return gaps
  }

  private async identifyComplianceGaps(organizationId: string): Promise<any[]> {
    const gaps: any[] = []

    const controls = await prisma.complianceControl.findMany({
      where: { organizationId },
      include: { evidence: true, testing: true }
    })

    for (const control of controls) {
      if (control.status === 'not_implemented') {
        gaps.push({
          controlId: control.controlId,
          description: `Control ${control.controlId} not implemented`,
          severity: control.riskLevel,
          controlsAffected: [control.controlId],
          recommendation: `Implement ${control.title}`,
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }

      if (control.evidence.length === 0) {
        gaps.push({
          controlId: control.controlId,
          description: `No evidence collected for control ${control.controlId}`,
          severity: 'medium',
          controlsAffected: [control.controlId],
          recommendation: `Collect required evidence for ${control.title}`,
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        })
      }

      if (control.testing.length === 0) {
        gaps.push({
          controlId: control.controlId,
          description: `Control ${control.controlId} not tested`,
          severity: 'medium',
          controlsAffected: [control.controlId],
          recommendation: `Perform testing for ${control.title}`,
          targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
        })
      }
    }

    return gaps
  }

  private async getOpenFindings(organizationId: string): Promise<number> {
    return await prisma.complianceTesting.count({
      where: {
        organizationId,
        testResult: { in: ['ineffective', 'partially_effective'] },
        remediationDeadline: { gte: new Date() }
      }
    })
  }

  private async getOverdueTasks(organizationId: string): Promise<number> {
    return await prisma.complianceTesting.count({
      where: {
        organizationId,
        remediationDeadline: { lt: new Date() },
        retestRequired: true
      }
    })
  }

  private async getCompletedRemediation(organizationId: string): Promise<number> {
    return await prisma.complianceTesting.count({
      where: {
        organizationId,
        testResult: 'effective',
        retestRequired: false
      }
    })
  }

  private async initializeSOC2Controls(): Promise<void> {
    const standardControls = this.getStandardSOC2Controls()
    for (const control of standardControls) {
      this.soc2Controls.set(control.controlId, control)
    }
  }
}

export type { SOC2Dashboard, ComplianceReport }