#!/usr/bin/env node

/**
 * Agent Orchestration Router
 *
 * Enhanced routing that integrates the Execution Orchestrator for multi-agent workflows
 * with intelligent communication, handoffs, and learning capabilities.
 */

const path = require('path');
const AgentSelector = require('./agent-selector');

class AgentOrchestrationRouter {
  constructor() {
    this.agentSelector = new AgentSelector();
    this.orchestrator = null;
    this.orchestratorInitialized = false;
  }

  /**
   * Initialize the orchestrator (lazy loading)
   */
  async initializeOrchestrator() {
    if (this.orchestratorInitialized) return;

    try {
      const { ExecutionOrchestrator } = require('../orchestration/execution-orchestrator');
      this.orchestrator = new ExecutionOrchestrator();
      await this.orchestrator.initialize();
      this.orchestratorInitialized = true;
      console.log('✅ Agent Orchestration Router initialized with full communication capabilities');
    } catch (error) {
      console.error('Failed to initialize orchestrator:', error.message);
      console.warn('⚠️  Falling back to single-agent routing');
    }
  }

  /**
   * Route a request to appropriate agent(s) with orchestration support
   *
   * @param {string} userRequest - The user's request
   * @param {Object} options - Routing options
   * @param {string} [options.filePath] - Optional file context
   * @param {boolean} [options.forceOrchestration] - Force orchestration even for single agent
   * @param {boolean} [options.disableOrchestration] - Disable orchestration
   * @returns {Promise<Object>} Routing result
   */
  async route(userRequest, options = {}) {
    const { filePath, forceOrchestration, disableOrchestration } = options;

    // Get agent selection recommendation
    const selection = this.agentSelector.selectAgent(userRequest, filePath);

    // Determine if orchestration should be used
    const shouldUseOrchestration = this.shouldUseOrchestration(selection, options);

    if (shouldUseOrchestration && !disableOrchestration) {
      // Use full orchestration
      await this.initializeOrchestrator();

      if (this.orchestrator) {
        console.log(`🎯 Using orchestrated execution for: ${selection.type}`);

        const result = await this.orchestrator.executeRequest(userRequest, {
          selection,
          filePath
        });

        return {
          mode: 'orchestrated',
          selection,
          result,
          dashboard: result.dashboard,
          logs: result.logFile,
          report: result.report
        };
      }
    }

    // Fall back to single agent routing
    console.log(`🤖 Using single-agent routing: ${selection.agent}`);

    return {
      mode: 'single-agent',
      selection,
      recommendation: 'Execute with Task tool or direct agent invocation'
    };
  }

  /**
   * Determine if orchestration should be used
   *
   * @param {Object} selection - Agent selection from AgentSelector
   * @param {Object} options - Routing options
   * @returns {boolean} Whether to use orchestration
   */
  shouldUseOrchestration(selection, options) {
    // Force orchestration if requested
    if (options.forceOrchestration) return true;

    // Explicitly disabled
    if (options.disableOrchestration) return false;

    // Multi-agent workflows always use orchestration
    if (selection.type === 'multi-agent-workflow') {
      return true;
    }

    // Single agent with supporting agents
    if (selection.supportingAgents && selection.supportingAgents.length > 0) {
      return true;
    }

    // Complex requests benefit from orchestration
    const complexityIndicators = [
      'build feature',
      'implement',
      'create and test',
      'with documentation',
      'with security',
      'end-to-end',
      'complete workflow',
      'fix and test',
      'review and'
    ];

    const requestLower = selection.userRequest?.toLowerCase() || '';
    const hasComplexityIndicator = complexityIndicators.some(indicator =>
      requestLower.includes(indicator)
    );

    return hasComplexityIndicator;
  }

  /**
   * Get routing recommendation without execution
   *
   * @param {string} userRequest - User's request
   * @param {Object} options - Options
   * @returns {Object} Routing recommendation
   */
  getRoutingRecommendation(userRequest, options = {}) {
    const selection = this.agentSelector.selectAgent(userRequest, options.filePath);
    const shouldOrchestrate = this.shouldUseOrchestration(selection, options);

    return {
      selection,
      recommendedMode: shouldOrchestrate ? 'orchestrated' : 'single-agent',
      reason: this.getReasonForMode(selection, shouldOrchestrate),
      benefits: this.getOrchestrationBenefits(shouldOrchestrate, selection)
    };
  }

  /**
   * Get reason for routing mode
   */
  getReasonForMode(selection, shouldOrchestrate) {
    if (shouldOrchestrate) {
      if (selection.type === 'multi-agent-workflow') {
        return `Multi-agent workflow detected: ${selection.workflow}`;
      }
      if (selection.supportingAgents?.length > 0) {
        return `Multiple agents required: ${selection.agent} with support from ${selection.supportingAgents.join(', ')}`;
      }
      return 'Complex request benefits from orchestrated execution with communication and handoffs';
    }

    return 'Simple request can be handled by single agent';
  }

  /**
   * Get orchestration benefits
   */
  getOrchestrationBenefits(shouldOrchestrate, selection) {
    if (!shouldOrchestrate) {
      return ['Fast single-agent execution'];
    }

    return [
      'Inter-agent communication for better coordination',
      'Automatic handoffs with full context transfer',
      'Real-time execution dashboard',
      'Complete audit trail logging',
      'Learning from execution for future improvements',
      selection.type === 'multi-agent-workflow'
        ? `Parallel execution where possible (estimated ${selection.agents?.length || 0} agents)`
        : 'Supporting agents can validate and enhance results'
    ];
  }

  /**
   * Execute with automatic routing
   *
   * @param {string} userRequest - User's request
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async execute(userRequest, options = {}) {
    return await this.route(userRequest, options);
  }

  /**
   * Get orchestrator statistics
   */
  getStatistics() {
    if (!this.orchestrator) {
      return {
        orchestratorAvailable: false,
        message: 'Orchestrator not initialized'
      };
    }

    return {
      orchestratorAvailable: true,
      ...this.orchestrator.getStatistics()
    };
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    if (this.orchestrator) {
      await this.orchestrator.shutdown();
    }
  }
}

// CLI interface
if (require.main === module) {
  const router = new AgentOrchestrationRouter();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node agent-orchestration-router.js "<user request>" [--file=path] [--force-orchestration] [--recommendation-only]');
    console.log('\nExamples:');
    console.log('  node agent-orchestration-router.js "Fix security vulnerability"');
    console.log('  node agent-orchestration-router.js "Build new feature" --force-orchestration');
    console.log('  node agent-orchestration-router.js "Optimize query" --recommendation-only');
    process.exit(0);
  }

  const userRequest = args[0];
  const options = {
    filePath: args.find(a => a.startsWith('--file='))?.split('=')[1],
    forceOrchestration: args.includes('--force-orchestration'),
    disableOrchestration: args.includes('--disable-orchestration')
  };

  const recommendationOnly = args.includes('--recommendation-only');

  (async () => {
    try {
      if (recommendationOnly) {
        const recommendation = router.getRoutingRecommendation(userRequest, options);
        console.log('\n📋 Routing Recommendation:');
        console.log('─'.repeat(70));
        console.log(`User Request: ${userRequest}`);
        console.log(`Recommended Mode: ${recommendation.recommendedMode}`);
        console.log(`Primary Agent: ${recommendation.selection.agent}`);
        if (recommendation.selection.supportingAgents?.length > 0) {
          console.log(`Supporting Agents: ${recommendation.selection.supportingAgents.join(', ')}`);
        }
        console.log(`Confidence: ${recommendation.selection.confidence}%`);
        console.log(`\nReason: ${recommendation.reason}`);
        console.log('\nBenefits:');
        recommendation.benefits.forEach(benefit => console.log(`  • ${benefit}`));
        console.log('─'.repeat(70));
      } else {
        console.log('\n🚀 Routing request...\n');
        const result = await router.execute(userRequest, options);

        console.log('\n📊 Execution Result:');
        console.log('─'.repeat(70));
        console.log(`Mode: ${result.mode}`);
        console.log(`Agent: ${result.selection.agent}`);

        if (result.mode === 'orchestrated') {
          console.log(`\n✅ Orchestrated execution completed!`);
          console.log(`Dashboard: ${result.dashboard}`);
          console.log(`Logs: ${result.logs}`);
          console.log(`Duration: ${result.report.totalDuration}ms`);
          console.log(`Agents Used: ${result.report.agentsUsed.join(', ')}`);
        } else {
          console.log(`\nRecommendation: ${result.recommendation}`);
        }
        console.log('─'.repeat(70));

        await router.shutdown();
      }
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = AgentOrchestrationRouter;