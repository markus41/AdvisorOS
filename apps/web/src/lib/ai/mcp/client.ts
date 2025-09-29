/**
 * Model Context Protocol (MCP) Integration for AdvisorOS
 * Enables AI agents to interact with external tools and data sources
 */

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: 'data-source' | 'calculator' | 'external-api' | 'document-processor' | 'communication';
  parameters: MCPParameter[];
  returnType: string;
  authentication?: {
    type: 'api-key' | 'oauth' | 'basic' | 'none';
    required: boolean;
  };
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  cost?: {
    pricePerCall: number;
    currency: string;
  };
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface MCPToolCall {
  toolId: string;
  parameters: Record<string, any>;
  context?: {
    userId: string;
    organizationId: string;
    clientId?: string;
    mode: string;
  };
}

export interface MCPToolResponse {
  success: boolean;
  data: any;
  metadata: {
    executionTime: number;
    tokensUsed?: number;
    cost?: number;
    rateLimit?: {
      remaining: number;
      resetTime: Date;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * QuickBooks Integration Tool
 */
export const QUICKBOOKS_TOOL: MCPTool = {
  id: 'quickbooks-integration',
  name: 'QuickBooks Data Access',
  description: 'Access QuickBooks financial data including customers, invoices, and reports',
  category: 'external-api',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform: get_customers, get_invoices, get_reports, get_items',
      required: true,
      validation: {
        enum: ['get_customers', 'get_invoices', 'get_reports', 'get_items', 'get_financial_summary']
      }
    },
    {
      name: 'companyId',
      type: 'string',
      description: 'QuickBooks company ID',
      required: true
    },
    {
      name: 'filters',
      type: 'object',
      description: 'Filters for data retrieval (date ranges, customer IDs, etc.)',
      required: false,
      default: {}
    },
    {
      name: 'includeInactive',
      type: 'boolean',
      description: 'Include inactive records',
      required: false,
      default: false
    }
  ],
  returnType: 'object',
  authentication: {
    type: 'oauth',
    required: true
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 500
  }
};

/**
 * Financial Calculator Tool
 */
export const FINANCIAL_CALCULATOR_TOOL: MCPTool = {
  id: 'financial-calculator',
  name: 'Financial Calculations',
  description: 'Perform various financial calculations including ratios, projections, and analysis',
  category: 'calculator',
  parameters: [
    {
      name: 'calculation',
      type: 'string',
      description: 'Type of calculation to perform',
      required: true,
      validation: {
        enum: [
          'liquidity_ratios',
          'profitability_ratios',
          'leverage_ratios',
          'efficiency_ratios',
          'cash_flow_projection',
          'loan_analysis',
          'investment_analysis',
          'tax_calculation'
        ]
      }
    },
    {
      name: 'data',
      type: 'object',
      description: 'Financial data required for calculation',
      required: true
    },
    {
      name: 'parameters',
      type: 'object',
      description: 'Additional parameters for calculation (rates, periods, etc.)',
      required: false,
      default: {}
    }
  ],
  returnType: 'object',
  authentication: {
    type: 'none',
    required: false
  }
};

/**
 * Tax Research Tool
 */
export const TAX_RESEARCH_TOOL: MCPTool = {
  id: 'tax-research',
  name: 'Tax Law Research',
  description: 'Access current tax laws, regulations, and compliance requirements',
  category: 'data-source',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Tax research query or topic',
      required: true
    },
    {
      name: 'jurisdiction',
      type: 'string',
      description: 'Tax jurisdiction (federal, state, local)',
      required: true,
      validation: {
        enum: ['federal', 'state', 'local', 'all']
      }
    },
    {
      name: 'taxYear',
      type: 'number',
      description: 'Tax year for research (current year if not specified)',
      required: false
    },
    {
      name: 'entityType',
      type: 'string',
      description: 'Entity type for relevant tax information',
      required: false,
      validation: {
        enum: ['individual', 'corporation', 's-corp', 'partnership', 'llc', 'nonprofit']
      }
    }
  ],
  returnType: 'object',
  authentication: {
    type: 'api-key',
    required: true
  },
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 200
  },
  cost: {
    pricePerCall: 0.05,
    currency: 'USD'
  }
};

/**
 * Industry Benchmarks Tool
 */
export const INDUSTRY_BENCHMARKS_TOOL: MCPTool = {
  id: 'industry-benchmarks',
  name: 'Industry Benchmark Data',
  description: 'Access industry benchmark data and financial ratios for comparison',
  category: 'data-source',
  parameters: [
    {
      name: 'industry',
      type: 'string',
      description: 'Industry classification (NAICS code or description)',
      required: true
    },
    {
      name: 'metrics',
      type: 'array',
      description: 'Specific metrics to retrieve',
      required: false,
      validation: {
        enum: [
          'gross_margin',
          'net_margin',
          'current_ratio',
          'debt_to_equity',
          'inventory_turnover',
          'receivables_days',
          'asset_turnover',
          'roa',
          'roe'
        ]
      }
    },
    {
      name: 'companySize',
      type: 'string',
      description: 'Company size category',
      required: false,
      validation: {
        enum: ['small', 'medium', 'large', 'all']
      }
    },
    {
      name: 'period',
      type: 'string',
      description: 'Time period for benchmarks',
      required: false,
      default: 'latest'
    }
  ],
  returnType: 'object',
  authentication: {
    type: 'api-key',
    required: true
  },
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 1000
  }
};

/**
 * Document OCR Processing Tool
 */
export const DOCUMENT_OCR_TOOL: MCPTool = {
  id: 'document-ocr',
  name: 'Document OCR Processing',
  description: 'Extract text and data from documents using OCR technology',
  category: 'document-processor',
  parameters: [
    {
      name: 'documentUrl',
      type: 'string',
      description: 'URL or path to the document to process',
      required: true
    },
    {
      name: 'documentType',
      type: 'string',
      description: 'Type of document for optimized processing',
      required: false,
      validation: {
        enum: ['invoice', 'receipt', 'tax-form', 'financial-statement', 'contract', 'general']
      }
    },
    {
      name: 'extractionOptions',
      type: 'object',
      description: 'Options for data extraction (tables, forms, text regions)',
      required: false,
      default: {
        extractTables: true,
        extractForms: true,
        extractText: true
      }
    }
  ],
  returnType: 'object',
  authentication: {
    type: 'api-key',
    required: true
  },
  cost: {
    pricePerCall: 0.02,
    currency: 'USD'
  }
};

/**
 * Email Communication Tool
 */
export const EMAIL_COMMUNICATION_TOOL: MCPTool = {
  id: 'email-communication',
  name: 'Email Communication',
  description: 'Send professional emails to clients and team members',
  category: 'communication',
  parameters: [
    {
      name: 'to',
      type: 'array',
      description: 'Recipient email addresses',
      required: true
    },
    {
      name: 'subject',
      type: 'string',
      description: 'Email subject line',
      required: true
    },
    {
      name: 'body',
      type: 'string',
      description: 'Email body content (HTML or plain text)',
      required: true
    },
    {
      name: 'cc',
      type: 'array',
      description: 'CC recipient email addresses',
      required: false
    },
    {
      name: 'attachments',
      type: 'array',
      description: 'File attachments',
      required: false
    },
    {
      name: 'template',
      type: 'string',
      description: 'Email template to use',
      required: false
    },
    {
      name: 'priority',
      type: 'string',
      description: 'Email priority level',
      required: false,
      validation: {
        enum: ['low', 'normal', 'high']
      }
    }
  ],
  returnType: 'object',
  authentication: {
    type: 'api-key',
    required: true
  },
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerHour: 100
  }
};

/**
 * All available MCP tools
 */
export const MCP_TOOLS: Record<string, MCPTool> = {
  'quickbooks-integration': QUICKBOOKS_TOOL,
  'financial-calculator': FINANCIAL_CALCULATOR_TOOL,
  'tax-research': TAX_RESEARCH_TOOL,
  'industry-benchmarks': INDUSTRY_BENCHMARKS_TOOL,
  'document-ocr': DOCUMENT_OCR_TOOL,
  'email-communication': EMAIL_COMMUNICATION_TOOL
};

/**
 * MCP Client - Handles tool execution and management
 */
export class MCPClient {
  private tools: Map<string, MCPTool> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: Date }> = new Map();
  private authTokens: Map<string, string> = new Map();

  constructor() {
    // Load all available tools
    Object.values(MCP_TOOLS).forEach(tool => {
      this.tools.set(tool.id, tool);
    });
  }

  /**
   * Execute a tool with given parameters
   */
  public async executeTool(toolCall: MCPToolCall): Promise<MCPToolResponse> {
    const startTime = Date.now();
    const tool = this.tools.get(toolCall.toolId);

    if (!tool) {
      return {
        success: false,
        data: null,
        metadata: { executionTime: Date.now() - startTime },
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${toolCall.toolId}' not found`
        }
      };
    }

    // Validate parameters
    const validation = this.validateParameters(tool, toolCall.parameters);
    if (!validation.isValid) {
      return {
        success: false,
        data: null,
        metadata: { executionTime: Date.now() - startTime },
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Parameter validation failed',
          details: validation.errors
        }
      };
    }

    // Check rate limits
    if (tool.rateLimit && !this.checkRateLimit(tool)) {
      return {
        success: false,
        data: null,
        metadata: { executionTime: Date.now() - startTime },
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded for this tool'
        }
      };
    }

    try {
      // Execute the tool
      const result = await this.executeSpecificTool(tool, toolCall);
      
      // Update rate limit tracking
      this.updateRateLimit(tool.id);

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          cost: tool.cost?.pricePerCall || 0
        }
      };

    } catch (error) {
      console.error(`Tool execution failed for ${tool.id}:`, error);
      
      return {
        success: false,
        data: null,
        metadata: { executionTime: Date.now() - startTime },
        error: {
          code: 'EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  /**
   * Execute specific tool implementation
   */
  private async executeSpecificTool(tool: MCPTool, toolCall: MCPToolCall): Promise<any> {
    switch (tool.id) {
      case 'financial-calculator':
        return this.executeFinancialCalculator(toolCall.parameters);
      
      case 'quickbooks-integration':
        return this.executeQuickBooksIntegration(toolCall.parameters, toolCall.context);
      
      case 'tax-research':
        return this.executeTaxResearch(toolCall.parameters);
      
      case 'industry-benchmarks':
        return this.executeIndustryBenchmarks(toolCall.parameters);
      
      case 'document-ocr':
        return this.executeDocumentOCR(toolCall.parameters);
      
      case 'email-communication':
        return this.executeEmailCommunication(toolCall.parameters, toolCall.context);
      
      default:
        throw new Error(`Tool implementation not found: ${tool.id}`);
    }
  }

  /**
   * Financial Calculator Implementation
   */
  private async executeFinancialCalculator(parameters: Record<string, any>): Promise<any> {
    const { calculation, data, parameters: calcParams = {} } = parameters;

    switch (calculation) {
      case 'liquidity_ratios':
        return this.calculateLiquidityRatios(data);
      
      case 'profitability_ratios':
        return this.calculateProfitabilityRatios(data);
      
      case 'leverage_ratios':
        return this.calculateLeverageRatios(data);
      
      case 'cash_flow_projection':
        return this.calculateCashFlowProjection(data, calcParams);
      
      default:
        throw new Error(`Unsupported calculation: ${calculation}`);
    }
  }

  /**
   * Calculate liquidity ratios
   */
  private calculateLiquidityRatios(data: any): any {
    const { currentAssets, currentLiabilities, quickAssets, inventory, cash } = data;

    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities > 0 ? (quickAssets || (currentAssets - inventory)) / currentLiabilities : 0;
    const cashRatio = currentLiabilities > 0 ? cash / currentLiabilities : 0;

    return {
      ratios: {
        currentRatio: Math.round(currentRatio * 100) / 100,
        quickRatio: Math.round(quickRatio * 100) / 100,
        cashRatio: Math.round(cashRatio * 100) / 100
      },
      interpretation: {
        currentRatio: this.interpretCurrentRatio(currentRatio),
        quickRatio: this.interpretQuickRatio(quickRatio),
        cashRatio: this.interpretCashRatio(cashRatio)
      },
      recommendations: this.getLiquidityRecommendations(currentRatio, quickRatio, cashRatio)
    };
  }

  /**
   * Calculate profitability ratios
   */
  private calculateProfitabilityRatios(data: any): any {
    const { revenue, grossProfit, netIncome, totalAssets, shareholderEquity } = data;

    const grossMargin = revenue > 0 ? grossProfit / revenue : 0;
    const netMargin = revenue > 0 ? netIncome / revenue : 0;
    const roa = totalAssets > 0 ? netIncome / totalAssets : 0;
    const roe = shareholderEquity > 0 ? netIncome / shareholderEquity : 0;

    return {
      ratios: {
        grossMargin: Math.round(grossMargin * 10000) / 100, // Convert to percentage
        netMargin: Math.round(netMargin * 10000) / 100,
        roa: Math.round(roa * 10000) / 100,
        roe: Math.round(roe * 10000) / 100
      },
      interpretation: {
        grossMargin: this.interpretGrossMargin(grossMargin),
        netMargin: this.interpretNetMargin(netMargin),
        roa: this.interpretROA(roa),
        roe: this.interpretROE(roe)
      }
    };
  }

  /**
   * QuickBooks Integration Implementation (Mock)
   */
  private async executeQuickBooksIntegration(parameters: Record<string, any>, context?: any): Promise<any> {
    // This would integrate with actual QuickBooks API
    const { action, companyId, filters = {} } = parameters;

    // Mock implementation for demonstration
    switch (action) {
      case 'get_customers':
        return {
          customers: [
            { id: '1', name: 'ABC Corp', balance: 5000 },
            { id: '2', name: 'XYZ LLC', balance: 3200 }
          ],
          total: 2
        };
      
      case 'get_financial_summary':
        return {
          totalRevenue: 150000,
          totalExpenses: 120000,
          netIncome: 30000,
          currentAssets: 75000,
          currentLiabilities: 25000,
          period: 'Q3 2024'
        };
      
      default:
        throw new Error(`Unsupported QuickBooks action: ${action}`);
    }
  }

  /**
   * Tax Research Implementation (Mock)
   */
  private async executeTaxResearch(parameters: Record<string, any>): Promise<any> {
    const { query, jurisdiction, taxYear = new Date().getFullYear() } = parameters;

    // Mock implementation - would integrate with tax research database
    return {
      query,
      jurisdiction,
      taxYear,
      results: [
        {
          title: `Tax regulations related to: ${query}`,
          summary: `Current ${jurisdiction} tax law provisions for ${taxYear}`,
          sections: ['Section 162', 'Section 199A'],
          lastUpdated: new Date().toISOString()
        }
      ],
      totalResults: 1
    };
  }

  /**
   * Industry Benchmarks Implementation (Mock)
   */
  private async executeIndustryBenchmarks(parameters: Record<string, any>): Promise<any> {
    const { industry, metrics, companySize = 'all' } = parameters;

    // Mock benchmark data
    return {
      industry,
      companySize,
      benchmarks: {
        gross_margin: { median: 45.2, q1: 38.1, q3: 52.8 },
        net_margin: { median: 8.7, q1: 5.2, q3: 12.4 },
        current_ratio: { median: 1.8, q1: 1.3, q3: 2.4 },
        debt_to_equity: { median: 0.6, q1: 0.3, q3: 1.1 }
      },
      sampleSize: 1247,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Document OCR Implementation (Mock)
   */
  private async executeDocumentOCR(parameters: Record<string, any>): Promise<any> {
    const { documentUrl, documentType, extractionOptions } = parameters;

    // Mock OCR result
    return {
      documentUrl,
      documentType,
      extractedText: 'Sample extracted text from document...',
      extractedData: {
        tables: [
          {
            headers: ['Date', 'Description', 'Amount'],
            rows: [
              ['2024-01-15', 'Office Supplies', '$125.00'],
              ['2024-01-16', 'Software License', '$299.00']
            ]
          }
        ],
        forms: {
          invoiceNumber: 'INV-2024-001',
          date: '2024-01-15',
          total: 424.00
        }
      },
      confidence: 0.95,
      processingTime: 2.3
    };
  }

  /**
   * Email Communication Implementation (Mock)
   */
  private async executeEmailCommunication(parameters: Record<string, any>, context?: any): Promise<any> {
    const { to, subject, body, cc = [], attachments = [] } = parameters;

    // Mock email sending
    return {
      messageId: `msg_${Date.now()}`,
      status: 'sent',
      recipients: to,
      cc,
      subject,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'delivered'
    };
  }

  /**
   * Validate tool parameters
   */
  private validateParameters(tool: MCPTool, parameters: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const param of tool.parameters) {
      if (param.required && (parameters[param.name] === undefined || parameters[param.name] === null)) {
        errors.push(`Required parameter '${param.name}' is missing`);
      }

      if (parameters[param.name] !== undefined && param.validation) {
        // Type validation would go here
        if (param.validation.enum && !param.validation.enum.includes(parameters[param.name])) {
          errors.push(`Parameter '${param.name}' must be one of: ${param.validation.enum.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(tool: MCPTool): boolean {
    if (!tool.rateLimit) return true;

    const tracker = this.rateLimitTracker.get(tool.id);
    const now = new Date();

    if (!tracker || now > tracker.resetTime) {
      return true;
    }

    return tracker.count < tool.rateLimit.requestsPerMinute;
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool || !tool.rateLimit) return;

    const now = new Date();
    const resetTime = new Date(now.getTime() + 60000); // Reset in 1 minute

    const tracker = this.rateLimitTracker.get(toolId);
    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTracker.set(toolId, { count: 1, resetTime });
    } else {
      tracker.count++;
    }
  }

  // Helper methods for ratio interpretation
  private interpretCurrentRatio(ratio: number): string {
    if (ratio < 1) return 'Low liquidity - may have trouble meeting short-term obligations';
    if (ratio < 1.5) return 'Adequate liquidity - monitor closely';
    if (ratio > 3) return 'High liquidity - may indicate inefficient use of assets';
    return 'Good liquidity - healthy short-term financial position';
  }

  private interpretQuickRatio(ratio: number): string {
    if (ratio < 0.5) return 'Poor quick liquidity - relies heavily on inventory';
    if (ratio < 1) return 'Adequate quick liquidity';
    return 'Strong quick liquidity - can meet obligations without selling inventory';
  }

  private interpretCashRatio(ratio: number): string {
    if (ratio < 0.1) return 'Low cash reserves - monitor cash flow closely';
    if (ratio > 0.5) return 'High cash reserves - consider investment opportunities';
    return 'Adequate cash reserves';
  }

  private interpretGrossMargin(margin: number): string {
    const percentage = margin * 100;
    if (percentage < 20) return 'Low gross margin - review pricing and costs';
    if (percentage > 60) return 'High gross margin - strong pricing power';
    return 'Healthy gross margin';
  }

  private interpretNetMargin(margin: number): string {
    const percentage = margin * 100;
    if (percentage < 5) return 'Low net margin - review operational efficiency';
    if (percentage > 15) return 'Excellent net margin - highly profitable';
    return 'Good net margin';
  }

  private interpretROA(roa: number): string {
    const percentage = roa * 100;
    if (percentage < 3) return 'Low ROA - inefficient asset utilization';
    if (percentage > 10) return 'Excellent ROA - very efficient asset use';
    return 'Good ROA';
  }

  private interpretROE(roe: number): string {
    const percentage = roe * 100;
    if (percentage < 10) return 'Low ROE - may not be generating adequate returns';
    if (percentage > 20) return 'High ROE - strong returns for shareholders';
    return 'Good ROE';
  }

  private getLiquidityRecommendations(current: number, quick: number, cash: number): string[] {
    const recommendations: string[] = [];

    if (current < 1.2) {
      recommendations.push('Improve current ratio by increasing current assets or reducing current liabilities');
    }
    if (quick < 0.8) {
      recommendations.push('Build quick assets to improve short-term liquidity');
    }
    if (cash < 0.1) {
      recommendations.push('Maintain higher cash reserves for operational flexibility');
    }
    if (current > 3) {
      recommendations.push('Consider investing excess current assets for better returns');
    }

    return recommendations;
  }

  private calculateLeverageRatios(data: any): any {
    const { totalDebt, totalAssets, shareholderEquity, ebit, interestExpense } = data;

    const debtToAssets = totalAssets > 0 ? totalDebt / totalAssets : 0;
    const debtToEquity = shareholderEquity > 0 ? totalDebt / shareholderEquity : 0;
    const timesInterestEarned = interestExpense > 0 ? ebit / interestExpense : 0;

    return {
      ratios: {
        debtToAssets: Math.round(debtToAssets * 10000) / 100,
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        timesInterestEarned: Math.round(timesInterestEarned * 100) / 100
      },
      interpretation: {
        debtToAssets: this.interpretDebtToAssets(debtToAssets),
        debtToEquity: this.interpretDebtToEquity(debtToEquity),
        timesInterestEarned: this.interpretTimesInterestEarned(timesInterestEarned)
      }
    };
  }

  private calculateCashFlowProjection(data: any, params: any): any {
    const { startingCash, monthlyInflows, monthlyOutflows, months = 12 } = data;
    const { growthRate = 0, seasonalFactors = {} } = params;

    const projections = [];
    let cumulativeCash = startingCash;

    for (let month = 1; month <= months; month++) {
      const seasonalFactor = seasonalFactors[month] || 1;
      const monthlyGrowth = Math.pow(1 + growthRate / 12, month - 1);
      
      const inflow = monthlyInflows * monthlyGrowth * seasonalFactor;
      const outflow = monthlyOutflows * monthlyGrowth;
      const netCashFlow = inflow - outflow;
      
      cumulativeCash += netCashFlow;

      projections.push({
        month,
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        netCashFlow: Math.round(netCashFlow),
        cumulativeCash: Math.round(cumulativeCash)
      });
    }

    return {
      projections,
      summary: {
        totalInflows: projections.reduce((sum, p) => sum + p.inflow, 0),
        totalOutflows: projections.reduce((sum, p) => sum + p.outflow, 0),
        netChange: cumulativeCash - startingCash,
        endingCash: cumulativeCash,
        lowestCash: Math.min(...projections.map(p => p.cumulativeCash))
      }
    };
  }

  private interpretDebtToAssets(ratio: number): string {
    const percentage = ratio * 100;
    if (percentage > 60) return 'High debt level - financial risk concern';
    if (percentage < 30) return 'Conservative debt level - room for leverage';
    return 'Moderate debt level - balanced capital structure';
  }

  private interpretDebtToEquity(ratio: number): string {
    if (ratio > 2) return 'High leverage - significant financial risk';
    if (ratio < 0.5) return 'Conservative leverage - may be under-leveraged';
    return 'Reasonable leverage level';
  }

  private interpretTimesInterestEarned(ratio: number): string {
    if (ratio < 2.5) return 'Low interest coverage - difficulty servicing debt';
    if (ratio > 10) return 'Strong interest coverage - comfortable debt service';
    return 'Adequate interest coverage';
  }

  /**
   * Get all available tools
   */
  public getAvailableTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  public getToolsByCategory(category: string): MCPTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  /**
   * Get tool by ID
   */
  public getTool(toolId: string): MCPTool | undefined {
    return this.tools.get(toolId);
  }
}

/**
 * Create MCP client instance
 */
export function createMCPClient(): MCPClient {
  return new MCPClient();
}

/**
 * Get all available MCP tools
 */
export function getAllMCPTools(): MCPTool[] {
  return Object.values(MCP_TOOLS);
}

/**
 * Get MCP tool by ID
 */
export function getMCPTool(toolId: string): MCPTool | undefined {
  return MCP_TOOLS[toolId];
}

export default {
  MCP_TOOLS,
  MCPClient,
  createMCPClient,
  getAllMCPTools,
  getMCPTool
};