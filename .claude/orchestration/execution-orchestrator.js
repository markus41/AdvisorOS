/**
 * Execution Orchestrator
 *
 * Central orchestration system that integrates all agent communication,
 * runtime logging, handoffs, and learning systems for intelligent workflow execution.
 */

const { AgentCommunicationBus } = require('./agent-communication-bus');
const { RuntimeLogger } = require('./runtime-logger');
const { ExecutionDashboard } = require('./execution-dashboard');
const { AgentHandoffSystem } = require('./agent-handoff');
const { AgentLearningSystem } = require('./agent-learning-system');
const { AgentCapabilities } = require('./communication-protocols');

/**
 * Execution Orchestrator Class
 */
class ExecutionOrchestrator {
  constructor(options = {}) {
    // Initialize all subsystems
    this.communicationBus = new AgentCommunicationBus(options.communicationBus);
    this.runtimeLogger = new RuntimeLogger(options.logger);
    this.dashboard = null; // Initialized per execution
    this.handoffSystem = null; // Initialized after communication bus
    this.learningSystem = null; // Initialized after communication bus

    this.options = options;
    this.currentExecution = null;
  }

  /**
   * Initialize orchestrator
   */
  async initialize() {
    console.log('🚀 Initializing Execution Orchestrator...');

    // Initialize communication bus
    await this.communicationBus.initialize();

    // Initialize subsystems that depend on communication bus
    this.handoffSystem = new AgentHandoffSystem(this.communicationBus, this.runtimeLogger);
    this.learningSystem = new AgentLearningSystem(this.communicationBus);

    // Register all available agents
    await this.registerAllAgents();

    console.log('✅ Execution Orchestrator initialized');
  }

  /**
   * Register all available agents
   */
  async registerAllAgents() {
    const agents = [
      { name: 'backend-api-developer', capabilities: [AgentCapabilities.BACKEND_DEVELOPMENT, AgentCapabilities.DATABASE_OPTIMIZATION] },
      { name: 'frontend-builder', capabilities: [AgentCapabilities.FRONTEND_DEVELOPMENT] },
      { name: 'database-optimizer', capabilities: [AgentCapabilities.DATABASE_OPTIMIZATION, AgentCapabilities.PERFORMANCE] },
      { name: 'security-auditor', capabilities: [AgentCapabilities.SECURITY_AUDIT] },
      { name: 'test-suite-developer', capabilities: [AgentCapabilities.TESTING] },
      { name: 'docs-writer', capabilities: [AgentCapabilities.DOCUMENTATION] },
      { name: 'ai-features-orchestrator', capabilities: [AgentCapabilities.AI_INTEGRATION] },
      { name: 'devops-azure-specialist', capabilities: [AgentCapabilities.DEVOPS] },
      { name: 'cpa-tax-compliance', capabilities: [AgentCapabilities.CPA_COMPLIANCE] },
      { name: 'architecture-designer', capabilities: [AgentCapabilities.ARCHITECTURE, AgentCapabilities.DATABASE_OPTIMIZATION] },
      { name: 'performance-optimization-specialist', capabilities: [AgentCapabilities.PERFORMANCE] }
    ];

    for (const agent of agents) {
      this.communicationBus.registerAgent(agent.name, agent.capabilities);
    }
  }

  /**
   * Execute a user request with full orchestration
   */
  async executeRequest(userRequest, options = {}) {
    console.log('\n🎯 Starting orchestrated execution...');
    console.log(`📝 Request: ${userRequest}\n`);

    try {
      // Step 1: Analyze request
      const analysis = await this.analyzeRequest(userRequest);
      console.log(`🔍 Analysis complete: ${analysis.agents.length} agents required`);

      // Step 2: Build execution plan
      const plan = await this.buildExecutionPlan(analysis);
      console.log(`📋 Execution plan: ${plan.parallelPhases.length} phases\n`);

      // Step 3: Initialize logging and dashboard
      const sessionId = await this.runtimeLogger.startExecution(userRequest, plan);
      this.dashboard = new ExecutionDashboard(this.runtimeLogger);
      await this.dashboard.initialize();

      this.currentExecution = {
        sessionId,
        userRequest,
        plan,
        startTime: Date.now(),
        results: []
      };

      // Step 4: Execute plan with full communication
      const results = await this.executePlan(plan);

      // Step 5: Generate final report
      const executionReport = await this.runtimeLogger.generateExecutionReport();

      // Step 6: Finalize dashboard
      await this.dashboard.finalize(executionReport);

      // Step 7: Learn from execution
      await this.recordLearnings(results, executionReport);

      console.log('\n✅ Execution completed successfully!\n');
      console.log(`📊 Dashboard: ${this.dashboard.dashboardPath}`);
      console.log(`📄 Logs: ${this.runtimeLogger.liveLogPath}`);
      console.log(`⏱️  Duration: ${executionReport.totalDuration}ms`);
      console.log(`🤝 Agent Messages: ${executionReport.agentMessagesTotal}`);
      console.log(`⚡ Parallel Execution: ${executionReport.parallelExecutionPercentage}%\n`);

      return {
        success: true,
        sessionId,
        results,
        report: executionReport,
        logFile: this.runtimeLogger.liveLogPath,
        dashboard: this.dashboard.dashboardPath
      };

    } catch (error) {
      console.error('❌ Execution failed:', error);

      return {
        success: false,
        error: error.message,
        sessionId: this.currentExecution?.sessionId
      };
    }
  }

  /**
   * Analyze request to determine agents and workflow
   */
  async analyzeRequest(userRequest) {
    // Simple analysis - in production, this would use more sophisticated routing
    const analysis = {
      userRequest,
      agents: [],
      taskType: 'general',
      complexity: 'medium',
      requiresParallel: false,
      mcpServers: [],
      estimatedDuration: 0
    };

    // Detect task type and agents (simplified)
    const lowerRequest = userRequest.toLowerCase();

    if (lowerRequest.includes('security') || lowerRequest.includes('vulnerability')) {
      analysis.agents.push('security-auditor');
      analysis.taskType = 'security';
      analysis.mcpServers.push('PostgreSQL MCP');
    }

    if (lowerRequest.includes('api') || lowerRequest.includes('endpoint') || lowerRequest.includes('backend')) {
      analysis.agents.push('backend-api-developer');
      analysis.mcpServers.push('PostgreSQL MCP', 'GitHub MCP');
    }

    if (lowerRequest.includes('database') || lowerRequest.includes('query') || lowerRequest.includes('schema')) {
      analysis.agents.push('database-optimizer');
      analysis.mcpServers.push('PostgreSQL MCP');
    }

    if (lowerRequest.includes('ui') || lowerRequest.includes('component') || lowerRequest.includes('frontend')) {
      analysis.agents.push('frontend-builder');
    }

    if (lowerRequest.includes('test')) {
      analysis.agents.push('test-suite-developer');
    }

    if (lowerRequest.includes('document') || lowerRequest.includes('docs')) {
      analysis.agents.push('docs-writer');
    }

    // Default to architecture designer if no specific agents
    if (analysis.agents.length === 0) {
      analysis.agents.push('architecture-designer');
    }

    // Add Memory Bank MCP for all executions
    if (!analysis.mcpServers.includes('Memory Bank MCP')) {
      analysis.mcpServers.push('Memory Bank MCP');
    }

    return analysis;
  }

  /**
   * Build execution plan with parallel phases
   */
  async buildExecutionPlan(analysis) {
    const plan = {
      agents: analysis.agents,
      mcpServers: analysis.mcpServers,
      totalTasks: analysis.agents.length,
      parallelPhases: [],
      estimatedDuration: analysis.agents.length * 10000 // Simple estimate: 10s per agent
    };

    // Detect parallelization opportunities
    const parallelizableAgents = this.detectParallelization(analysis.agents);

    if (parallelizableAgents.length > 0) {
      // Create parallel phases
      plan.parallelPhases = parallelizableAgents;
    } else {
      // Sequential execution
      plan.parallelPhases = analysis.agents.map(agent => [{
        agent,
        task: `Execute ${agent}`,
        mcpServers: analysis.mcpServers
      }]);
    }

    return plan;
  }

  /**
   * Detect which agents can run in parallel
   */
  detectParallelization(agents) {
    const phases = [];

    // Simple rule: security-auditor and database-optimizer can run in parallel
    const parallelGroup1 = [];
    const sequentialAgents = [];

    for (const agent of agents) {
      if (agent === 'security-auditor' || agent === 'database-optimizer') {
        parallelGroup1.push({
          agent,
          task: `Execute ${agent}`,
          parallelWith: parallelGroup1.map(a => a.agent)
        });
      } else {
        sequentialAgents.push({
          agent,
          task: `Execute ${agent}`
        });
      }
    }

    // Add parallel group if exists
    if (parallelGroup1.length > 0) {
      phases.push(parallelGroup1);
    }

    // Add sequential agents
    for (const agentTask of sequentialAgents) {
      phases.push([agentTask]);
    }

    return phases;
  }

  /**
   * Execute plan with communication and handoffs
   */
  async executePlan(plan) {
    const results = [];
    let previousAgentResults = null;

    for (let phaseIndex = 0; phaseIndex < plan.parallelPhases.length; phaseIndex++) {
      const phase = plan.parallelPhases[phaseIndex];

      console.log(`\n📍 Phase ${phaseIndex + 1}/${plan.parallelPhases.length}`);

      if (phase.length > 1) {
        console.log(`   Running ${phase.length} agents in parallel: ${phase.map(t => t.agent).join(', ')}`);
      } else {
        console.log(`   Running agent: ${phase[0].agent}`);
      }

      // Execute all agents in phase concurrently
      const phaseResults = await Promise.all(
        phase.map(task => this.executeAgent(task, previousAgentResults))
      );

      results.push(...phaseResults);

      // Update previous results for next phase
      previousAgentResults = phaseResults;

      // Handle handoffs for next phase
      if (phaseIndex < plan.parallelPhases.length - 1) {
        await this.handlePhaseHandoffs(phaseResults, plan.parallelPhases[phaseIndex + 1]);
      }
    }

    return results;
  }

  /**
   * Execute a single agent with full communication
   */
  async executeAgent(task, previousResults = null) {
    const agentName = task.agent;

    // Query learnings before execution
    const learnings = await this.learningSystem.queryLearnings(agentName, {
      taskType: task.task,
      previousResults: previousResults ? 'yes' : 'no'
    });

    console.log(`   🤖 ${agentName}: ${learnings.confidenceScore}% confidence`);

    if (learnings.estimatedDuration) {
      console.log(`      ⏱️  Estimated: ${learnings.estimatedDuration.estimated}ms`);
    }

    // Prepare agent context
    const agentContext = {
      task: task.task,
      learnings,
      previousResults,
      communicationBus: this.communicationBus,
      logger: this.runtimeLogger,
      handoffSystem: this.handoffSystem,
      mcpServers: task.mcpServers || []
    };

    // Check for pending handoff
    const pendingHandoff = this.handoffSystem.getPendingHandoff(agentName);
    if (pendingHandoff) {
      const handoffContext = await this.handoffSystem.receiveHandoff(agentName, pendingHandoff);
      agentContext.inheritedContext = handoffContext;
    }

    // Log agent start
    await this.runtimeLogger.logAgentStart(agentName, task.task, {
      mcpServers: agentContext.mcpServers,
      parallelAgents: task.parallelWith || [],
      inheritedContext: agentContext.inheritedContext
    });

    // Update dashboard
    await this.dashboard.update({
      type: 'AGENT_START',
      agent: agentName,
      task: task.task,
      timestamp: Date.now(),
      context: {
        mcpServers: agentContext.mcpServers,
        parallelWith: task.parallelWith || []
      }
    });

    // Simulate agent execution (in real implementation, this would call actual agent)
    const executionStart = Date.now();
    const result = await this.simulateAgentExecution(agentName, agentContext);
    const executionDuration = Date.now() - executionStart;

    result.duration = executionDuration;

    // Log agent completion
    await this.runtimeLogger.logAgentComplete(agentName, result.outputs, result.recommendations);

    // Update dashboard
    await this.dashboard.update({
      type: 'AGENT_COMPLETE',
      agent: agentName,
      duration: executionDuration,
      timestamp: Date.now(),
      outputs: result.outputs,
      recommendations: result.recommendations
    });

    // Record execution for learning
    await this.learningSystem.recordAgentExecution(agentName, {
      sessionId: this.currentExecution.sessionId,
      userRequest: this.currentExecution.userRequest,
      taskType: task.task,
      duration: executionDuration,
      toolSequence: result.toolSequence || [],
      mcpUsage: result.mcpUsage || {},
      filesModified: result.outputs.filesModified || [],
      success: true,
      qualityScore: 85
    });

    console.log(`   ✅ ${agentName} completed (${executionDuration}ms)`);

    return result;
  }

  /**
   * Simulate agent execution (placeholder for actual agent execution)
   */
  async simulateAgentExecution(agentName, context) {
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate tool calls
    await this.runtimeLogger.logToolCall(agentName, 'Read', { file: 'example.ts' }, {
      success: true,
      duration: 100
    });

    await this.dashboard.update({
      type: 'TOOL_CALL',
      agent: agentName,
      tool: 'Read',
      timestamp: Date.now(),
      result: { success: true, duration: 100 }
    });

    // Generate simulated outputs
    const result = {
      agent: agentName,
      outputs: {
        filesModified: ['src/example.ts'],
        filesRead: ['src/example.ts', 'src/types.ts'],
        testsGenerated: agentName === 'test-suite-developer',
        securityIssuesFound: agentName === 'security-auditor' ? 2 : 0
      },
      recommendations: {
        nextAgents: this.getRecommendedNextAgents(agentName),
        optimizations: ['Consider caching', 'Add error handling'],
        warnings: []
      },
      toolSequence: ['Read', 'Edit', 'Write'],
      mcpUsage: context.mcpServers.reduce((obj, server) => {
        obj[server] = true;
        return obj;
      }, {})
    };

    return result;
  }

  /**
   * Get recommended next agents based on current agent
   */
  getRecommendedNextAgents(currentAgent) {
    const recommendations = {
      'security-auditor': ['backend-api-developer'],
      'backend-api-developer': ['test-suite-developer', 'docs-writer'],
      'database-optimizer': ['backend-api-developer'],
      'frontend-builder': ['test-suite-developer'],
      'architecture-designer': ['database-optimizer', 'backend-api-developer']
    };

    return recommendations[currentAgent] || [];
  }

  /**
   * Handle handoffs between phases
   */
  async handlePhaseHandoffs(phaseResults, nextPhase) {
    for (const result of phaseResults) {
      if (result.recommendations.nextAgents.length > 0) {
        for (const nextAgent of result.recommendations.nextAgents) {
          // Check if next agent is in the next phase
          const isInNextPhase = nextPhase.some(task => task.agent === nextAgent);

          if (isInNextPhase) {
            await this.handoffSystem.initiateHandoff(result.agent, nextAgent, {
              task: `Continue from ${result.agent}`,
              outputs: result.outputs,
              recommendations: result.recommendations,
              urgency: 'normal'
            });
          }
        }
      }
    }
  }

  /**
   * Record learnings from execution
   */
  async recordLearnings(results, executionReport) {
    // Extract patterns from successful execution
    const patterns = [];

    // Agent sequence pattern
    const agentSequence = results.map(r => r.agent);
    patterns.push({
      type: 'agent_sequence',
      pattern: agentSequence.join(' → '),
      context: this.currentExecution.userRequest,
      confidence: 85
    });

    // Share discoveries
    for (const pattern of patterns) {
      await this.learningSystem.shareDiscovery('orchestrator', {
        pattern: {
          id: pattern.type,
          name: pattern.pattern,
          type: pattern.type
        },
        context: pattern.context,
        confidence: pattern.confidence,
        applicableTo: ['all']
      });
    }

    // Update dashboard with learned patterns
    await this.dashboard.updateLearnedPatterns(executionReport.learnedPatterns);
  }

  /**
   * Get orchestrator statistics
   */
  getStatistics() {
    return {
      communication: this.communicationBus.getStatistics(),
      handoffs: this.handoffSystem.getStatistics(),
      learning: this.learningSystem.getStatistics()
    };
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    console.log('🛑 Shutting down Execution Orchestrator...');

    await this.communicationBus.shutdown();

    console.log('✅ Execution Orchestrator shut down');
  }
}

module.exports = { ExecutionOrchestrator };