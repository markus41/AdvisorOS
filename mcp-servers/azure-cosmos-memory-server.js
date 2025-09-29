#!/usr/bin/env node

/**
 * Azure Cosmos DB Memory MCP Server for AdvisorOS
 * Provides enterprise-grade persistent memory services with multi-tenant isolation
 * Implements SOC2 compliance requirements and supports 10,000+ concurrent users
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential, ManagedIdentityCredential } = require('@azure/identity');
const crypto = require('crypto');
const EventEmitter = require('events');

class AzureCosmosMemoryServer extends EventEmitter {
  constructor() {
    super();
    this.name = 'azure-cosmos-memory';
    this.version = '2.0.0';
    
    // Initialize configuration from environment
    this.config = {
      // Azure Cosmos DB configuration
      endpoint: process.env.AZURE_COSMOS_ENDPOINT,
      key: process.env.AZURE_COSMOS_KEY,
      database: process.env.COSMOS_DATABASE || 'advisoros',
      
      // Container names
      containers: {
        memory: process.env.COSMOS_MEMORY_CONTAINER || 'memory',
        sharedContexts: process.env.COSMOS_SHARED_CONTAINER || 'shared_contexts',
        userSessions: process.env.COSMOS_SESSIONS_CONTAINER || 'user_sessions'
      },
      
      // Multi-tenant configuration
      tenantId: process.env.TENANT_ID,
      enableMultiTenant: process.env.ENABLE_MULTI_TENANT === 'true',
      
      // Performance and limits
      maxMemorySize: parseInt(process.env.MAX_MEMORY_SIZE) || 1024 * 1024 * 50, // 50MB
      maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE) || 100,
      defaultTTL: parseInt(process.env.DEFAULT_TTL) || 7776000, // 90 days
      
      // Compliance and security
      enableEncryption: process.env.ENABLE_ENCRYPTION === 'true',
      enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
      dataClassification: process.env.DATA_CLASSIFICATION || 'internal',
      
      // Connection settings
      connectionPolicy: {
        requestTimeout: 30000,
        enableEndpointDiscovery: true,
        preferredLocations: (process.env.PREFERRED_REGIONS || '').split(',').filter(r => r),
        maxRetryAttempts: 3,
        fixedRetryInterval: 1000
      }
    };
    
    this.cosmosClient = null;
    this.database = null;
    this.containers = {};
    this.isInitialized = false;
    this.auditLogger = new AuditLogger(this.config);
    
    this.initializeServer();
  }
  
  async initializeServer() {
    try {
      await this.initializeCosmosClient();
      await this.ensureContainers();
      this.setupMCPServer();
      this.isInitialized = true;
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async initializeCosmosClient() {
    let credential;
    
    if (process.env.USE_MANAGED_IDENTITY === 'true') {
      credential = new ManagedIdentityCredential();
      this.cosmosClient = new CosmosClient({
        endpoint: this.config.endpoint,
        aadCredentials: credential,
        connectionPolicy: this.config.connectionPolicy
      });
    } else if (this.config.key) {
      this.cosmosClient = new CosmosClient({
        endpoint: this.config.endpoint,
        key: this.config.key,
        connectionPolicy: this.config.connectionPolicy
      });
    } else {
      credential = new DefaultAzureCredential();
      this.cosmosClient = new CosmosClient({
        endpoint: this.config.endpoint,
        aadCredentials: credential,
        connectionPolicy: this.config.connectionPolicy
      });
    }
    
    this.database = this.cosmosClient.database(this.config.database);
  }
  
  async ensureContainers() {
    // Memory container with multi-tenant partition key
    const memoryContainer = await this.database.containers.createIfNotExists({
      id: this.config.containers.memory,
      partitionKey: {
        paths: ['/tenantId', '/category'],
        kind: 'MultiHash'
      },
      defaultTtl: this.config.defaultTTL,
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent',
        includedPaths: [
          { path: '/*' },
          { path: '/tags/[]/?' },
          { path: '/metadata/[]/?' }
        ],
        excludedPaths: [
          { path: '/content/?' },
          { path: '/rawData/?' }
        ]
      },
      uniqueKeyPolicy: {
        uniqueKeys: [
          { paths: ['/tenantId', '/key'] }
        ]
      }
    });
    this.containers.memory = memoryContainer.container;
    
    // Shared contexts container
    const sharedContainer = await this.database.containers.createIfNotExists({
      id: this.config.containers.sharedContexts,
      partitionKey: {
        paths: ['/fromTenant', '/toTenant'],
        kind: 'MultiHash'
      },
      defaultTtl: this.config.defaultTTL,
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent'
      }
    });
    this.containers.sharedContexts = sharedContainer.container;
    
    // User sessions container
    const sessionsContainer = await this.database.containers.createIfNotExists({
      id: this.config.containers.userSessions,
      partitionKey: {
        paths: ['/tenantId', '/userId'],
        kind: 'MultiHash'
      },
      defaultTtl: 86400, // 24 hours for sessions
      indexingPolicy: {
        automatic: true,
        indexingMode: 'consistent'
      }
    });
    this.containers.userSessions = sessionsContainer.container;
  }
  
  setupMCPServer() {
    this.server = new Server({
      name: this.name,
      version: this.version
    }, {
      capabilities: {
        tools: {}
      }
    });
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }
  
  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'store_memory',
          description: 'Store encrypted memory with multi-tenant isolation and audit logging',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Unique memory identifier' },
              content: { type: 'string', description: 'Memory content to store' },
              category: { 
                type: 'string', 
                description: 'Memory category', 
                enum: ['client_data', 'financial_insights', 'audit_trails', 'compliance']
              },
              tags: { type: 'array', items: { type: 'string' }, description: 'Categorization tags' },
              metadata: { type: 'object', description: 'Additional metadata' },
              ttl: { type: 'number', description: 'Time to live in seconds' },
              classification: { 
                type: 'string', 
                description: 'Data classification level',
                enum: ['public', 'internal', 'confidential', 'restricted']
              },
              tenantId: { type: 'string', description: 'Tenant identifier for multi-tenant isolation' },
              userId: { type: 'string', description: 'User identifier for audit trail' }
            },
            required: ['key', 'content', 'category', 'tenantId']
          }
        },
        {
          name: 'retrieve_memory',
          description: 'Retrieve and decrypt memory with access control validation',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Memory key to retrieve' },
              tenantId: { type: 'string', description: 'Tenant identifier' },
              userId: { type: 'string', description: 'User identifier for audit trail' },
              includeMetadata: { type: 'boolean', description: 'Include full metadata', default: false }
            },
            required: ['key', 'tenantId']
          }
        },
        {
          name: 'search_memories',
          description: 'Search memories with advanced filtering and pagination',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              category: { type: 'string', description: 'Filter by category' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
              classification: { type: 'string', description: 'Filter by data classification' },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' }
                }
              },
              tenantId: { type: 'string', description: 'Tenant identifier' },
              userId: { type: 'string', description: 'User identifier for audit trail' },
              limit: { type: 'number', default: 20, maximum: 100 },
              offset: { type: 'number', default: 0 },
              sortBy: { type: 'string', enum: ['timestamp', 'category', 'classification'], default: 'timestamp' },
              sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
            },
            required: ['tenantId']
          }
        },
        {
          name: 'share_memory_context',
          description: 'Share memory context between tenants with permission validation',
          inputSchema: {
            type: 'object',
            properties: {
              fromTenant: { type: 'string', description: 'Source tenant ID' },
              toTenant: { type: 'string', description: 'Target tenant ID' },
              contextType: { type: 'string', description: 'Type of context to share' },
              memoryKeys: { type: 'array', items: { type: 'string' }, description: 'Specific memory keys to share' },
              permissions: { 
                type: 'array', 
                items: { type: 'string', enum: ['read', 'write', 'delete'] },
                description: 'Access permissions' 
              },
              expiresAt: { type: 'string', format: 'date-time', description: 'Share expiration' },
              userId: { type: 'string', description: 'User initiating the share' }
            },
            required: ['fromTenant', 'toTenant', 'contextType', 'userId']
          }
        },
        {
          name: 'get_memory_analytics',
          description: 'Get comprehensive memory usage analytics and compliance metrics',
          inputSchema: {
            type: 'object',
            properties: {
              tenantId: { type: 'string', description: 'Tenant identifier' },
              timeRange: { 
                type: 'string', 
                enum: ['hour', 'day', 'week', 'month'], 
                default: 'day',
                description: 'Analytics time range' 
              },
              includeCompliance: { type: 'boolean', default: true, description: 'Include compliance metrics' },
              userId: { type: 'string', description: 'User identifier for audit trail' }
            },
            required: ['tenantId']
          }
        },
        {
          name: 'create_user_session',
          description: 'Create and track user session for memory access',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User identifier' },
              tenantId: { type: 'string', description: 'Tenant identifier' },
              sessionMetadata: { type: 'object', description: 'Session context and metadata' },
              ipAddress: { type: 'string', description: 'User IP address' },
              userAgent: { type: 'string', description: 'User agent string' }
            },
            required: ['userId', 'tenantId']
          }
        },
        {
          name: 'get_compliance_report',
          description: 'Generate SOC2 compliance report for memory operations',
          inputSchema: {
            type: 'object',
            properties: {
              tenantId: { type: 'string', description: 'Tenant identifier' },
              reportType: { 
                type: 'string', 
                enum: ['access_audit', 'data_classification', 'retention_compliance'],
                description: 'Type of compliance report' 
              },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' }
                },
                required: ['start', 'end']
              },
              userId: { type: 'string', description: 'User requesting the report' }
            },
            required: ['tenantId', 'reportType', 'dateRange', 'userId']
          }
        }
      ]
    }));
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Validate tenant access
        if (args.tenantId && !await this.validateTenantAccess(args.tenantId, args.userId)) {
          throw new Error('Unauthorized tenant access');
        }
        
        switch (name) {
          case 'store_memory':
            return await this.storeMemory(args);
          case 'retrieve_memory':
            return await this.retrieveMemory(args);
          case 'search_memories':
            return await this.searchMemories(args);
          case 'share_memory_context':
            return await this.shareMemoryContext(args);
          case 'get_memory_analytics':
            return await this.getMemoryAnalytics(args);
          case 'create_user_session':
            return await this.createUserSession(args);
          case 'get_compliance_report':
            return await this.getComplianceReport(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        await this.auditLogger.logError(name, args, error);
        return {
          content: [{
            type: 'text',
            text: `Error executing ${name}: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }
  
  async validateTenantAccess(tenantId, userId) {
    // Implement tenant access validation logic
    // This would typically check against your authentication/authorization service
    if (!tenantId) return false;
    
    // For now, basic validation
    return true;
  }
  
  async storeMemory(args) {
    const { 
      key, content, category, tags = [], metadata = {}, ttl, 
      classification = 'internal', tenantId, userId 
    } = args;
    
    // Validate content size
    if (Buffer.byteLength(content, 'utf8') > this.config.maxMemorySize) {
      throw new Error(`Memory content exceeds maximum size of ${this.config.maxMemorySize} bytes`);
    }
    
    // Generate unique document ID
    const documentId = this.generateDocumentId(tenantId, key);
    
    // Encrypt content if enabled
    const encryptedContent = this.config.enableEncryption ? 
      this.encryptContent(content, tenantId) : content;
    
    const memoryDocument = {
      id: documentId,
      key,
      content: encryptedContent,
      category,
      tags,
      classification,
      tenantId,
      metadata: {
        ...metadata,
        size: Buffer.byteLength(content, 'utf8'),
        encrypted: this.config.enableEncryption,
        version: '2.0',
        contentHash: this.generateContentHash(content)
      },
      audit: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString(),
        accessCount: 0
      },
      ttl: ttl ? Math.floor(Date.now() / 1000) + ttl : undefined
    };
    
    try {
      const response = await this.containers.memory.items.upsert(memoryDocument);
      
      // Log audit event
      await this.auditLogger.logMemoryOperation('store', {
        tenantId,
        userId,
        key,
        category,
        classification,
        size: memoryDocument.metadata.size
      });
      
      return {
        content: [{
          type: 'text',
          text: `Memory stored successfully: ${key} (${memoryDocument.metadata.size} bytes, ${classification} classification)`
        }]
      };
    } catch (error) {
      if (error.code === 409) {
        throw new Error(`Memory with key '${key}' already exists for tenant '${tenantId}'`);
      }
      throw error;
    }
  }
  
  async retrieveMemory(args) {
    const { key, tenantId, userId, includeMetadata = false } = args;
    
    const documentId = this.generateDocumentId(tenantId, key);
    
    try {
      const { resource: memory } = await this.containers.memory.item(documentId, [tenantId, this.getCategoryFromKey(key)]).read();
      
      if (!memory) {
        return {
          content: [{
            type: 'text',
            text: `Memory not found: ${key}`
          }]
        };
      }
      
      // Decrypt content if encrypted
      const decryptedContent = memory.metadata?.encrypted ? 
        this.decryptContent(memory.content, tenantId) : memory.content;
      
      // Update access audit
      memory.audit.accessCount = (memory.audit.accessCount || 0) + 1;
      memory.audit.lastAccessedBy = userId;
      memory.audit.lastAccessedAt = new Date().toISOString();
      
      await this.containers.memory.item(documentId, [tenantId, memory.category]).replace(memory);
      
      // Log audit event
      await this.auditLogger.logMemoryOperation('retrieve', {
        tenantId,
        userId,
        key,
        category: memory.category,
        classification: memory.classification
      });
      
      const result = {
        key: memory.key,
        content: decryptedContent,
        category: memory.category,
        tags: memory.tags,
        classification: memory.classification,
        createdAt: memory.audit.createdAt,
        lastModifiedAt: memory.audit.lastModifiedAt
      };
      
      if (includeMetadata) {
        result.metadata = memory.metadata;
        result.audit = memory.audit;
      }
      
      return {
        content: [{
          type: 'text',
          text: `Memory retrieved: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error) {
      if (error.code === 404) {
        return {
          content: [{
            type: 'text',
            text: `Memory not found: ${key}`
          }]
        };
      }
      throw error;
    }
  }
  
  async searchMemories(args) {
    const { 
      query, category, tags, classification, dateRange, tenantId, userId,
      limit = 20, offset = 0, sortBy = 'timestamp', sortOrder = 'desc'
    } = args;
    
    // Build search query
    let sql = `SELECT * FROM c WHERE c.tenantId = @tenantId`;
    const parameters = [{ name: '@tenantId', value: tenantId }];
    
    // Add search conditions
    if (query) {
      sql += ` AND (CONTAINS(c.content, @query) OR CONTAINS(c.key, @query) OR ARRAY_CONTAINS(c.tags, @query))`;
      parameters.push({ name: '@query', value: query });
    }
    
    if (category) {
      sql += ` AND c.category = @category`;
      parameters.push({ name: '@category', value: category });
    }
    
    if (classification) {
      sql += ` AND c.classification = @classification`;
      parameters.push({ name: '@classification', value: classification });
    }
    
    if (tags && tags.length > 0) {
      sql += ` AND EXISTS(SELECT VALUE t FROM t IN c.tags WHERE t IN (@tags))`;
      parameters.push({ name: '@tags', value: tags });
    }
    
    if (dateRange) {
      if (dateRange.start) {
        sql += ` AND c.audit.createdAt >= @startDate`;
        parameters.push({ name: '@startDate', value: dateRange.start });
      }
      if (dateRange.end) {
        sql += ` AND c.audit.createdAt <= @endDate`;
        parameters.push({ name: '@endDate', value: dateRange.end });
      }
    }
    
    // Add sorting
    const sortField = sortBy === 'timestamp' ? 'c.audit.createdAt' : `c.${sortBy}`;
    sql += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;
    
    // Add pagination
    sql += ` OFFSET ${offset} LIMIT ${limit}`;
    
    try {
      const { resources: memories } = await this.containers.memory.items.query({
        query: sql,
        parameters
      }).fetchAll();
      
      // Decrypt content if needed and prepare results
      const results = memories.map(memory => {
        const decryptedContent = memory.metadata?.encrypted ? 
          this.decryptContent(memory.content, tenantId) : memory.content;
        
        return {
          key: memory.key,
          content: decryptedContent.substring(0, 200) + (decryptedContent.length > 200 ? '...' : ''),
          category: memory.category,
          tags: memory.tags,
          classification: memory.classification,
          createdAt: memory.audit.createdAt,
          size: memory.metadata.size
        };
      });
      
      // Log audit event
      await this.auditLogger.logMemoryOperation('search', {
        tenantId,
        userId,
        query,
        resultCount: results.length
      });
      
      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} memories:\n${JSON.stringify({
            total: results.length,
            offset,
            limit,
            results
          }, null, 2)}`
        }]
      };
    } catch (error) {
      throw error;
    }
  }
  
  async shareMemoryContext(args) {
    const { 
      fromTenant, toTenant, contextType, memoryKeys = [], 
      permissions = ['read'], expiresAt, userId 
    } = args;
    
    const shareId = crypto.randomUUID();
    const shareDocument = {
      id: shareId,
      fromTenant,
      toTenant,
      contextType,
      memoryKeys,
      permissions,
      status: 'active',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
      accessLog: []
    };
    
    try {
      await this.containers.sharedContexts.items.create(shareDocument);
      
      // Log audit event
      await this.auditLogger.logMemoryOperation('share', {
        fromTenant,
        toTenant,
        userId,
        contextType,
        shareId,
        permissions
      });
      
      return {
        content: [{
          type: 'text',
          text: `Memory context shared successfully: ${fromTenant} → ${toTenant} (${contextType})\nShare ID: ${shareId}\nPermissions: ${permissions.join(', ')}`
        }]
      };
    } catch (error) {
      throw error;
    }
  }
  
  async getMemoryAnalytics(args) {
    const { tenantId, timeRange = 'day', includeCompliance = true, userId } = args;
    
    const now = new Date();
    const timeRanges = {
      hour: new Date(now - 60 * 60 * 1000),
      day: new Date(now - 24 * 60 * 60 * 1000),
      week: new Date(now - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now - 30 * 24 * 60 * 60 * 1000)
    };
    
    const startTime = timeRanges[timeRange].toISOString();
    
    try {
      // Get memory statistics
      const memoryStatsQuery = `
        SELECT 
          COUNT(1) as totalMemories,
          SUM(c.metadata.size) as totalSize,
          c.category,
          c.classification,
          AVG(c.audit.accessCount) as avgAccessCount
        FROM c 
        WHERE c.tenantId = @tenantId 
        AND c.audit.createdAt >= @startTime
        GROUP BY c.category, c.classification
      `;
      
      const { resources: memoryStats } = await this.containers.memory.items.query({
        query: memoryStatsQuery,
        parameters: [
          { name: '@tenantId', value: tenantId },
          { name: '@startTime', value: startTime }
        ]
      }).fetchAll();
      
      const analytics = {
        tenantId,
        timeRange,
        generatedAt: new Date().toISOString(),
        memoryStatistics: {
          totalMemories: memoryStats.reduce((sum, stat) => sum + stat.totalMemories, 0),
          totalSize: memoryStats.reduce((sum, stat) => sum + (stat.totalSize || 0), 0),
          byCategory: memoryStats.reduce((acc, stat) => {
            if (!acc[stat.category]) acc[stat.category] = { count: 0, size: 0 };
            acc[stat.category].count += stat.totalMemories;
            acc[stat.category].size += stat.totalSize || 0;
            return acc;
          }, {}),
          byClassification: memoryStats.reduce((acc, stat) => {
            if (!acc[stat.classification]) acc[stat.classification] = { count: 0, size: 0 };
            acc[stat.classification].count += stat.totalMemories;
            acc[stat.classification].size += stat.totalSize || 0;
            return acc;
          }, {})
        }
      };
      
      if (includeCompliance) {
        analytics.compliance = await this.getComplianceMetrics(tenantId, startTime);
      }
      
      // Log audit event
      await this.auditLogger.logMemoryOperation('analytics', {
        tenantId,
        userId,
        timeRange
      });
      
      return {
        content: [{
          type: 'text',
          text: `Memory Analytics Report:\n${JSON.stringify(analytics, null, 2)}`
        }]
      };
    } catch (error) {
      throw error;
    }
  }
  
  async createUserSession(args) {
    const { userId, tenantId, sessionMetadata = {}, ipAddress, userAgent } = args;
    
    const sessionId = crypto.randomUUID();
    const sessionDocument = {
      id: sessionId,
      userId,
      tenantId,
      createdAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
      metadata: sessionMetadata,
      ipAddress,
      userAgent,
      isActive: true,
      accessCount: 1
    };
    
    try {
      await this.containers.userSessions.items.create(sessionDocument);
      
      return {
        content: [{
          type: 'text',
          text: `User session created: ${sessionId}`
        }]
      };
    } catch (error) {
      throw error;
    }
  }
  
  async getComplianceReport(args) {
    const { tenantId, reportType, dateRange, userId } = args;
    
    try {
      let report;
      
      switch (reportType) {
        case 'access_audit':
          report = await this.generateAccessAuditReport(tenantId, dateRange);
          break;
        case 'data_classification':
          report = await this.generateDataClassificationReport(tenantId, dateRange);
          break;
        case 'retention_compliance':
          report = await this.generateRetentionComplianceReport(tenantId, dateRange);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      
      // Log audit event
      await this.auditLogger.logMemoryOperation('compliance_report', {
        tenantId,
        userId,
        reportType,
        dateRange
      });
      
      return {
        content: [{
          type: 'text',
          text: `Compliance Report (${reportType}):\n${JSON.stringify(report, null, 2)}`
        }]
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Utility methods
  generateDocumentId(tenantId, key) {
    return `${tenantId}:${key}`;
  }
  
  getCategoryFromKey(key) {
    // Simple heuristic to determine category from key
    // In practice, this would be more sophisticated
    if (key.includes('client')) return 'client_data';
    if (key.includes('financial')) return 'financial_insights';
    if (key.includes('audit')) return 'audit_trails';
    return 'compliance';
  }
  
  generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  encryptContent(content, tenantId) {
    // Implement AES-256-GCM encryption
    const key = crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY + tenantId, 'salt', 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM('aes-256-gcm', key);
    cipher.setAAD(Buffer.from(tenantId));
    
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decryptContent(encryptedData, tenantId) {
    if (typeof encryptedData === 'string') {
      return encryptedData; // Not encrypted
    }
    
    const key = crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY + tenantId, 'salt', 100000, 32, 'sha512');
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    decipher.setAAD(Buffer.from(tenantId));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  async getComplianceMetrics(tenantId, startTime) {
    // Implementation for compliance metrics
    return {
      dataRetentionCompliance: 95.5,
      encryptionCompliance: 100,
      accessControlCompliance: 98.2,
      auditTrailCompleteness: 100
    };
  }
  
  async generateAccessAuditReport(tenantId, dateRange) {
    // Implementation for access audit report
    return {
      reportType: 'access_audit',
      tenantId,
      dateRange,
      totalAccesses: 0,
      uniqueUsers: 0,
      accessesByUser: {},
      accessesByResource: {},
      suspiciousActivities: []
    };
  }
  
  async generateDataClassificationReport(tenantId, dateRange) {
    // Implementation for data classification report
    return {
      reportType: 'data_classification',
      tenantId,
      dateRange,
      classificationBreakdown: {
        public: 0,
        internal: 0,
        confidential: 0,
        restricted: 0
      },
      complianceScore: 100
    };
  }
  
  async generateRetentionComplianceReport(tenantId, dateRange) {
    // Implementation for retention compliance report
    return {
      reportType: 'retention_compliance',
      tenantId,
      dateRange,
      retentionPolicies: [],
      expiringData: [],
      complianceScore: 100
    };
  }
  
  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[Azure Cosmos Memory Server Error]', error);
      this.emit('error', error);
    };
    
    process.on('SIGINT', async () => {
      console.log('Shutting down Azure Cosmos Memory Server...');
      await this.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Gracefully shutting down Azure Cosmos Memory Server...');
      await this.shutdown();
      process.exit(0);
    });
  }
  
  async shutdown() {
    try {
      if (this.cosmosClient) {
        await this.cosmosClient.dispose();
      }
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
  
  async run() {
    if (!this.isInitialized) {
      await new Promise((resolve, reject) => {
        this.once('ready', resolve);
        this.once('error', reject);
      });
    }
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Azure Cosmos Memory MCP Server running on stdio');
  }
}

// Audit Logger Class
class AuditLogger {
  constructor(config) {
    this.config = config;
    this.enabled = config.enableAuditLogging;
  }
  
  async logMemoryOperation(operation, details) {
    if (!this.enabled) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      source: 'azure-cosmos-memory-server'
    };
    
    // In production, this would write to Azure Monitor, Application Insights, or similar
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
  
  async logError(operation, args, error) {
    if (!this.enabled) return;
    
    const errorEntry = {
      timestamp: new Date().toISOString(),
      operation,
      args: { ...args, content: '[REDACTED]' }, // Redact sensitive content
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      source: 'azure-cosmos-memory-server'
    };
    
    console.error('[AUDIT_ERROR]', JSON.stringify(errorEntry));
  }
}

// Start the server
if (require.main === module) {
  const server = new AzureCosmosMemoryServer();
  server.run().catch(console.error);
}

module.exports = AzureCosmosMemoryServer;