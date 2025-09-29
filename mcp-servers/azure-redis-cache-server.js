#!/usr/bin/env node

/**
 * Azure Redis Cache Integration Server for AdvisorOS
 * Provides high-performance caching with clustering, persistence, and real-time updates
 * Supports Redis Streams for cross-project memory notifications
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const Redis = require('ioredis');
const crypto = require('crypto');
const EventEmitter = require('events');

class AzureRedisCacheServer extends EventEmitter {
  constructor() {
    super();
    this.name = 'azure-redis-cache';
    this.version = '2.0.0';
    
    this.config = {
      // Redis connection configuration
      connectionString: process.env.AZURE_REDIS_CONNECTION_STRING,
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 6380,
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DATABASE) || 0,
      
      // Clustering configuration
      enableClustering: process.env.ENABLE_REDIS_CLUSTERING === 'true',
      clusterNodes: (process.env.REDIS_CLUSTER_NODES || '').split(',').filter(n => n),
      
      // Performance settings
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'advisoros:',
      defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL) || 3600, // 1 hour
      maxMemorySize: parseInt(process.env.REDIS_MAX_MEMORY) || 1024 * 1024 * 100, // 100MB
      
      // Streams configuration
      enableStreams: process.env.ENABLE_REDIS_STREAMS === 'true',
      streamName: process.env.REDIS_STREAM_NAME || 'advisoros:memory:events',
      consumerGroup: process.env.REDIS_CONSUMER_GROUP || 'memory-processors',
      consumerName: process.env.REDIS_CONSUMER_NAME || `consumer-${process.pid}`,
      
      // Pub/Sub configuration
      enablePubSub: process.env.ENABLE_REDIS_PUBSUB === 'true',
      notificationChannel: process.env.REDIS_NOTIFICATION_CHANNEL || 'advisoros:notifications',
      
      // Connection pooling
      maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS) || 10,
      minConnections: parseInt(process.env.REDIS_MIN_CONNECTIONS) || 2,
      
      // Retry and circuit breaker
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 1000,
      enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
      
      // Security
      enableTLS: process.env.REDIS_ENABLE_TLS === 'true',
      rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED !== 'false'
    };
    
    this.redis = null;
    this.subscriber = null;
    this.publisher = null;
    this.isInitialized = false;
    this.connectionPool = new Map();
    this.circuitBreaker = new CircuitBreaker();
    
    this.initializeRedis();
  }
  
  async initializeRedis() {
    try {
      const redisOptions = {
        password: this.config.password,
        db: this.config.database,
        keyPrefix: this.config.keyPrefix,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        maxRetriesPerRequest: this.config.maxRetries,
        enableOfflineQueue: this.config.enableOfflineQueue,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        family: 4
      };
      
      if (this.config.enableTLS) {
        redisOptions.tls = {
          rejectUnauthorized: this.config.rejectUnauthorized
        };
      }
      
      if (this.config.enableClustering && this.config.clusterNodes.length > 0) {
        // Initialize Redis Cluster
        this.redis = new Redis.Cluster(
          this.config.clusterNodes.map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) || 6380 };
          }),
          {
            redisOptions,
            enableReadyCheck: true,
            maxRedirections: 16,
            retryDelayOnFailover: this.config.retryDelayOnFailover
          }
        );
      } else if (this.config.connectionString) {
        // Initialize single Redis instance with connection string
        this.redis = new Redis(this.config.connectionString, redisOptions);
      } else {
        // Initialize single Redis instance with host/port
        this.redis = new Redis({
          host: this.config.host,
          port: this.config.port,
          ...redisOptions
        });
      }
      
      // Initialize pub/sub connections
      if (this.config.enablePubSub) {
        this.subscriber = this.redis.duplicate();
        this.publisher = this.redis.duplicate();
        await this.setupPubSub();
      }
      
      // Initialize streams
      if (this.config.enableStreams) {
        await this.setupStreams();
      }
      
      await this.redis.connect();
      
      this.setupEventHandlers();
      this.setupMCPServer();
      
      this.isInitialized = true;
      this.emit('ready');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  setupEventHandlers() {
    this.redis.on('connect', () => {
      console.log('Redis connected');
      this.circuitBreaker.onSuccess();
    });
    
    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
      this.circuitBreaker.onFailure();
      this.emit('error', error);
    });
    
    this.redis.on('close', () => {
      console.log('Redis connection closed');
    });
    
    this.redis.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
    
    if (this.config.enableClustering) {
      this.redis.on('node error', (error, node) => {
        console.error(`Redis cluster node error on ${node.options.host}:${node.options.port}:`, error);
      });
    }
  }
  
  async setupPubSub() {
    // Subscribe to notification channel
    await this.subscriber.subscribe(this.config.notificationChannel);
    
    this.subscriber.on('message', (channel, message) => {
      try {
        const notification = JSON.parse(message);
        this.handleNotification(notification);
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    });
  }
  
  async setupStreams() {
    try {
      // Create consumer group if it doesn't exist
      await this.redis.xgroup(
        'CREATE',
        this.config.streamName,
        this.config.consumerGroup,
        '$',
        'MKSTREAM'
      );
    } catch (error) {
      // Consumer group might already exist
      if (!error.message.includes('BUSYGROUP')) {
        console.error('Error creating consumer group:', error);
      }
    }
    
    // Start consuming stream events
    this.startStreamConsumer();
  }
  
  async startStreamConsumer() {
    const consumeStreams = async () => {
      try {
        const results = await this.redis.xreadgroup(
          'GROUP',
          this.config.consumerGroup,
          this.config.consumerName,
          'COUNT',
          10,
          'BLOCK',
          5000,
          'STREAMS',
          this.config.streamName,
          '>'
        );
        
        if (results) {
          for (const [stream, messages] of results) {
            for (const [id, fields] of messages) {
              await this.processStreamMessage(id, fields);
              // Acknowledge message
              await this.redis.xack(this.config.streamName, this.config.consumerGroup, id);
            }
          }
        }
      } catch (error) {
        console.error('Stream consumer error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retrying
      }
      
      // Continue consuming
      setImmediate(consumeStreams);
    };
    
    consumeStreams();
  }
  
  async processStreamMessage(messageId, fields) {
    try {
      const event = {
        id: messageId,
        type: fields[1], // fields are in key-value pairs
        data: fields.length > 3 ? JSON.parse(fields[3]) : {},
        timestamp: new Date().toISOString()
      };
      
      this.emit('streamEvent', event);
    } catch (error) {
      console.error('Error processing stream message:', error);
    }
  }
  
  handleNotification(notification) {
    this.emit('notification', notification);
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'cache_set',
          description: 'Store data in Redis cache with optional TTL and clustering support',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Cache key' },
              value: { type: 'string', description: 'Value to cache' },
              ttl: { type: 'number', description: 'Time to live in seconds' },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' },
              compress: { type: 'boolean', default: false, description: 'Compress large values' }
            },
            required: ['key', 'value']
          }
        },
        {
          name: 'cache_get',
          description: 'Retrieve data from Redis cache with automatic decompression',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Cache key to retrieve' },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' }
            },
            required: ['key']
          }
        },
        {
          name: 'cache_delete',
          description: 'Delete data from Redis cache',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Cache key to delete' },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' }
            },
            required: ['key']
          }
        },
        {
          name: 'cache_list_keys',
          description: 'List cache keys with pattern matching and pagination',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: { type: 'string', default: '*', description: 'Key pattern to match' },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' },
              limit: { type: 'number', default: 100, maximum: 1000, description: 'Maximum keys to return' },
              cursor: { type: 'string', default: '0', description: 'Cursor for pagination' }
            }
          }
        },
        {
          name: 'cache_batch_set',
          description: 'Set multiple cache entries in a single operation',
          inputSchema: {
            type: 'object',
            properties: {
              entries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    value: { type: 'string' },
                    ttl: { type: 'number' }
                  },
                  required: ['key', 'value']
                },
                maxItems: 100
              },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' }
            },
            required: ['entries']
          }
        },
        {
          name: 'cache_batch_get',
          description: 'Get multiple cache entries in a single operation',
          inputSchema: {
            type: 'object',
            properties: {
              keys: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 100
              },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' }
            },
            required: ['keys']
          }
        },
        {
          name: 'publish_notification',
          description: 'Publish real-time notification to subscribers',
          inputSchema: {
            type: 'object',
            properties: {
              channel: { type: 'string', description: 'Notification channel' },
              message: { type: 'object', description: 'Notification payload' },
              tenantId: { type: 'string', description: 'Tenant identifier' }
            },
            required: ['channel', 'message']
          }
        },
        {
          name: 'stream_add_event',
          description: 'Add event to Redis Stream for cross-project notifications',
          inputSchema: {
            type: 'object',
            properties: {
              eventType: { type: 'string', description: 'Type of event' },
              eventData: { type: 'object', description: 'Event payload' },
              tenantId: { type: 'string', description: 'Tenant identifier' },
              maxLen: { type: 'number', default: 10000, description: 'Maximum stream length' }
            },
            required: ['eventType', 'eventData']
          }
        },
        {
          name: 'get_cache_stats',
          description: 'Get comprehensive Redis cache statistics and health metrics',
          inputSchema: {
            type: 'object',
            properties: {
              tenantId: { type: 'string', description: 'Tenant identifier for filtered stats' },
              includeClusterInfo: { type: 'boolean', default: false, description: 'Include cluster information' }
            }
          }
        },
        {
          name: 'cache_invalidate_pattern',
          description: 'Invalidate cache entries matching a pattern',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: 'Pattern to match for invalidation' },
              tenantId: { type: 'string', description: 'Tenant identifier for isolation' }
            },
            required: ['pattern']
          }
        },
        {
          name: 'setup_cache_warming',
          description: 'Set up cache warming for frequently accessed data',
          inputSchema: {
            type: 'object',
            properties: {
              warmingConfig: {
                type: 'object',
                properties: {
                  keys: { type: 'array', items: { type: 'string' } },
                  schedule: { type: 'string', description: 'Cron-like schedule' },
                  ttl: { type: 'number', description: 'TTL for warmed cache entries' }
                }
              },
              tenantId: { type: 'string', description: 'Tenant identifier' }
            },
            required: ['warmingConfig']
          }
        }
      ]
    }));
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        if (this.circuitBreaker.isOpen()) {
          throw new Error('Redis circuit breaker is open - service temporarily unavailable');
        }
        
        switch (name) {
          case 'cache_set':
            return await this.cacheSet(args);
          case 'cache_get':
            return await this.cacheGet(args);
          case 'cache_delete':
            return await this.cacheDelete(args);
          case 'cache_list_keys':
            return await this.cacheListKeys(args);
          case 'cache_batch_set':
            return await this.cacheBatchSet(args);
          case 'cache_batch_get':
            return await this.cacheBatchGet(args);
          case 'publish_notification':
            return await this.publishNotification(args);
          case 'stream_add_event':
            return await this.streamAddEvent(args);
          case 'get_cache_stats':
            return await this.getCacheStats(args);
          case 'cache_invalidate_pattern':
            return await this.cacheInvalidatePattern(args);
          case 'setup_cache_warming':
            return await this.setupCacheWarming(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.circuitBreaker.onFailure();
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
  
  generateTenantKey(key, tenantId) {
    return tenantId ? `tenant:${tenantId}:${key}` : key;
  }
  
  async cacheSet(args) {
    const { key, value, ttl = this.config.defaultTTL, tenantId, compress = false } = args;
    
    if (Buffer.byteLength(value, 'utf8') > this.config.maxMemorySize) {
      throw new Error(`Value size exceeds maximum allowed size of ${this.config.maxMemorySize} bytes`);
    }
    
    const fullKey = this.generateTenantKey(key, tenantId);
    let processedValue = value;
    
    if (compress && Buffer.byteLength(value, 'utf8') > 1024) {
      processedValue = this.compressValue(value);
    }
    
    const metadata = {
      compressed: compress && Buffer.byteLength(value, 'utf8') > 1024,
      originalSize: Buffer.byteLength(value, 'utf8'),
      timestamp: new Date().toISOString(),
      tenantId: tenantId || 'default'
    };
    
    const cacheEntry = {
      value: processedValue,
      metadata
    };
    
    await this.redis.setex(fullKey, ttl, JSON.stringify(cacheEntry));
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Cache entry set: ${fullKey} (TTL: ${ttl}s, Size: ${metadata.originalSize} bytes${metadata.compressed ? ', Compressed' : ''})`
      }]
    };
  }
  
  async cacheGet(args) {
    const { key, tenantId } = args;
    const fullKey = this.generateTenantKey(key, tenantId);
    
    const cachedData = await this.redis.get(fullKey);
    
    if (!cachedData) {
      return {
        content: [{
          type: 'text',
          text: `Cache miss: ${fullKey}`
        }]
      };
    }
    
    try {
      const cacheEntry = JSON.parse(cachedData);
      let value = cacheEntry.value;
      
      if (cacheEntry.metadata?.compressed) {
        value = this.decompressValue(value);
      }
      
      this.circuitBreaker.onSuccess();
      
      return {
        content: [{
          type: 'text',
          text: `Cache hit: ${fullKey}\nValue: ${value}\nMetadata: ${JSON.stringify(cacheEntry.metadata, null, 2)}`
        }]
      };
    } catch (error) {
      // Fallback for old cache format
      return {
        content: [{
          type: 'text',
          text: `Cache hit (legacy format): ${fullKey}\nValue: ${cachedData}`
        }]
      };
    }
  }
  
  async cacheDelete(args) {
    const { key, tenantId } = args;
    const fullKey = this.generateTenantKey(key, tenantId);
    
    const deleted = await this.redis.del(fullKey);
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: deleted > 0 ? `Cache entry deleted: ${fullKey}` : `Cache entry not found: ${fullKey}`
      }]
    };
  }
  
  async cacheListKeys(args) {
    const { pattern = '*', tenantId, limit = 100, cursor = '0' } = args;
    const searchPattern = tenantId ? this.generateTenantKey(pattern, tenantId) : pattern;
    
    const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', searchPattern, 'COUNT', limit);
    
    const results = {
      keys,
      cursor: nextCursor,
      hasMore: nextCursor !== '0',
      count: keys.length
    };
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Found ${keys.length} keys matching pattern '${searchPattern}':\n${JSON.stringify(results, null, 2)}`
      }]
    };
  }
  
  async cacheBatchSet(args) {
    const { entries, tenantId } = args;
    
    if (entries.length > 100) {
      throw new Error('Batch size exceeds maximum limit of 100 entries');
    }
    
    const pipeline = this.redis.pipeline();
    const processedEntries = [];
    
    for (const entry of entries) {
      const fullKey = this.generateTenantKey(entry.key, tenantId);
      const ttl = entry.ttl || this.config.defaultTTL;
      
      const metadata = {
        compressed: false,
        originalSize: Buffer.byteLength(entry.value, 'utf8'),
        timestamp: new Date().toISOString(),
        tenantId: tenantId || 'default'
      };
      
      const cacheEntry = {
        value: entry.value,
        metadata
      };
      
      pipeline.setex(fullKey, ttl, JSON.stringify(cacheEntry));
      processedEntries.push({ key: fullKey, ttl, size: metadata.originalSize });
    }
    
    const results = await pipeline.exec();
    const successCount = results.filter(([error]) => !error).length;
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Batch set completed: ${successCount}/${entries.length} entries set successfully\n${JSON.stringify(processedEntries, null, 2)}`
      }]
    };
  }
  
  async cacheBatchGet(args) {
    const { keys, tenantId } = args;
    
    if (keys.length > 100) {
      throw new Error('Batch size exceeds maximum limit of 100 keys');
    }
    
    const fullKeys = keys.map(key => this.generateTenantKey(key, tenantId));
    const values = await this.redis.mget(...fullKeys);
    
    const results = fullKeys.map((fullKey, index) => {
      const originalKey = keys[index];
      const value = values[index];
      
      if (!value) {
        return { key: originalKey, found: false };
      }
      
      try {
        const cacheEntry = JSON.parse(value);
        let processedValue = cacheEntry.value;
        
        if (cacheEntry.metadata?.compressed) {
          processedValue = this.decompressValue(processedValue);
        }
        
        return {
          key: originalKey,
          found: true,
          value: processedValue,
          metadata: cacheEntry.metadata
        };
      } catch (error) {
        // Fallback for old cache format
        return {
          key: originalKey,
          found: true,
          value,
          metadata: { legacy: true }
        };
      }
    });
    
    this.circuitBreaker.onSuccess();
    
    const foundCount = results.filter(r => r.found).length;
    
    return {
      content: [{
        type: 'text',
        text: `Batch get completed: ${foundCount}/${keys.length} entries found\n${JSON.stringify(results, null, 2)}`
      }]
    };
  }
  
  async publishNotification(args) {
    const { channel, message, tenantId } = args;
    
    if (!this.config.enablePubSub) {
      throw new Error('Pub/Sub is not enabled');
    }
    
    const notification = {
      ...message,
      tenantId: tenantId || 'default',
      timestamp: new Date().toISOString(),
      source: 'redis-cache-server'
    };
    
    const fullChannel = tenantId ? `tenant:${tenantId}:${channel}` : channel;
    const subscribers = await this.publisher.publish(fullChannel, JSON.stringify(notification));
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Notification published to ${fullChannel}: ${subscribers} subscribers received the message`
      }]
    };
  }
  
  async streamAddEvent(args) {
    const { eventType, eventData, tenantId, maxLen = 10000 } = args;
    
    if (!this.config.enableStreams) {
      throw new Error('Redis Streams are not enabled');
    }
    
    const streamKey = tenantId ? `${this.config.streamName}:${tenantId}` : this.config.streamName;
    
    const eventId = await this.redis.xadd(
      streamKey,
      'MAXLEN', '~', maxLen,
      '*',
      'type', eventType,
      'data', JSON.stringify(eventData),
      'tenant', tenantId || 'default',
      'timestamp', new Date().toISOString()
    );
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Event added to stream ${streamKey}: ${eventId}\nType: ${eventType}\nData: ${JSON.stringify(eventData, null, 2)}`
      }]
    };
  }
  
  async getCacheStats(args) {
    const { tenantId, includeClusterInfo = false } = args;
    
    const info = await this.redis.info();
    const memory = await this.redis.info('memory');
    const stats = await this.redis.info('stats');
    
    const cacheStats = {
      connection: {
        connected: this.redis.status === 'ready',
        clustered: this.config.enableClustering
      },
      memory: this.parseRedisInfo(memory),
      stats: this.parseRedisInfo(stats),
      circuitBreaker: {
        state: this.circuitBreaker.getState(),
        failures: this.circuitBreaker.failures,
        lastFailure: this.circuitBreaker.lastFailure
      }
    };
    
    if (tenantId) {
      const tenantPattern = this.generateTenantKey('*', tenantId);
      const [, tenantKeys] = await this.redis.scan('0', 'MATCH', tenantPattern, 'COUNT', 1000);
      cacheStats.tenant = {
        tenantId,
        keyCount: tenantKeys.length,
        sampleKeys: tenantKeys.slice(0, 10)
      };
    }
    
    if (includeClusterInfo && this.config.enableClustering) {
      cacheStats.cluster = await this.getClusterInfo();
    }
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Redis Cache Statistics:\n${JSON.stringify(cacheStats, null, 2)}`
      }]
    };
  }
  
  async cacheInvalidatePattern(args) {
    const { pattern, tenantId } = args;
    const searchPattern = tenantId ? this.generateTenantKey(pattern, tenantId) : pattern;
    
    let cursor = '0';
    let deletedCount = 0;
    
    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', searchPattern, 'COUNT', 100);
      cursor = nextCursor;
      
      if (keys.length > 0) {
        const deleted = await this.redis.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== '0');
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Cache invalidation completed: ${deletedCount} entries deleted matching pattern '${searchPattern}'`
      }]
    };
  }
  
  async setupCacheWarming(args) {
    const { warmingConfig, tenantId } = args;
    
    // Store warming configuration
    const configKey = tenantId ? 
      `warming:config:${tenantId}` : 
      'warming:config:default';
    
    const config = {
      ...warmingConfig,
      tenantId: tenantId || 'default',
      createdAt: new Date().toISOString(),
      enabled: true
    };
    
    await this.redis.set(configKey, JSON.stringify(config));
    
    // In a production environment, you would set up a scheduler here
    // For now, we'll just acknowledge the configuration
    
    this.circuitBreaker.onSuccess();
    
    return {
      content: [{
        type: 'text',
        text: `Cache warming configured for ${config.keys.length} keys\nSchedule: ${config.schedule}\nTTL: ${config.ttl}s`
      }]
    };
  }
  
  // Utility methods
  compressValue(value) {
    const zlib = require('zlib');
    return zlib.gzipSync(value).toString('base64');
  }
  
  decompressValue(compressedValue) {
    const zlib = require('zlib');
    return zlib.gunzipSync(Buffer.from(compressedValue, 'base64')).toString();
  }
  
  parseRedisInfo(infoString) {
    const result = {};
    const lines = infoString.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value !== undefined) {
          result[key] = isNaN(value) ? value : Number(value);
        }
      }
    }
    
    return result;
  }
  
  async getClusterInfo() {
    if (!this.config.enableClustering) {
      return null;
    }
    
    try {
      const nodes = await this.redis.cluster('NODES');
      const slots = await this.redis.cluster('SLOTS');
      
      return {
        nodes: nodes.split('\n').filter(line => line.trim()),
        slots: slots.length,
        state: await this.redis.cluster('INFO')
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[Azure Redis Cache Server Error]', error);
      this.emit('error', error);
    };
    
    process.on('SIGINT', async () => {
      console.log('Shutting down Azure Redis Cache Server...');
      await this.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Gracefully shutting down Azure Redis Cache Server...');
      await this.shutdown();
      process.exit(0);
    });
  }
  
  async shutdown() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
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
    console.error('Azure Redis Cache MCP Server running on stdio');
  }
}

// Circuit Breaker Implementation
class CircuitBreaker {
  constructor() {
    this.failures = 0;
    this.lastFailure = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.threshold = 5;
    this.timeout = 60000; // 1 minute
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  isOpen() {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure.getTime() > this.timeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure
    };
  }
}

// Start the server
if (require.main === module) {
  const server = new AzureRedisCacheServer();
  server.run().catch(console.error);
}

module.exports = AzureRedisCacheServer;