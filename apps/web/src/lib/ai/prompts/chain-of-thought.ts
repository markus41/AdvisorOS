/**
 * Advanced Chain-of-Thought Prompts for CPA Advisory Platform
 * Implements sophisticated reasoning patterns and contextual prompt templates
 */

export interface ChainOfThoughtPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  reasoningSteps: string[];
  systemPrompt: string;
  userTemplate: string;
  variables: string[];
  examples: Array<{
    input: Record<string, any>;
    reasoning: string[];
    output: string;
  }>;
  confidenceFactors: string[];
  qualityChecks: string[];
}

export interface ContextualPromptTemplate {
  basePrompt: ChainOfThoughtPrompt;
  contextAdaptations: Record<string, {
    additionalInstructions: string;
    modifiedSteps: string[];
    contextSpecificExamples: any[];
  }>;
  dynamicVariables: string[];
}

/**
 * Advanced Financial Health Analysis with Chain-of-Thought Reasoning
 */
export const FINANCIAL_HEALTH_COT: ChainOfThoughtPrompt = {
  id: 'financial-health-cot',
  name: 'Financial Health Analysis (Chain-of-Thought)',
  description: 'Comprehensive financial health assessment with structured reasoning',
  category: 'financial-analysis',
  reasoningSteps: [
    'Analyze current financial position and liquidity',
    'Evaluate profitability trends and margins',
    'Assess debt structure and leverage ratios',
    'Compare performance against industry benchmarks',
    'Identify key financial strengths and weaknesses',
    'Project financial trajectory and risks',
    'Formulate actionable recommendations'
  ],
  systemPrompt: `You are a Senior Financial Analyst conducting a comprehensive financial health assessment. 

Follow this structured reasoning approach:
1. First, establish the current financial baseline
2. Analyze each key financial dimension systematically
3. Compare against relevant benchmarks and standards
4. Identify patterns, trends, and anomalies
5. Assess risks and opportunities
6. Synthesize findings into clear conclusions
7. Provide specific, actionable recommendations

For each step, show your reasoning process clearly. Use financial ratios, industry knowledge, and best practices to support your analysis.`,
  userTemplate: `Analyze the financial health of this business using chain-of-thought reasoning:

## Financial Data
{financialStatements}

## Business Context
- Industry: {industry}
- Business Stage: {businessStage}
- Market Conditions: {marketConditions}
- Company Size: {companySize}

## Industry Benchmarks
{industryBenchmarks}

## Analysis Request
{analysisRequest}

Please follow the structured reasoning steps and provide:
1. Step-by-step analysis for each financial dimension
2. Reasoning behind each conclusion
3. Specific evidence supporting your assessment
4. Risk factors and opportunities identified
5. Prioritized recommendations with rationale

Show your work for all calculations and explain your reasoning process.`,
  variables: [
    'financialStatements',
    'industry',
    'businessStage',
    'marketConditions',
    'companySize',
    'industryBenchmarks',
    'analysisRequest'
  ],
  examples: [
    {
      input: {
        financialStatements: 'Revenue: $500K, Gross Profit: $300K, Net Income: $50K, Current Assets: $100K, Current Liabilities: $80K',
        industry: 'Professional Services',
        businessStage: 'Established (5+ years)',
        marketConditions: 'Stable growth market'
      },
      reasoning: [
        'Calculate gross margin: $300K / $500K = 60% - healthy for professional services',
        'Calculate net margin: $50K / $500K = 10% - reasonable but could improve',
        'Calculate current ratio: $100K / $80K = 1.25 - adequate liquidity',
        'Compare to industry: Professional services typically see 50-70% gross margins',
        'Assess trend implications and growth sustainability'
      ],
      output: 'Financial health assessment with detailed reasoning and recommendations...'
    }
  ],
  confidenceFactors: [
    'Quality and completeness of financial data',
    'Availability of industry benchmarks',
    'Length of historical data for trend analysis',
    'Market conditions stability',
    'Business model complexity'
  ],
  qualityChecks: [
    'All key financial ratios calculated and explained',
    'Industry comparisons provided where relevant',
    'Reasoning steps clearly documented',
    'Recommendations are specific and actionable',
    'Risk factors adequately addressed'
  ]
};

/**
 * Advanced Tax Optimization Strategy with Chain-of-Thought
 */
export const TAX_OPTIMIZATION_COT: ChainOfThoughtPrompt = {
  id: 'tax-optimization-cot',
  name: 'Tax Optimization Strategy (Chain-of-Thought)',
  description: 'Strategic tax planning with detailed reasoning and compliance considerations',
  category: 'tax-planning',
  reasoningSteps: [
    'Review current tax situation and recent filing history',
    'Analyze income sources and timing opportunities',
    'Identify eligible deductions and credits',
    'Evaluate entity structure optimization options',
    'Consider timing strategies for income and expenses',
    'Assess multi-year tax planning opportunities',
    'Ensure compliance with all applicable tax laws',
    'Calculate potential tax savings and ROI',
    'Develop implementation timeline and action plan'
  ],
  systemPrompt: `You are a Tax Strategy Specialist with deep expertise in federal and state tax laws. 

Your approach to tax optimization follows these principles:
1. Comprehensive review of the current tax situation
2. Systematic identification of all available opportunities
3. Careful consideration of compliance requirements
4. Risk assessment for each strategy
5. Quantification of potential benefits
6. Practical implementation guidance

Always prioritize compliance and conservative strategies. Show detailed reasoning for each recommendation, including relevant tax code references where applicable.`,
  userTemplate: `Develop a comprehensive tax optimization strategy with detailed reasoning:

## Current Tax Situation
{currentTaxSituation}

## Business/Personal Profile
- Entity Type: {entityType}
- Industry: {industry}
- Annual Income: {annualIncome}
- Current Tax Burden: {currentTaxBurden}

## Specific Areas to Analyze
{analysisAreas}

## Goals and Constraints
{goalsConstraints}

## Timing Considerations
{timingConsiderations}

Please provide:
1. Step-by-step analysis of the current tax situation
2. Detailed evaluation of each optimization opportunity
3. Compliance considerations and risk assessment
4. Quantified potential tax savings with calculations
5. Prioritized action plan with implementation timeline
6. Relevant tax code references and documentation requirements

Show your reasoning process for each recommendation and explain how it fits into the overall tax strategy.`,
  variables: [
    'currentTaxSituation',
    'entityType',
    'industry',
    'annualIncome',
    'currentTaxBurden',
    'analysisAreas',
    'goalsConstraints',
    'timingConsiderations'
  ],
  examples: [
    {
      input: {
        entityType: 'S Corporation',
        industry: 'Professional Services',
        annualIncome: '$200,000',
        currentTaxBurden: '28% effective rate'
      },
      reasoning: [
        'S Corp allows for reasonable salary + distributions split',
        'Professional services qualify for Section 199A deduction',
        'Consider retirement plan contributions to reduce taxable income',
        'Evaluate timing of equipment purchases for Section 179 deduction',
        'Assess health insurance deduction opportunities'
      ],
      output: 'Comprehensive tax optimization strategy with specific recommendations...'
    }
  ],
  confidenceFactors: [
    'Completeness of tax and financial information',
    'Clarity of client goals and constraints',
    'Complexity of tax situation',
    'Time horizon for implementation',
    'Regulatory environment stability'
  ],
  qualityChecks: [
    'All major tax optimization areas considered',
    'Compliance implications clearly addressed',
    'Tax savings quantified with supporting calculations',
    'Implementation steps are specific and actionable',
    'Risk factors and mitigation strategies provided'
  ]
};

/**
 * Business Advisory Consultation with Chain-of-Thought
 */
export const BUSINESS_ADVISORY_COT: ChainOfThoughtPrompt = {
  id: 'business-advisory-cot',
  name: 'Business Advisory Consultation (Chain-of-Thought)',
  description: 'Strategic business consulting with structured analytical reasoning',
  category: 'business-advisory',
  reasoningSteps: [
    'Understand the business model and current situation',
    'Analyze financial performance and key metrics',
    'Assess market position and competitive landscape',
    'Identify operational strengths and inefficiencies',
    'Evaluate growth opportunities and constraints',
    'Consider risk factors and mitigation strategies',
    'Develop strategic recommendations with priorities',
    'Create implementation roadmap with milestones'
  ],
  systemPrompt: `You are a Senior Business Advisor with extensive experience helping businesses grow and optimize operations.

Your advisory approach is:
1. Holistic - considering all aspects of the business
2. Data-driven - using financial and operational metrics
3. Strategic - focusing on long-term value creation
4. Practical - providing actionable recommendations
5. Risk-aware - identifying and mitigating potential issues

Use structured analytical reasoning to work through each business challenge. Support your recommendations with clear logic and quantitative analysis where possible.`,
  userTemplate: `Provide business advisory consultation using chain-of-thought reasoning:

## Business Overview
{businessOverview}

## Current Challenges
{currentChallenges}

## Financial Performance
{financialPerformance}

## Market Context
{marketContext}

## Specific Advisory Areas
{advisoryAreas}

## Goals and Objectives
{goalsObjectives}

Please provide:
1. Comprehensive situation analysis with reasoning
2. Key insights and findings from your evaluation
3. Strategic recommendations with supporting rationale
4. Implementation priorities and timeline
5. Success metrics and monitoring approach
6. Risk assessment and contingency planning

Show your analytical process and explain how you arrived at each recommendation.`,
  variables: [
    'businessOverview',
    'currentChallenges',
    'financialPerformance',
    'marketContext',
    'advisoryAreas',
    'goalsObjectives'
  ],
  examples: [
    {
      input: {
        businessOverview: 'Manufacturing company, 20 employees, $2M annual revenue',
        currentChallenges: 'Cash flow issues, increasing competition',
        financialPerformance: 'Declining margins, slow receivables collection'
      },
      reasoning: [
        'Analyze cash flow patterns to identify root causes',
        'Evaluate receivables aging and collection processes',
        'Assess competitive positioning and value proposition',
        'Review operational efficiency and cost structure',
        'Identify quick wins vs. strategic improvements',
        'Prioritize recommendations based on impact and feasibility'
      ],
      output: 'Strategic business advisory report with detailed analysis and recommendations...'
    }
  ],
  confidenceFactors: [
    'Quality and depth of business information provided',
    'Access to relevant financial and operational data',
    'Understanding of industry and market dynamics',
    'Clarity of business goals and constraints',
    'Management team engagement and capability'
  ],
  qualityChecks: [
    'All major business dimensions analyzed',
    'Recommendations are strategic yet actionable',
    'Implementation roadmap is realistic and detailed',
    'Success metrics clearly defined',
    'Risk factors identified and addressed'
  ]
};

/**
 * Client Communication with Emotional Intelligence
 */
export const CLIENT_COMMUNICATION_COT: ChainOfThoughtPrompt = {
  id: 'client-communication-cot',
  name: 'Client Communication (Chain-of-Thought)',
  description: 'Professional client communication with emotional intelligence and persuasive reasoning',
  category: 'communication',
  reasoningSteps: [
    'Analyze client context and emotional state',
    'Identify key messages and objectives',
    'Consider client perspective and potential concerns',
    'Structure communication for clarity and impact',
    'Incorporate appropriate emotional intelligence elements',
    'Include clear next steps and call-to-action',
    'Review tone and professional appropriateness'
  ],
  systemPrompt: `You are a Client Relationship Specialist who excels at professional communication that builds trust and drives action.

Your communication approach includes:
1. Empathy - understanding client emotions and concerns
2. Clarity - making complex topics accessible
3. Professionalism - maintaining appropriate boundaries and tone
4. Persuasion - influencing positive outcomes
5. Action-orientation - providing clear next steps

Consider both the technical content and emotional intelligence aspects of your communication. Always maintain professional standards while being personable and engaging.`,
  userTemplate: `Create professional client communication using chain-of-thought reasoning:

## Communication Context
{communicationContext}

## Client Profile
{clientProfile}

## Key Messages to Convey
{keyMessages}

## Desired Outcomes
{desiredOutcomes}

## Client Concerns/Situation
{clientConcerns}

## Technical Information
{technicalInformation}

Please provide:
1. Analysis of client context and communication needs
2. Key message strategy and reasoning
3. Draft communication with professional tone
4. Emotional intelligence considerations
5. Clear next steps and follow-up plan

Show your reasoning for communication choices and explain how the message addresses client needs and concerns.`,
  variables: [
    'communicationContext',
    'clientProfile',
    'keyMessages',
    'desiredOutcomes',
    'clientConcerns',
    'technicalInformation'
  ],
  examples: [
    {
      input: {
        communicationContext: 'Year-end tax planning meeting follow-up',
        clientProfile: 'Small business owner, detail-oriented, risk-averse',
        keyMessages: 'Recommended tax strategies, implementation timeline',
        clientConcerns: 'Complexity of new strategies, compliance risks'
      },
      reasoning: [
        'Acknowledge client concerns about complexity upfront',
        'Break down strategies into simple, understandable components',
        'Emphasize compliance focus and conservative approach',
        'Provide clear implementation steps with support offered',
        'Include reassurance about professional guidance throughout'
      ],
      output: 'Professional client communication that addresses concerns while moving forward...'
    }
  ],
  confidenceFactors: [
    'Understanding of client personality and preferences',
    'Clarity of communication objectives',
    'Complexity of technical information',
    'Sensitivity of the situation',
    'Relationship history and context'
  ],
  qualityChecks: [
    'Professional tone maintained throughout',
    'Client concerns addressed empathetically',
    'Technical information explained clearly',
    'Action items and next steps clearly defined',
    'Appropriate emotional intelligence elements included'
  ]
};

/**
 * All Chain-of-Thought Prompts
 */
export const COT_PROMPTS: Record<string, ChainOfThoughtPrompt> = {
  'financial-health-cot': FINANCIAL_HEALTH_COT,
  'tax-optimization-cot': TAX_OPTIMIZATION_COT,
  'business-advisory-cot': BUSINESS_ADVISORY_COT,
  'client-communication-cot': CLIENT_COMMUNICATION_COT
};

/**
 * Contextual Prompt Templates
 */
export const CONTEXTUAL_TEMPLATES: Record<string, ContextualPromptTemplate> = {
  'financial-health-seasonal': {
    basePrompt: FINANCIAL_HEALTH_COT,
    contextAdaptations: {
      'tax-season': {
        additionalInstructions: 'Focus on tax implications of financial decisions and year-end planning opportunities.',
        modifiedSteps: [
          'Analyze current financial position with tax implications',
          'Evaluate profitability trends and tax efficiency',
          'Assess deductible expenses and tax planning opportunities'
        ],
        contextSpecificExamples: []
      },
      'year-end': {
        additionalInstructions: 'Emphasize year-end financial planning and next year preparation.',
        modifiedSteps: [
          'Review year-end financial position',
          'Identify year-end planning opportunities',
          'Prepare for next year financial goals'
        ],
        contextSpecificExamples: []
      }
    },
    dynamicVariables: ['currentSeason', 'yearEndDeadlines', 'taxPlanningDeadlines']
  }
};

/**
 * Advanced Prompt Formatter with Chain-of-Thought Integration
 */
export class AdvancedPromptFormatter {
  /**
   * Format a chain-of-thought prompt with context
   */
  public static formatCOTPrompt(
    promptId: string,
    variables: Record<string, any>,
    context?: {
      mode: string;
      season: string;
      urgency: string;
    }
  ): { systemPrompt: string; userPrompt: string; reasoningSteps: string[] } {
    const prompt = COT_PROMPTS[promptId];
    if (!prompt) {
      throw new Error(`Chain-of-thought prompt '${promptId}' not found`);
    }

    // Check for contextual adaptations
    let adaptedPrompt = prompt;
    if (context) {
      const contextualTemplate = this.findContextualTemplate(promptId, context);
      if (contextualTemplate) {
        adaptedPrompt = this.applyContextualAdaptation(prompt, contextualTemplate, context);
      }
    }

    // Format system prompt with reasoning steps
    const systemPrompt = `${adaptedPrompt.systemPrompt}

## Reasoning Process
Follow these steps in your analysis:
${adaptedPrompt.reasoningSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

For each step, show your reasoning and provide supporting evidence or calculations.`;

    // Format user prompt with variables
    let userPrompt = adaptedPrompt.userTemplate;
    adaptedPrompt.variables.forEach(variable => {
      const value = variables[variable] || `[${variable} not provided]`;
      const placeholder = `{${variable}}`;
      userPrompt = userPrompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    return {
      systemPrompt,
      userPrompt,
      reasoningSteps: adaptedPrompt.reasoningSteps
    };
  }

  /**
   * Find contextual template for given prompt and context
   */
  private static findContextualTemplate(
    promptId: string,
    context: { mode: string; season: string; urgency: string }
  ): ContextualPromptTemplate | null {
    // Check for seasonal adaptations
    const seasonalTemplateId = `${promptId.replace('-cot', '')}-seasonal`;
    const seasonalTemplate = CONTEXTUAL_TEMPLATES[seasonalTemplateId];
    
    if (seasonalTemplate && seasonalTemplate.contextAdaptations[context.season]) {
      return seasonalTemplate;
    }

    // Check for mode-specific adaptations
    const modeTemplateId = `${promptId.replace('-cot', '')}-${context.mode}`;
    const modeTemplate = CONTEXTUAL_TEMPLATES[modeTemplateId];
    
    if (modeTemplate) {
      return modeTemplate;
    }

    return null;
  }

  /**
   * Apply contextual adaptation to a prompt
   */
  private static applyContextualAdaptation(
    basePrompt: ChainOfThoughtPrompt,
    contextualTemplate: ContextualPromptTemplate,
    context: { mode: string; season: string; urgency: string }
  ): ChainOfThoughtPrompt {
    const adaptation = contextualTemplate.contextAdaptations[context.season] || 
                      contextualTemplate.contextAdaptations[context.mode];
    
    if (!adaptation) return basePrompt;

    return {
      ...basePrompt,
      systemPrompt: `${basePrompt.systemPrompt}\n\n${adaptation.additionalInstructions}`,
      reasoningSteps: adaptation.modifiedSteps.length > 0 ? adaptation.modifiedSteps : basePrompt.reasoningSteps
    };
  }

  /**
   * Validate prompt variables
   */
  public static validatePromptVariables(
    promptId: string,
    variables: Record<string, any>
  ): { isValid: boolean; missingVariables: string[] } {
    const prompt = COT_PROMPTS[promptId];
    if (!prompt) {
      return { isValid: false, missingVariables: [] };
    }

    const missingVariables = prompt.variables.filter(variable =>
      variables[variable] === undefined || variables[variable] === null || variables[variable] === ''
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }

  /**
   * Get confidence factors for a prompt
   */
  public static getConfidenceFactors(promptId: string): string[] {
    const prompt = COT_PROMPTS[promptId];
    return prompt ? prompt.confidenceFactors : [];
  }

  /**
   * Get quality checks for a prompt
   */
  public static getQualityChecks(promptId: string): string[] {
    const prompt = COT_PROMPTS[promptId];
    return prompt ? prompt.qualityChecks : [];
  }
}

/**
 * Get all chain-of-thought prompts
 */
export function getAllCOTPrompts(): ChainOfThoughtPrompt[] {
  return Object.values(COT_PROMPTS);
}

/**
 * Get chain-of-thought prompt by ID
 */
export function getCOTPrompt(promptId: string): ChainOfThoughtPrompt | undefined {
  return COT_PROMPTS[promptId];
}

/**
 * Get prompts by category
 */
export function getCOTPromptsByCategory(category: string): ChainOfThoughtPrompt[] {
  return Object.values(COT_PROMPTS).filter(prompt => prompt.category === category);
}

export default {
  COT_PROMPTS,
  CONTEXTUAL_TEMPLATES,
  AdvancedPromptFormatter,
  getAllCOTPrompts,
  getCOTPrompt,
  getCOTPromptsByCategory
};