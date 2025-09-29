#!/usr/bin/env node

/**
 * AdvisorOS Memory MCP Server
 * Provides persistent memory services for Claude Code and AdvisorOS
 * Integrates with Azure Cosmos DB and Redis for multi-tier memory architecture
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { CosmosClient } = require('@azure/cosmos');
const Redis = require('ioredis');

class AdvisorOSMemoryServer {
  constructor() {
    this.name = 'advisoros-memory';
    this.version = '1.0.0';

    // Initialize Azure Cosmos DB client
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.AZURE_COSMOS_ENDPOINT,
      key: process.env.AZURE_COSMOS_KEY
    });

    // Initialize Redis client for fast access
    this.redisClient = new Redis(process.env.AZURE_REDIS_CONNECTION);

    // Memory configuration
    this.config = {
      database: 'advisoros',
      container: 'memory',
      memoryScope: process.env.MEMORY_SCOPE || 'enterprise',
      projectId: process.env.PROJECT_ID || 'advisoros',
      cacheExpirySeconds: 3600, // 1 hour
      maxMemorySize: 1024 * 1024 * 10 // 10MB per memory entry
    };

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
          description: 'Store a memory in the persistent backend with metadata',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Unique identifier for the memory' },
              content: { type: 'string', description: 'Memory content' },
              category: { type: 'string', description: 'Memory category (client, financial, audit, etc.)' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
              ttl: { type: 'number', description: 'Time to live in seconds (optional)' }
            },
            required: ['key', 'content', 'category']
          }
        },
        {
          name: 'retrieve_memory',
          description: 'Retrieve a specific memory by key',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Memory key to retrieve' }
            },
            required: ['key']
          }
        },
        {
          name: 'search_memories',
          description: 'Search memories by content, category, or tags',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              category: { type: 'string', description: 'Filter by category (optional)' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags (optional)' },
              limit: { type: 'number', description: 'Maximum results to return', default: 10 }
            },
            required: ['query']
          }
        },
        {
          name: 'list_memory_categories',
          description: 'List all available memory categories',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'share_memory_context',
          description: 'Share memory context between projects or agents',
          inputSchema: {
            type: 'object',
            properties: {
              fromProject: { type: 'string', description: 'Source project ID' },
              toProject: { type: 'string', description: 'Target project ID' },
              contextType: { type: 'string', description: 'Type of context to share' },
              permissions: { type: 'array', items: { type: 'string' }, description: 'Access permissions' }
            },
            required: ['fromProject', 'toProject', 'contextType']
          }
        },
        {
          name: 'get_memory_stats',
          description: 'Get statistics about memory usage and performance',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: { type: 'string', description: 'Project ID for stats (optional)' }
            }
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'store_memory':
            return await this.storeMemory(args);
          case 'retrieve_memory':
            return await this.retrieveMemory(args);
          case 'search_memories':
            return await this.searchMemories(args);
          case 'list_memory_categories':
            return await this.listMemoryCategories(args);
          case 'share_memory_context':
            return await this.shareMemoryContext(args);
          case 'get_memory_stats':
            return await this.getMemoryStats(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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

  async storeMemory(args) {
    const { key, content, category, tags = [], ttl } = args;

    const memoryItem = {
      id: `${this.config.projectId}:${key}`,
      key,
      content,
      category,
      tags,
      projectId: this.config.projectId,
      scope: this.config.memoryScope,
      timestamp: new Date().toISOString(),
      ttl: ttl ? Date.now() + (ttl * 1000) : null,
      metadata: {
        size: Buffer.byteLength(content, 'utf8'),
        version: 1
      }
    };

    // Store in Cosmos DB for persistence
    const container = this.cosmosClient.database(this.config.database).container(this.config.container);
    await container.items.create(memoryItem);

    // Cache in Redis for fast access
    const cacheKey = `${this.config.projectId}:memory:${key}`;
    await this.redisClient.setex(
      cacheKey,
      ttl || this.config.cacheExpirySeconds,
      JSON.stringify(memoryItem)
    );

    return {
      content: [{
        type: 'text',
        text: `Memory stored successfully: ${key} (${memoryItem.metadata.size} bytes)`
      }]
    };
  }

  async retrieveMemory(args) {
    const { key } = args;
    const cacheKey = `${this.config.projectId}:memory:${key}`;

    // Try Redis cache first
    const cachedMemory = await this.redisClient.get(cacheKey);
    if (cachedMemory) {
      const memory = JSON.parse(cachedMemory);
      return {
        content: [{
          type: 'text',
          text: `Memory retrieved (cached): ${JSON.stringify(memory, null, 2)}`
        }]
      };
    }

    // Fallback to Cosmos DB
    const container = this.cosmosClient.database(this.config.database).container(this.config.container);
    const { resource: memory } = await container.item(`${this.config.projectId}:${key}`, this.config.projectId).read();

    if (memory) {
      // Cache the result
      await this.redisClient.setex(cacheKey, this.config.cacheExpirySeconds, JSON.stringify(memory));

      return {
        content: [{
          type: 'text',
          text: `Memory retrieved: ${JSON.stringify(memory, null, 2)}`
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: `Memory not found: ${key}`
      }]
    };
  }

  async searchMemories(args) {
    const { query, category, tags = [], limit = 10 } = args;

    // Build Cosmos DB query
    let sql = `SELECT * FROM c WHERE c.projectId = @projectId AND (CONTAINS(c.content, @query) OR CONTAINS(c.key, @query))`;
    const parameters = [
      { name: '@projectId', value: this.config.projectId },
      { name: '@query', value: query }
    ];

    if (category) {
      sql += ` AND c.category = @category`;
      parameters.push({ name: '@category', value: category });
    }

    if (tags.length > 0) {
      sql += ` AND EXISTS(SELECT VALUE t FROM t IN c.tags WHERE t IN (@tags))`;
      parameters.push({ name: '@tags', value: tags });
    }

    sql += ` ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`;

    const container = this.cosmosClient.database(this.config.database).container(this.config.container);
    const { resources: memories } = await container.items.query({
      query: sql,
      parameters
    }).fetchAll();

    return {
      content: [{
        type: 'text',
        text: `Found ${memories.length} memories:\n${JSON.stringify(memories, null, 2)}`
      }]
    };
  }

  async listMemoryCategories(args) {
    const sql = `SELECT DISTINCT c.category FROM c WHERE c.projectId = @projectId`;
    const container = this.cosmosClient.database(this.config.database).container(this.config.container);

    const { resources: categories } = await container.items.query({
      query: sql,
      parameters: [{ name: '@projectId', value: this.config.projectId }]
    }).fetchAll();

    return {
      content: [{
        type: 'text',
        text: `Available categories: ${categories.map(c => c.category).join(', ')}`
      }]
    };
  }

  async shareMemoryContext(args) {
    const { fromProject, toProject, contextType, permissions = ['read'] } = args;

    // Create a shared context record
    const sharedContext = {
      id: `shared:${fromProject}:${toProject}:${contextType}:${Date.now()}`,
      fromProject,
      toProject,
      contextType,
      permissions,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    const container = this.cosmosClient.database(this.config.database).container('shared_contexts');
    await container.items.create(sharedContext);

    return {
      content: [{
        type: 'text',
        text: `Memory context shared: ${fromProject} → ${toProject} (${contextType})`
      }]
    };
  }

  async getMemoryStats(args) {
    const { projectId = this.config.projectId } = args;

    // Get memory count and size from Cosmos DB
    const sql = `SELECT COUNT(1) as count, SUM(c.metadata.size) as totalSize FROM c WHERE c.projectId = @projectId`;
    const container = this.cosmosClient.database(this.config.database).container(this.config.container);

    const { resources: [stats] } = await container.items.query({
      query: sql,
      parameters: [{ name: '@projectId', value: projectId }]
    }).fetchAll();

    // Get Redis cache stats
    const cacheKeys = await this.redisClient.keys(`${projectId}:memory:*`);

    const memoryStats = {
      projectId,
      totalMemories: stats?.count || 0,
      totalSize: stats?.totalSize || 0,
      cachedMemories: cacheKeys.length,
      cacheHitRatio: 'N/A', // Would need to track this over time
      lastUpdated: new Date().toISOString()
    };

    return {
      content: [{
        type: 'text',
        text: `Memory Statistics:\n${JSON.stringify(memoryStats, null, 2)}`
      }]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('Shutting down AdvisorOS Memory Server...');
      await this.redisClient.quit();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AdvisorOS Memory MCP Server running on stdio');
  }
}

// Start the server
if (require.main === module) {
  const server = new AdvisorOSMemoryServer();
  server.run().catch(console.error);
}

module.exports = AdvisorOSMemoryServer;