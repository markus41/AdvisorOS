import { openaiService } from './openai-service';
import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface AIUsageMetrics {
  organizationId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  serviceBreakdown: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    averageLatency: number;
    errorRate: number;
  }>;
  operationBreakdown: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    successRate: number;
  }>;
  userBreakdown: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    topOperations: string[];
  }>;
  qualityMetrics: {
    averageConfidence: number;
    feedbackScore: number;
    accuracyRate: number;
    userSatisfaction: number;
  };
  anomalies: Array<{
    type: 'cost_spike' | 'error_spike' | 'unusual_usage' | 'performance_degradation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: Date;
    metrics: Record<string, number>;
  }>;
  recommendations: Array<{
    category: 'cost_optimization' | 'performance' | 'quality' | 'security';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedImpact: string;
    actionItems: string[];
  }>;
}

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  category: 'content_moderation' | 'privacy_protection' | 'usage_limits' | 'quality_assurance' | 'compliance';
  isActive: boolean;
  organizationId: string;
  rules: Array<{
    id: string;
    condition: string;
    action: 'block' | 'warn' | 'review' | 'log' | 'escalate';
    threshold?: number;
    message?: string;
  }>;
  autoRemediation: {
    enabled: boolean;
    actions: string[];
    escalationThreshold: number;
  };
  notifications: {
    immediate: string[];
    daily: string[];
    weekly: string[];
  };
  auditSettings: {
    logLevel: 'basic' | 'detailed' | 'comprehensive';
    retentionDays: number;
    includeContent: boolean;
  };
  createdAt: Date;
  lastUpdated: Date;
}

export interface ContentModerationResult {
  id: string;
  requestId: string;
  content: string;
  contentType: 'text' | 'image' | 'document';
  moderationStatus: 'safe' | 'flagged' | 'blocked';
  confidence: number;
  categories: Array<{
    category: string;
    score: number;
    threshold: number;
    triggered: boolean;
  }>;
  detectedIssues: Array<{
    type: 'inappropriate_content' | 'pii_exposure' | 'confidential_info' | 'bias' | 'hallucination';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
    suggestion: string;
  }>;
  appliedPolicies: string[];
  actionsPerformed: Array<{
    action: string;
    timestamp: Date;
    reason: string;
  }>;
  reviewRequired: boolean;
  reviewAssignedTo?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface UsageQuota {
  organizationId: string;
  service: 'openai' | 'azure_cognitive' | 'form_recognizer' | 'all';
  quotaType: 'requests' | 'tokens' | 'cost' | 'storage';
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  limit: number;
  currentUsage: number;
  resetDate: Date;
  warningThresholds: Array<{
    percentage: number;
    notified: boolean;
  }>;
  overage: {
    allowed: boolean;
    multiplier: number;
    maxOverage: number;
  };
  isActive: boolean;
  lastUpdated: Date;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  service: string;
  operation: string;
  requestData: {
    sanitized: Record<string, any>;
    hash: string;
    containsPII: boolean;
  };
  responseData: {
    sanitized: Record<string, any>;
    hash: string;
    confidence?: number;
    tokensUsed?: number;
  };
  moderationResult?: ContentModerationResult;
  policyViolations: string[];
  costImpact: number;
  latency: number;
  success: boolean;
  errorMessage?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  retentionUntil: Date;
  complianceFlags: string[];
}

export interface QualityAssessment {
  requestId: string;
  assessmentType: 'automatic' | 'manual' | 'user_feedback';
  metrics: {
    accuracy: number;
    relevance: number;
    completeness: number;
    safety: number;
    compliance: number;
  };
  feedback: {
    userRating?: number;
    userComments?: string;
    expertReview?: {
      reviewer: string;
      rating: number;
      comments: string;
      timestamp: Date;
    };
  };
  improvementSuggestions: Array<{
    area: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  benchmarkComparison: {
    industryAverage: number;
    organizationAverage: number;
    previousPeriod: number;
  };
  timestamp: Date;
}

export interface RealTimeAlert {
  id: string;
  organizationId: string;
  type: 'usage_threshold' | 'cost_anomaly' | 'quality_degradation' | 'security_incident' | 'policy_violation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  affectedServices: string[];
  affectedUsers: string[];
  metrics: Record<string, number>;
  recommendedActions: string[];
  autoRemediation: {
    applied: boolean;
    actions: string[];
    success: boolean;
  };
  notifications: {
    sent: string[];
    pending: string[];
    failed: string[];
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

class AIMonitoringSafetyService extends EventEmitter {
  private usageCache = new Map<string, any>();
  private quotas = new Map<string, UsageQuota>();
  private policies = new Map<string, SafetyPolicy>();
  private activeAlerts = new Map<string, RealTimeAlert>();
  private isMonitoring = false;

  constructor() {
    super();
    this.loadSafetyPolicies();
    this.loadUsageQuotas();
    this.startRealTimeMonitoring();
  }

  /**
   * Monitor AI usage in real-time
   */
  async monitorAIRequest(
    organizationId: string,
    userId: string,
    requestData: {
      service: string;
      operation: string;
      content: string;
      metadata: Record<string, any>;
    }
  ): Promise<{
    allowed: boolean;
    moderationResult: ContentModerationResult;
    quotaStatus: {
      withinLimits: boolean;
      warnings: string[];
    };
    policyViolations: string[];
    recommendations: string[];
  }> {
    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Step 1: Content moderation
      const moderationResult = await this.moderateContent(
        requestId,
        requestData.content,
        'text',
        organizationId
      );

      // Step 2: Check usage quotas
      const quotaStatus = await this.checkUsageQuotas(
        organizationId,
        requestData.service,
        requestData.operation
      );

      // Step 3: Evaluate safety policies
      const policyViolations = await this.evaluateSafetyPolicies(
        organizationId,
        requestData,
        moderationResult
      );

      // Step 4: Generate recommendations
      const recommendations = await this.generateSafetyRecommendations(
        moderationResult,
        quotaStatus,
        policyViolations
      );

      // Step 5: Log audit trail
      await this.logAuditTrail(
        organizationId,
        userId,
        requestId,
        requestData,
        moderationResult,
        policyViolations
      );

      // Step 6: Check for real-time alerts
      await this.checkRealTimeAlerts(
        organizationId,
        requestData,
        moderationResult,
        quotaStatus
      );

      const allowed = moderationResult.moderationStatus !== 'blocked' &&
                     quotaStatus.withinLimits &&
                     !policyViolations.some(v => this.isCriticalViolation(v));

      return {
        allowed,
        moderationResult,
        quotaStatus,
        policyViolations,
        recommendations
      };

    } catch (error) {
      console.error('AI request monitoring failed:', error);
      throw new Error(`Monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate comprehensive usage analytics
   */
  async generateUsageAnalytics(
    organizationId: string,
    period: {
      startDate: Date;
      endDate: Date;
    },
    options: {
      includeUserBreakdown?: boolean;
      includeQualityMetrics?: boolean;
      detectAnomalies?: boolean;
    } = {}
  ): Promise<AIUsageMetrics> {
    try {
      // Get usage data from database
      const usageData = await prisma.aiUsageLog.findMany({
        where: {
          organizationId,
          timestamp: {
            gte: period.startDate,
            lte: period.endDate
          }
        },
        include: {
          user: true
        }
      });

      // Calculate basic metrics
      const totalRequests = usageData.length;
      const totalTokens = usageData.reduce((sum, log) => sum + log.tokensUsed, 0);
      const totalCost = usageData.reduce((sum, log) => sum + log.cost, 0);

      // Service breakdown
      const serviceBreakdown = this.calculateServiceBreakdown(usageData);

      // Operation breakdown
      const operationBreakdown = this.calculateOperationBreakdown(usageData);

      // User breakdown
      const userBreakdown = options.includeUserBreakdown
        ? this.calculateUserBreakdown(usageData)
        : {};

      // Quality metrics
      const qualityMetrics = options.includeQualityMetrics
        ? await this.calculateQualityMetrics(organizationId, period)
        : {
            averageConfidence: 0,
            feedbackScore: 0,
            accuracyRate: 0,
            userSatisfaction: 0
          };

      // Anomaly detection
      const anomalies = options.detectAnomalies
        ? await this.detectUsageAnomalies(organizationId, usageData, period)
        : [];

      // Generate recommendations
      const recommendations = await this.generateUsageRecommendations(
        usageData,
        serviceBreakdown,
        qualityMetrics,
        anomalies
      );

      return {
        organizationId,
        period,
        totalRequests,
        totalTokens,
        totalCost,
        serviceBreakdown,
        operationBreakdown,
        userBreakdown,
        qualityMetrics,
        anomalies,
        recommendations
      };

    } catch (error) {
      console.error('Usage analytics generation failed:', error);
      throw new Error(`Analytics generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Moderate content for safety and compliance
   */
  async moderateContent(
    requestId: string,
    content: string,
    contentType: 'text' | 'image' | 'document',
    organizationId: string
  ): Promise<ContentModerationResult> {
    try {
      // Step 1: OpenAI content moderation
      const openaiModeration = await openaiService.moderateContent(content);

      // Step 2: Custom PII detection
      const piiDetection = await this.detectPII(content);

      // Step 3: Confidentiality check
      const confidentialityCheck = await this.checkConfidentiality(content, organizationId);

      // Step 4: Bias detection
      const biasDetection = await this.detectBias(content);

      // Step 5: Hallucination detection (for AI-generated content)
      const hallucinationCheck = await this.detectHallucination(content);

      // Combine results
      const categories = [
        ...this.mapOpenAIModerationCategories(openaiModeration),
        ...piiDetection.categories,
        ...confidentialityCheck.categories,
        ...biasDetection.categories,
        ...hallucinationCheck.categories
      ];

      const detectedIssues = [
        ...piiDetection.issues,
        ...confidentialityCheck.issues,
        ...biasDetection.issues,
        ...hallucinationCheck.issues
      ];

      // Determine overall status
      const criticalIssues = detectedIssues.filter(issue => issue.severity === 'critical');
      const highIssues = detectedIssues.filter(issue => issue.severity === 'high');

      let moderationStatus: 'safe' | 'flagged' | 'blocked';
      if (criticalIssues.length > 0 || !openaiModeration.isSafe) {
        moderationStatus = 'blocked';
      } else if (highIssues.length > 0 || detectedIssues.length > 3) {
        moderationStatus = 'flagged';
      } else {
        moderationStatus = 'safe';
      }

      // Apply policies
      const appliedPolicies = await this.applyModerationPolicies(
        organizationId,
        moderationStatus,
        detectedIssues
      );

      const result: ContentModerationResult = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        content: this.sanitizeContentForLogging(content),
        contentType,
        moderationStatus,
        confidence: this.calculateModerationConfidence(categories, detectedIssues),
        categories,
        detectedIssues,
        appliedPolicies,
        actionsPerformed: [],
        reviewRequired: moderationStatus === 'flagged' || criticalIssues.length > 0,
        timestamp: new Date(),
        metadata: {
          openaiModeration,
          piiDetected: piiDetection.detected,
          confidentialityFlags: confidentialityCheck.flags,
          biasScore: biasDetection.score,
          hallucinationRisk: hallucinationCheck.risk
        }
      };

      // Save moderation result
      await this.saveModerationResult(organizationId, result);

      return result;

    } catch (error) {
      console.error('Content moderation failed:', error);
      throw new Error(`Content moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assess AI output quality
   */
  async assessAIQuality(
    requestId: string,
    prompt: string,
    response: string,
    organizationId: string,
    assessmentType: 'automatic' | 'manual' | 'user_feedback' = 'automatic'
  ): Promise<QualityAssessment> {
    try {
      let metrics = {
        accuracy: 0.8,
        relevance: 0.8,
        completeness: 0.8,
        safety: 0.9,
        compliance: 0.9
      };

      if (assessmentType === 'automatic') {
        // Use AI to assess quality
        metrics = await this.automaticQualityAssessment(prompt, response);
      }

      // Get benchmark data
      const benchmarkComparison = await this.getBenchmarkComparison(
        organizationId,
        'quality_score'
      );

      // Generate improvement suggestions
      const improvementSuggestions = await this.generateImprovementSuggestions(
        prompt,
        response,
        metrics
      );

      const assessment: QualityAssessment = {
        requestId,
        assessmentType,
        metrics,
        feedback: {},
        improvementSuggestions,
        benchmarkComparison,
        timestamp: new Date()
      };

      // Save quality assessment
      await this.saveQualityAssessment(organizationId, assessment);

      return assessment;

    } catch (error) {
      console.error('Quality assessment failed:', error);
      throw new Error(`Quality assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create or update safety policy
   */
  async createSafetyPolicy(
    organizationId: string,
    policyData: Omit<SafetyPolicy, 'id' | 'createdAt' | 'lastUpdated'>
  ): Promise<SafetyPolicy> {
    try {
      const policy: SafetyPolicy = {
        id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...policyData,
        organizationId,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      // Validate policy rules
      await this.validatePolicyRules(policy.rules);

      // Save to database
      await prisma.safetyPolicy.create({
        data: {
          id: policy.id,
          organizationId: policy.organizationId,
          name: policy.name,
          description: policy.description,
          category: policy.category,
          isActive: policy.isActive,
          rules: policy.rules,
          autoRemediation: policy.autoRemediation,
          notifications: policy.notifications,
          auditSettings: policy.auditSettings,
          createdAt: policy.createdAt,
          lastUpdated: policy.lastUpdated
        }
      });

      // Update cache
      this.policies.set(policy.id, policy);

      this.emit('policy_created', {
        organizationId,
        policyId: policy.id,
        category: policy.category
      });

      return policy;

    } catch (error) {
      console.error('Safety policy creation failed:', error);
      throw new Error(`Policy creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time alerts
   */
  async getRealTimeAlerts(
    organizationId: string,
    filters: {
      severity?: string[];
      type?: string[];
      status?: string[];
      limit?: number;
    } = {}
  ): Promise<RealTimeAlert[]> {
    try {
      const alerts = await prisma.realTimeAlert.findMany({
        where: {
          organizationId,
          ...(filters.severity && { severity: { in: filters.severity } }),
          ...(filters.type && { type: { in: filters.type } }),
          ...(filters.status && { status: { in: filters.status } })
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50
      });

      return alerts as RealTimeAlert[];

    } catch (error) {
      console.error('Failed to get real-time alerts:', error);
      throw new Error(`Failed to get alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private async loadSafetyPolicies(): Promise<void> {
    try {
      const policies = await prisma.safetyPolicy.findMany({
        where: { isActive: true }
      });

      policies.forEach(policy => {
        this.policies.set(policy.id, policy as any);
      });

      console.log(`Loaded ${policies.length} safety policies`);
    } catch (error) {
      console.error('Failed to load safety policies:', error);
    }
  }

  private async loadUsageQuotas(): Promise<void> {
    try {
      const quotas = await prisma.usageQuota.findMany({
        where: { isActive: true }
      });

      quotas.forEach(quota => {
        this.quotas.set(`${quota.organizationId}_${quota.service}_${quota.quotaType}`, quota as any);
      });

      console.log(`Loaded ${quotas.length} usage quotas`);
    } catch (error) {
      console.error('Failed to load usage quotas:', error);
    }
  }

  private startRealTimeMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor usage patterns every minute
    setInterval(async () => {
      try {
        await this.performRealTimeChecks();
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 60 * 1000); // 1 minute

    console.log('Real-time AI monitoring started');
  }

  private async checkUsageQuotas(
    organizationId: string,
    service: string,
    operation: string
  ): Promise<{
    withinLimits: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let withinLimits = true;

    // Check relevant quotas
    const quotaKeys = [
      `${organizationId}_${service}_requests`,
      `${organizationId}_${service}_tokens`,
      `${organizationId}_${service}_cost`,
      `${organizationId}_all_requests`,
      `${organizationId}_all_cost`
    ];

    for (const key of quotaKeys) {
      const quota = this.quotas.get(key);
      if (!quota) continue;

      const usagePercentage = quota.currentUsage / quota.limit;

      // Check warning thresholds
      for (const threshold of quota.warningThresholds) {
        if (usagePercentage >= threshold.percentage / 100 && !threshold.notified) {
          warnings.push(`${quota.quotaType} usage at ${Math.round(usagePercentage * 100)}% for ${quota.service}`);
          threshold.notified = true;
        }
      }

      // Check if over limit
      if (quota.currentUsage >= quota.limit) {
        if (!quota.overage.allowed) {
          withinLimits = false;
        } else if (quota.currentUsage >= quota.limit * (1 + quota.overage.maxOverage)) {
          withinLimits = false;
        }
      }
    }

    return { withinLimits, warnings };
  }

  private async evaluateSafetyPolicies(
    organizationId: string,
    requestData: any,
    moderationResult: ContentModerationResult
  ): Promise<string[]> {
    const violations: string[] = [];

    const orgPolicies = Array.from(this.policies.values())
      .filter(policy => policy.organizationId === organizationId && policy.isActive);

    for (const policy of orgPolicies) {
      for (const rule of policy.rules) {
        const violation = await this.evaluatePolicyRule(rule, requestData, moderationResult);
        if (violation) {
          violations.push(`${policy.name}: ${violation}`);
        }
      }
    }

    return violations;
  }

  private async evaluatePolicyRule(
    rule: any,
    requestData: any,
    moderationResult: ContentModerationResult
  ): Promise<string | null> {
    // Evaluate rule condition
    try {
      // Simple condition evaluation
      if (rule.condition.includes('moderationStatus') &&
          moderationResult.moderationStatus === 'blocked') {
        return rule.message || 'Content blocked by moderation';
      }

      if (rule.condition.includes('detectedIssues') &&
          moderationResult.detectedIssues.length > (rule.threshold || 0)) {
        return rule.message || `Too many detected issues: ${moderationResult.detectedIssues.length}`;
      }

      return null;
    } catch (error) {
      console.error('Policy rule evaluation failed:', error);
      return null;
    }
  }

  private async generateSafetyRecommendations(
    moderationResult: ContentModerationResult,
    quotaStatus: any,
    policyViolations: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (moderationResult.moderationStatus === 'flagged') {
      recommendations.push('Review flagged content before proceeding');
    }

    if (moderationResult.detectedIssues.some(issue => issue.type === 'pii_exposure')) {
      recommendations.push('Remove or redact personal information before processing');
    }

    if (!quotaStatus.withinLimits) {
      recommendations.push('Consider upgrading usage quota or optimizing AI usage');
    }

    if (quotaStatus.warnings.length > 0) {
      recommendations.push('Monitor usage closely - approaching quota limits');
    }

    if (policyViolations.length > 0) {
      recommendations.push('Address policy violations before proceeding');
    }

    return recommendations;
  }

  private async logAuditTrail(
    organizationId: string,
    userId: string,
    requestId: string,
    requestData: any,
    moderationResult: ContentModerationResult,
    policyViolations: string[]
  ): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        organizationId,
        userId,
        service: requestData.service,
        operation: requestData.operation,
        requestData: {
          sanitized: this.sanitizeData(requestData),
          hash: this.hashContent(requestData.content),
          containsPII: moderationResult.detectedIssues.some(issue => issue.type === 'pii_exposure')
        },
        responseData: {
          sanitized: {},
          hash: ''
        },
        moderationResult,
        policyViolations,
        costImpact: 0, // Would be calculated based on actual usage
        latency: 0,
        success: true,
        ipAddress: requestData.metadata.ipAddress || 'unknown',
        userAgent: requestData.metadata.userAgent || 'unknown',
        timestamp: new Date(),
        retentionUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        complianceFlags: this.extractComplianceFlags(moderationResult)
      };

      await prisma.auditLog.create({
        data: auditLog as any
      });

    } catch (error) {
      console.error('Failed to log audit trail:', error);
    }
  }

  private async detectPII(content: string): Promise<{
    detected: boolean;
    categories: Array<{ category: string; score: number; threshold: number; triggered: boolean }>;
    issues: Array<{ type: 'pii_exposure'; severity: 'low' | 'medium' | 'high' | 'critical'; description: string; location?: string; suggestion: string }>;
  }> {
    const issues: any[] = [];
    const categories: any[] = [];

    // SSN detection
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
    const ssnMatches = content.match(ssnPattern);
    if (ssnMatches) {
      issues.push({
        type: 'pii_exposure',
        severity: 'critical',
        description: `Social Security Number detected: ${ssnMatches.length} instances`,
        suggestion: 'Remove or redact SSN before processing'
      });
      categories.push({ category: 'ssn', score: 1.0, threshold: 0.5, triggered: true });
    }

    // Email detection
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = content.match(emailPattern);
    if (emailMatches) {
      issues.push({
        type: 'pii_exposure',
        severity: 'medium',
        description: `Email addresses detected: ${emailMatches.length} instances`,
        suggestion: 'Consider anonymizing email addresses'
      });
      categories.push({ category: 'email', score: 0.8, threshold: 0.7, triggered: true });
    }

    // Phone number detection
    const phonePattern = /\b\d{3}-?\d{3}-?\d{4}\b/g;
    const phoneMatches = content.match(phonePattern);
    if (phoneMatches) {
      issues.push({
        type: 'pii_exposure',
        severity: 'medium',
        description: `Phone numbers detected: ${phoneMatches.length} instances`,
        suggestion: 'Consider redacting phone numbers'
      });
      categories.push({ category: 'phone', score: 0.7, threshold: 0.6, triggered: true });
    }

    return {
      detected: issues.length > 0,
      categories,
      issues
    };
  }

  private async checkConfidentiality(content: string, organizationId: string): Promise<{
    flags: string[];
    categories: Array<{ category: string; score: number; threshold: number; triggered: boolean }>;
    issues: Array<{ type: 'confidential_info'; severity: 'low' | 'medium' | 'high' | 'critical'; description: string; location?: string; suggestion: string }>;
  }> {
    const flags: string[] = [];
    const categories: any[] = [];
    const issues: any[] = [];

    // Check for financial data
    const financialPattern = /\$[\d,]+\.?\d*/g;
    const financialMatches = content.match(financialPattern);
    if (financialMatches && financialMatches.length > 5) {
      flags.push('financial_data');
      issues.push({
        type: 'confidential_info',
        severity: 'high',
        description: 'Multiple financial amounts detected',
        suggestion: 'Verify if financial data should be included'
      });
      categories.push({ category: 'financial', score: 0.9, threshold: 0.7, triggered: true });
    }

    // Check for client-attorney privilege indicators
    const privilegeKeywords = ['confidential', 'attorney-client', 'privileged', 'do not disclose'];
    const privilegeDetected = privilegeKeywords.some(keyword =>
      content.toLowerCase().includes(keyword)
    );

    if (privilegeDetected) {
      flags.push('attorney_client_privilege');
      issues.push({
        type: 'confidential_info',
        severity: 'critical',
        description: 'Attorney-client privileged information detected',
        suggestion: 'Do not process without explicit authorization'
      });
      categories.push({ category: 'privilege', score: 1.0, threshold: 0.5, triggered: true });
    }

    return { flags, categories, issues };
  }

  private async detectBias(content: string): Promise<{
    score: number;
    categories: Array<{ category: string; score: number; threshold: number; triggered: boolean }>;
    issues: Array<{ type: 'bias'; severity: 'low' | 'medium' | 'high' | 'critical'; description: string; location?: string; suggestion: string }>;
  }> {
    // Simplified bias detection
    const biasKeywords = ['obviously', 'clearly', 'everyone knows', 'it\'s common sense'];
    const biasCount = biasKeywords.reduce((count, keyword) =>
      count + (content.toLowerCase().includes(keyword) ? 1 : 0), 0
    );

    const score = Math.min(biasCount * 0.2, 1.0);
    const issues: any[] = [];
    const categories: any[] = [];

    if (score > 0.5) {
      issues.push({
        type: 'bias',
        severity: 'medium',
        description: 'Potential bias detected in language',
        suggestion: 'Review language for objectivity'
      });
      categories.push({ category: 'language_bias', score, threshold: 0.5, triggered: true });
    }

    return { score, categories, issues };
  }

  private async detectHallucination(content: string): Promise<{
    risk: number;
    categories: Array<{ category: string; score: number; threshold: number; triggered: boolean }>;
    issues: Array<{ type: 'hallucination'; severity: 'low' | 'medium' | 'high' | 'critical'; description: string; location?: string; suggestion: string }>;
  }> {
    // Simplified hallucination detection
    const risk = 0.1; // Would be more sophisticated in practice
    return {
      risk,
      categories: [],
      issues: []
    };
  }

  private mapOpenAIModerationCategories(moderation: any): Array<{ category: string; score: number; threshold: number; triggered: boolean }> {
    if (!moderation.categories) return [];

    return Object.keys(moderation.categories).map(category => ({
      category,
      score: 1.0, // OpenAI provides boolean results
      threshold: 0.5,
      triggered: moderation.categories[category]
    }));
  }

  private calculateModerationConfidence(categories: any[], issues: any[]): number {
    if (categories.length === 0) return 0.9;

    const avgScore = categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length;
    const severityPenalty = issues.filter(issue => issue.severity === 'critical').length * 0.2;

    return Math.max(0.1, Math.min(0.95, avgScore - severityPenalty));
  }

  private async applyModerationPolicies(
    organizationId: string,
    moderationStatus: string,
    detectedIssues: any[]
  ): Promise<string[]> {
    const appliedPolicies: string[] = [];

    const relevantPolicies = Array.from(this.policies.values())
      .filter(policy =>
        policy.organizationId === organizationId &&
        policy.category === 'content_moderation' &&
        policy.isActive
      );

    for (const policy of relevantPolicies) {
      appliedPolicies.push(policy.id);
    }

    return appliedPolicies;
  }

  private sanitizeContentForLogging(content: string): string {
    // Remove PII and sensitive data for logging
    return content
      .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE]')
      .substring(0, 1000); // Limit length
  }

  private async saveModerationResult(organizationId: string, result: ContentModerationResult): Promise<void> {
    try {
      await prisma.contentModerationResult.create({
        data: {
          id: result.id,
          organizationId,
          requestId: result.requestId,
          contentType: result.contentType,
          moderationStatus: result.moderationStatus,
          confidence: result.confidence,
          categories: result.categories,
          detectedIssues: result.detectedIssues,
          appliedPolicies: result.appliedPolicies,
          reviewRequired: result.reviewRequired,
          timestamp: result.timestamp,
          metadata: result.metadata
        }
      });
    } catch (error) {
      console.error('Failed to save moderation result:', error);
    }
  }

  private calculateServiceBreakdown(usageData: any[]): Record<string, any> {
    const breakdown: Record<string, any> = {};

    usageData.forEach(log => {
      if (!breakdown[log.service]) {
        breakdown[log.service] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          latencies: [],
          errors: 0
        };
      }

      breakdown[log.service].requests += 1;
      breakdown[log.service].tokens += log.tokensUsed || 0;
      breakdown[log.service].cost += log.cost || 0;
      breakdown[log.service].latencies.push(log.latency || 0);
      if (!log.success) breakdown[log.service].errors += 1;
    });

    // Calculate averages
    Object.keys(breakdown).forEach(service => {
      const data = breakdown[service];
      data.averageLatency = data.latencies.reduce((sum: number, lat: number) => sum + lat, 0) / data.latencies.length || 0;
      data.errorRate = data.errors / data.requests;
      delete data.latencies;
      delete data.errors;
    });

    return breakdown;
  }

  private calculateOperationBreakdown(usageData: any[]): Record<string, any> {
    const breakdown: Record<string, any> = {};

    usageData.forEach(log => {
      if (!breakdown[log.operation]) {
        breakdown[log.operation] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          successes: 0
        };
      }

      breakdown[log.operation].requests += 1;
      breakdown[log.operation].tokens += log.tokensUsed || 0;
      breakdown[log.operation].cost += log.cost || 0;
      if (log.success) breakdown[log.operation].successes += 1;
    });

    // Calculate success rates
    Object.keys(breakdown).forEach(operation => {
      const data = breakdown[operation];
      data.successRate = data.successes / data.requests;
      delete data.successes;
    });

    return breakdown;
  }

  private calculateUserBreakdown(usageData: any[]): Record<string, any> {
    const breakdown: Record<string, any> = {};

    usageData.forEach(log => {
      if (!breakdown[log.userId]) {
        breakdown[log.userId] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          operations: new Map()
        };
      }

      breakdown[log.userId].requests += 1;
      breakdown[log.userId].tokens += log.tokensUsed || 0;
      breakdown[log.userId].cost += log.cost || 0;

      const ops = breakdown[log.userId].operations;
      ops.set(log.operation, (ops.get(log.operation) || 0) + 1);
    });

    // Convert to final format
    Object.keys(breakdown).forEach(userId => {
      const data = breakdown[userId];
      data.topOperations = Array.from(data.operations.entries())
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([op]) => op);
      delete data.operations;
    });

    return breakdown;
  }

  private async calculateQualityMetrics(organizationId: string, period: any): Promise<any> {
    // Get quality assessments from database
    const assessments = await prisma.qualityAssessment.findMany({
      where: {
        organizationId,
        timestamp: {
          gte: period.startDate,
          lte: period.endDate
        }
      }
    });

    if (assessments.length === 0) {
      return {
        averageConfidence: 0,
        feedbackScore: 0,
        accuracyRate: 0,
        userSatisfaction: 0
      };
    }

    const metrics = assessments.reduce((acc, assessment) => {
      acc.accuracy += assessment.metrics.accuracy;
      acc.relevance += assessment.metrics.relevance;
      acc.completeness += assessment.metrics.completeness;
      acc.safety += assessment.metrics.safety;
      acc.compliance += assessment.metrics.compliance;
      if (assessment.feedback.userRating) {
        acc.userRatings.push(assessment.feedback.userRating);
      }
      return acc;
    }, {
      accuracy: 0,
      relevance: 0,
      completeness: 0,
      safety: 0,
      compliance: 0,
      userRatings: [] as number[]
    });

    const count = assessments.length;
    return {
      averageConfidence: (metrics.accuracy + metrics.relevance + metrics.completeness) / (3 * count),
      feedbackScore: metrics.userRatings.length > 0 ?
        metrics.userRatings.reduce((sum, rating) => sum + rating, 0) / metrics.userRatings.length : 0,
      accuracyRate: metrics.accuracy / count,
      userSatisfaction: metrics.userRatings.length > 0 ?
        metrics.userRatings.reduce((sum, rating) => sum + rating, 0) / metrics.userRatings.length : 0
    };
  }

  private async detectUsageAnomalies(
    organizationId: string,
    usageData: any[],
    period: any
  ): Promise<Array<{
    type: 'cost_spike' | 'error_spike' | 'unusual_usage' | 'performance_degradation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: Date;
    metrics: Record<string, number>;
  }>> {
    const anomalies: any[] = [];

    // Cost spike detection
    const totalCost = usageData.reduce((sum, log) => sum + log.cost, 0);
    const averageDailyCost = totalCost / Math.max(1, Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (averageDailyCost > 100) { // Threshold
      anomalies.push({
        type: 'cost_spike',
        severity: averageDailyCost > 500 ? 'critical' : 'high',
        description: `Daily cost average of $${averageDailyCost.toFixed(2)} detected`,
        detectedAt: new Date(),
        metrics: { dailyCost: averageDailyCost, totalCost }
      });
    }

    // Error spike detection
    const errorRate = usageData.filter(log => !log.success).length / Math.max(1, usageData.length);
    if (errorRate > 0.1) { // 10% error rate threshold
      anomalies.push({
        type: 'error_spike',
        severity: errorRate > 0.25 ? 'critical' : 'high',
        description: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        detectedAt: new Date(),
        metrics: { errorRate, totalErrors: usageData.filter(log => !log.success).length }
      });
    }

    return anomalies;
  }

  private async generateUsageRecommendations(
    usageData: any[],
    serviceBreakdown: any,
    qualityMetrics: any,
    anomalies: any[]
  ): Promise<Array<{
    category: 'cost_optimization' | 'performance' | 'quality' | 'security';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedImpact: string;
    actionItems: string[];
  }>> {
    const recommendations: any[] = [];

    // Cost optimization
    const totalCost = usageData.reduce((sum, log) => sum + log.cost, 0);
    if (totalCost > 1000) {
      recommendations.push({
        category: 'cost_optimization',
        priority: 'high',
        description: 'High AI usage costs detected',
        estimatedImpact: 'Potential 20-30% cost reduction',
        actionItems: [
          'Implement prompt optimization',
          'Review usage patterns for efficiency',
          'Consider batch processing for bulk operations',
          'Implement caching for repeated queries'
        ]
      });
    }

    // Quality improvement
    if (qualityMetrics.averageConfidence < 0.8) {
      recommendations.push({
        category: 'quality',
        priority: 'medium',
        description: 'AI output quality below optimal threshold',
        estimatedImpact: 'Improved accuracy and user satisfaction',
        actionItems: [
          'Implement quality feedback loops',
          'Fine-tune prompts for better results',
          'Add human review for critical operations',
          'Implement A/B testing for prompt variations'
        ]
      });
    }

    // Performance optimization
    const averageLatency = Object.values(serviceBreakdown).reduce((sum: number, service: any) =>
      sum + service.averageLatency, 0) / Object.keys(serviceBreakdown).length;

    if (averageLatency > 5000) { // 5 seconds
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        description: 'High response latency detected',
        estimatedImpact: 'Faster response times and better user experience',
        actionItems: [
          'Optimize prompt length and complexity',
          'Implement request queuing and prioritization',
          'Consider parallel processing where applicable',
          'Monitor and optimize network connectivity'
        ]
      });
    }

    return recommendations;
  }

  private isCriticalViolation(violation: string): boolean {
    const criticalPatterns = ['blocked', 'critical', 'unauthorized', 'breach'];
    return criticalPatterns.some(pattern => violation.toLowerCase().includes(pattern));
  }

  private async checkRealTimeAlerts(
    organizationId: string,
    requestData: any,
    moderationResult: ContentModerationResult,
    quotaStatus: any
  ): Promise<void> {
    // Check for immediate alerts that need to be raised
    const alerts: Partial<RealTimeAlert>[] = [];

    // Critical moderation issues
    if (moderationResult.moderationStatus === 'blocked') {
      alerts.push({
        organizationId,
        type: 'security_incident',
        severity: 'critical',
        title: 'Content Blocked by AI Safety Systems',
        description: 'Potentially harmful content was automatically blocked',
        affectedServices: [requestData.service],
        recommendedActions: ['Review content before resubmission', 'Check safety policies']
      });
    }

    // Quota violations
    if (!quotaStatus.withinLimits) {
      alerts.push({
        organizationId,
        type: 'usage_threshold',
        severity: 'warning',
        title: 'Usage Quota Exceeded',
        description: 'AI service usage has exceeded configured limits',
        affectedServices: [requestData.service],
        recommendedActions: ['Review usage patterns', 'Consider quota increase']
      });
    }

    // Create alerts in database
    for (const alertData of alerts) {
      await this.createRealTimeAlert(alertData as RealTimeAlert);
    }
  }

  private async createRealTimeAlert(alertData: Partial<RealTimeAlert>): Promise<void> {
    try {
      const alert: RealTimeAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: alertData.organizationId!,
        type: alertData.type!,
        severity: alertData.severity!,
        title: alertData.title!,
        description: alertData.description!,
        affectedServices: alertData.affectedServices || [],
        affectedUsers: alertData.affectedUsers || [],
        metrics: alertData.metrics || {},
        recommendedActions: alertData.recommendedActions || [],
        autoRemediation: {
          applied: false,
          actions: [],
          success: false
        },
        notifications: {
          sent: [],
          pending: [],
          failed: []
        },
        status: 'active',
        createdAt: new Date()
      };

      await prisma.realTimeAlert.create({
        data: alert as any
      });

      this.activeAlerts.set(alert.id, alert);

      this.emit('real_time_alert', alert);

    } catch (error) {
      console.error('Failed to create real-time alert:', error);
    }
  }

  private async performRealTimeChecks(): Promise<void> {
    // Perform various real-time monitoring checks
    try {
      const organizations = await prisma.organization.findMany({
        select: { id: true }
      });

      for (const org of organizations) {
        await this.checkOrganizationHealth(org.id);
      }
    } catch (error) {
      console.error('Real-time checks failed:', error);
    }
  }

  private async checkOrganizationHealth(organizationId: string): Promise<void> {
    // Check for various health metrics and raise alerts if needed
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check recent error rates
    const recentLogs = await prisma.aiUsageLog.findMany({
      where: {
        organizationId,
        timestamp: { gte: oneHourAgo }
      }
    });

    if (recentLogs.length > 0) {
      const errorRate = recentLogs.filter(log => !log.success).length / recentLogs.length;

      if (errorRate > 0.25) { // 25% error rate
        await this.createRealTimeAlert({
          organizationId,
          type: 'performance_degradation',
          severity: 'high',
          title: 'High Error Rate Detected',
          description: `Error rate of ${(errorRate * 100).toFixed(1)}% in the last hour`,
          metrics: { errorRate, totalRequests: recentLogs.length },
          recommendedActions: ['Check service status', 'Review recent changes']
        });
      }
    }
  }

  private async automaticQualityAssessment(prompt: string, response: string): Promise<any> {
    // Use AI to assess the quality of AI responses
    try {
      const assessment = await openaiService.analyzeSentiment('temp', response);

      return {
        accuracy: Math.max(0.5, assessment.confidence),
        relevance: assessment.score > 0 ? 0.8 : 0.6,
        completeness: response.length > 100 ? 0.8 : 0.6,
        safety: assessment.sentiment === 'positive' ? 0.9 : 0.7,
        compliance: 0.85 // Would be more sophisticated
      };
    } catch (error) {
      return {
        accuracy: 0.7,
        relevance: 0.7,
        completeness: 0.7,
        safety: 0.8,
        compliance: 0.8
      };
    }
  }

  private async getBenchmarkComparison(organizationId: string, metric: string): Promise<any> {
    // Get benchmark data for comparison
    return {
      industryAverage: 0.75,
      organizationAverage: 0.78,
      previousPeriod: 0.76
    };
  }

  private async generateImprovementSuggestions(
    prompt: string,
    response: string,
    metrics: any
  ): Promise<Array<{
    area: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>> {
    const suggestions: any[] = [];

    if (metrics.accuracy < 0.8) {
      suggestions.push({
        area: 'accuracy',
        suggestion: 'Improve prompt specificity and add context',
        priority: 'high'
      });
    }

    if (metrics.completeness < 0.8) {
      suggestions.push({
        area: 'completeness',
        suggestion: 'Request more comprehensive responses',
        priority: 'medium'
      });
    }

    if (response.length < 50) {
      suggestions.push({
        area: 'detail',
        suggestion: 'Encourage more detailed responses',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  private async saveQualityAssessment(organizationId: string, assessment: QualityAssessment): Promise<void> {
    try {
      await prisma.qualityAssessment.create({
        data: {
          organizationId,
          requestId: assessment.requestId,
          assessmentType: assessment.assessmentType,
          metrics: assessment.metrics,
          feedback: assessment.feedback,
          improvementSuggestions: assessment.improvementSuggestions,
          benchmarkComparison: assessment.benchmarkComparison,
          timestamp: assessment.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to save quality assessment:', error);
    }
  }

  private async validatePolicyRules(rules: any[]): Promise<void> {
    // Validate that policy rules are well-formed
    for (const rule of rules) {
      if (!rule.condition || !rule.action) {
        throw new Error('Policy rules must have condition and action');
      }
    }
  }

  private sanitizeData(data: any): Record<string, any> {
    // Remove sensitive data for logging
    const sanitized = { ...data };
    delete sanitized.content; // Content is handled separately
    delete sanitized.apiKey;
    delete sanitized.password;
    return sanitized;
  }

  private hashContent(content: string): string {
    // Simple hash function for content tracking
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private extractComplianceFlags(moderationResult: ContentModerationResult): string[] {
    const flags: string[] = [];

    if (moderationResult.detectedIssues.some(issue => issue.type === 'pii_exposure')) {
      flags.push('pii_detected');
    }

    if (moderationResult.detectedIssues.some(issue => issue.type === 'confidential_info')) {
      flags.push('confidential_content');
    }

    if (moderationResult.moderationStatus === 'blocked') {
      flags.push('content_blocked');
    }

    return flags;
  }
}

// Export singleton instance
export const aiMonitoringSafetyService = new AIMonitoringSafetyService();

// Export types
export type {
  AIUsageMetrics,
  SafetyPolicy,
  ContentModerationResult,
  UsageQuota,
  AuditLog,
  QualityAssessment,
  RealTimeAlert
};