#!/usr/bin/env node

/**
 * Intelligent Agent Selector for AdvisorOS
 * Automatically routes development requests to the most appropriate specialized agent
 */

const fs = require('fs');
const path = require('path');

class AgentSelector {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'agent-routing-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error('Failed to load routing configuration:', error.message);
      return null;
    }
  }

  /**
   * Select the best agent(s) for a given request
   * @param {string} userRequest - The user's request/query
   * @param {string} [filePath] - Optional file path for context
   * @returns {Object} Selected agent information
   */
  selectAgent(userRequest, filePath = null) {
    if (!this.config) {
      return { agent: 'architecture-designer', confidence: 0, reason: 'Fallback (config error)' };
    }

    const lowercaseRequest = userRequest.toLowerCase();
    const matches = [];

    // Check for multi-agent workflow keywords first
    const workflowMatch = this.matchWorkflow(lowercaseRequest);
    if (workflowMatch) {
      return {
        type: 'multi-agent-workflow',
        workflow: workflowMatch.name,
        agents: workflowMatch.agents,
        confidence: 95,
        reason: `Multi-agent workflow: ${workflowMatch.description}`
      };
    }

    // Match against routing rules
    for (const [category, rule] of Object.entries(this.config.routingRules)) {
      const score = this.calculateMatchScore(lowercaseRequest, rule.keywords);

      if (score > 0) {
        matches.push({
          category,
          agent: rule.primaryAgent,
          supportingAgents: rule.supportingAgents || [],
          score,
          priority: this.config.priorityRules[category] || 10
        });
      }
    }

    // Context-based routing from file path
    if (filePath) {
      const contextMatch = this.matchFileContext(filePath);
      if (contextMatch) {
        matches.push({
          category: 'file-context',
          agent: contextMatch,
          supportingAgents: [],
          score: 50,
          priority: 5
        });
      }
    }

    // Sort by score and priority
    matches.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = higher priority
      }
      return b.score - a.score; // Higher score = better match
    });

    if (matches.length === 0) {
      return {
        type: 'single-agent',
        agent: this.config.fallbackAgent,
        supportingAgents: [],
        confidence: 30,
        reason: 'No strong keyword matches - using fallback agent'
      };
    }

    const best = matches[0];
    const confidence = Math.min(95, best.score + (best.priority <= 2 ? 20 : 0));

    return {
      type: 'single-agent',
      agent: best.agent,
      supportingAgents: best.supportingAgents,
      confidence,
      reason: `Matched category: ${best.category}`,
      alternateAgents: matches.slice(1, 3).map(m => m.agent)
    };
  }

  /**
   * Calculate match score based on keyword matching
   * @param {string} text - Text to analyze
   * @param {string[]} keywords - Keywords to match
   * @returns {number} Match score (0-100)
   */
  calculateMatchScore(text, keywords) {
    let score = 0;
    let matches = 0;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
        // Exact phrase match gets higher score
        if (text.includes(keyword + ' ') || text.includes(' ' + keyword)) {
          score += 15;
        } else {
          score += 10;
        }
      }
    }

    // Bonus for multiple keyword matches
    if (matches > 1) {
      score += matches * 5;
    }

    return Math.min(100, score);
  }

  /**
   * Match file path to context rules
   * @param {string} filePath - File path to analyze
   * @returns {string|null} Matched agent or null
   */
  matchFileContext(filePath) {
    const normalized = filePath.replace(/\\/g, '/');

    // Check file extension
    const ext = path.extname(filePath);
    if (this.config.contextRules.byFileExtension[ext]) {
      return this.config.contextRules.byFileExtension[ext];
    }

    // Check directory
    for (const [dir, agent] of Object.entries(this.config.contextRules.byDirectory)) {
      if (normalized.includes(dir)) {
        return agent;
      }
    }

    return null;
  }

  /**
   * Match multi-agent workflow
   * @param {string} text - Text to analyze
   * @returns {Object|null} Matched workflow or null
   */
  matchWorkflow(text) {
    for (const [name, workflow] of Object.entries(this.config.multiAgentWorkflows)) {
      for (const keyword of workflow.keywords) {
        if (text.includes(keyword)) {
          return {
            name,
            description: workflow.description,
            agents: workflow.agents
          };
        }
      }
    }
    return null;
  }

  /**
   * Get agent recommendation with explanation
   * @param {string} userRequest - User's request
   * @param {string} [filePath] - Optional file path
   * @returns {Object} Recommendation object
   */
  getRecommendation(userRequest, filePath = null) {
    const selection = this.selectAgent(userRequest, filePath);

    const recommendation = {
      ...selection,
      userRequest,
      filePath,
      timestamp: new Date().toISOString()
    };

    if (selection.type === 'multi-agent-workflow') {
      recommendation.explanation = this.explainWorkflow(selection);
    } else {
      recommendation.explanation = this.explainSelection(selection);
    }

    return recommendation;
  }

  /**
   * Explain agent selection to user
   * @param {Object} selection - Selection result
   * @returns {string} Human-readable explanation
   */
  explainSelection(selection) {
    let explanation = `\n🎯 Recommended Agent: ${selection.agent}\n`;
    explanation += `   Confidence: ${selection.confidence}%\n`;
    explanation += `   Reason: ${selection.reason}\n`;

    if (selection.supportingAgents && selection.supportingAgents.length > 0) {
      explanation += `\n🤝 Supporting Agents:\n`;
      selection.supportingAgents.forEach(agent => {
        explanation += `   - ${agent}\n`;
      });
    }

    if (selection.alternateAgents && selection.alternateAgents.length > 0) {
      explanation += `\n💡 Alternative Agents:\n`;
      selection.alternateAgents.forEach(agent => {
        explanation += `   - ${agent}\n`;
      });
    }

    return explanation;
  }

  /**
   * Explain multi-agent workflow
   * @param {Object} selection - Workflow selection
   * @returns {string} Human-readable explanation
   */
  explainWorkflow(selection) {
    let explanation = `\n🔄 Multi-Agent Workflow: ${selection.workflow}\n`;
    explanation += `   Description: ${selection.reason}\n`;
    explanation += `   Confidence: ${selection.confidence}%\n`;
    explanation += `\n📋 Agent Execution Order:\n`;

    selection.agents.forEach((agent, index) => {
      explanation += `   ${index + 1}. ${agent}\n`;
    });

    return explanation;
  }

  /**
   * Format agent command for execution
   * @param {Object} selection - Selection result
   * @returns {string} Command to execute
   */
  formatCommand(selection) {
    if (selection.type === 'multi-agent-workflow') {
      return `Execute workflow: ${selection.workflow}\nAgents: ${selection.agents.join(' → ')}`;
    }

    let command = `Use agent: ${selection.agent}`;

    if (selection.supportingAgents && selection.supportingAgents.length > 0) {
      command += `\nFollow-up: ${selection.supportingAgents.join(', ')}`;
    }

    return command;
  }

  /**
   * List all available agents
   * @returns {Array} List of agent information
   */
  listAgents() {
    const agents = new Set();

    for (const rule of Object.values(this.config.routingRules)) {
      agents.add(rule.primaryAgent);
      if (rule.supportingAgents) {
        rule.supportingAgents.forEach(agent => agents.add(agent));
      }
    }

    return Array.from(agents).sort();
  }

  /**
   * Get agent capabilities
   * @param {string} agentName - Name of agent
   * @returns {Object} Agent capabilities
   */
  getAgentCapabilities(agentName) {
    const capabilities = {
      name: agentName,
      primaryFor: [],
      supportingFor: [],
      keywords: []
    };

    for (const [category, rule] of Object.entries(this.config.routingRules)) {
      if (rule.primaryAgent === agentName) {
        capabilities.primaryFor.push(category);
        capabilities.keywords.push(...rule.keywords);
      }
      if (rule.supportingAgents && rule.supportingAgents.includes(agentName)) {
        capabilities.supportingFor.push(category);
      }
    }

    // Remove duplicate keywords
    capabilities.keywords = [...new Set(capabilities.keywords)];

    return capabilities;
  }
}

// CLI interface
if (require.main === module) {
  const selector = new AgentSelector();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'select':
      if (args.length < 2) {
        console.error('Usage: node agent-selector.js select "<user request>" [file-path]');
        process.exit(1);
      }
      const userRequest = args[1];
      const filePath = args[2];
      const recommendation = selector.getRecommendation(userRequest, filePath);
      console.log(recommendation.explanation);
      console.log(`\n📌 Command:\n${selector.formatCommand(recommendation)}`);
      break;

    case 'list':
      console.log('\n📋 Available Agents:\n');
      const agents = selector.listAgents();
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent}`);
      });
      console.log(`\nTotal: ${agents.length} agents\n`);
      break;

    case 'capabilities':
      if (args.length < 2) {
        console.error('Usage: node agent-selector.js capabilities <agent-name>');
        process.exit(1);
      }
      const agentName = args[1];
      const capabilities = selector.getAgentCapabilities(agentName);
      console.log(`\n🤖 Agent: ${capabilities.name}\n`);
      console.log(`Primary for: ${capabilities.primaryFor.join(', ') || 'None'}`);
      console.log(`Supporting for: ${capabilities.supportingFor.join(', ') || 'None'}`);
      console.log(`\nKeywords: ${capabilities.keywords.slice(0, 10).join(', ')}${capabilities.keywords.length > 10 ? '...' : ''}\n`);
      break;

    case 'test':
      console.log('\n🧪 Testing Agent Selector\n');
      const testCases = [
        { request: 'Create API endpoint for client management', expected: 'backend-api-developer' },
        { request: 'Optimize slow database query', expected: 'database-optimizer' },
        { request: 'Build React dashboard component', expected: 'frontend-builder' },
        { request: 'Security audit of authentication', expected: 'security-auditor' },
        { request: 'Calculate quarterly estimated taxes', expected: 'cpa-tax-compliance' },
        { request: 'Generate unit tests for service', expected: 'test-suite-developer' },
        { request: 'Set up CI/CD pipeline', expected: 'devops-azure-specialist' },
      ];

      let passed = 0;
      testCases.forEach((test, index) => {
        const result = selector.selectAgent(test.request);
        const success = result.agent === test.expected;
        console.log(`${index + 1}. ${success ? '✅' : '❌'} "${test.request}"`);
        console.log(`   Expected: ${test.expected}, Got: ${result.agent} (${result.confidence}% confidence)`);
        if (success) passed++;
      });

      console.log(`\nPassed: ${passed}/${testCases.length}\n`);
      break;

    default:
      console.log(`
AdvisorOS Agent Selector

Usage:
  node agent-selector.js select "<user request>" [file-path]
    - Select the best agent for a request

  node agent-selector.js list
    - List all available agents

  node agent-selector.js capabilities <agent-name>
    - Show agent capabilities and keywords

  node agent-selector.js test
    - Run test cases

Examples:
  node agent-selector.js select "Create API endpoint for clients"
  node agent-selector.js select "Optimize database query" apps/web/src/server/services/client.service.ts
  node agent-selector.js capabilities backend-api-developer
  node agent-selector.js test
      `);
      break;
  }
}

module.exports = AgentSelector;