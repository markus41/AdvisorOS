/**
 * Agent Learning System
 *
 * Enables agents to learn from past executions and share knowledge.
 * Integrates with Memory Bank MCP for persistent learning storage.
 */

const { ProtocolHelpers, MessageTypes } = require('./communication-protocols');

/**
 * Agent Learning System
 */
class AgentLearningSystem {
  constructor(communicationBus) {
    this.communicationBus = communicationBus;
    this.patternLibrary = new Map();
    this.executionHistory = [];
    this.learningCache = new Map();
  }

  /**
   * Record agent execution for learning
   */
  async recordAgentExecution(agentName, execution) {
    const learningData = {
      agent: agentName,
      timestamp: Date.now(),
      sessionId: execution.sessionId,

      // What worked well
      successPatterns: {
        toolSequence: execution.toolSequence || [],
        parallelExecutions: execution.parallelExecutions || [],
        mcpUsage: execution.mcpUsage || {},
        duration: execution.duration || 0,
        filesModified: execution.filesModified || [],
        efficientApproaches: execution.efficientApproaches || []
      },

      // What didn't work
      failures: {
        errors: execution.errors || [],
        bottlenecks: execution.bottlenecks || [],
        missedOptimizations: execution.missedOptimizations || [],
        slowOperations: execution.slowOperations || []
      },

      // Discoveries
      discoveries: {
        newPatterns: execution.discoveredPatterns || [],
        codePatterns: execution.codePatterns || [],
        securityIssues: execution.securityIssues || [],
        optimizationOpportunities: execution.optimizationOpportunities || []
      },

      // Agent communication
      collaboration: {
        messagesReceived: execution.messagesReceived || 0,
        messagesSent: execution.messagesSent || 0,
        assistanceRequests: execution.assistanceRequests || 0,
        handoffs: execution.handoffs || [],
        collaborators: execution.collaborators || []
      },

      // Context
      context: {
        userRequest: execution.userRequest || '',
        taskType: execution.taskType || 'unknown',
        complexity: execution.complexity || 'medium',
        filesInvolved: execution.filesInvolved || [],
        technologiesUsed: execution.technologiesUsed || []
      },

      // Outcomes
      outcomes: {
        success: execution.success !== false,
        qualityScore: execution.qualityScore || 0,
        userSatisfaction: execution.userSatisfaction || null,
        requiresRework: execution.requiresRework || false
      }
    };

    // Store in memory
    this.executionHistory.push(learningData);

    // Trim history to last 100 executions per agent
    this.trimExecutionHistory(agentName, 100);

    // Store in Memory Bank MCP
    await this.storeInMemoryBank(agentName, learningData);

    // Update pattern library
    await this.updatePatternLibrary(learningData);

    // Share learnings with other agents
    await this.broadcastLearnings(agentName, learningData);

    console.log(`🎓 Recorded learning for ${agentName}`);

    return learningData;
  }

  /**
   * Query learnings for an agent
   */
  async queryLearnings(agentName, context) {
    // Check cache first
    const cacheKey = `${agentName}:${JSON.stringify(context)}`;
    if (this.learningCache.has(cacheKey)) {
      return this.learningCache.get(cacheKey);
    }

    // Retrieve relevant past executions
    const similarExecutions = this.findSimilarExecutions(agentName, context);

    const learnings = {
      recommendedApproach: this.synthesizeRecommendations(similarExecutions),
      commonPitfalls: this.extractCommonPitfalls(similarExecutions),
      optimizationTips: this.extractOptimizationTips(similarExecutions),
      collaborationPatterns: this.extractCollaborationPatterns(similarExecutions),
      estimatedDuration: this.estimateDuration(similarExecutions),
      confidenceScore: this.calculateConfidence(similarExecutions)
    };

    // Cache for 1 hour
    this.learningCache.set(cacheKey, learnings);
    setTimeout(() => this.learningCache.delete(cacheKey), 3600000);

    return learnings;
  }

  /**
   * Find similar past executions
   */
  findSimilarExecutions(agentName, context, limit = 10) {
    const agentExecutions = this.executionHistory.filter(e => e.agent === agentName);

    // Calculate similarity scores
    const scored = agentExecutions.map(execution => ({
      execution,
      similarity: this.calculateSimilarity(context, execution.context)
    }));

    // Sort by similarity and return top matches
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.execution);
  }

  /**
   * Calculate similarity between contexts
   */
  calculateSimilarity(context1, context2) {
    let score = 0;

    // Task type match
    if (context1.taskType === context2.taskType) score += 30;

    // Complexity match
    if (context1.complexity === context2.complexity) score += 20;

    // File overlap
    const files1 = new Set(context1.filesInvolved || []);
    const files2 = new Set(context2.filesInvolved || []);
    const fileOverlap = [...files1].filter(f => files2.has(f)).length;
    score += Math.min(25, fileOverlap * 5);

    // Technology overlap
    const tech1 = new Set(context1.technologiesUsed || []);
    const tech2 = new Set(context2.technologiesUsed || []);
    const techOverlap = [...tech1].filter(t => tech2.has(t)).length;
    score += Math.min(25, techOverlap * 5);

    return score;
  }

  /**
   * Synthesize recommendations from past executions
   */
  synthesizeRecommendations(executions) {
    if (executions.length === 0) {
      return {
        toolSequence: [],
        mcpServers: [],
        parallelOpportunities: [],
        confidence: 0
      };
    }

    // Find most common successful tool sequences
    const toolSequences = executions
      .filter(e => e.outcomes.success)
      .map(e => e.successPatterns.toolSequence);

    const mostCommonSequence = this.findMostCommon(toolSequences);

    // Find commonly used MCP servers
    const mcpUsage = executions
      .filter(e => e.outcomes.success)
      .flatMap(e => Object.keys(e.successPatterns.mcpUsage));

    const recommendedMCP = [...new Set(mcpUsage)];

    // Find parallel execution patterns
    const parallelPatterns = executions
      .filter(e => e.outcomes.success)
      .flatMap(e => e.successPatterns.parallelExecutions);

    return {
      toolSequence: mostCommonSequence || [],
      mcpServers: recommendedMCP,
      parallelOpportunities: parallelPatterns,
      confidence: Math.min(95, executions.length * 10)
    };
  }

  /**
   * Extract common pitfalls
   */
  extractCommonPitfalls(executions) {
    const allErrors = executions.flatMap(e => e.failures.errors);
    const allBottlenecks = executions.flatMap(e => e.failures.bottlenecks);

    // Count occurrences
    const errorCounts = {};
    for (const error of allErrors) {
      const key = error.type || error.message || 'unknown';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }

    // Return most common issues
    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({
        issue,
        frequency: count,
        severity: count > executions.length * 0.5 ? 'high' : 'medium'
      }));
  }

  /**
   * Extract optimization tips
   */
  extractOptimizationTips(executions) {
    const tips = [];

    // Analyze successful executions for patterns
    const successfulExecutions = executions.filter(e => e.outcomes.success && e.outcomes.qualityScore > 70);

    if (successfulExecutions.length > 0) {
      // Find common efficient approaches
      const efficientApproaches = successfulExecutions
        .flatMap(e => e.successPatterns.efficientApproaches);

      const uniqueApproaches = [...new Set(efficientApproaches)];

      for (const approach of uniqueApproaches) {
        tips.push({
          type: 'efficient_approach',
          tip: approach,
          confidence: Math.round((efficientApproaches.filter(a => a === approach).length / successfulExecutions.length) * 100)
        });
      }

      // Analyze MCP usage effectiveness
      const avgDurationWithMCP = this.calculateAvgDuration(
        successfulExecutions.filter(e => Object.keys(e.successPatterns.mcpUsage).length > 0)
      );

      const avgDurationWithoutMCP = this.calculateAvgDuration(
        successfulExecutions.filter(e => Object.keys(e.successPatterns.mcpUsage).length === 0)
      );

      if (avgDurationWithMCP < avgDurationWithoutMCP * 0.8) {
        tips.push({
          type: 'mcp_usage',
          tip: 'Using MCP servers reduces execution time by ~20%',
          confidence: 80
        });
      }
    }

    return tips;
  }

  /**
   * Extract collaboration patterns
   */
  extractCollaborationPatterns(executions) {
    const patterns = {
      frequentCollaborators: {},
      effectiveHandoffs: [],
      communicationEfficiency: 0
    };

    for (const execution of executions) {
      // Track collaborators
      for (const collaborator of execution.collaboration.collaborators) {
        patterns.frequentCollaborators[collaborator] =
          (patterns.frequentCollaborators[collaborator] || 0) + 1;
      }

      // Track effective handoffs
      if (execution.outcomes.success && execution.collaboration.handoffs.length > 0) {
        patterns.effectiveHandoffs.push(...execution.collaboration.handoffs);
      }
    }

    // Calculate communication efficiency
    const totalMessages = executions.reduce(
      (sum, e) => sum + e.collaboration.messagesSent + e.collaboration.messagesReceived,
      0
    );
    const successfulExecutions = executions.filter(e => e.outcomes.success).length;

    if (executions.length > 0) {
      patterns.communicationEfficiency = Math.round(
        (successfulExecutions / executions.length) * 100
      );
    }

    return patterns;
  }

  /**
   * Estimate duration based on past executions
   */
  estimateDuration(executions) {
    if (executions.length === 0) return null;

    const durations = executions
      .filter(e => e.outcomes.success)
      .map(e => e.successPatterns.duration);

    if (durations.length === 0) return null;

    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const stdDev = Math.sqrt(
      durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length
    );

    return {
      estimated: Math.round(avg),
      min: Math.round(Math.max(0, avg - stdDev)),
      max: Math.round(avg + stdDev),
      confidence: Math.min(95, durations.length * 10)
    };
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(executions) {
    if (executions.length === 0) return 0;

    const successRate = executions.filter(e => e.outcomes.success).length / executions.length;
    const sampleSize = Math.min(100, executions.length * 10);

    return Math.round(successRate * sampleSize);
  }

  /**
   * Share discovery with all agents
   */
  async shareDiscovery(fromAgent, discovery) {
    console.log(`💡 ${fromAgent} sharing discovery: ${discovery.pattern.name}`);

    // Broadcast discovery
    const message = ProtocolHelpers.createPatternDiscovery(
      fromAgent,
      {
        details: discovery.pattern,
        context: discovery.context,
        applicableTo: discovery.applicableTo
      },
      discovery.confidence
    );

    await this.communicationBus.broadcastMessage(fromAgent, message);

    // Store in pattern library
    this.patternLibrary.set(discovery.pattern.id, {
      ...discovery,
      discoveredBy: fromAgent,
      discoveredAt: Date.now(),
      usageCount: 0
    });

    // Store in Memory Bank MCP
    await this.storePattern(discovery);
  }

  /**
   * Update pattern library
   */
  async updatePatternLibrary(learningData) {
    for (const pattern of learningData.discoveries.newPatterns) {
      const patternId = pattern.id || this.generatePatternId(pattern);

      if (this.patternLibrary.has(patternId)) {
        // Update existing pattern
        const existing = this.patternLibrary.get(patternId);
        existing.usageCount++;
        existing.lastUsed = Date.now();
      } else {
        // Add new pattern
        this.patternLibrary.set(patternId, {
          ...pattern,
          usageCount: 1,
          discoveredBy: learningData.agent,
          discoveredAt: learningData.timestamp
        });
      }
    }
  }

  /**
   * Broadcast learnings to other agents
   */
  async broadcastLearnings(fromAgent, learningData) {
    // Only broadcast significant learnings
    if (learningData.discoveries.newPatterns.length > 0) {
      for (const pattern of learningData.discoveries.newPatterns) {
        await this.shareDiscovery(fromAgent, {
          pattern,
          context: learningData.context.taskType,
          confidence: 75,
          applicableTo: [learningData.agent] // Could be expanded
        });
      }
    }

    // Share optimization tips
    if (learningData.successPatterns.efficientApproaches.length > 0) {
      await this.communicationBus.broadcastMessage(fromAgent, {
        type: MessageTypes.OPTIMIZATION_TIP,
        priority: 'normal',
        payload: {
          tips: learningData.successPatterns.efficientApproaches,
          context: learningData.context
        }
      });
    }
  }

  /**
   * Store in Memory Bank MCP
   */
  async storeInMemoryBank(agentName, learningData) {
    // TODO: Integrate with actual Memory Bank MCP
    // For now, store in shared memory
    const key = `learning:${agentName}:${learningData.timestamp}`;
    this.communicationBus.sharedMemory.set(key, learningData, 30 * 24 * 60 * 60 * 1000); // 30 day TTL
  }

  /**
   * Store pattern in Memory Bank MCP
   */
  async storePattern(pattern) {
    // TODO: Integrate with actual Memory Bank MCP
    const key = `pattern:${pattern.pattern.id}`;
    this.communicationBus.sharedMemory.set(key, pattern, 90 * 24 * 60 * 60 * 1000); // 90 day TTL
  }

  /**
   * Trim execution history
   */
  trimExecutionHistory(agentName, maxSize) {
    const agentExecutions = this.executionHistory.filter(e => e.agent === agentName);

    if (agentExecutions.length > maxSize) {
      // Remove oldest executions
      const toRemove = agentExecutions.slice(0, agentExecutions.length - maxSize);

      this.executionHistory = this.executionHistory.filter(
        e => !toRemove.includes(e)
      );
    }
  }

  /**
   * Find most common item in arrays
   */
  findMostCommon(arrays) {
    if (arrays.length === 0) return null;

    const flattened = arrays.flat();
    const counts = {};

    for (const item of flattened) {
      const key = JSON.stringify(item);
      counts[key] = (counts[key] || 0) + 1;
    }

    const mostCommon = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0];

    return mostCommon ? JSON.parse(mostCommon[0]) : null;
  }

  /**
   * Calculate average duration
   */
  calculateAvgDuration(executions) {
    if (executions.length === 0) return 0;

    const totalDuration = executions.reduce(
      (sum, e) => sum + e.successPatterns.duration,
      0
    );

    return totalDuration / executions.length;
  }

  /**
   * Generate pattern ID
   */
  generatePatternId(pattern) {
    const name = pattern.name || 'unknown';
    const hash = Math.random().toString(36).substr(2, 9);
    return `pattern_${name.replace(/\s+/g, '_')}_${hash}`;
  }

  /**
   * Get learning statistics
   */
  getStatistics() {
    return {
      totalExecutions: this.executionHistory.length,
      totalPatterns: this.patternLibrary.size,
      agentLearnings: this.getAgentLearningCounts(),
      mostDiscoveredPatterns: this.getMostUsedPatterns(5),
      learningTrends: this.analyzeLearningTrends()
    };
  }

  /**
   * Get agent learning counts
   */
  getAgentLearningCounts() {
    const counts = {};

    for (const execution of this.executionHistory) {
      counts[execution.agent] = (counts[execution.agent] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get most used patterns
   */
  getMostUsedPatterns(limit = 5) {
    return Array.from(this.patternLibrary.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        usageCount: p.usageCount,
        discoveredBy: p.discoveredBy
      }));
  }

  /**
   * Analyze learning trends
   */
  analyzeLearningTrends() {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentExecutions = this.executionHistory.filter(
      e => e.timestamp >= oneWeekAgo
    );

    return {
      executionsThisWeek: recentExecutions.length,
      successRate: recentExecutions.filter(e => e.outcomes.success).length / recentExecutions.length,
      newPatternsDiscovered: recentExecutions.reduce(
        (sum, e) => sum + e.discoveries.newPatterns.length,
        0
      )
    };
  }
}

module.exports = { AgentLearningSystem };