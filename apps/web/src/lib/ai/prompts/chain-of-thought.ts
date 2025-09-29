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
 * Code Generation with Architecture Planning
 */
export const CODE_GENERATION_COT: ChainOfThoughtPrompt = {
  id: 'code-generation-cot',
  name: 'Code Generation (Chain-of-Thought)',
  description: 'Systematic code generation with architecture planning and best practices',
  category: 'development',
  reasoningSteps: [
    'Analyze requirements and understand the problem context',
    'Design the component/feature architecture and data flow',
    'Identify required dependencies and integrations',
    'Plan the file structure and component organization',
    'Consider security, performance, and accessibility requirements',
    'Generate clean, maintainable code following best practices',
    'Include comprehensive error handling and edge cases',
    'Add appropriate tests and documentation'
  ],
  systemPrompt: `You are a Senior Developer creating high-quality code with systematic planning. Your approach includes:

1. Understanding the full context and requirements
2. Designing proper architecture before coding
3. Following established patterns and best practices
4. Writing secure, performant, and accessible code
5. Including comprehensive error handling
6. Adding appropriate tests and documentation

Consider TypeScript types, React patterns, Next.js conventions, and modern development practices.`,
  userTemplate: `Generate code with systematic planning and reasoning:

## Requirements
{requirements}

## Technical Context
- Framework: {framework}
- Language: {language}
- Existing Architecture: {architecture}
- Dependencies: {dependencies}

## Constraints & Considerations
{constraints}

## Integration Points
{integrations}

Please provide:
1. Architectural analysis and design decisions
2. Complete implementation with reasoning for each part
3. Error handling and edge case considerations
4. Testing strategy and example tests
5. Documentation and usage examples

Show your reasoning process for design decisions and explain how the solution addresses the requirements.`,
  variables: [
    'requirements',
    'framework',
    'language',
    'architecture',
    'dependencies',
    'constraints',
    'integrations'
  ],
  examples: [
    {
      input: {
        requirements: 'Create a reusable data table component with sorting, filtering, and pagination',
        framework: 'Next.js 14',
        language: 'TypeScript',
        architecture: 'Component-based with custom hooks'
      },
      reasoning: [
        'Analyze data table requirements: sorting, filtering, pagination',
        'Design component API with proper TypeScript generics',
        'Plan state management with custom hooks for reusability',
        'Consider accessibility with proper ARIA labels and keyboard navigation',
        'Implement performance optimizations like virtualization for large datasets',
        'Add comprehensive error boundaries and loading states'
      ],
      output: 'Complete data table implementation with hooks, types, and tests...'
    }
  ],
  confidenceFactors: [
    'Clarity and completeness of requirements',
    'Understanding of existing architecture',
    'Availability of similar patterns in codebase',
    'Complexity of integration requirements',
    'Performance and security considerations'
  ],
  qualityChecks: [
    'Code follows established patterns and conventions',
    'TypeScript types are comprehensive and accurate',
    'Error handling covers all edge cases',
    'Performance considerations are addressed',
    'Accessibility requirements are met',
    'Tests provide adequate coverage',
    'Documentation is clear and complete'
  ]
};

/**
 * Code Review and Quality Analysis
 */
export const CODE_REVIEW_COT: ChainOfThoughtPrompt = {
  id: 'code-review-cot',
  name: 'Code Review Analysis (Chain-of-Thought)',
  description: 'Comprehensive code review with security, performance, and quality analysis',
  category: 'code-review',
  reasoningSteps: [
    'Understand the code purpose and context',
    'Analyze code structure and organization',
    'Review security vulnerabilities and potential exploits',
    'Assess performance implications and optimization opportunities',
    'Check accessibility compliance and best practices',
    'Validate TypeScript types and error handling',
    'Review test coverage and quality',
    'Provide actionable improvement recommendations'
  ],
  systemPrompt: `You are a meticulous Code Reviewer conducting comprehensive analysis. Your review covers:

1. Security vulnerabilities and OWASP compliance
2. Performance optimization opportunities
3. Code quality and maintainability
4. Accessibility compliance (WCAG)
5. TypeScript type safety
6. Error handling and edge cases
7. Test coverage and quality
8. Best practices adherence

Provide specific, actionable feedback with examples and recommendations.`,
  userTemplate: `Conduct comprehensive code review with detailed analysis:

## Code to Review
{codeContent}

## Context Information
- Purpose: {purpose}
- Framework: {framework}
- Target Environment: {environment}
- Performance Requirements: {performanceRequirements}
- Security Requirements: {securityRequirements}

## Review Focus Areas
{focusAreas}

## Existing Issues (if any)
{knownIssues}

Please provide:
1. Security vulnerability analysis with specific risks
2. Performance assessment and optimization recommendations
3. Code quality evaluation with improvement suggestions
4. Accessibility compliance review
5. TypeScript type safety validation
6. Test coverage and quality assessment
7. Overall recommendations prioritized by impact

Show your reasoning for each finding and provide specific examples of improvements.`,
  variables: [
    'codeContent',
    'purpose',
    'framework',
    'environment',
    'performanceRequirements',
    'securityRequirements',
    'focusAreas',
    'knownIssues'
  ],
  examples: [
    {
      input: {
        codeContent: 'React component with user authentication logic',
        purpose: 'User login and session management',
        framework: 'Next.js with NextAuth',
        securityRequirements: 'OWASP compliance, secure session handling'
      },
      reasoning: [
        'Analyze authentication flow for security vulnerabilities',
        'Check for proper input validation and sanitization',
        'Review session management and token handling',
        'Assess XSS and CSRF protection measures',
        'Evaluate error handling to prevent information leakage',
        'Check TypeScript types for authentication data'
      ],
      output: 'Comprehensive security review with specific vulnerability findings and fixes...'
    }
  ],
  confidenceFactors: [
    'Completeness of code provided for review',
    'Understanding of security requirements',
    'Knowledge of framework-specific vulnerabilities',
    'Access to performance benchmarks',
    'Clarity of functional requirements'
  ],
  qualityChecks: [
    'All security risks properly identified and categorized',
    'Performance recommendations are measurable and actionable',
    'Code quality suggestions follow established best practices',
    'Accessibility issues are identified with specific fixes',
    'TypeScript improvements enhance type safety',
    'Test recommendations improve coverage and quality'
  ]
};

/**
 * Debugging and Problem Resolution
 */
export const DEBUGGING_COT: ChainOfThoughtPrompt = {
  id: 'debugging-cot',
  name: 'Debugging Analysis (Chain-of-Thought)',
  description: 'Systematic debugging approach with root cause analysis and resolution',
  category: 'debugging',
  reasoningSteps: [
    'Understand the problem symptoms and error context',
    'Analyze error messages, stack traces, and logs',
    'Identify potential root causes and contributing factors',
    'Examine related code areas and dependencies',
    'Consider environment and configuration issues',
    'Develop hypotheses and testing strategies',
    'Provide step-by-step debugging approach',
    'Suggest preventive measures and monitoring'
  ],
  systemPrompt: `You are a debugging expert with systematic problem-solving skills. Your approach includes:

1. Careful analysis of symptoms and error context
2. Methodical examination of stack traces and logs
3. Root cause analysis considering all possible factors
4. Hypothesis-driven debugging strategies
5. Environment and dependency considerations
6. Preventive measures and monitoring setup

Provide clear, actionable debugging steps and long-term solutions.`,
  userTemplate: `Analyze and debug this issue systematically:

## Problem Description
{problemDescription}

## Error Messages/Stack Traces
{errorDetails}

## Environment Information
{environmentInfo}

## Steps to Reproduce
{reproductionSteps}

## Recent Changes
{recentChanges}

## Additional Context
{additionalContext}

Please provide:
1. Analysis of error messages and stack traces
2. Identification of potential root causes
3. Step-by-step debugging methodology
4. Specific areas of code to investigate
5. Environment and configuration checks
6. Immediate fixes and workarounds
7. Long-term prevention strategies
8. Monitoring and alerting recommendations

Show your reasoning process for each hypothesis and debugging step.`,
  variables: [
    'problemDescription',
    'errorDetails',
    'environmentInfo',
    'reproductionSteps',
    'recentChanges',
    'additionalContext'
  ],
  examples: [
    {
      input: {
        problemDescription: 'React application crashes on user login',
        errorDetails: 'TypeError: Cannot read property id of undefined',
        environmentInfo: 'Next.js 14, Node.js 18, Production environment',
        recentChanges: 'Updated authentication library'
      },
      reasoning: [
        'Analyze TypeError to identify null/undefined object access',
        'Examine authentication flow changes in recent update',
        'Check user object structure and API response format',
        'Investigate timing issues with async authentication',
        'Review error boundaries and fallback handling',
        'Consider race conditions in component mounting'
      ],
      output: 'Systematic debugging plan with specific investigation steps and fixes...'
    }
  ],
  confidenceFactors: [
    'Quality and completeness of error information',
    'Understanding of the application architecture',
    'Access to relevant logs and monitoring data',
    'Knowledge of recent changes and deployments',
    'Reproducibility of the issue'
  ],
  qualityChecks: [
    'Root cause analysis is thorough and logical',
    'Debugging steps are specific and actionable',
    'Solutions address both immediate and long-term needs',
    'Prevention strategies are practical and implementable',
    'Monitoring recommendations help detect similar issues'
  ]
};

/**
 * Performance Optimization Strategy
 */
export const PERFORMANCE_OPTIMIZATION_COT: ChainOfThoughtPrompt = {
  id: 'performance-optimization-cot',
  name: 'Performance Optimization (Chain-of-Thought)',
  description: 'Systematic performance analysis and optimization strategy',
  category: 'performance',
  reasoningSteps: [
    'Analyze current performance metrics and bottlenecks',
    'Identify critical performance paths and user journeys',
    'Examine bundle size, loading times, and runtime performance',
    'Review database queries and API efficiency',
    'Assess caching strategies and optimization opportunities',
    'Consider code splitting and lazy loading opportunities',
    'Evaluate third-party dependencies and their impact',
    'Develop prioritized optimization roadmap with measurable goals'
  ],
  systemPrompt: `You are a Performance Optimization Specialist focused on delivering fast, efficient applications. Your analysis includes:

1. Comprehensive performance metrics analysis
2. Critical rendering path optimization
3. Bundle size and code splitting strategies
4. Database and API performance optimization
5. Caching implementation and strategies
6. Third-party dependency optimization
7. Monitoring and measurement setup

Provide specific, measurable optimization recommendations with expected impact.`,
  userTemplate: `Analyze performance and create optimization strategy:

## Current Performance Metrics
{performanceMetrics}

## Application Architecture
{architectureOverview}

## Key User Journeys
{userJourneys}

## Performance Goals
{performanceGoals}

## Current Bottlenecks (if known)
{knownBottlenecks}

## Technical Constraints
{constraints}

Please provide:
1. Performance audit findings with specific metrics
2. Critical path analysis and optimization priorities
3. Bundle optimization and code splitting strategy
4. Database and API optimization recommendations
5. Caching strategy implementation plan
6. Third-party dependency audit and alternatives
7. Monitoring and measurement implementation
8. Phased optimization roadmap with expected improvements

Show your reasoning for prioritization and expected performance gains.`,
  variables: [
    'performanceMetrics',
    'architectureOverview',
    'userJourneys',
    'performanceGoals',
    'knownBottlenecks',
    'constraints'
  ],
  examples: [
    {
      input: {
        performanceMetrics: 'LCP: 4.5s, FID: 300ms, CLS: 0.25',
        architectureOverview: 'Next.js SPA with large bundle',
        performanceGoals: 'LCP < 2.5s, FID < 100ms, CLS < 0.1',
        knownBottlenecks: 'Large JavaScript bundle, unoptimized images'
      },
      reasoning: [
        'Analyze Core Web Vitals against target metrics',
        'Identify bundle size impact on LCP and loading performance',
        'Examine image optimization opportunities for LCP improvement',
        'Consider code splitting to reduce initial bundle size',
        'Review component lazy loading for non-critical features',
        'Assess caching strategies for repeat visits'
      ],
      output: 'Comprehensive optimization plan with specific techniques and expected metrics...'
    }
  ],
  confidenceFactors: [
    'Quality and accuracy of performance metrics',
    'Understanding of user behavior and critical paths',
    'Access to performance monitoring tools',
    'Knowledge of technical architecture',
    'Clarity of performance goals and constraints'
  ],
  qualityChecks: [
    'Optimization recommendations are specific and measurable',
    'Priorities align with business impact and user experience',
    'Implementation plan is realistic and phased',
    'Monitoring strategy enables continuous optimization',
    'Performance goals are achievable with proposed changes'
  ]
};

/**
 * All Chain-of-Thought Prompts
 */
export const COT_PROMPTS: Record<string, ChainOfThoughtPrompt> = {
  'financial-health-cot': FINANCIAL_HEALTH_COT,
  'tax-optimization-cot': TAX_OPTIMIZATION_COT,
  'business-advisory-cot': BUSINESS_ADVISORY_COT,
  'client-communication-cot': CLIENT_COMMUNICATION_COT,
  'code-generation-cot': CODE_GENERATION_COT,
  'code-review-cot': CODE_REVIEW_COT,
  'debugging-cot': DEBUGGING_COT,
  'performance-optimization-cot': PERFORMANCE_OPTIMIZATION_COT
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