/**
 * AI Prompt Templates Index
 * Centralized exports for all AI-powered features in the CPA platform
 */

// Financial Analysis Prompts
export {
  FINANCIAL_ANALYSIS_PROMPTS,
  ANALYSIS_SYSTEM_PROMPTS,
  getSystemPrompt,
  optimizePromptForTokens,
  type FinancialContext
} from './financialAnalysis';

// Report Generation Prompts
export {
  REPORT_GENERATION_PROMPTS,
  REPORT_SYSTEM_PROMPTS,
  REPORT_FORMATTING,
  optimizeReportPrompt,
  type ReportContext
} from './reportGeneration';

// Email Communication Prompts
export {
  EMAIL_TEMPLATES,
  EMAIL_SYSTEM_PROMPTS,
  EMAIL_FORMATTING,
  personalizeEmail,
  optimizeEmailPrompt,
  type EmailContext
} from './emailTemplates';

// Data Extraction Prompts
export {
  DATA_EXTRACTION_PROMPTS,
  EXTRACTION_SYSTEM_PROMPTS,
  VALIDATION_RULES,
  calculateFieldConfidence,
  optimizeExtractionPrompt,
  type ExtractionContext
} from './dataExtraction';

/**
 * Main Prompt Categories and Use Cases
 */
export const PROMPT_CATEGORIES = {
  FINANCIAL_ANALYSIS: {
    name: 'Financial Analysis',
    description: 'Comprehensive financial health assessment, tax optimization, and risk analysis',
    prompts: [
      'FINANCIAL_HEALTH_ANALYSIS',
      'TAX_OPTIMIZATION_ANALYSIS',
      'CASH_FLOW_ANALYSIS',
      'EXPENSE_ANALYSIS',
      'COMPLIANCE_RISK_ASSESSMENT'
    ]
  },
  REPORT_GENERATION: {
    name: 'Report Generation',
    description: 'Professional financial reports and executive summaries',
    prompts: [
      'EXECUTIVE_SUMMARY',
      'DETAILED_FINANCIAL_REPORT',
      'TAX_PLANNING_REPORT',
      'COMPLIANCE_REPORT',
      'PERFORMANCE_DASHBOARD'
    ]
  },
  EMAIL_COMMUNICATION: {
    name: 'Email Communication',
    description: 'Professional client communication templates',
    prompts: [
      'TAX_PLANNING_EMAIL',
      'DOCUMENT_REQUEST_EMAIL',
      'MEETING_FOLLOWUP_EMAIL',
      'FINANCIAL_UPDATE_EMAIL',
      'COMPLIANCE_REMINDER_EMAIL',
      'GENERAL_CLIENT_EMAIL'
    ]
  },
  DATA_EXTRACTION: {
    name: 'Data Extraction',
    description: 'Structured data extraction from financial documents',
    prompts: [
      'W2_EXTRACTION',
      'FORM1099_EXTRACTION',
      'INVOICE_EXTRACTION',
      'BANK_STATEMENT_EXTRACTION',
      'RECEIPT_EXTRACTION',
      'FINANCIAL_STATEMENT_EXTRACTION'
    ]
  }
} as const;

/**
 * Common System Prompts for Different AI Roles
 */
export const AI_ROLES = {
  SENIOR_CPA: `You are a senior Certified Public Accountant (CPA) with 15+ years of experience in financial analysis, tax planning, and business advisory services. You provide accurate, compliant, and actionable financial guidance while maintaining the highest professional standards.`,

  TAX_SPECIALIST: `You are a tax planning specialist with deep expertise in federal and state tax regulations, business entity taxation, and tax optimization strategies. You ensure all recommendations comply with current tax law and ethical standards.`,

  FINANCIAL_ANALYST: `You are a financial analyst specializing in business performance analysis, financial statement interpretation, and strategic financial planning. You provide data-driven insights and actionable recommendations.`,

  RISK_ANALYST: `You are a financial risk assessment specialist focusing on compliance evaluation, operational risk identification, and regulatory compliance assessment. You provide thorough risk assessments with specific mitigation strategies.`,

  COMMUNICATION_SPECIALIST: `You are a professional communication specialist who translates complex financial concepts into clear, client-friendly language while maintaining accuracy and professionalism.`,

  DATA_SPECIALIST: `You are a financial data extraction and validation specialist with expertise in document structure recognition, OCR interpretation, and financial data quality assurance.`
} as const;

/**
 * Token Management and Optimization Settings
 */
export const TOKEN_LIMITS = {
  GPT_4_TURBO: 128000,
  GPT_4: 8192,
  GPT_3_5_TURBO: 16385,

  // Recommended limits for different use cases
  FINANCIAL_ANALYSIS: 4000,
  REPORT_GENERATION: 3500,
  EMAIL_COMMUNICATION: 2000,
  DATA_EXTRACTION: 3000,

  // Buffer for response tokens
  RESPONSE_BUFFER: 1000
} as const;

/**
 * Prompt Template Utility Functions
 */
export class PromptManager {
  /**
   * Get appropriate system prompt based on AI role and task type
   */
  static getSystemPrompt(role: keyof typeof AI_ROLES, category?: keyof typeof PROMPT_CATEGORIES): string {
    let systemPrompt = AI_ROLES[role];

    // Add category-specific guidance
    if (category) {
      const categoryInfo = PROMPT_CATEGORIES[category];
      systemPrompt += `\n\nYou are currently working on: ${categoryInfo.name} - ${categoryInfo.description}`;
    }

    return systemPrompt;
  }

  /**
   * Optimize prompt for token limits
   */
  static optimizeForTokens(prompt: string, maxTokens: number): string {
    const estimatedTokens = prompt.length / 4; // Rough estimation

    if (estimatedTokens <= maxTokens) {
      return prompt;
    }

    // Apply generic optimization
    const targetLength = maxTokens * 4 * 0.85; // 85% of max to be safe
    const sections = prompt.split('\n\n');

    let optimized = '';
    let currentLength = 0;

    for (const section of sections) {
      if (currentLength + section.length > targetLength) {
        // Keep essential sections
        if (section.includes('Requirements:') || section.includes('Extract') || section.includes('Generate')) {
          optimized += section + '\n\n';
        }
        break;
      }

      optimized += section + '\n\n';
      currentLength += section.length;
    }

    return optimized.trim();
  }

  /**
   * Calculate estimated token usage
   */
  static estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate prompt parameters
   */
  static validatePromptContext(context: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required fields
    if (!context.clientName || context.clientName.trim() === '') {
      errors.push('Client name is required');
    }

    // Validate dates if present
    if (context.deadline && isNaN(Date.parse(context.deadline))) {
      errors.push('Invalid deadline date format');
    }

    if (context.period) {
      if (context.period.start && isNaN(Date.parse(context.period.start))) {
        errors.push('Invalid period start date');
      }
      if (context.period.end && isNaN(Date.parse(context.period.end))) {
        errors.push('Invalid period end date');
      }
    }

    // Validate urgency levels
    if (context.urgency && !['low', 'medium', 'high', 'urgent'].includes(context.urgency)) {
      errors.push('Invalid urgency level');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Pre-configured prompt combinations for common workflows
 */
export const WORKFLOW_PROMPTS = {
  MONTHLY_CLIENT_REVIEW: {
    analysis: 'FINANCIAL_HEALTH_ANALYSIS',
    report: 'EXECUTIVE_SUMMARY',
    communication: 'FINANCIAL_UPDATE_EMAIL',
    systemPrompt: 'SENIOR_CPA'
  },

  TAX_SEASON_PREPARATION: {
    analysis: 'TAX_OPTIMIZATION_ANALYSIS',
    report: 'TAX_PLANNING_REPORT',
    communication: 'TAX_PLANNING_EMAIL',
    systemPrompt: 'TAX_SPECIALIST'
  },

  DOCUMENT_PROCESSING: {
    extraction: 'W2_EXTRACTION', // or other document types
    validation: 'COMPLIANCE_RISK_ASSESSMENT',
    communication: 'DOCUMENT_REQUEST_EMAIL',
    systemPrompt: 'DATA_SPECIALIST'
  },

  COMPLIANCE_REVIEW: {
    analysis: 'COMPLIANCE_RISK_ASSESSMENT',
    report: 'COMPLIANCE_REPORT',
    communication: 'COMPLIANCE_REMINDER_EMAIL',
    systemPrompt: 'RISK_ANALYST'
  }
} as const;

/**
 * Export all prompt templates for easy access
 */
export const ALL_PROMPTS = {
  ...FINANCIAL_ANALYSIS_PROMPTS,
  ...REPORT_GENERATION_PROMPTS,
  ...EMAIL_TEMPLATES,
  ...DATA_EXTRACTION_PROMPTS
} as const;

export default {
  PROMPT_CATEGORIES,
  AI_ROLES,
  TOKEN_LIMITS,
  PromptManager,
  WORKFLOW_PROMPTS,
  ALL_PROMPTS
};