/**
 * AI Copilot Mode System - Context-aware operating modes for different CPA workflows
 * Each mode configures the AI assistant for specific professional contexts
 */

export interface AIModeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  primaryAgent: string;
  supportingAgents: string[];
  contextPrompts: string[];
  quickActions: string[];
  toolsEnabled: string[];
  workflows: string[];
  priority: 'high' | 'medium' | 'low';
  autoActivation?: {
    triggers: string[];
    conditions: Record<string, any>;
  };
}

export interface ModeContext {
  userId: string;
  organizationId: string;
  currentClient?: string;
  activeDocument?: string;
  workflowState?: Record<string, any>;
  temporalContext?: {
    season: 'tax' | 'audit' | 'normal' | 'yearend';
    urgency: 'high' | 'medium' | 'low';
  };
  preferences?: Record<string, any>;
}

/**
 * CPA Professional Mode - General advisory and client management
 */
export const CPA_MODE: AIModeConfig = {
  id: 'cpa-professional',
  name: 'CPA Professional',
  description: 'General purpose CPA advisory with client management focus',
  icon: '👨‍💼',
  primaryAgent: 'senior-cpa-advisor',
  supportingAgents: ['client-relationship-manager', 'document-analyzer', 'financial-analyst'],
  contextPrompts: [
    'professional-communication',
    'business-advisory',
    'client-consultation'
  ],
  quickActions: [
    'analyze-client-financial-health',
    'draft-professional-email',
    'generate-client-meeting-agenda',
    'review-financial-statements',
    'create-advisory-report'
  ],
  toolsEnabled: [
    'quickbooks-integration',
    'document-analysis',
    'financial-insights',
    'communication-assistant',
    'calendar-integration'
  ],
  workflows: [
    'client-onboarding',
    'monthly-review-cycle',
    'advisory-consultation',
    'document-processing'
  ],
  priority: 'high'
};

/**
 * Tax Season Mode - Tax preparation and compliance focused
 */
export const TAX_SEASON_MODE: AIModeConfig = {
  id: 'tax-season',
  name: 'Tax Season',
  description: 'Optimized for tax preparation, compliance, and deadline management',
  icon: '📋',
  primaryAgent: 'tax-specialist',
  supportingAgents: ['compliance-checker', 'deadline-manager', 'deduction-finder'],
  contextPrompts: [
    'tax-optimization',
    'compliance-guidance',
    'deadline-management',
    'deduction-analysis'
  ],
  quickActions: [
    'find-tax-deductions',
    'check-compliance-requirements',
    'calculate-tax-obligations',
    'generate-tax-planning-report',
    'schedule-client-tax-meetings'
  ],
  toolsEnabled: [
    'tax-calculation-engine',
    'compliance-database',
    'deadline-tracker',
    'document-ocr',
    'irs-api-integration'
  ],
  workflows: [
    'tax-document-processing',
    'deduction-optimization',
    'compliance-review',
    'client-tax-consultation'
  ],
  priority: 'high',
  autoActivation: {
    triggers: ['tax-document-upload', 'tax-related-client-query'],
    conditions: {
      season: 'tax',
      dateRange: { start: '01-01', end: '04-15' }
    }
  }
};

/**
 * Developer Mode - Code development and technical assistance
 */
export const DEVELOPER_MODE: AIModeConfig = {
  id: 'developer-mode',
  name: 'Developer Mode',
  description: 'Advanced development assistance with code generation, debugging, and technical guidance',
  icon: '💻',
  primaryAgent: 'senior-developer',
  supportingAgents: ['code-reviewer', 'testing-specialist', 'devops-engineer', 'ui-designer'],
  contextPrompts: [
    'code-generation',
    'debugging-assistance',
    'architecture-review',
    'performance-optimization'
  ],
  quickActions: [
    'generate-component',
    'review-code-quality',
    'optimize-performance',
    'write-tests',
    'debug-issue',
    'refactor-code',
    'setup-deployment',
    'analyze-bundle-size'
  ],
  toolsEnabled: [
    'code-analyzer',
    'test-runner',
    'bundle-analyzer',
    'linter',
    'typescript-checker',
    'git-integration',
    'npm-manager',
    'docker-tools'
  ],
  workflows: [
    'code-review-workflow',
    'feature-development',
    'bug-fixing-process',
    'deployment-pipeline',
    'testing-automation'
  ],
  priority: 'high',
  autoActivation: {
    triggers: ['code-file-open', 'git-commit', 'test-failure', 'build-error'],
    conditions: {
      fileTypes: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'],
      context: 'development'
    }
  }
};

/**
 * Code Review Mode - Specialized for code review and quality assurance
 */
export const CODE_REVIEW_MODE: AIModeConfig = {
  id: 'code-review',
  name: 'Code Review',
  description: 'Comprehensive code review with security, performance, and best practices analysis',
  icon: '🔍',
  primaryAgent: 'code-reviewer',
  supportingAgents: ['security-analyst', 'performance-specialist'],
  contextPrompts: [
    'code-quality-analysis',
    'security-review',
    'performance-assessment',
    'best-practices-check'
  ],
  quickActions: [
    'analyze-security-vulnerabilities',
    'check-performance-issues',
    'validate-typescript-types',
    'review-accessibility',
    'audit-dependencies',
    'check-test-coverage'
  ],
  toolsEnabled: [
    'security-scanner',
    'performance-profiler',
    'accessibility-checker',
    'dependency-auditor',
    'coverage-analyzer'
  ],
  workflows: [
    'comprehensive-code-review',
    'security-audit',
    'performance-analysis'
  ],
  priority: 'high'
};

/**
 * DevOps Mode - Infrastructure, deployment, and operations assistance
 */
export const DEVOPS_MODE: AIModeConfig = {
  id: 'devops-mode',
  name: 'DevOps & Infrastructure',
  description: 'Infrastructure management, CI/CD, and deployment optimization',
  icon: '⚙️',
  primaryAgent: 'devops-engineer',
  supportingAgents: ['infrastructure-architect', 'monitoring-specialist'],
  contextPrompts: [
    'infrastructure-design',
    'deployment-strategy',
    'monitoring-setup',
    'cost-optimization'
  ],
  quickActions: [
    'optimize-build-pipeline',
    'setup-monitoring',
    'configure-deployment',
    'analyze-infrastructure-costs',
    'troubleshoot-deployment',
    'scale-resources'
  ],
  toolsEnabled: [
    'docker-tools',
    'kubernetes-manager',
    'ci-cd-pipeline',
    'monitoring-tools',
    'cost-analyzer',
    'terraform-integration'
  ],
  workflows: [
    'deployment-automation',
    'infrastructure-provisioning',
    'monitoring-setup'
  ],
  priority: 'medium'
};

/**
 * All available AI modes
 */
export const AI_MODES: Record<string, AIModeConfig> = {
  'cpa-professional': CPA_MODE,
  'tax-season': TAX_SEASON_MODE,
  'developer-mode': DEVELOPER_MODE,
  'code-review': CODE_REVIEW_MODE,
  'devops-mode': DEVOPS_MODE,
};

/**
 * Mode Manager - Handles mode switching and context management
 */
export class AIModeManager {
  private currentMode: AIModeConfig = CPA_MODE;
  private context: ModeContext;

  constructor(context: ModeContext) {
    this.context = context;
  }

  /**
   * Switch to a specific AI mode
   */
  public switchToMode(modeId: string): AIModeConfig {
    const mode = AI_MODES[modeId];
    if (!mode) {
      throw new Error(`AI mode '${modeId}' not found`);
    }
    
    this.currentMode = mode;
    return mode;
  }

  /**
   * Get current active mode
   */
  public getCurrentMode(): AIModeConfig {
    return this.currentMode;
  }

  /**
   * Auto-detect appropriate mode based on context
   */
  public autoDetectMode(): AIModeConfig {
    // Check for automatic activation conditions
    for (const mode of Object.values(AI_MODES)) {
      if (mode.autoActivation && this.shouldActivateMode(mode)) {
        return this.switchToMode(mode.id);
      }
    }

    // Default intelligent detection based on context
    if (this.context.temporalContext?.season === 'tax') {
      return this.switchToMode('tax-season');
    }

    // Default to professional mode
    return this.switchToMode('cpa-professional');
  }

  /**
   * Get contextual quick actions for current mode
   */
  public getQuickActions(): string[] {
    return this.currentMode.quickActions;
  }

  /**
   * Get available tools for current mode
   */
  public getEnabledTools(): string[] {
    return this.currentMode.toolsEnabled;
  }

  /**
   * Get available workflows for current mode
   */
  public getAvailableWorkflows(): string[] {
    return this.currentMode.workflows;
  }

  /**
   * Update context and potentially switch modes
   */
  public updateContext(newContext: Partial<ModeContext>): AIModeConfig {
    this.context = { ...this.context, ...newContext };
    return this.autoDetectMode();
  }

  private shouldActivateMode(mode: AIModeConfig): boolean {
    if (!mode.autoActivation) return false;

    const { triggers, conditions } = mode.autoActivation;
    
    // Check trigger conditions
    const hasMatchingTrigger = triggers.some(trigger => {
      return this.matchesTrigger(trigger);
    });

    if (!hasMatchingTrigger) return false;

    // Check additional conditions
    return this.matchesConditions(conditions);
  }

  private matchesTrigger(trigger: string): boolean {
    switch (trigger) {
      case 'tax-document-upload':
        return this.context.activeDocument?.toLowerCase().includes('tax') || false;
      case 'tax-related-client-query':
        return this.context.workflowState?.queryType === 'tax';
      default:
        return false;
    }
  }

  private matchesConditions(conditions: Record<string, any>): boolean {
    if (conditions.season && this.context.temporalContext?.season !== conditions.season) {
      return false;
    }

    if (conditions.dateRange) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();
      
      // Simple date range check (MM-DD format)
      const [startMonth, startDay] = conditions.dateRange.start.split('-').map(Number);
      const [endMonth, endDay] = conditions.dateRange.end.split('-').map(Number);
      
      if (startMonth <= endMonth) {
        if (currentMonth < startMonth || currentMonth > endMonth) return false;
        if (currentMonth === startMonth && currentDay < startDay) return false;
        if (currentMonth === endMonth && currentDay > endDay) return false;
      }
    }

    return true;
  }
}

/**
 * Create mode manager instance
 */
export function createAIModeManager(context: ModeContext): AIModeManager {
  return new AIModeManager(context);
}

/**
 * Get all available modes
 */
export function getAllAIModes(): AIModeConfig[] {
  return Object.values(AI_MODES);
}

/**
 * Get mode by ID
 */
export function getAIMode(modeId: string): AIModeConfig | undefined {
  return AI_MODES[modeId];
}