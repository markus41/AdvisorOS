/**
 * Agent Communication Bus
 *
 * Central message bus for inter-agent communication in AdvisorOS.
 * Handles message routing, queueing, broadcasting, and MCP data sharing.
 */

const fs = require('fs').promises;
const path = require('path');
const {
  MessageTypes,
  MessagePriority,
  AgentCapabilities,
  MessageValidator,
  ProtocolHelpers,
  MessageSerializer
} = require('./communication-protocols');

/**
 * Shared Memory Store for agent context
 */
class SharedMemoryStore {
  constructor() {
    this.store = new Map();
    this.mcpCache = new Map();
  }

  set(key, value, ttl = 3600000) { // Default 1 hour TTL
    this.store.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.mcpCache.clear();
  }

  // MCP-specific caching
  setMCPData(agentName, mcpServer, data) {
    const key = `mcp:${agentName}:${mcpServer}`;
    this.mcpCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getMCPData(agentName, mcpServer) {
    const key = `mcp:${agentName}:${mcpServer}`;
    return this.mcpCache.get(key);
  }
}

/**
 * Agent Communication Bus
 */
class AgentCommunicationBus {
  constructor(options = {}) {
    this.messageQueue = new Map();
    this.agentContexts = new Map();
    this.sharedMemory = new SharedMemoryStore();
    this.subscribers = new Map(); // Agent subscriptions
    this.messageHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.logPath = options.logPath || path.join(process.cwd(), '.claude', 'logs', 'agent-messages.log');
  }

  /**
   * Initialize the communication bus
   */
  async initialize() {
    // Ensure log directory exists
    const logDir = path.dirname(this.logPath);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }

    console.log('🚀 Agent Communication Bus initialized');
  }

  /**
   * Register an agent with the bus
   */
  registerAgent(agentName, capabilities = []) {
    this.agentContexts.set(agentName, {
      name: agentName,
      capabilities,
      registeredAt: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      lastActive: Date.now()
    });

    // Initialize subscriber list
    if (!this.subscribers.has(agentName)) {
      this.subscribers.set(agentName, []);
    }

    console.log(`✅ Agent registered: ${agentName} with capabilities:`, capabilities);
  }

  /**
   * Send a message from one agent to another
   */
  async sendMessage(fromAgent, toAgent, message) {
    // Validate message structure
    const validation = MessageValidator.validateMessage({
      from: fromAgent,
      to: toAgent,
      ...message
    });

    if (!validation.valid) {
      throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
    }

    // Enrich message with context
    const enrichedMessage = {
      id: message.id || this.generateMessageId(),
      timestamp: message.timestamp || Date.now(),
      from: fromAgent,
      to: toAgent,
      type: message.type,
      priority: message.priority || MessagePriority.NORMAL,
      payload: message.payload,
      context: this.getAgentContext(fromAgent),
      mcpData: await this.fetchRelevantMCPData(message)
    };

    // Store in message queue
    this.messageQueue.set(enrichedMessage.id, enrichedMessage);

    // Add to history
    this.addToHistory(enrichedMessage);

    // Update agent stats
    this.updateAgentStats(fromAgent, 'sent');
    this.updateAgentStats(toAgent, 'received');

    // Log message
    await this.logMessage(enrichedMessage);

    // Notify subscribers
    await this.notifySubscribers(toAgent, enrichedMessage);

    // Persist to Memory Bank MCP if available
    await this.persistToMemoryBank(enrichedMessage);

    return enrichedMessage;
  }

  /**
   * Broadcast message to all active agents
   */
  async broadcastMessage(fromAgent, message) {
    const activeAgents = Array.from(this.agentContexts.keys()).filter(
      agent => agent !== fromAgent
    );

    const broadcasts = await Promise.all(
      activeAgents.map(agent =>
        this.sendMessage(fromAgent, agent, message).catch(error => {
          console.error(`Failed to broadcast to ${agent}:`, error);
          return null;
        })
      )
    );

    return broadcasts.filter(msg => msg !== null);
  }

  /**
   * Request assistance from capable agents
   */
  async requestAssistance(fromAgent, capability, context, urgency = 'normal') {
    // Find agents with the required capability
    const capableAgents = this.findAgentsByCapability(capability);

    if (capableAgents.length === 0) {
      console.warn(`No agents found with capability: ${capability}`);
      return null;
    }

    // Send assistance request to the best candidate
    const targetAgent = capableAgents[0]; // TODO: Improve selection logic

    const message = ProtocolHelpers.createAssistanceRequest(
      fromAgent,
      capability,
      context,
      urgency
    );

    return await this.sendMessage(fromAgent, targetAgent, message);
  }

  /**
   * Subscribe to messages for an agent
   */
  subscribe(agentName, callback) {
    if (!this.subscribers.has(agentName)) {
      this.subscribers.set(agentName, []);
    }

    this.subscribers.get(agentName).push(callback);
  }

  /**
   * Notify subscribers of new message
   */
  async notifySubscribers(agentName, message) {
    const callbacks = this.subscribers.get(agentName) || [];

    await Promise.all(
      callbacks.map(callback =>
        Promise.resolve(callback(message)).catch(error => {
          console.error(`Subscriber callback error:`, error);
        })
      )
    );
  }

  /**
   * Get messages for a specific agent
   */
  getMessagesForAgent(agentName, options = {}) {
    const messages = Array.from(this.messageQueue.values()).filter(
      msg => msg.to === agentName || msg.to === 'all'
    );

    // Apply filters
    if (options.type) {
      return messages.filter(msg => msg.type === options.type);
    }

    if (options.priority) {
      return messages.filter(msg => msg.priority === options.priority);
    }

    if (options.since) {
      return messages.filter(msg => msg.timestamp >= options.since);
    }

    return messages;
  }

  /**
   * Get agent context
   */
  getAgentContext(agentName) {
    return this.agentContexts.get(agentName) || null;
  }

  /**
   * Update agent statistics
   */
  updateAgentStats(agentName, action) {
    const context = this.agentContexts.get(agentName);
    if (!context) return;

    if (action === 'sent') {
      context.messagesSent++;
    } else if (action === 'received') {
      context.messagesReceived++;
    }

    context.lastActive = Date.now();
    this.agentContexts.set(agentName, context);
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability) {
    const agents = [];

    for (const [name, context] of this.agentContexts.entries()) {
      if (context.capabilities.includes(capability)) {
        agents.push(name);
      }
    }

    return agents;
  }

  /**
   * Get active agents
   */
  getActiveAgents() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    return Array.from(this.agentContexts.entries())
      .filter(([_, context]) => context.lastActive >= fiveMinutesAgo)
      .map(([name]) => name);
  }

  /**
   * Fetch relevant MCP data for message
   */
  async fetchRelevantMCPData(message) {
    const mcpData = {};

    // This would integrate with actual MCP servers
    // For now, return cached data if available
    if (message.requiresMCP) {
      for (const mcpServer of message.requiresMCP) {
        const cached = this.sharedMemory.getMCPData(message.from, mcpServer);
        if (cached) {
          mcpData[mcpServer] = cached.data;
        }
      }
    }

    return mcpData;
  }

  /**
   * Store MCP data for an agent
   */
  storeMCPData(agentName, mcpServer, data) {
    this.sharedMemory.setMCPData(agentName, mcpServer, data);
  }

  /**
   * Persist message to Memory Bank MCP
   */
  async persistToMemoryBank(message) {
    // TODO: Integrate with actual Memory Bank MCP
    // For now, store in shared memory
    const key = `message:${message.id}`;
    this.sharedMemory.set(key, message, 24 * 60 * 60 * 1000); // 24 hour TTL
  }

  /**
   * Log message to file
   */
  async logMessage(message) {
    const sanitized = MessageSerializer.sanitize(message);
    const logEntry = `[${new Date(message.timestamp).toISOString()}] ${message.from} → ${message.to}: ${message.type}\n${MessageSerializer.serialize(sanitized)}\n\n`;

    try {
      await fs.appendFile(this.logPath, logEntry);
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  /**
   * Add message to history
   */
  addToHistory(message) {
    this.messageHistory.push(message);

    // Trim history if too large
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get communication statistics
   */
  getStatistics() {
    const stats = {
      totalMessages: this.messageQueue.size,
      totalAgents: this.agentContexts.size,
      activeAgents: this.getActiveAgents().length,
      messagesByType: {},
      messagesByPriority: {},
      agentStats: []
    };

    // Count by type and priority
    for (const message of this.messageQueue.values()) {
      stats.messagesByType[message.type] = (stats.messagesByType[message.type] || 0) + 1;
      stats.messagesByPriority[message.priority] = (stats.messagesByPriority[message.priority] || 0) + 1;
    }

    // Agent statistics
    for (const [name, context] of this.agentContexts.entries()) {
      stats.agentStats.push({
        name,
        messagesSent: context.messagesSent,
        messagesReceived: context.messagesReceived,
        capabilities: context.capabilities,
        lastActive: context.lastActive
      });
    }

    return stats;
  }

  /**
   * Clear old messages from queue
   */
  clearOldMessages(maxAge = 3600000) { // Default 1 hour
    const cutoff = Date.now() - maxAge;

    for (const [id, message] of this.messageQueue.entries()) {
      if (message.timestamp < cutoff) {
        this.messageQueue.delete(id);
      }
    }
  }

  /**
   * Get message history for analysis
   */
  getMessageHistory(options = {}) {
    let history = [...this.messageHistory];

    if (options.agentName) {
      history = history.filter(
        msg => msg.from === options.agentName || msg.to === options.agentName
      );
    }

    if (options.type) {
      history = history.filter(msg => msg.type === options.type);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Shutdown the communication bus
   */
  async shutdown() {
    console.log('🛑 Shutting down Agent Communication Bus');

    // Save final statistics
    const stats = this.getStatistics();
    const statsPath = path.join(path.dirname(this.logPath), 'communication-stats.json');

    try {
      await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    } catch (error) {
      console.error('Failed to save statistics:', error);
    }

    // Clear all data
    this.messageQueue.clear();
    this.agentContexts.clear();
    this.sharedMemory.clear();
    this.messageHistory = [];
  }
}

module.exports = {
  AgentCommunicationBus,
  SharedMemoryStore
};