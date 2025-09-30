/**
 * Runtime Logger
 *
 * Comprehensive execution tracking and analysis for AdvisorOS agent orchestration.
 * Provides real-time logging, performance analysis, and intelligent recommendations.
 */

const fs = require('fs').promises;
const path = require('path');
const { MessageSerializer } = require('./communication-protocols');

/**
 * Runtime Logger Class
 */
class RuntimeLogger {
  constructor(options = {}) {
    this.logStream = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.liveLogPath = null;
    this.agentStartTimes = new Map();
    this.toolCalls = [];
    this.agentMessages = [];
    this.agentCompletions = [];
    this.logDir = options.logDir || path.join(process.cwd(), '.claude', 'logs');
  }

  /**
   * Start execution logging
   */
  async startExecution(userRequest, executionPlan) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'EXECUTION_START',
      userRequest,
      executionPlan: {
        agents: executionPlan.agents || [],
        estimatedDuration: executionPlan.estimatedDuration || 'unknown',
        mcpServers: executionPlan.mcpServers || [],
        parallelPhases: executionPlan.parallelPhases?.length || 0,
        totalTasks: executionPlan.totalTasks || 0
      }
    };

    this.log(logEntry);
    await this.persistLog(logEntry);

    // Generate live log file
    this.liveLogPath = await this.generateLiveLogFile(logEntry);

    console.log(`📝 Execution logging started: ${this.sessionId}`);
    console.log(`📄 Live log: ${this.liveLogPath}`);

    return this.sessionId;
  }

  /**
   * Log agent start
   */
  async logAgentStart(agentName, task, context = {}) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'AGENT_START',
      agent: agentName,
      task,
      context: {
        mcpServers: context.mcpServers || [],
        parallelWith: context.parallelAgents || [],
        inheritedContext: context.inheritedContext ? 'yes' : 'no'
      }
    };

    this.agentStartTimes.set(agentName, Date.now());
    this.log(logEntry);
    await this.updateLiveLog(logEntry);

    console.log(`🚀 Agent started: ${agentName}`);
  }

  /**
   * Log tool call
   */
  async logToolCall(agentName, toolName, parameters, result) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'TOOL_CALL',
      agent: agentName,
      tool: toolName,
      parameters: this.sanitizeParameters(parameters),
      result: {
        success: result.success !== false,
        duration: result.duration || 0,
        summary: this.sanitizeResult(result)
      }
    };

    this.toolCalls.push(logEntry);
    this.log(logEntry);
    await this.updateLiveLog(logEntry);

    // Analyze performance if slow
    if (result.duration > 5000) {
      await this.analyzePerformance(logEntry);
    }
  }

  /**
   * Log agent message
   */
  async logAgentMessage(message) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'AGENT_MESSAGE',
      from: message.from,
      to: message.to,
      messageType: message.type,
      priority: message.priority,
      payload: this.sanitizePayload(message.payload)
    };

    this.agentMessages.push(logEntry);
    this.log(logEntry);
    await this.updateLiveLog(logEntry);
    await this.trackCommunicationPattern(logEntry);
  }

  /**
   * Log agent completion
   */
  async logAgentComplete(agentName, outputs = {}, recommendations = {}) {
    const startTime = this.agentStartTimes.get(agentName);
    const duration = startTime ? Date.now() - startTime : 0;

    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'AGENT_COMPLETE',
      agent: agentName,
      duration,
      outputs: {
        filesModified: outputs.filesModified || [],
        filesRead: outputs.filesRead || [],
        testsGenerated: outputs.testsGenerated || false,
        securityIssuesFound: outputs.securityIssuesFound || 0
      },
      recommendations: {
        nextAgents: recommendations.nextAgents || [],
        optimizations: recommendations.optimizations || [],
        warnings: recommendations.warnings || []
      }
    };

    this.agentCompletions.push(logEntry);
    this.log(logEntry);
    await this.updateLiveLog(logEntry);

    // Automatically initiate handoffs if recommended
    if (recommendations.nextAgents?.length > 0) {
      await this.initiateHandoffs(agentName, recommendations);
    }

    console.log(`✅ Agent completed: ${agentName} (${duration}ms)`);
  }

  /**
   * Log handoff
   */
  async logHandoff(handoffPackage) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'HANDOFF',
      from: handoffPackage.from,
      to: handoffPackage.to,
      task: handoffPackage.executionContext?.task || 'unknown',
      urgency: handoffPackage.urgency,
      contextTransferred: Object.keys(handoffPackage.executionContext || {}).length
    };

    this.log(logEntry);
    await this.updateLiveLog(logEntry);

    console.log(`🤝 Handoff: ${handoffPackage.from} → ${handoffPackage.to}`);
  }

  /**
   * Log handoff received
   */
  async logHandoffReceived(toAgent, handoffPackage) {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      type: 'HANDOFF_RECEIVED',
      agent: toAgent,
      from: handoffPackage.from,
      contextReceived: true
    };

    this.log(logEntry);
    await this.updateLiveLog(logEntry);
  }

  /**
   * Generate live log file
   */
  async generateLiveLogFile(initialEntry) {
    // Ensure log directory exists
    await fs.mkdir(this.logDir, { recursive: true });

    const logFilePath = path.join(this.logDir, `execution-${this.sessionId}.log`);

    const header = `
# AdvisorOS Agent Execution Log
Session ID: ${this.sessionId}
Started: ${new Date().toISOString()}
User Request: ${initialEntry.userRequest}

## Execution Plan
${this.formatExecutionPlan(initialEntry.executionPlan)}

## Live Execution Log
---
`;

    await fs.writeFile(logFilePath, header);
    return logFilePath;
  }

  /**
   * Update live log file
   */
  async updateLiveLog(entry) {
    if (!this.liveLogPath) return;

    const formattedEntry = this.formatLogEntry(entry);

    try {
      await fs.appendFile(this.liveLogPath, formattedEntry + '\n');
    } catch (error) {
      console.error('Failed to update live log:', error);
    }
  }

  /**
   * Format execution plan for display
   */
  formatExecutionPlan(plan) {
    return `
- Agents: ${plan.agents.join(', ')}
- Estimated Duration: ${plan.estimatedDuration}
- MCP Servers: ${plan.mcpServers.join(', ') || 'none'}
- Parallel Phases: ${plan.parallelPhases}
- Total Tasks: ${plan.totalTasks}
`;
  }

  /**
   * Format log entry for display
   */
  formatLogEntry(entry) {
    const emoji = this.getEmojiForType(entry.type);
    const timestamp = new Date(entry.timestamp).toISOString();

    switch (entry.type) {
      case 'AGENT_START':
        return `\n${emoji} [${timestamp}] AGENT START: ${entry.agent}\n` +
               `  Task: ${entry.task}\n` +
               `  MCP Servers: ${entry.context.mcpServers.join(', ') || 'none'}\n` +
               `  Parallel with: ${entry.context.parallelWith.join(', ') || 'none'}`;

      case 'TOOL_CALL':
        const status = entry.result.success ? '✅' : '❌';
        return `  🔧 [${timestamp}] ${entry.agent} → ${entry.tool}\n` +
               `     Duration: ${entry.result.duration}ms | Status: ${status}`;

      case 'AGENT_MESSAGE':
        return `  💬 [${timestamp}] ${entry.from} → ${entry.to}: ${entry.messageType}\n` +
               `     Priority: ${entry.priority}`;

      case 'AGENT_COMPLETE':
        return `\n${emoji} [${timestamp}] AGENT COMPLETE: ${entry.agent}\n` +
               `  Duration: ${entry.duration}ms\n` +
               `  Files Modified: ${entry.outputs.filesModified.length}\n` +
               `  Next Agents: ${entry.recommendations.nextAgents.join(', ') || 'none'}`;

      case 'HANDOFF':
        return `\n🤝 [${timestamp}] HANDOFF: ${entry.from} → ${entry.to}\n` +
               `  Task: ${entry.task}\n` +
               `  Urgency: ${entry.urgency}\n` +
               `  Context Items: ${entry.contextTransferred}`;

      case 'HANDOFF_RECEIVED':
        return `  ✅ [${timestamp}] ${entry.agent} received handoff from ${entry.from}`;

      default:
        return `  [${timestamp}] ${entry.type}: ${JSON.stringify(entry, null, 2)}`;
    }
  }

  /**
   * Get emoji for log entry type
   */
  getEmojiForType(type) {
    const emojiMap = {
      'EXECUTION_START': '🚀',
      'AGENT_START': '🤖',
      'AGENT_COMPLETE': '✅',
      'TOOL_CALL': '🔧',
      'AGENT_MESSAGE': '💬',
      'HANDOFF': '🤝',
      'ERROR': '❌',
      'WARNING': '⚠️'
    };

    return emojiMap[type] || '📝';
  }

  /**
   * Log entry to stream
   */
  log(entry) {
    this.logStream.push(entry);
  }

  /**
   * Persist log entry
   */
  async persistLog(entry) {
    // TODO: Integrate with Memory Bank MCP
    // For now, just store in memory
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParameters(parameters) {
    if (!parameters) return {};

    const sanitized = { ...parameters };

    // Remove sensitive data
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]';

    return sanitized;
  }

  /**
   * Sanitize result for logging
   */
  sanitizeResult(result) {
    if (!result) return 'No result';

    if (typeof result === 'string') {
      return result.length > 200 ? result.substring(0, 200) + '...' : result;
    }

    return 'Result available';
  }

  /**
   * Sanitize payload for logging
   */
  sanitizePayload(payload) {
    if (!payload) return {};

    const sanitized = { ...payload };

    // Truncate large data
    if (JSON.stringify(sanitized).length > 1000) {
      return { summary: 'Large payload truncated' };
    }

    return sanitized;
  }

  /**
   * Analyze performance
   */
  async analyzePerformance(logEntry) {
    console.warn(`⚠️ Slow operation detected: ${logEntry.tool} took ${logEntry.result.duration}ms`);

    // TODO: Store performance issues for later analysis
  }

  /**
   * Track communication patterns
   */
  async trackCommunicationPattern(logEntry) {
    // TODO: Analyze communication patterns for optimization
  }

  /**
   * Initiate handoffs
   */
  async initiateHandoffs(fromAgent, recommendations) {
    // This would be called by the handoff system
    console.log(`🤝 Initiating handoffs from ${fromAgent} to ${recommendations.nextAgents.join(', ')}`);
  }

  /**
   * Get agent start time
   */
  getAgentStartTime(agentName) {
    return this.agentStartTimes.get(agentName) || this.startTime;
  }

  /**
   * Count tool calls
   */
  countToolCalls() {
    return this.toolCalls.length;
  }

  /**
   * Count agent messages
   */
  countAgentMessages() {
    return this.agentMessages.length;
  }

  /**
   * Get unique agents used
   */
  getUniqueAgents() {
    const agents = new Set();

    for (const completion of this.agentCompletions) {
      agents.add(completion.agent);
    }

    return Array.from(agents);
  }

  /**
   * Calculate parallel execution percentage
   */
  calculateParallelPercentage() {
    // Analyze agent start times to determine parallelism
    const startTimes = Array.from(this.agentStartTimes.values()).sort();

    if (startTimes.length < 2) return 0;

    let parallelWindows = 0;
    for (let i = 1; i < startTimes.length; i++) {
      if (startTimes[i] - startTimes[i - 1] < 1000) { // Within 1 second = parallel
        parallelWindows++;
      }
    }

    return Math.round((parallelWindows / (startTimes.length - 1)) * 100);
  }

  /**
   * Calculate MCP utilization
   */
  calculateMCPUtilization() {
    const agentsWithMCP = this.logStream.filter(
      entry => entry.type === 'AGENT_START' && entry.context?.mcpServers?.length > 0
    );

    const totalAgents = this.logStream.filter(entry => entry.type === 'AGENT_START').length;

    if (totalAgents === 0) return 0;

    return Math.round((agentsWithMCP.length / totalAgents) * 100);
  }

  /**
   * Identify bottlenecks
   */
  async identifyBottlenecks() {
    const bottlenecks = [];

    // Find slow agents
    for (const completion of this.agentCompletions) {
      if (completion.duration > 30000) { // > 30 seconds
        bottlenecks.push({
          type: 'slow_agent',
          agent: completion.agent,
          duration: completion.duration,
          recommendation: 'Consider optimizing or breaking into smaller tasks'
        });
      }
    }

    // Find slow tool calls
    for (const toolCall of this.toolCalls) {
      if (toolCall.result.duration > 5000) { // > 5 seconds
        bottlenecks.push({
          type: 'slow_tool',
          agent: toolCall.agent,
          tool: toolCall.tool,
          duration: toolCall.result.duration,
          recommendation: 'Consider caching or optimization'
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Find parallelization opportunities
   */
  async findParallelizationOpps() {
    const opportunities = [];

    // Analyze sequential agents that could run in parallel
    const completions = [...this.agentCompletions].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < completions.length; i++) {
      const prev = completions[i - 1];
      const curr = completions[i];

      // If agents don't share file dependencies, they could be parallel
      const prevFiles = prev.outputs.filesModified || [];
      const currFiles = curr.outputs.filesModified || [];

      const hasSharedFiles = prevFiles.some(file => currFiles.includes(file));

      if (!hasSharedFiles && curr.timestamp - prev.timestamp < 5000) {
        opportunities.push({
          agents: [prev.agent, curr.agent],
          potentialTimeSaving: Math.min(prev.duration, curr.duration),
          confidence: 'medium'
        });
      }
    }

    return opportunities;
  }

  /**
   * Analyze tool usage
   */
  async analyzeToolUsage() {
    const toolStats = {};

    for (const toolCall of this.toolCalls) {
      if (!toolStats[toolCall.tool]) {
        toolStats[toolCall.tool] = {
          count: 0,
          totalDuration: 0,
          failures: 0
        };
      }

      toolStats[toolCall.tool].count++;
      toolStats[toolCall.tool].totalDuration += toolCall.result.duration;
      if (!toolCall.result.success) {
        toolStats[toolCall.tool].failures++;
      }
    }

    // Calculate averages
    for (const tool in toolStats) {
      toolStats[tool].avgDuration = Math.round(
        toolStats[tool].totalDuration / toolStats[tool].count
      );
      toolStats[tool].successRate = Math.round(
        ((toolStats[tool].count - toolStats[tool].failures) / toolStats[tool].count) * 100
      );
    }

    return toolStats;
  }

  /**
   * Analyze agent communication
   */
  async analyzeAgentCommunication() {
    const communicationGraph = {};
    let missedHandoffs = 0;

    for (const message of this.agentMessages) {
      const key = `${message.from}->${message.to}`;

      if (!communicationGraph[key]) {
        communicationGraph[key] = {
          count: 0,
          types: {}
        };
      }

      communicationGraph[key].count++;
      communicationGraph[key].types[message.messageType] =
        (communicationGraph[key].types[message.messageType] || 0) + 1;
    }

    // Check for agents that completed without handoffs
    for (const completion of this.agentCompletions) {
      if (completion.recommendations.nextAgents.length > 0) {
        const hasHandoff = this.logStream.some(
          entry => entry.type === 'HANDOFF' && entry.from === completion.agent
        );

        if (!hasHandoff) missedHandoffs++;
      }
    }

    return {
      communicationGraph,
      missedHandoffs,
      totalMessages: this.agentMessages.length,
      suggestions: missedHandoffs > 0 ? ['Enable automatic handoffs for better coordination'] : []
    };
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    const bottlenecks = await this.identifyBottlenecks();
    const parallelizationOpps = await this.findParallelizationOpps();
    const communication = await this.analyzeAgentCommunication();

    // Parallelization recommendations
    if (parallelizationOpps.length > 0) {
      recommendations.push({
        type: 'parallelization',
        priority: 'high',
        message: `Found ${parallelizationOpps.length} opportunities for parallel execution`,
        details: parallelizationOpps,
        expectedImprovement: `Could save ~${parallelizationOpps.reduce((sum, opp) => sum + opp.potentialTimeSaving, 0)}ms`
      });
    }

    // Bottleneck recommendations
    if (bottlenecks.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `Found ${bottlenecks.length} performance bottlenecks`,
        details: bottlenecks
      });
    }

    // Communication recommendations
    if (communication.missedHandoffs > 0) {
      recommendations.push({
        type: 'communication',
        priority: 'medium',
        message: `${communication.missedHandoffs} potential handoffs were not utilized`,
        details: communication.suggestions
      });
    }

    return recommendations;
  }

  /**
   * Extract learned patterns
   */
  async extractLearnedPatterns() {
    const patterns = [];

    // Analyze successful agent sequences
    const agentSequence = this.agentCompletions.map(c => c.agent);

    if (agentSequence.length >= 3) {
      patterns.push({
        type: 'agent_sequence',
        pattern: agentSequence.join(' → '),
        context: 'Successful execution flow',
        confidence: 85
      });
    }

    // Analyze tool usage patterns
    const toolSequence = this.toolCalls
      .slice(0, 5)
      .map(t => t.tool);

    if (toolSequence.length >= 3) {
      patterns.push({
        type: 'tool_sequence',
        pattern: toolSequence.join(' → '),
        context: 'Common tool usage pattern',
        confidence: 75
      });
    }

    return patterns;
  }

  /**
   * Generate execution report
   */
  async generateExecutionReport() {
    const totalDuration = Date.now() - this.startTime;

    const report = {
      sessionId: this.sessionId,
      totalDuration,
      agentsUsed: this.getUniqueAgents(),
      toolCallsTotal: this.countToolCalls(),
      agentMessagesTotal: this.countAgentMessages(),
      parallelExecutionPercentage: this.calculateParallelPercentage(),
      mcpUtilization: this.calculateMCPUtilization(),
      performanceMetrics: {
        bottlenecks: await this.identifyBottlenecks(),
        toolUsage: await this.analyzeToolUsage(),
        agentCollaboration: await this.analyzeAgentCommunication()
      },
      recommendations: await this.generateRecommendations(),
      learnedPatterns: await this.extractLearnedPatterns()
    };

    // Save report
    await this.saveFinalReport(report);

    return report;
  }

  /**
   * Save final report
   */
  async saveFinalReport(report) {
    const reportPath = path.join(this.logDir, `report-${this.sessionId}.json`);

    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`📊 Execution report saved: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }
}

module.exports = { RuntimeLogger };