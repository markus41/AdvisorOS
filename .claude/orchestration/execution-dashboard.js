/**
 * Execution Dashboard
 *
 * Real-time visualization of agent execution with live updates.
 * Generates Markdown dashboards with Mermaid diagrams and metrics.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Execution Dashboard Class
 */
class ExecutionDashboard {
  constructor(runtimeLogger) {
    this.logger = runtimeLogger;
    this.dashboardPath = null;
    this.agentTable = new Map();
    this.communicationEdges = [];
    this.messageLog = [];
    this.metrics = {
      parallelPercentage: 0,
      mcpUtilization: 0,
      toolCalls: 0,
      avgResponseTime: 0
    };
    this.learnedPatterns = [];
  }

  /**
   * Initialize dashboard
   */
  async initialize() {
    const dashboardDir = path.dirname(this.logger.liveLogPath);
    this.dashboardPath = path.join(dashboardDir, `dashboard-${this.logger.sessionId}.md`);

    const dashboard = `
# 🚀 Live Execution Dashboard

**Session**: \`${this.logger.sessionId}\`
**Started**: ${new Date().toISOString()}
**Status**: 🟢 Running

---

## 📊 Real-Time Agent Status

| Agent | Status | Duration | Tools Used | Messages |
|-------|--------|----------|------------|----------|
<!-- AGENT_TABLE_MARKER -->

---

## 🔄 Agent Communication Flow

\`\`\`mermaid
graph LR
<!-- COMMUNICATION_GRAPH_MARKER -->
\`\`\`

---

## 🎯 Execution Progress

\`\`\`
<!-- PROGRESS_BAR_MARKER -->
\`\`\`

---

## 💬 Recent Agent Messages

<!-- MESSAGE_LOG_MARKER -->

---

## ⚡ Performance Metrics

- **Parallel Execution**: <!-- PARALLEL_PERCENTAGE -->%
- **MCP Utilization**: <!-- MCP_UTILIZATION -->%
- **Tool Calls**: <!-- TOOL_CALLS -->
- **Avg Response Time**: <!-- AVG_RESPONSE_TIME -->ms

---

## 🎓 Learned Patterns

<!-- LEARNED_PATTERNS_MARKER -->

---

## 🔍 Detailed Logs

Full execution log: [\`execution-${this.logger.sessionId}.log\`](./execution-${this.logger.sessionId}.log)

---

*Dashboard updates in real-time during execution*
*Last updated: <!-- LAST_UPDATED_MARKER -->*
`;

    await fs.writeFile(this.dashboardPath, dashboard);
    console.log(`📊 Dashboard initialized: ${this.dashboardPath}`);

    return this.dashboardPath;
  }

  /**
   * Update dashboard with new log entry
   */
  async update(logEntry) {
    switch (logEntry.type) {
      case 'AGENT_START':
        await this.updateAgentTable(logEntry);
        await this.updateCommunicationGraph(logEntry);
        await this.updateProgressBar(logEntry);
        break;

      case 'AGENT_MESSAGE':
        await this.updateMessageLog(logEntry);
        await this.updateCommunicationGraph(logEntry);
        break;

      case 'TOOL_CALL':
        await this.updateToolMetrics(logEntry);
        await this.updateAgentTable(logEntry);
        break;

      case 'AGENT_COMPLETE':
        await this.updateAgentTable(logEntry);
        await this.updateProgressBar(logEntry);
        await this.updateMetrics();
        break;

      case 'HANDOFF':
        await this.updateCommunicationGraph(logEntry);
        await this.updateMessageLog(logEntry);
        break;
    }

    // Update timestamp
    await this.updateTimestamp();
  }

  /**
   * Update agent table
   */
  async updateAgentTable(logEntry) {
    const agentName = logEntry.agent;

    if (logEntry.type === 'AGENT_START') {
      this.agentTable.set(agentName, {
        name: agentName,
        status: '🔄 Running',
        startTime: logEntry.timestamp,
        duration: '-',
        toolsUsed: 0,
        messages: 0
      });
    } else if (logEntry.type === 'AGENT_COMPLETE') {
      const agent = this.agentTable.get(agentName);
      if (agent) {
        agent.status = '✅ Complete';
        agent.duration = `${logEntry.duration}ms`;
      }
    } else if (logEntry.type === 'TOOL_CALL') {
      const agent = this.agentTable.get(agentName);
      if (agent) {
        agent.toolsUsed++;
      }
    }

    await this.renderAgentTable();
  }

  /**
   * Render agent table to dashboard
   */
  async renderAgentTable() {
    let tableRows = '';

    for (const [name, agent] of this.agentTable.entries()) {
      tableRows += `| ${agent.name} | ${agent.status} | ${agent.duration} | ${agent.toolsUsed} | ${agent.messages} |\n`;
    }

    await this.replacePlaceholder('AGENT_TABLE_MARKER', tableRows);
  }

  /**
   * Update communication graph
   */
  async updateCommunicationGraph(logEntry) {
    if (logEntry.type === 'AGENT_MESSAGE' || logEntry.type === 'HANDOFF') {
      const edge = {
        from: this.sanitizeNodeName(logEntry.from),
        to: this.sanitizeNodeName(logEntry.to),
        type: logEntry.type
      };

      // Avoid duplicates
      const exists = this.communicationEdges.some(
        e => e.from === edge.from && e.to === edge.to
      );

      if (!exists) {
        this.communicationEdges.push(edge);
      }
    }

    await this.renderCommunicationGraph();
  }

  /**
   * Render communication graph as Mermaid diagram
   */
  async renderCommunicationGraph() {
    if (this.communicationEdges.length === 0) {
      await this.replacePlaceholder('COMMUNICATION_GRAPH_MARKER', '    %% No communication yet');
      return;
    }

    let mermaidCode = '';

    for (const edge of this.communicationEdges) {
      const arrow = edge.type === 'HANDOFF' ? '==>' : '-->';
      const label = edge.type === 'HANDOFF' ? '|handoff|' : '';
      mermaidCode += `    ${edge.from}${arrow}${label}${edge.to}\n`;
    }

    await this.replacePlaceholder('COMMUNICATION_GRAPH_MARKER', mermaidCode);
  }

  /**
   * Sanitize node names for Mermaid
   */
  sanitizeNodeName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Update message log
   */
  async updateMessageLog(logEntry) {
    const timestamp = new Date(logEntry.timestamp).toISOString().substr(11, 8);

    let logLine = '';

    if (logEntry.type === 'AGENT_MESSAGE') {
      const emoji = this.getMessageEmoji(logEntry.messageType);
      logLine = `- **${timestamp}** ${emoji} \`${logEntry.from}\` → \`${logEntry.to}\`: *${logEntry.messageType}* (Priority: ${logEntry.priority})`;
    } else if (logEntry.type === 'HANDOFF') {
      logLine = `- **${timestamp}** 🤝 \`${logEntry.from}\` → \`${logEntry.to}\`: **HANDOFF** (Urgency: ${logEntry.urgency})`;
    }

    this.messageLog.unshift(logLine); // Add to beginning

    // Keep only last 10 messages
    if (this.messageLog.length > 10) {
      this.messageLog = this.messageLog.slice(0, 10);
    }

    await this.renderMessageLog();
  }

  /**
   * Get emoji for message type
   */
  getMessageEmoji(messageType) {
    const emojiMap = {
      'finding_report': '🔍',
      'assistance_request': '🆘',
      'validation_request': '✅',
      'validation_result': '📋',
      'context_share': '📤',
      'progress_update': '📊',
      'pattern_discovered': '💡',
      'warning': '⚠️',
      'error_report': '❌'
    };

    return emojiMap[messageType] || '💬';
  }

  /**
   * Render message log
   */
  async renderMessageLog() {
    const messageLogText = this.messageLog.length > 0
      ? this.messageLog.join('\n')
      : '*No messages yet*';

    await this.replacePlaceholder('MESSAGE_LOG_MARKER', messageLogText);
  }

  /**
   * Update progress bar
   */
  async updateProgressBar(logEntry) {
    const totalAgents = this.logger.logStream.filter(e => e.type === 'AGENT_START').length;
    const completedAgents = this.logger.logStream.filter(e => e.type === 'AGENT_COMPLETE').length;

    if (totalAgents === 0) {
      await this.replacePlaceholder('PROGRESS_BAR_MARKER', '[░░░░░░░░░░] 0%');
      return;
    }

    const percentage = Math.round((completedAgents / totalAgents) * 100);
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;

    const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}% (${completedAgents}/${totalAgents} agents)`;

    await this.replacePlaceholder('PROGRESS_BAR_MARKER', progressBar);
  }

  /**
   * Update tool metrics
   */
  async updateToolMetrics(logEntry) {
    this.metrics.toolCalls++;

    // Update average response time
    const toolCalls = this.logger.toolCalls;
    if (toolCalls.length > 0) {
      const totalDuration = toolCalls.reduce((sum, call) => sum + (call.result.duration || 0), 0);
      this.metrics.avgResponseTime = Math.round(totalDuration / toolCalls.length);
    }

    await this.updateMetrics();
  }

  /**
   * Update metrics section
   */
  async updateMetrics() {
    this.metrics.parallelPercentage = this.logger.calculateParallelPercentage();
    this.metrics.mcpUtilization = this.logger.calculateMCPUtilization();

    await this.replacePlaceholder('PARALLEL_PERCENTAGE', this.metrics.parallelPercentage.toString());
    await this.replacePlaceholder('MCP_UTILIZATION', this.metrics.mcpUtilization.toString());
    await this.replacePlaceholder('TOOL_CALLS', this.metrics.toolCalls.toString());
    await this.replacePlaceholder('AVG_RESPONSE_TIME', this.metrics.avgResponseTime.toString());
  }

  /**
   * Update learned patterns
   */
  async updateLearnedPatterns(patterns) {
    this.learnedPatterns = patterns;

    if (patterns.length === 0) {
      await this.replacePlaceholder('LEARNED_PATTERNS_MARKER', '*No patterns discovered yet*');
      return;
    }

    let patternsText = '';

    for (const pattern of patterns) {
      patternsText += `- 💡 **${pattern.type}**: \`${pattern.pattern}\` (Confidence: ${pattern.confidence}%)\n`;
      patternsText += `  - Context: ${pattern.context}\n`;
    }

    await this.replacePlaceholder('LEARNED_PATTERNS_MARKER', patternsText);
  }

  /**
   * Update timestamp
   */
  async updateTimestamp() {
    const timestamp = new Date().toISOString();
    await this.replacePlaceholder('LAST_UPDATED_MARKER', timestamp);
  }

  /**
   * Replace placeholder in dashboard
   */
  async replacePlaceholder(marker, value) {
    if (!this.dashboardPath) return;

    try {
      let content = await fs.readFile(this.dashboardPath, 'utf-8');

      // Handle both inline markers and block markers
      const inlinePattern = new RegExp(`<!-- ${marker} -->([^<]*)`, 'g');
      const blockPattern = new RegExp(`<!-- ${marker} -->`, 'g');

      if (content.match(inlinePattern)) {
        content = content.replace(inlinePattern, `<!-- ${marker} -->${value}`);
      } else {
        content = content.replace(blockPattern, value);
      }

      await fs.writeFile(this.dashboardPath, content);
    } catch (error) {
      console.error(`Failed to update placeholder ${marker}:`, error);
    }
  }

  /**
   * Finalize dashboard
   */
  async finalize(executionReport) {
    // Update with final statistics
    await this.updateLearnedPatterns(executionReport.learnedPatterns);

    // Update status
    let content = await fs.readFile(this.dashboardPath, 'utf-8');
    content = content.replace('**Status**: 🟢 Running', '**Status**: ✅ Complete');

    // Add execution summary
    const summary = `

---

## 📈 Execution Summary

- **Total Duration**: ${executionReport.totalDuration}ms
- **Agents Used**: ${executionReport.agentsUsed.length} (${executionReport.agentsUsed.join(', ')})
- **Total Messages**: ${executionReport.agentMessagesTotal}
- **Parallel Execution**: ${executionReport.parallelExecutionPercentage}%
- **MCP Utilization**: ${executionReport.mcpUtilization}%

### Recommendations

${this.formatRecommendations(executionReport.recommendations)}

---

**🎉 Execution completed successfully!**
`;

    content += summary;

    await fs.writeFile(this.dashboardPath, content);

    console.log(`✅ Dashboard finalized: ${this.dashboardPath}`);
  }

  /**
   * Format recommendations
   */
  formatRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '*No recommendations*';
    }

    let text = '';

    for (const rec of recommendations) {
      const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      text += `- ${priorityEmoji} **${rec.type}**: ${rec.message}\n`;
    }

    return text;
  }

  /**
   * Generate static HTML version (optional enhancement)
   */
  async generateHTML() {
    // TODO: Convert Markdown to HTML for better visualization
    // Could use marked.js or similar
  }
}

module.exports = { ExecutionDashboard };