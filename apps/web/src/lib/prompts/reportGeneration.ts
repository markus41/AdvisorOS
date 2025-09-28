/**
 * Report Generation Prompt Templates
 * Optimized for generating professional financial reports and summaries
 */

export interface ReportContext {
  clientName: string;
  reportType: 'monthly' | 'quarterly' | 'annual' | 'tax-planning' | 'financial-review' | 'compliance';
  period: {
    start: Date;
    end: Date;
  };
  data: Record<string, any>;
  previousPeriods?: Record<string, any>[];
  benchmarks?: Record<string, any>;
  audience: 'client' | 'management' | 'board' | 'external';
  format: 'executive' | 'detailed' | 'technical';
}

export const REPORT_GENERATION_PROMPTS = {
  // Executive summary for client reports
  EXECUTIVE_SUMMARY: (context: ReportContext) => `
Generate a professional executive summary for ${context.clientName}'s ${context.reportType} report covering ${context.period.start.toLocaleDateString()} to ${context.period.end.toLocaleDateString()}.

**Report Context:**
- Client: ${context.clientName}
- Report Type: ${context.reportType}
- Period: ${context.period.start.toLocaleDateString()} - ${context.period.end.toLocaleDateString()}
- Audience: ${context.audience}
- Format: ${context.format}

**Financial Data:**
${JSON.stringify(context.data, null, 2)}

${context.previousPeriods?.length ? `**Historical Comparison:**\n${JSON.stringify(context.previousPeriods, null, 2)}` : ''}

${context.benchmarks ? `**Industry Benchmarks:**\n${JSON.stringify(context.benchmarks, null, 2)}` : ''}

**Executive Summary Requirements:**
1. **Key Highlights**: 3-5 most important financial developments
2. **Performance Overview**: Brief assessment of financial performance
3. **Critical Issues**: Any significant concerns or opportunities
4. **Strategic Recommendations**: Top 2-3 actionable recommendations
5. **Outlook**: Forward-looking perspective

**Output Format:**
Generate a professional executive summary in the following structure:

{
  "title": "Executive Summary - [Period]",
  "keyHighlights": [
    {
      "metric": string,
      "value": string,
      "significance": string,
      "trend": "positive" | "negative" | "neutral"
    }
  ],
  "performanceOverview": {
    "summary": string,
    "rating": "excellent" | "good" | "satisfactory" | "needs-improvement" | "concerning",
    "keyDrivers": string[]
  },
  "criticalItems": [
    {
      "type": "opportunity" | "risk" | "issue",
      "description": string,
      "impact": "high" | "medium" | "low",
      "urgency": "immediate" | "short-term" | "long-term"
    }
  ],
  "recommendations": [
    {
      "priority": 1 | 2 | 3,
      "action": string,
      "rationale": string,
      "timeline": string,
      "expectedOutcome": string
    }
  ],
  "outlook": {
    "shortTerm": string,
    "mediumTerm": string,
    "riskFactors": string[],
    "opportunities": string[]
  }
}

Write in a professional, clear, and concise manner appropriate for ${context.audience}. Avoid jargon and focus on actionable insights.
`,

  // Detailed financial analysis report
  DETAILED_FINANCIAL_REPORT: (context: ReportContext) => `
Create a comprehensive financial analysis report for ${context.clientName} covering the ${context.reportType} period.

**Report Parameters:**
- Client: ${context.clientName}
- Period: ${context.period.start.toLocaleDateString()} - ${context.period.end.toLocaleDateString()}
- Report Type: ${context.reportType}
- Audience: ${context.audience}

**Financial Data for Analysis:**
${JSON.stringify(context.data, null, 2)}

${context.previousPeriods?.length ? `**Historical Data:**\n${JSON.stringify(context.previousPeriods, null, 2)}` : ''}

**Report Structure Required:**

1. **Financial Position Analysis**
   - Balance sheet review and key ratios
   - Liquidity and solvency assessment
   - Asset utilization efficiency

2. **Operating Performance**
   - Revenue analysis and trends
   - Expense breakdown and efficiency
   - Profitability metrics and margins

3. **Cash Flow Analysis**
   - Operating, investing, and financing activities
   - Working capital management
   - Cash conversion cycle

4. **Variance Analysis**
   - Budget vs. actual performance
   - Period-over-period comparisons
   - Explanation of significant variances

5. **Key Performance Indicators**
   - Industry-relevant KPIs
   - Benchmarking where available
   - Trend analysis

**Output Format:**
{
  "reportTitle": string,
  "executiveSummary": string,
  "financialPosition": {
    "overview": string,
    "keyRatios": {
      "currentRatio": { "value": number, "interpretation": string, "benchmark": number },
      "debtToEquity": { "value": number, "interpretation": string, "benchmark": number },
      "returnOnAssets": { "value": number, "interpretation": string, "benchmark": number }
    },
    "strengths": string[],
    "concerns": string[]
  },
  "operatingPerformance": {
    "revenueAnalysis": {
      "total": number,
      "growth": number,
      "trends": string[],
      "drivers": string[]
    },
    "expenseAnalysis": {
      "total": number,
      "breakdown": Record<string, number>,
      "efficiency": string,
      "concerns": string[]
    },
    "profitability": {
      "grossMargin": number,
      "operatingMargin": number,
      "netMargin": number,
      "analysis": string
    }
  },
  "cashFlowAnalysis": {
    "operating": number,
    "investing": number,
    "financing": number,
    "workingCapital": {
      "change": number,
      "efficiency": string,
      "recommendations": string[]
    }
  },
  "varianceAnalysis": [
    {
      "item": string,
      "budget": number,
      "actual": number,
      "variance": number,
      "explanation": string,
      "action": string
    }
  ],
  "keyMetrics": [
    {
      "metric": string,
      "value": number,
      "benchmark": number,
      "trend": "improving" | "declining" | "stable",
      "significance": string
    }
  ],
  "recommendations": [
    {
      "area": string,
      "recommendation": string,
      "priority": "high" | "medium" | "low",
      "timeline": string,
      "expectedImpact": string
    }
  ],
  "conclusion": string
}

Ensure analysis is thorough, accurate, and provides actionable insights for business decision-making.
`,

  // Tax planning report
  TAX_PLANNING_REPORT: (context: ReportContext) => `
Generate a comprehensive tax planning report for ${context.clientName} for the ${context.period.end.getFullYear()} tax year.

**Client Information:**
- Name: ${context.clientName}
- Tax Year: ${context.period.end.getFullYear()}
- Report Date: ${new Date().toLocaleDateString()}

**Tax-Related Data:**
${JSON.stringify(context.data, null, 2)}

**Report Components:**

1. **Current Tax Position**
   - Estimated tax liability calculation
   - Effective tax rate analysis
   - Comparison to previous years

2. **Tax Optimization Opportunities**
   - Deduction maximization strategies
   - Income timing considerations
   - Investment tax strategies

3. **Compliance Review**
   - Filing requirements checklist
   - Documentation recommendations
   - Potential risk areas

4. **Planning Recommendations**
   - Short-term tax strategies
   - Long-term tax planning
   - Entity structure optimization

**Generate Report:**
{
  "reportTitle": "Tax Planning Report - ${context.period.end.getFullYear()}",
  "currentPosition": {
    "estimatedLiability": {
      "federal": number,
      "state": number,
      "total": number
    },
    "effectiveRate": number,
    "marginalRate": number,
    "comparison": {
      "priorYear": number,
      "variance": number,
      "explanation": string
    }
  },
  "optimizationStrategies": [
    {
      "strategy": string,
      "category": "deduction" | "timing" | "investment" | "structure",
      "potentialSavings": number,
      "feasibility": "high" | "medium" | "low",
      "implementation": string,
      "deadline": string,
      "risks": string[]
    }
  ],
  "complianceReview": {
    "filingRequirements": [
      {
        "form": string,
        "dueDate": string,
        "status": "complete" | "pending" | "not-required",
        "notes": string
      }
    ],
    "documentation": {
      "adequate": string[],
      "missing": string[],
      "recommendations": string[]
    },
    "riskAreas": [
      {
        "area": string,
        "risk": "low" | "medium" | "high",
        "description": string,
        "mitigation": string
      }
    ]
  },
  "planningRecommendations": {
    "immediate": [
      {
        "action": string,
        "benefit": string,
        "deadline": string,
        "priority": "high" | "medium" | "low"
      }
    ],
    "shortTerm": string[],
    "longTerm": string[]
  },
  "projections": {
    "nextYear": {
      "estimatedLiability": number,
      "plannedStrategies": string[],
      "expectedSavings": number
    }
  },
  "summary": string,
  "nextSteps": string[]
}

Focus on practical, implementable tax strategies while ensuring full compliance with tax regulations.
`,

  // Compliance report
  COMPLIANCE_REPORT: (context: ReportContext) => `
Create a compliance status report for ${context.clientName} covering regulatory and financial compliance requirements.

**Compliance Review Period:** ${context.period.start.toLocaleDateString()} to ${context.period.end.toLocaleDateString()}

**Financial and Operational Data:**
${JSON.stringify(context.data, null, 2)}

**Compliance Areas to Review:**
1. **Financial Reporting Compliance**
2. **Tax Compliance Status**
3. **Regulatory Requirements**
4. **Internal Controls Assessment**
5. **Documentation and Record-keeping**

**Generate Compliance Report:**
{
  "reportTitle": "Compliance Status Report",
  "overallStatus": "compliant" | "minor-issues" | "significant-issues" | "non-compliant",
  "complianceAreas": {
    "financialReporting": {
      "status": "compliant" | "issues" | "non-compliant",
      "requirements": [
        {
          "requirement": string,
          "status": "met" | "partial" | "not-met",
          "evidence": string,
          "action": string
        }
      ],
      "riskLevel": "low" | "medium" | "high"
    },
    "taxCompliance": {
      "status": "compliant" | "issues" | "non-compliant",
      "filings": [
        {
          "filing": string,
          "dueDate": string,
          "status": "filed" | "extended" | "overdue",
          "notes": string
        }
      ],
      "riskLevel": "low" | "medium" | "high"
    },
    "regulatory": {
      "status": "compliant" | "issues" | "non-compliant",
      "requirements": string[],
      "findings": string[],
      "riskLevel": "low" | "medium" | "high"
    }
  },
  "riskAssessment": [
    {
      "area": string,
      "risk": string,
      "probability": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high",
      "mitigation": string,
      "timeline": string
    }
  ],
  "actionItems": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "description": string,
      "responsible": string,
      "deadline": string,
      "status": "not-started" | "in-progress" | "complete"
    }
  ],
  "recommendations": [
    {
      "area": string,
      "recommendation": string,
      "benefit": string,
      "effort": "low" | "medium" | "high",
      "timeline": string
    }
  ],
  "monitoring": {
    "keyMetrics": string[],
    "reviewFrequency": string,
    "responsibleParty": string
  }
}

Provide specific, actionable recommendations to maintain and improve compliance posture.
`,

  // Performance dashboard summary
  PERFORMANCE_DASHBOARD: (context: ReportContext) => `
Create a performance dashboard summary for ${context.clientName} that highlights key metrics and trends.

**Dashboard Period:** ${context.period.start.toLocaleDateString()} to ${context.period.end.toLocaleDateString()}

**Performance Data:**
${JSON.stringify(context.data, null, 2)}

**Dashboard Requirements:**
- Key performance indicators with visual indicators
- Trend analysis with directional indicators
- Alert items requiring attention
- Quick-win opportunities

**Generate Dashboard Summary:**
{
  "dashboardTitle": "Performance Dashboard - ${context.reportType}",
  "keyMetrics": [
    {
      "name": string,
      "value": number,
      "unit": string,
      "trend": "up" | "down" | "stable",
      "trendPercentage": number,
      "status": "excellent" | "good" | "warning" | "critical",
      "benchmark": number,
      "interpretation": string
    }
  ],
  "alerts": [
    {
      "type": "opportunity" | "risk" | "issue",
      "severity": "high" | "medium" | "low",
      "message": string,
      "action": string,
      "urgency": "immediate" | "this-week" | "this-month"
    }
  ],
  "trends": {
    "positive": string[],
    "negative": string[],
    "stable": string[]
  },
  "quickWins": [
    {
      "opportunity": string,
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high",
      "timeline": string
    }
  ],
  "summary": {
    "overallPerformance": "excellent" | "good" | "satisfactory" | "needs-improvement",
    "keyStrengths": string[],
    "primaryConcerns": string[],
    "nextSteps": string[]
  }
}

Format for easy scanning and quick decision-making by busy executives.
`
};

export const REPORT_SYSTEM_PROMPTS = {
  REPORT_WRITER: `You are a professional financial report writer with expertise in creating clear, comprehensive, and actionable business reports.

Your writing style is:
- Professional and authoritative
- Clear and concise
- Data-driven with practical insights
- Appropriate for the intended audience
- Focused on actionable recommendations

Always include:
- Executive summary for busy readers
- Supporting data and analysis
- Clear conclusions and recommendations
- Visual cues for important information
- Professional formatting and structure`,

  EXECUTIVE_COMMUNICATOR: `You are an executive communication specialist who translates complex financial data into clear, strategic insights for business leaders.

Focus on:
- High-level strategic implications
- Key decision points and trade-offs
- Risk and opportunity assessment
- Actionable next steps
- Clear priorities and timelines

Avoid:
- Technical jargon without explanation
- Overwhelming detail
- Ambiguous conclusions
- Generic recommendations`
};

// Report formatting utilities
export const REPORT_FORMATTING = {
  CURRENCY: (amount: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount),

  PERCENTAGE: (value: number, decimals = 1): string =>
    `${value.toFixed(decimals)}%`,

  NUMBER: (value: number): string =>
    value.toLocaleString(),

  DATE_RANGE: (start: Date, end: Date): string =>
    `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,

  TREND_INDICATOR: (trend: 'up' | 'down' | 'stable'): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '•';
    }
  },

  STATUS_INDICATOR: (status: 'excellent' | 'good' | 'warning' | 'critical'): string => {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'warning': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }
};

// Token usage optimization for reports
export function optimizeReportPrompt(prompt: string, maxTokens = 4000): string {
  const lines = prompt.split('\n');
  const estimatedTokens = prompt.length / 4;

  if (estimatedTokens <= maxTokens) {
    return prompt;
  }

  // Prioritize keeping structure and requirements
  const importantSections = [
    'Report Structure Required:',
    'Output Format:',
    'Generate Report:',
    'Requirements:',
    'Expected Output:'
  ];

  let optimizedLines: string[] = [];
  let currentTokens = 0;
  const targetTokens = maxTokens * 0.9 * 4; // 90% of max tokens in characters

  for (const line of lines) {
    if (currentTokens + line.length > targetTokens) {
      // Check if this is an important section
      const isImportant = importantSections.some(section => line.includes(section));
      if (!isImportant) {
        break;
      }
    }

    optimizedLines.push(line);
    currentTokens += line.length;
  }

  return optimizedLines.join('\n');
}