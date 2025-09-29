/**
 * SOC2 & GDPR Compliance Audit Logging Framework
 *
 * This module provides comprehensive audit logging for compliance requirements:
 * - SOC2 Type II controls for security, availability, processing integrity
 * - GDPR Article 30 records of processing activities
 * - Real-time security monitoring and alerting
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  clientId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource: string;
  resourceId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  details: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complianceFramework: string[];
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  retention_policy: string;
  encryption_status: 'ENCRYPTED' | 'UNENCRYPTED';
}

interface GDPRDataProcessingLog {
  id: string;
  timestamp: Date;
  userId: string;
  dataSubjectId: string;
  processingPurpose: string;
  legalBasis: 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTERESTS' | 'PUBLIC_TASK' | 'LEGITIMATE_INTERESTS';
  dataCategories: string[];
  recipients: string[];
  transferMechanism?: string;
  retentionPeriod: string;
  securityMeasures: string[];
}

interface SecurityIncident {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH' | 'SYSTEM_COMPROMISE' | 'MALWARE' | 'PHISHING' | 'OTHER';
  description: string;
  affectedUsers: string[];
  affectedSystems: string[];
  responseActions: string[];
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  notificationRequired: boolean;
  regulatoryReporting: string[];
}

class ComplianceAuditLogger {
  private prisma: PrismaClient;
  private logBuffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.prisma = new PrismaClient();

    // Flush logs every 30 seconds for performance
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 30000);
  }

  /**
   * Log user authentication events (SOC2 CC6.1, CC6.2)
   */
  async logAuthentication(data: {
    userId?: string;
    email: string;
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_ATTEMPT' | 'PASSWORD_RESET' | 'MFA_CHALLENGE';
    outcome: 'SUCCESS' | 'FAILURE';
    ipAddress: string;
    userAgent: string;
    details?: Record<string, any>;
  }) {
    await this.addAuditLog({
      userId: data.userId,
      userEmail: data.email,
      action: data.action,
      resource: 'AUTHENTICATION',
      outcome: data.outcome,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details || {},
      riskLevel: data.outcome === 'FAILURE' ? 'HIGH' : 'LOW',
      complianceFramework: ['SOC2_CC6.1', 'SOC2_CC6.2', 'GDPR_ARTICLE_32'],
      dataClassification: 'CONFIDENTIAL'
    });

    // Alert on multiple failed login attempts
    if (data.action === 'LOGIN_ATTEMPT' && data.outcome === 'FAILURE') {
      await this.checkFailedLoginThreshold(data.email, data.ipAddress);
    }
  }

  /**
   * Log data access events (SOC2 CC6.3, GDPR Article 30)
   */
  async logDataAccess(data: {
    userId: string;
    userEmail: string;
    userRole: string;
    clientId?: string;
    action: 'READ' | 'WRITE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT';
    resource: string;
    resourceId?: string;
    outcome: 'SUCCESS' | 'FAILURE';
    ipAddress: string;
    userAgent: string;
    dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    details?: Record<string, any>;
  }) {
    const riskLevel = this.calculateRiskLevel(data.action, data.dataClassification, data.outcome);

    await this.addAuditLog({
      userId: data.userId,
      userEmail: data.userEmail,
      userRole: data.userRole,
      clientId: data.clientId,
      action: `DATA_${data.action.toUpperCase()}`,
      resource: data.resource,
      resourceId: data.resourceId,
      outcome: data.outcome,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details || {},
      riskLevel,
      complianceFramework: ['SOC2_CC6.3', 'GDPR_ARTICLE_30', 'SOC2_CC7.1'],
      dataClassification: data.dataClassification
    });

    // Log GDPR data processing activity
    if (data.clientId && ['READ', 'WRITE', 'UPDATE', 'DELETE', 'EXPORT'].includes(data.action.toUpperCase())) {
      await this.logGDPRDataProcessing({
        userId: data.userId,
        dataSubjectId: data.clientId,
        processingPurpose: this.getProcessingPurpose(data.action, data.resource),
        legalBasis: 'CONTRACT',
        dataCategories: [data.resource],
        recipients: [data.userEmail],
        retentionPeriod: '7_YEARS',
        securityMeasures: ['ENCRYPTION_AT_REST', 'ENCRYPTION_IN_TRANSIT', 'ACCESS_CONTROLS']
      });
    }
  }

  /**
   * Log system administration events (SOC2 CC6.1, CC7.1)
   */
  async logSystemAdministration(data: {
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    outcome: 'SUCCESS' | 'FAILURE';
    ipAddress: string;
    userAgent: string;
    details?: Record<string, any>;
  }) {
    await this.addAuditLog({
      userId: data.userId,
      userEmail: data.userEmail,
      action: `ADMIN_${data.action.toUpperCase()}`,
      resource: data.resource,
      resourceId: data.resourceId,
      outcome: data.outcome,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details || {},
      riskLevel: 'HIGH',
      complianceFramework: ['SOC2_CC6.1', 'SOC2_CC7.1'],
      dataClassification: 'RESTRICTED'
    });
  }

  /**
   * Log security incidents (SOC2 CC7.4, GDPR Article 33)
   */
  async logSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp'>) {
    const incidentId = randomUUID();
    const timestamp = new Date();

    await this.prisma.securityIncident.create({
      data: {
        id: incidentId,
        timestamp,
        ...incident
      }
    });

    // Auto-escalate critical incidents
    if (incident.severity === 'CRITICAL') {
      await this.escalateIncident(incidentId, incident);
    }

    // Check if regulatory notification is required (GDPR 72-hour rule)
    if (incident.notificationRequired) {
      await this.scheduleRegulatoryNotification(incidentId, incident);
    }
  }

  /**
   * Log GDPR data processing activities (Article 30)
   */
  async logGDPRDataProcessing(data: Omit<GDPRDataProcessingLog, 'id' | 'timestamp'>) {
    const logEntry: GDPRDataProcessingLog = {
      id: randomUUID(),
      timestamp: new Date(),
      ...data
    };

    await this.prisma.gDPRProcessingLog.create({
      data: logEntry
    });
  }

  /**
   * Generate compliance reports
   */
  async generateSOC2Report(startDate: Date, endDate: Date) {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        complianceFramework: {
          hasSome: ['SOC2_CC6.1', 'SOC2_CC6.2', 'SOC2_CC6.3', 'SOC2_CC7.1', 'SOC2_CC7.4']
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return {
      period: { startDate, endDate },
      totalEvents: auditLogs.length,
      authenticationEvents: auditLogs.filter(log => log.resource === 'AUTHENTICATION').length,
      dataAccessEvents: auditLogs.filter(log => log.action.startsWith('DATA_')).length,
      adminEvents: auditLogs.filter(log => log.action.startsWith('ADMIN_')).length,
      highRiskEvents: auditLogs.filter(log => log.riskLevel === 'HIGH' || log.riskLevel === 'CRITICAL').length,
      failureRate: auditLogs.filter(log => log.outcome === 'FAILURE').length / auditLogs.length,
      complianceMetrics: {
        CC6_1_AuthenticationControls: this.calculateComplianceScore(auditLogs, 'SOC2_CC6.1'),
        CC6_2_AuthorizationControls: this.calculateComplianceScore(auditLogs, 'SOC2_CC6.2'),
        CC6_3_DataAccessControls: this.calculateComplianceScore(auditLogs, 'SOC2_CC6.3'),
        CC7_1_SystemMonitoring: this.calculateComplianceScore(auditLogs, 'SOC2_CC7.1'),
        CC7_4_IncidentResponse: this.calculateComplianceScore(auditLogs, 'SOC2_CC7.4')
      }
    };
  }

  async generateGDPRReport(startDate: Date, endDate: Date) {
    const processingLogs = await this.prisma.gDPRProcessingLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const incidents = await this.prisma.securityIncident.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        notificationRequired: true
      }
    });

    return {
      period: { startDate, endDate },
      processingActivities: processingLogs.length,
      dataSubjects: new Set(processingLogs.map(log => log.dataSubjectId)).size,
      legalBasisBreakdown: this.groupBy(processingLogs, 'legalBasis'),
      dataBreaches: incidents.length,
      notificationDeadlineCompliance: incidents.filter(i =>
        new Date(i.timestamp.getTime() + 72 * 60 * 60 * 1000) > new Date()
      ).length / incidents.length,
      rightsExercised: {
        // Add queries for GDPR rights (access, rectification, erasure, etc.)
      }
    };
  }

  private async addAuditLog(logData: Omit<AuditLogEntry, 'id' | 'timestamp' | 'sessionId' | 'retention_policy' | 'encryption_status'>) {
    const auditLog: AuditLogEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      sessionId: randomUUID(),
      retention_policy: this.getRetentionPolicy(logData.complianceFramework),
      encryption_status: 'ENCRYPTED',
      ...logData
    };

    this.logBuffer.push(auditLog);

    // Immediate flush for high-risk events
    if (auditLog.riskLevel === 'HIGH' || auditLog.riskLevel === 'CRITICAL') {
      await this.flushLogs();
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.prisma.auditLog.createMany({
        data: logsToFlush
      });
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Re-add failed logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  private calculateRiskLevel(action: string, dataClassification: string, outcome: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (outcome === 'FAILURE') return 'HIGH';
    if (dataClassification === 'RESTRICTED') return 'HIGH';
    if (dataClassification === 'CONFIDENTIAL' && ['DELETE', 'EXPORT'].includes(action.toUpperCase())) return 'MEDIUM';
    return 'LOW';
  }

  private getProcessingPurpose(action: string, resource: string): string {
    const purposeMap: Record<string, string> = {
      'READ': 'Service Provision',
      'write': 'Service Provision',
      'update': 'Service Provision',
      'delete': 'Data Management',
      'export': 'Client Request'
    };
    return purposeMap[action.toLowerCase()] || 'Service Provision';
  }

  private getRetentionPolicy(frameworks: string[]): string {
    if (frameworks.includes('SOC2')) return '7_YEARS';
    if (frameworks.includes('GDPR')) return '6_YEARS';
    return '3_YEARS';
  }

  private async checkFailedLoginThreshold(email: string, ipAddress: string) {
    const threshold = 5;
    const timeWindow = 15 * 60 * 1000; // 15 minutes

    const recentFailures = await this.prisma.auditLog.count({
      where: {
        userEmail: email,
        action: 'LOGIN_ATTEMPT',
        outcome: 'FAILURE',
        timestamp: {
          gte: new Date(Date.now() - timeWindow)
        }
      }
    });

    if (recentFailures >= threshold) {
      await this.logSecurityIncident({
        severity: 'HIGH',
        type: 'UNAUTHORIZED_ACCESS',
        description: `Multiple failed login attempts detected for user ${email} from IP ${ipAddress}`,
        affectedUsers: [email],
        affectedSystems: ['AUTHENTICATION_SYSTEM'],
        responseActions: ['ACCOUNT_MONITORING', 'IP_INVESTIGATION'],
        status: 'OPEN',
        notificationRequired: false,
        regulatoryReporting: []
      });
    }
  }

  private async escalateIncident(incidentId: string, incident: Omit<SecurityIncident, 'id' | 'timestamp'>) {
    // Send immediate notifications to security team
    console.log(`CRITICAL INCIDENT ESCALATION: ${incidentId}`);
    // Implement your escalation logic here (email, Slack, PagerDuty, etc.)
  }

  private async scheduleRegulatoryNotification(incidentId: string, incident: Omit<SecurityIncident, 'id' | 'timestamp'>) {
    // Schedule GDPR 72-hour notification
    console.log(`REGULATORY NOTIFICATION REQUIRED: ${incidentId}`);
    // Implement notification scheduling logic here
  }

  private calculateComplianceScore(logs: any[], framework: string): number {
    const frameworkLogs = logs.filter(log => log.complianceFramework.includes(framework));
    if (frameworkLogs.length === 0) return 1.0;

    const successRate = frameworkLogs.filter(log => log.outcome === 'SUCCESS').length / frameworkLogs.length;
    return successRate;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {} as Record<string, number>);
  }

  async cleanup() {
    clearInterval(this.flushInterval);
    await this.flushLogs();
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
export const auditLogger = new ComplianceAuditLogger();

// Export types for use in other modules
export type { AuditLogEntry, GDPRDataProcessingLog, SecurityIncident };