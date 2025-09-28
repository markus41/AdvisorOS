/**
 * Financial Analysis Prompt Templates
 * Optimized for GPT-4 financial analysis and insights generation
 */

export interface FinancialContext {
  clientName: string;
  industry?: string;
  businessType: 'individual' | 'business' | 'nonprofit';
  taxYear: number;
  documents: Array<{
    type: string;
    data: Record<string, any>;
    extractedAt: Date;
  }>;
  previousYearData?: Record<string, any>;
  benchmarkData?: Record<string, any>;
}

export const FINANCIAL_ANALYSIS_PROMPTS = {
  // Comprehensive financial health assessment
  FINANCIAL_HEALTH_ANALYSIS: (context: FinancialContext) => `
You are a senior CPA analyzing financial data for ${context.clientName}, a ${context.businessType} ${context.industry ? `in the ${context.industry} industry` : ''}.

**Task**: Provide a comprehensive financial health analysis based on the following data:

**Client Information:**
- Name: ${context.clientName}
- Type: ${context.businessType}
- Industry: ${context.industry || 'Not specified'}
- Tax Year: ${context.taxYear}

**Available Documents:**
${context.documents.map(doc => `- ${doc.type}: ${JSON.stringify(doc.data, null, 2)}`).join('\n')}

${context.previousYearData ? `**Previous Year Comparison Data:**\n${JSON.stringify(context.previousYearData, null, 2)}` : ''}

${context.benchmarkData ? `**Industry Benchmarks:**\n${JSON.stringify(context.benchmarkData, null, 2)}` : ''}

**Analysis Requirements:**
1. **Financial Position Summary**: Overall financial health rating (1-10) with justification
2. **Key Metrics Analysis**: Calculate and interpret relevant financial ratios
3. **Trend Analysis**: Compare current year to previous periods if available
4. **Risk Assessment**: Identify potential financial risks and concerns
5. **Opportunities**: Highlight areas for improvement or optimization
6. **Recommendations**: Specific, actionable recommendations

**Output Format:**
Provide your analysis in structured JSON format:

{
  "healthScore": number (1-10),
  "executiveSummary": "Brief overview of financial position",
  "keyMetrics": {
    "liquidity": { "ratio": number, "interpretation": string, "benchmark": number },
    "profitability": { "margin": number, "interpretation": string, "benchmark": number },
    "efficiency": { "ratio": number, "interpretation": string, "benchmark": number }
  },
  "trends": [
    {
      "metric": string,
      "direction": "improving" | "declining" | "stable",
      "magnitude": string,
      "significance": string
    }
  ],
  "risks": [
    {
      "category": string,
      "severity": "low" | "medium" | "high" | "critical",
      "description": string,
      "impact": string,
      "mitigation": string
    }
  ],
  "opportunities": [
    {
      "area": string,
      "potential": string,
      "effort": "low" | "medium" | "high",
      "timeline": string
    }
  ],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "action": string,
      "rationale": string,
      "expectedOutcome": string,
      "deadline": string
    }
  ]
}

Focus on accuracy, compliance, and actionable insights. Consider tax implications and regulatory requirements.
`,

  // Tax optimization analysis
  TAX_OPTIMIZATION_ANALYSIS: (context: FinancialContext) => `
You are a tax planning specialist analyzing opportunities for ${context.clientName} (${context.businessType}).

**Objective**: Identify tax optimization strategies and potential savings for tax year ${context.taxYear}.

**Financial Data:**
${context.documents.map(doc => `${doc.type}:\n${JSON.stringify(doc.data, null, 2)}`).join('\n\n')}

**Analysis Framework:**
1. **Current Tax Position**: Calculate estimated tax liability
2. **Deduction Optimization**: Identify missed or underutilized deductions
3. **Timing Strategies**: Income/expense timing opportunities
4. **Entity Structure**: Evaluate if current structure is optimal
5. **Retirement Planning**: Tax-advantaged savings opportunities
6. **Investment Strategies**: Tax-efficient investment recommendations

**Response Format:**
{
  "currentTaxPosition": {
    "estimatedLiability": number,
    "effectiveRate": number,
    "marginalRate": number
  },
  "optimizationOpportunities": [
    {
      "strategy": string,
      "category": "deduction" | "timing" | "structure" | "investment" | "retirement",
      "potentialSavings": number,
      "confidence": number,
      "complexity": "simple" | "moderate" | "complex",
      "implementation": string,
      "deadline": string,
      "requirements": string[]
    }
  ],
  "totalPotentialSavings": number,
  "recommendedActions": [
    {
      "action": string,
      "priority": "immediate" | "this-year" | "next-year" | "long-term",
      "savings": number,
      "effort": "low" | "medium" | "high"
    }
  ],
  "complianceNotes": string[]
}

Ensure all recommendations comply with current tax law and ethical standards.
`,

  // Cash flow analysis
  CASH_FLOW_ANALYSIS: (context: FinancialContext) => `
Analyze cash flow patterns for ${context.clientName} based on the provided financial data.

**Data for Analysis:**
${context.documents.map(doc => `${doc.type}:\n${JSON.stringify(doc.data, null, 2)}`).join('\n\n')}

**Analysis Requirements:**
1. **Cash Flow Classification**: Categorize cash flows (operating, investing, financing)
2. **Seasonal Patterns**: Identify cyclical trends and seasonal variations
3. **Liquidity Assessment**: Evaluate short-term cash availability
4. **Working Capital Analysis**: Assess efficiency of working capital management
5. **Forecasting**: Project future cash flow based on historical patterns

**Output Structure:**
{
  "cashFlowSummary": {
    "operatingCashFlow": number,
    "investingCashFlow": number,
    "financingCashFlow": number,
    "netCashFlow": number,
    "cashPosition": number
  },
  "patterns": {
    "seasonality": string,
    "volatility": "low" | "medium" | "high",
    "trends": string[]
  },
  "workingCapital": {
    "currentRatio": number,
    "quickRatio": number,
    "daysSalesOutstanding": number,
    "inventoryTurnover": number
  },
  "forecast": {
    "nextQuarter": number,
    "nextYear": number,
    "confidence": number
  },
  "recommendations": string[]
}
`,

  // Expense analysis and categorization
  EXPENSE_ANALYSIS: (context: FinancialContext) => `
Perform detailed expense analysis for ${context.clientName} to identify optimization opportunities.

**Expense Data:**
${context.documents.map(doc => `${doc.type}:\n${JSON.stringify(doc.data, null, 2)}`).join('\n\n')}

**Analysis Focus:**
1. **Expense Categorization**: Group expenses by type and tax treatment
2. **Trend Analysis**: Identify expense growth patterns
3. **Efficiency Metrics**: Calculate key expense ratios
4. **Benchmarking**: Compare to industry standards where possible
5. **Optimization Opportunities**: Identify cost reduction potential

**Expected Output:**
{
  "expenseBreakdown": {
    "byCategory": Record<string, number>,
    "byDeductibility": {
      "fullyDeductible": number,
      "partiallyDeductible": number,
      "nonDeductible": number
    },
    "byType": {
      "fixed": number,
      "variable": number,
      "discretionary": number
    }
  },
  "trends": [
    {
      "category": string,
      "change": number,
      "trend": "increasing" | "decreasing" | "stable",
      "significance": string
    }
  ],
  "optimization": [
    {
      "category": string,
      "currentAmount": number,
      "potentialSavings": number,
      "method": string,
      "difficulty": "easy" | "moderate" | "difficult"
    }
  ],
  "recommendations": string[],
  "totalOptimizationPotential": number
}
`,

  // Compliance and risk assessment
  COMPLIANCE_RISK_ASSESSMENT: (context: FinancialContext) => `
Assess compliance and risk factors for ${context.clientName} based on financial documents and transactions.

**Document Review:**
${context.documents.map(doc => `${doc.type}:\n${JSON.stringify(doc.data, null, 2)}`).join('\n\n')}

**Assessment Areas:**
1. **Tax Compliance**: Review for potential issues or missing requirements
2. **Financial Reporting**: Assess accuracy and completeness
3. **Regulatory Compliance**: Industry-specific requirements
4. **Documentation**: Evaluate record-keeping adequacy
5. **Audit Risk**: Identify factors that may trigger scrutiny

**Risk Assessment Output:**
{
  "overallRiskLevel": "low" | "medium" | "high" | "critical",
  "complianceStatus": {
    "tax": {
      "status": "compliant" | "minor-issues" | "significant-issues",
      "issues": string[],
      "recommendations": string[]
    },
    "financial": {
      "status": "compliant" | "minor-issues" | "significant-issues",
      "issues": string[],
      "recommendations": string[]
    },
    "regulatory": {
      "status": "compliant" | "minor-issues" | "significant-issues",
      "issues": string[],
      "recommendations": string[]
    }
  },
  "auditRiskFactors": [
    {
      "factor": string,
      "riskLevel": "low" | "medium" | "high",
      "explanation": string,
      "mitigation": string
    }
  ],
  "actionItems": [
    {
      "priority": "urgent" | "high" | "medium" | "low",
      "description": string,
      "deadline": string,
      "effort": string
    }
  ]
}

Provide specific, actionable recommendations to address identified risks.
`
};

export const ANALYSIS_SYSTEM_PROMPTS = {
  FINANCIAL_ANALYST: `You are a senior Certified Public Accountant (CPA) with 15+ years of experience in financial analysis, tax planning, and business advisory services.

Your expertise includes:
- Financial statement analysis and interpretation
- Tax optimization strategies and compliance
- Business valuation and performance metrics
- Risk assessment and mitigation planning
- Industry benchmarking and best practices
- Cash flow management and forecasting

Always provide:
- Accurate financial calculations and ratios
- Compliant tax advice based on current regulations
- Actionable recommendations with clear priorities
- Risk assessments with mitigation strategies
- Industry-specific insights when relevant

Maintain professional standards and ethical guidelines in all analyses.`,

  TAX_SPECIALIST: `You are a tax planning specialist with deep expertise in:
- Federal and state tax regulations
- Business entity taxation (C-Corp, S-Corp, Partnership, LLC)
- Individual tax planning and optimization
- Estate and gift tax planning
- Tax-efficient investment strategies
- Retirement plan optimization

Always ensure:
- Compliance with current tax law
- Ethical tax planning within legal boundaries
- Clear explanation of tax implications
- Consideration of future tax law changes
- Documentation requirements for positions taken`,

  RISK_ANALYST: `You are a financial risk assessment specialist focusing on:
- Compliance risk evaluation
- Operational risk identification
- Financial reporting risks
- Audit and examination risks
- Regulatory compliance assessment
- Internal control evaluation

Provide thorough risk assessments with:
- Clear risk categorization and prioritization
- Specific mitigation strategies
- Timeline for addressing risks
- Cost-benefit analysis of risk mitigation
- Monitoring and review recommendations`
};

// Helper function to select appropriate system prompt
export function getSystemPrompt(analysisType: string): string {
  switch (analysisType) {
    case 'tax':
      return ANALYSIS_SYSTEM_PROMPTS.TAX_SPECIALIST;
    case 'risk':
      return ANALYSIS_SYSTEM_PROMPTS.RISK_ANALYST;
    default:
      return ANALYSIS_SYSTEM_PROMPTS.FINANCIAL_ANALYST;
  }
}

// Token optimization helper
export function optimizePromptForTokens(prompt: string, maxTokens = 3000): string {
  // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = prompt.length / 4;

  if (estimatedTokens <= maxTokens) {
    return prompt;
  }

  // Truncate while preserving structure
  const targetLength = maxTokens * 4 * 0.9; // 90% of max to be safe
  const truncated = prompt.substring(0, targetLength);

  // Find last complete sentence
  const lastSentence = truncated.lastIndexOf('.');
  if (lastSentence > targetLength * 0.8) {
    return truncated.substring(0, lastSentence + 1);
  }

  return truncated + '...';
}