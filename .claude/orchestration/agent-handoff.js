/**
 * Agent Handoff System
 *
 * Manages seamless context transfer between agents in multi-step workflows.
 * Ensures no information loss and enables intelligent agent chaining.
 */

const { ProtocolHelpers, MessageTypes } = require('./communication-protocols');

/**
 * Agent Handoff System
 */
class AgentHandoffSystem {
  constructor(communicationBus, runtimeLogger) {
    this.communicationBus = communicationBus;
    this.logger = runtimeLogger;
    this.pendingHandoffs = new Map();
    this.handoffHistory = [];
  }

  /**
   * Initiate handoff from one agent to another
   */
  async initiateHandoff(fromAgent, toAgent, context) {
    const handoffPackage = {
      sessionId: this.logger.sessionId,
      timestamp: Date.now(),
      from: fromAgent,
      to: toAgent,

      // Complete context transfer
      executionContext: {
        task: context.task || 'Continue workflow',
        filesModified: context.outputs?.filesModified || [],
        filesRead: context.outputs?.filesRead || [],
        searchResults: context.outputs?.searchResults || [],
        decisions: context.decisions || [],
        warnings: context.warnings || [],
        discoveries: context.discoveries || []
      },

      // MCP data transfer
      mcpData: await this.fetchMCPData(fromAgent, context),

      // Agent-specific recommendations
      recommendations: {
        nextActions: context.recommendations?.nextActions || [],
        potentialIssues: context.recommendations?.potentialIssues || [],
        optimizations: context.recommendations?.optimizations || [],
        testingNeeded: context.recommendations?.testingNeeded || false,
        securityReview: context.recommendations?.securityReview || false
      },

      // Communication preferences
      urgency: context.urgency || 'normal',
      requiresValidation: context.requiresValidation || false,
      blockingIssues: context.blockingIssues || [],

      // Dependencies
      dependencies: {
        completedTasks: context.completedTasks || [],
        requiredInputs: context.requiredInputs || [],
        optionalInputs: context.optionalInputs || []
      }
    };

    // Validate handoff package
    const validation = this.validateHandoff(handoffPackage);
    if (!validation.valid) {
      console.error('Invalid handoff package:', validation.errors);
      throw new Error(`Handoff validation failed: ${validation.errors.join(', ')}`);
    }

    // Log handoff
    await this.logger.logHandoff(handoffPackage);

    // Send via communication bus
    const message = ProtocolHelpers.createHandoff(
      fromAgent,
      toAgent,
      handoffPackage.executionContext.task,
      handoffPackage.executionContext,
      handoffPackage.recommendations
    );

    // Add full handoff package to message for recipient
    message.payload.handoffPackage = handoffPackage;

    await this.communicationBus.sendMessage(fromAgent, toAgent, message);

    // Store pending handoff
    this.pendingHandoffs.set(toAgent, handoffPackage);

    // Add to history
    this.handoffHistory.push({
      from: fromAgent,
      to: toAgent,
      timestamp: Date.now(),
      success: true
    });

    // Persist handoff pattern for learning
    await this.persistHandoffPattern(handoffPackage);

    console.log(`🤝 Handoff initiated: ${fromAgent} → ${toAgent}`);

    return handoffPackage;
  }

  /**
   * Receive handoff as target agent
   */
  async receiveHandoff(toAgent, handoffPackage) {
    // Validate handoff package
    const validation = this.validateHandoff(handoffPackage);

    if (!validation.valid) {
      console.error('Invalid handoff received:', validation.errors);

      // Request clarification
      await this.requestClarification(toAgent, handoffPackage.from, validation.issues);

      return null;
    }

    // Check for blocking issues
    if (handoffPackage.blockingIssues.length > 0) {
      console.warn(`⚠️ Blocking issues detected in handoff to ${toAgent}:`, handoffPackage.blockingIssues);

      // Send warning back to sender
      await this.communicationBus.sendMessage(toAgent, handoffPackage.from, {
        type: MessageTypes.WARNING,
        priority: 'high',
        payload: {
          message: 'Blocking issues detected',
          issues: handoffPackage.blockingIssues
        }
      });
    }

    // Prepare agent context with inherited data
    const agentContext = {
      inheritedContext: handoffPackage.executionContext,
      mcpData: handoffPackage.mcpData,
      recommendations: handoffPackage.recommendations,
      predecessorAgent: handoffPackage.from,
      handoffTimestamp: handoffPackage.timestamp,
      dependencies: handoffPackage.dependencies
    };

    // Remove from pending
    this.pendingHandoffs.delete(toAgent);

    // Log receipt
    await this.logger.logHandoffReceived(toAgent, handoffPackage);

    console.log(`✅ Handoff received by ${toAgent} from ${handoffPackage.from}`);

    return agentContext;
  }

  /**
   * Request clarification from sender
   */
  async requestClarification(fromAgent, toAgent, issues) {
    console.log(`❓ Requesting clarification from ${toAgent}`);

    await this.communicationBus.sendMessage(fromAgent, toAgent, {
      type: MessageTypes.ASSISTANCE_REQUEST,
      priority: 'high',
      payload: {
        capability: 'clarification',
        context: {
          issues,
          message: 'Handoff requires clarification'
        },
        urgency: 'immediate'
      }
    });
  }

  /**
   * Validate handoff package
   */
  validateHandoff(handoffPackage) {
    const errors = [];

    // Required fields
    if (!handoffPackage.from) errors.push('Missing sender agent');
    if (!handoffPackage.to) errors.push('Missing recipient agent');
    if (!handoffPackage.executionContext) errors.push('Missing execution context');

    // Context validation
    if (handoffPackage.executionContext) {
      if (!handoffPackage.executionContext.task) {
        errors.push('Missing task description');
      }
    }

    // Recommendations validation
    if (handoffPackage.recommendations) {
      if (!Array.isArray(handoffPackage.recommendations.nextActions)) {
        errors.push('Invalid nextActions format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Fetch MCP data for handoff
   */
  async fetchMCPData(fromAgent, context) {
    const mcpData = {};

    // Fetch PostgreSQL MCP data if available
    if (context.requiresDatabase) {
      const postgresData = this.communicationBus.sharedMemory.getMCPData(fromAgent, 'PostgreSQL MCP');
      if (postgresData) {
        mcpData.postgresQueries = postgresData.data;
      }
    }

    // Fetch Memory Bank MCP data
    const memoryBankData = this.communicationBus.sharedMemory.getMCPData(fromAgent, 'Memory Bank MCP');
    if (memoryBankData) {
      mcpData.memoryBankContext = memoryBankData.data;
    }

    // Fetch GitHub MCP data if available
    if (context.requiresGit) {
      const githubData = this.communicationBus.sharedMemory.getMCPData(fromAgent, 'GitHub MCP');
      if (githubData) {
        mcpData.githubContext = githubData.data;
      }
    }

    return mcpData;
  }

  /**
   * Persist handoff pattern for learning
   */
  async persistHandoffPattern(handoffPackage) {
    const pattern = {
      fromAgent: handoffPackage.from,
      toAgent: handoffPackage.to,
      context: handoffPackage.executionContext.task,
      timestamp: handoffPackage.timestamp,
      success: true,
      filesInvolved: handoffPackage.executionContext.filesModified.length,
      recommendations: handoffPackage.recommendations.nextActions.length
    };

    // Store in shared memory for learning system
    const key = `handoff_pattern:${handoffPackage.from}->${handoffPackage.to}`;
    this.communicationBus.sharedMemory.set(key, pattern, 24 * 60 * 60 * 1000); // 24 hour TTL
  }

  /**
   * Get handoff statistics
   */
  getStatistics() {
    const stats = {
      totalHandoffs: this.handoffHistory.length,
      successfulHandoffs: this.handoffHistory.filter(h => h.success).length,
      pendingHandoffs: this.pendingHandoffs.size,
      handoffsByAgent: {}
    };

    // Count handoffs by agent
    for (const handoff of this.handoffHistory) {
      if (!stats.handoffsByAgent[handoff.from]) {
        stats.handoffsByAgent[handoff.from] = { sent: 0, received: 0 };
      }
      if (!stats.handoffsByAgent[handoff.to]) {
        stats.handoffsByAgent[handoff.to] = { sent: 0, received: 0 };
      }

      stats.handoffsByAgent[handoff.from].sent++;
      stats.handoffsByAgent[handoff.to].received++;
    }

    return stats;
  }

  /**
   * Get pending handoff for agent
   */
  getPendingHandoff(agentName) {
    return this.pendingHandoffs.get(agentName) || null;
  }

  /**
   * Clear completed handoffs
   */
  clearCompletedHandoffs() {
    this.pendingHandoffs.clear();
  }

  /**
   * Get handoff history
   */
  getHandoffHistory(options = {}) {
    let history = [...this.handoffHistory];

    if (options.fromAgent) {
      history = history.filter(h => h.from === options.fromAgent);
    }

    if (options.toAgent) {
      history = history.filter(h => h.to === options.toAgent);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Analyze handoff patterns
   */
  analyzeHandoffPatterns() {
    const patterns = {};

    for (const handoff of this.handoffHistory) {
      const key = `${handoff.from}->${handoff.to}`;

      if (!patterns[key]) {
        patterns[key] = {
          count: 0,
          avgDuration: 0,
          successRate: 0,
          lastUsed: null
        };
      }

      patterns[key].count++;
      patterns[key].lastUsed = handoff.timestamp;
    }

    return patterns;
  }

  /**
   * Recommend next agent based on handoff history
   */
  recommendNextAgent(fromAgent, context) {
    const patterns = this.analyzeHandoffPatterns();
    const candidates = [];

    // Find agents that commonly follow fromAgent
    for (const [key, pattern] of Object.entries(patterns)) {
      if (key.startsWith(`${fromAgent}->`)) {
        const toAgent = key.split('->')[1];
        candidates.push({
          agent: toAgent,
          confidence: Math.min(95, pattern.count * 10), // Max 95% confidence
          reason: `Commonly follows ${fromAgent} (${pattern.count} times)`
        });
      }
    }

    // Sort by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Create handoff chain for workflow
   */
  async createHandoffChain(workflow) {
    const chain = [];

    for (let i = 0; i < workflow.agents.length - 1; i++) {
      const fromAgent = workflow.agents[i];
      const toAgent = workflow.agents[i + 1];

      chain.push({
        from: fromAgent,
        to: toAgent,
        task: workflow.tasks[i + 1],
        context: workflow.context
      });
    }

    return chain;
  }

  /**
   * Execute handoff chain
   */
  async executeHandoffChain(chain) {
    const results = [];

    for (const handoff of chain) {
      const result = await this.initiateHandoff(
        handoff.from,
        handoff.to,
        handoff.context
      );

      results.push(result);

      // Wait for agent to process (in real implementation)
      // await this.waitForAgentCompletion(handoff.to);
    }

    return results;
  }
}

module.exports = { AgentHandoffSystem };