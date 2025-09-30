/**
 * Agent Communication Protocols
 *
 * Defines message types, priorities, and validation rules for inter-agent communication
 * in the AdvisorOS multi-agent orchestration system.
 */

// Message Type Definitions
const MessageTypes = {
  // Information Sharing
  CONTEXT_SHARE: 'context_share',           // Share execution context
  FINDING_REPORT: 'finding_report',         // Report discoveries
  WARNING: 'warning',                       // Alert about issues

  // Requests
  ASSISTANCE_REQUEST: 'assistance_request', // Ask for help
  VALIDATION_REQUEST: 'validation_request', // Request review
  DATA_REQUEST: 'data_request',            // Request specific data

  // Responses
  CONTEXT_RESPONSE: 'context_response',     // Provide context
  VALIDATION_RESULT: 'validation_result',   // Review results
  DATA_RESPONSE: 'data_response',          // Provide requested data

  // Coordination
  HANDOFF: 'handoff',                      // Transfer control
  PROGRESS_UPDATE: 'progress_update',      // Status update
  COMPLETION: 'completion',                // Task completed

  // Learning
  PATTERN_DISCOVERED: 'pattern_discovered', // New pattern found
  OPTIMIZATION_TIP: 'optimization_tip',    // Improvement suggestion
  ERROR_REPORT: 'error_report'            // Error encountered
};

// Priority Levels
const MessagePriority = {
  CRITICAL: 'critical',  // Blocking issues
  HIGH: 'high',          // Important but not blocking
  NORMAL: 'normal',      // Standard communication
  LOW: 'low'            // Nice-to-have information
};

// Agent Capability Categories
const AgentCapabilities = {
  BACKEND_DEVELOPMENT: 'backend_development',
  FRONTEND_DEVELOPMENT: 'frontend_development',
  DATABASE_OPTIMIZATION: 'database_optimization',
  SECURITY_AUDIT: 'security_audit',
  TESTING: 'testing',
  DOCUMENTATION: 'documentation',
  AI_INTEGRATION: 'ai_integration',
  DEVOPS: 'devops',
  CPA_COMPLIANCE: 'cpa_compliance',
  PERFORMANCE: 'performance',
  ARCHITECTURE: 'architecture'
};

/**
 * Message Schema Validator
 */
class MessageValidator {
  /**
   * Validate message structure
   */
  static validateMessage(message) {
    const errors = [];

    // Required fields
    if (!message.id) errors.push('Missing message ID');
    if (!message.timestamp) errors.push('Missing timestamp');
    if (!message.from) errors.push('Missing sender agent');
    if (!message.to) errors.push('Missing recipient agent');
    if (!message.type) errors.push('Missing message type');

    // Type validation
    if (message.type && !Object.values(MessageTypes).includes(message.type)) {
      errors.push(`Invalid message type: ${message.type}`);
    }

    // Priority validation
    if (message.priority && !Object.values(MessagePriority).includes(message.priority)) {
      errors.push(`Invalid priority: ${message.priority}`);
    }

    // Payload validation by type
    if (message.type) {
      const payloadErrors = this.validatePayload(message.type, message.payload);
      errors.push(...payloadErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate payload based on message type
   */
  static validatePayload(messageType, payload) {
    const errors = [];

    if (!payload) {
      errors.push('Missing payload');
      return errors;
    }

    switch (messageType) {
      case MessageTypes.FINDING_REPORT:
        if (!payload.severity) errors.push('Finding report missing severity');
        if (!payload.issue) errors.push('Finding report missing issue description');
        break;

      case MessageTypes.ASSISTANCE_REQUEST:
        if (!payload.capability) errors.push('Assistance request missing capability');
        if (!payload.context) errors.push('Assistance request missing context');
        break;

      case MessageTypes.VALIDATION_REQUEST:
        if (!payload.changesImplemented) errors.push('Validation request missing changes');
        break;

      case MessageTypes.HANDOFF:
        if (!payload.task) errors.push('Handoff missing task description');
        if (!payload.context) errors.push('Handoff missing context');
        break;

      case MessageTypes.PATTERN_DISCOVERED:
        if (!payload.pattern) errors.push('Pattern discovery missing pattern details');
        if (!payload.confidence) errors.push('Pattern discovery missing confidence score');
        break;
    }

    return errors;
  }
}

/**
 * Message Builder - Fluent API for creating messages
 */
class MessageBuilder {
  constructor() {
    this.message = {
      id: this.generateId(),
      timestamp: Date.now(),
      priority: MessagePriority.NORMAL
    };
  }

  from(agentName) {
    this.message.from = agentName;
    return this;
  }

  to(agentName) {
    this.message.to = agentName;
    return this;
  }

  broadcast() {
    this.message.to = 'all';
    return this;
  }

  type(messageType) {
    this.message.type = messageType;
    return this;
  }

  priority(level) {
    this.message.priority = level;
    return this;
  }

  payload(data) {
    this.message.payload = data;
    return this;
  }

  context(contextData) {
    this.message.context = contextData;
    return this;
  }

  mcpData(data) {
    this.message.mcpData = data;
    return this;
  }

  build() {
    const validation = MessageValidator.validateMessage(this.message);
    if (!validation.valid) {
      throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
    }
    return this.message;
  }

  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Protocol Helper Functions
 */
class ProtocolHelpers {
  /**
   * Create a finding report message
   */
  static createFindingReport(fromAgent, severity, issue, details) {
    return new MessageBuilder()
      .from(fromAgent)
      .broadcast()
      .type(MessageTypes.FINDING_REPORT)
      .priority(severity === 'high' || severity === 'critical' ? MessagePriority.HIGH : MessagePriority.NORMAL)
      .payload({
        severity,
        issue,
        ...details
      })
      .build();
  }

  /**
   * Create an assistance request
   */
  static createAssistanceRequest(fromAgent, capability, context, urgency = 'normal') {
    return new MessageBuilder()
      .from(fromAgent)
      .to('orchestrator') // Orchestrator will route to capable agent
      .type(MessageTypes.ASSISTANCE_REQUEST)
      .priority(urgency === 'immediate' ? MessagePriority.HIGH : MessagePriority.NORMAL)
      .payload({
        capability,
        context,
        urgency
      })
      .build();
  }

  /**
   * Create a validation request
   */
  static createValidationRequest(fromAgent, toAgent, changes) {
    return new MessageBuilder()
      .from(fromAgent)
      .to(toAgent)
      .type(MessageTypes.VALIDATION_REQUEST)
      .priority(MessagePriority.HIGH)
      .payload({
        changesImplemented: changes.implemented,
        filesModified: changes.filesModified,
        requestingReview: true
      })
      .build();
  }

  /**
   * Create a handoff message
   */
  static createHandoff(fromAgent, toAgent, task, context, recommendations) {
    return new MessageBuilder()
      .from(fromAgent)
      .to(toAgent)
      .type(MessageTypes.HANDOFF)
      .priority(context.urgency === 'high' ? MessagePriority.HIGH : MessagePriority.NORMAL)
      .payload({
        task,
        context,
        recommendations
      })
      .build();
  }

  /**
   * Create a pattern discovery message
   */
  static createPatternDiscovery(fromAgent, pattern, confidence) {
    return new MessageBuilder()
      .from(fromAgent)
      .broadcast()
      .type(MessageTypes.PATTERN_DISCOVERED)
      .priority(MessagePriority.NORMAL)
      .payload({
        pattern: pattern.details,
        context: pattern.context,
        confidence,
        applicableTo: pattern.applicableTo || []
      })
      .build();
  }

  /**
   * Create a progress update
   */
  static createProgressUpdate(fromAgent, status, percentage, details) {
    return new MessageBuilder()
      .from(fromAgent)
      .to('orchestrator')
      .type(MessageTypes.PROGRESS_UPDATE)
      .priority(MessagePriority.LOW)
      .payload({
        status,
        percentage,
        details
      })
      .build();
  }
}

/**
 * Serialization utilities for complex data types
 */
class MessageSerializer {
  /**
   * Serialize message for storage
   */
  static serialize(message) {
    return JSON.stringify(message, null, 2);
  }

  /**
   * Deserialize message from storage
   */
  static deserialize(messageString) {
    try {
      return JSON.parse(messageString);
    } catch (error) {
      throw new Error(`Failed to deserialize message: ${error.message}`);
    }
  }

  /**
   * Sanitize sensitive data from message
   */
  static sanitize(message) {
    const sanitized = { ...message };

    // Remove sensitive fields
    if (sanitized.payload?.credentials) delete sanitized.payload.credentials;
    if (sanitized.payload?.secrets) delete sanitized.payload.secrets;
    if (sanitized.payload?.tokens) delete sanitized.payload.tokens;

    // Truncate large data
    if (sanitized.payload?.data && JSON.stringify(sanitized.payload.data).length > 10000) {
      sanitized.payload.data = '[Large data truncated]';
    }

    return sanitized;
  }
}

module.exports = {
  MessageTypes,
  MessagePriority,
  AgentCapabilities,
  MessageValidator,
  MessageBuilder,
  ProtocolHelpers,
  MessageSerializer
};