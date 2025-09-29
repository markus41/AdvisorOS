import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { openaiClient, type AIConfig, type TokenUsage, type AIResponse } from '@/lib/ai/openai-client'

// Mock the Azure OpenAI client
jest.mock('openai', () => ({
  AzureOpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    embeddings: {
      create: jest.fn(),
    },
  })),
}))

// Mock tiktoken
jest.mock('tiktoken', () => ({
  encoding_for_model: jest.fn().mockReturnValue({
    encode: jest.fn().mockReturnValue(new Array(10)), // Mock 10 tokens
    free: jest.fn(),
  }),
}))

// Mock the database connection
jest.mock('../../server/db', () => ({
  prisma: {
    aiUsage: {
      create: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}))

const { AzureOpenAI } = require('openai')
const { encoding_for_model } = require('tiktoken')

describe('OpenAI Client', () => {
  let mockClient: any
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env

    // Set up test environment variables
    process.env = {
      ...originalEnv,
      AZURE_OPENAI_API_KEY: 'test-api-key',
      AZURE_OPENAI_ENDPOINT: 'https://test-endpoint.openai.azure.com',
      AZURE_OPENAI_API_VERSION: '2024-02-15-preview',
      AZURE_OPENAI_DEPLOYMENT_NAME: 'gpt-4-test',
      AZURE_OPENAI_GPT35_DEPLOYMENT_NAME: 'gpt-35-turbo-test',
      AI_MAX_TOKENS_PER_REQUEST: '4000',
      AI_COST_LIMIT_PER_ORG_MONTHLY: '1000',
      AI_CONFIDENCE_THRESHOLD: '0.7',
      AI_FEATURES_ENABLED: 'true',
    }

    // Set up mock client
    mockClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      embeddings: {
        create: jest.fn(),
      },
    }

    AzureOpenAI.mockImplementation(() => mockClient)
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    jest.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      const config = openaiClient.getConfig()

      expect(config.apiKey).toBe('test-api-key')
      expect(config.endpoint).toBe('https://test-endpoint.openai.azure.com')
      expect(config.gpt4DeploymentName).toBe('gpt-4-test')
      expect(config.gpt35DeploymentName).toBe('gpt-35-turbo-test')
      expect(config.maxTokensPerRequest).toBe(4000)
      expect(config.costLimitPerOrgMonthly).toBe(1000)
      expect(config.confidenceThreshold).toBe(0.7)
      expect(config.enabled).toBe(true)
    })

    it('should not initialize when AI features are disabled', () => {
      process.env.AI_FEATURES_ENABLED = 'false'

      // Create a new instance with disabled features
      const { openaiClient: disabledClient } = require('@/lib/ai/openai-client')

      expect(disabledClient.isReady()).toBe(false)
    })

    it('should not initialize when API key is missing', () => {
      delete process.env.AZURE_OPENAI_API_KEY

      const { openaiClient: clientWithoutKey } = require('@/lib/ai/openai-client')

      expect(clientWithoutKey.isReady()).toBe(false)
    })

    it('should handle initialization errors gracefully', () => {
      AzureOpenAI.mockImplementation(() => {
        throw new Error('Initialization failed')
      })

      // This should not throw an error
      expect(() => {
        const { openaiClient: clientWithError } = require('@/lib/ai/openai-client')
        expect(clientWithError.isReady()).toBe(false)
      }).not.toThrow()
    })
  })

  describe('token counting', () => {
    it('should count tokens using tiktoken', () => {
      const mockEncode = jest.fn().mockReturnValue(new Array(15))
      const mockFree = jest.fn()

      encoding_for_model.mockReturnValue({
        encode: mockEncode,
        free: mockFree,
      })

      const count = openaiClient.countTokens('Hello world', 'gpt-4')

      expect(encoding_for_model).toHaveBeenCalledWith('gpt-4')
      expect(mockEncode).toHaveBeenCalledWith('Hello world')
      expect(mockFree).toHaveBeenCalled()
      expect(count).toBe(15)
    })

    it('should fallback to estimation when tiktoken fails', () => {
      encoding_for_model.mockImplementation(() => {
        throw new Error('Tiktoken error')
      })

      const count = openaiClient.countTokens('Hello world test', 'gpt-4')

      // Should be roughly text.length / 4
      expect(count).toBe(Math.ceil('Hello world test'.length / 4))
    })

    it('should handle empty text', () => {
      const mockEncode = jest.fn().mockReturnValue([])

      encoding_for_model.mockReturnValue({
        encode: mockEncode,
        free: jest.fn(),
      })

      const count = openaiClient.countTokens('', 'gpt-4')
      expect(count).toBe(0)
    })
  })

  describe('cost estimation', () => {
    it('should calculate cost for GPT-4', () => {
      const usage = { promptTokens: 1000, completionTokens: 500 }
      const cost = openaiClient.estimateCost(usage, 'gpt-4')

      // Expected: (1000/1000 * 0.03) + (500/1000 * 0.06) = 0.03 + 0.03 = 0.06
      expect(cost).toBe(0.06)
    })

    it('should calculate cost for GPT-3.5 Turbo', () => {
      const usage = { promptTokens: 1000, completionTokens: 500 }
      const cost = openaiClient.estimateCost(usage, 'gpt-35-turbo')

      // Expected: (1000/1000 * 0.0015) + (500/1000 * 0.002) = 0.0015 + 0.001 = 0.0025
      expect(cost).toBe(0.0025)
    })

    it('should fallback to GPT-3.5 pricing for unknown models', () => {
      const usage = { promptTokens: 1000, completionTokens: 500 }
      const cost = openaiClient.estimateCost(usage, 'unknown-model')

      // Should use gpt-35-turbo pricing
      expect(cost).toBe(0.0025)
    })

    it('should handle zero tokens', () => {
      const usage = { promptTokens: 0, completionTokens: 0 }
      const cost = openaiClient.estimateCost(usage, 'gpt-4')

      expect(cost).toBe(0)
    })
  })

  describe('createCompletion', () => {
    it('should create completion successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'AI response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const result = await openaiClient.createCompletion('Test prompt', {
        model: 'gpt-35-turbo',
        maxTokens: 100,
        temperature: 0.5,
      })

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-35-turbo-test',
        messages: [{ role: 'user', content: 'Test prompt' }],
        max_tokens: 100,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      expect(result.data).toBe('AI response')
      expect(result.usage.promptTokens).toBe(10)
      expect(result.usage.completionTokens).toBe(5)
      expect(result.usage.totalTokens).toBe(15)
      expect(result.model).toBe('gpt-35-turbo-test')
      expect(result.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
    })

    it('should include system message when provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'AI response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      await openaiClient.createCompletion('Test prompt', {
        systemMessage: 'You are a helpful assistant',
      })

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Test prompt' },
          ],
        })
      )
    })

    it('should use GPT-4 deployment when specified', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'AI response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      await openaiClient.createCompletion('Test prompt', {
        model: 'gpt-4',
      })

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-test',
        })
      )
    })

    it('should reject prompts that are too long', async () => {
      // Mock a very long prompt
      const longPrompt = 'A'.repeat(10000)

      encoding_for_model.mockReturnValue({
        encode: jest.fn().mockReturnValue(new Array(5000)), // 5000 tokens > 80% of 4000
        free: jest.fn(),
      })

      await expect(
        openaiClient.createCompletion(longPrompt)
      ).rejects.toThrow('Prompt too long: 5000 tokens exceeds limit')
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error')
      apiError.status = 429

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      await expect(
        openaiClient.createCompletion('Test prompt')
      ).rejects.toThrow('Rate limit exceeded. Please try again later.')
    })

    it('should handle authentication errors', async () => {
      const apiError = new Error('Unauthorized')
      apiError.status = 401

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      await expect(
        openaiClient.createCompletion('Test prompt')
      ).rejects.toThrow('Invalid API key or authentication failed.')
    })

    it('should handle forbidden errors', async () => {
      const apiError = new Error('Forbidden')
      apiError.status = 403

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      await expect(
        openaiClient.createCompletion('Test prompt')
      ).rejects.toThrow('Access forbidden. Check your Azure OpenAI permissions.')
    })

    it('should handle generic errors', async () => {
      const apiError = new Error('Unknown error')

      mockClient.chat.completions.create.mockRejectedValue(apiError)

      await expect(
        openaiClient.createCompletion('Test prompt')
      ).rejects.toThrow('AI service error: Unknown error')
    })

    it('should throw error when client is not ready', async () => {
      // Create a client that's not ready
      process.env.AI_FEATURES_ENABLED = 'false'
      const { openaiClient: notReadyClient } = require('@/lib/ai/openai-client')

      await expect(
        notReadyClient.createCompletion('Test prompt')
      ).rejects.toThrow('Azure OpenAI client is not initialized or disabled')
    })
  })

  describe('createStructuredCompletion', () => {
    it('should create structured completion with JSON response', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"result": "success", "value": 42}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const schema = { type: 'object', properties: { result: { type: 'string' }, value: { type: 'number' } } }
      const result = await openaiClient.createStructuredCompletion<{ result: string; value: number }>(
        'Test prompt',
        schema
      )

      expect(result.data).toEqual({ result: 'success', value: 42 })
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Respond with valid JSON only'),
            }),
          ]),
        })
      )
    })

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Invalid JSON response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const schema = { type: 'object' }

      await expect(
        openaiClient.createStructuredCompletion('Test prompt', schema)
      ).rejects.toThrow('Failed to parse AI response as JSON')
    })

    it('should merge system messages correctly', async () => {
      const mockResponse = {
        choices: [{ message: { content: '{"result": "success"}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const schema = { type: 'object' }
      await openaiClient.createStructuredCompletion('Test prompt', schema, {
        systemMessage: 'You are a helpful assistant',
      })

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('You are a helpful assistant'),
            }),
          ]),
        })
      )
    })
  })

  describe('createEmbedding', () => {
    it('should create embeddings successfully', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      }

      mockClient.embeddings.create.mockResolvedValue(mockResponse)

      const result = await openaiClient.createEmbedding('Test text')

      expect(mockClient.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: 'Test text',
      })

      expect(result.data).toEqual([0.1, 0.2, 0.3, 0.4, 0.5])
      expect(result.usage.promptTokens).toBe(5)
      expect(result.usage.completionTokens).toBe(0)
      expect(result.usage.totalTokens).toBe(5)
      expect(result.model).toBe('text-embedding-ada-002')
    })

    it('should use custom model when specified', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        usage: { prompt_tokens: 5, total_tokens: 5 },
      }

      mockClient.embeddings.create.mockResolvedValue(mockResponse)

      await openaiClient.createEmbedding('Test text', {
        model: 'custom-embedding-model',
      })

      expect(mockClient.embeddings.create).toHaveBeenCalledWith({
        model: 'custom-embedding-model',
        input: 'Test text',
      })
    })

    it('should handle embeddings API errors', async () => {
      const apiError = new Error('Embeddings error')
      mockClient.embeddings.create.mockRejectedValue(apiError)

      await expect(
        openaiClient.createEmbedding('Test text')
      ).rejects.toThrow('Embeddings service error: Embeddings error')
    })

    it('should throw error when client is not ready', async () => {
      process.env.AI_FEATURES_ENABLED = 'false'
      const { openaiClient: notReadyClient } = require('@/lib/ai/openai-client')

      await expect(
        notReadyClient.createEmbedding('Test text')
      ).rejects.toThrow('Azure OpenAI client is not initialized or disabled')
    })
  })

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'OK' } }],
        usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const result = await openaiClient.testConnection()

      expect(result).toBe(true)
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 5,
          temperature: 0,
        })
      )
    })

    it('should return false for failed connection', async () => {
      mockClient.chat.completions.create.mockRejectedValue(new Error('Connection failed'))

      const result = await openaiClient.testConnection()

      expect(result).toBe(false)
    })

    it('should return false when client is not ready', async () => {
      process.env.AI_FEATURES_ENABLED = 'false'
      const { openaiClient: notReadyClient } = require('@/lib/ai/openai-client')

      const result = await notReadyClient.testConnection()

      expect(result).toBe(false)
    })
  })

  describe('usage statistics', () => {
    it('should return default stats when database is not available', async () => {
      const stats = await openaiClient.getUsageStats('org_123', 'month')

      expect(stats).toEqual({
        totalTokens: 0,
        totalCost: 0,
        requests: 0,
        averageCostPerRequest: 0,
        topModels: [],
      })
    })

    it('should handle different time periods', async () => {
      const dayStats = await openaiClient.getUsageStats('org_123', 'day')
      const monthStats = await openaiClient.getUsageStats('org_123', 'month')
      const yearStats = await openaiClient.getUsageStats('org_123', 'year')

      expect(dayStats).toBeDefined()
      expect(monthStats).toBeDefined()
      expect(yearStats).toBeDefined()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle missing response content', async () => {
      const mockResponse = {
        choices: [{ message: {} }], // No content
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const result = await openaiClient.createCompletion('Test prompt')

      expect(result.data).toBe('')
    })

    it('should handle missing usage data', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        // No usage data
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const result = await openaiClient.createCompletion('Test prompt')

      expect(result.usage.promptTokens).toBe(0)
      expect(result.usage.completionTokens).toBe(0)
      expect(result.usage.totalTokens).toBe(0)
    })

    it('should handle empty embedding response', async () => {
      const mockResponse = {
        data: [], // No embeddings
        usage: { prompt_tokens: 5, total_tokens: 5 },
      }

      mockClient.embeddings.create.mockResolvedValue(mockResponse)

      const result = await openaiClient.createEmbedding('Test text')

      expect(result.data).toEqual([])
    })

    it('should handle very large numbers in cost calculation', async () => {
      const usage = {
        promptTokens: Number.MAX_SAFE_INTEGER,
        completionTokens: Number.MAX_SAFE_INTEGER
      }

      const cost = openaiClient.estimateCost(usage, 'gpt-4')

      expect(cost).toBeGreaterThan(0)
      expect(isFinite(cost)).toBe(true)
    })

    it('should handle malformed environment variables', () => {
      process.env.AI_MAX_TOKENS_PER_REQUEST = 'invalid'
      process.env.AI_COST_LIMIT_PER_ORG_MONTHLY = 'invalid'
      process.env.AI_CONFIDENCE_THRESHOLD = 'invalid'

      const { openaiClient: clientWithInvalidEnv } = require('@/lib/ai/openai-client')
      const config = clientWithInvalidEnv.getConfig()

      expect(isNaN(config.maxTokensPerRequest)).toBe(true)
      expect(isNaN(config.costLimitPerOrgMonthly)).toBe(true)
      expect(isNaN(config.confidenceThreshold)).toBe(true)
    })
  })

  describe('performance and reliability', () => {
    it('should handle concurrent requests', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const promises = Array.from({ length: 10 }, (_, i) =>
        openaiClient.createCompletion(`Test prompt ${i}`)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result, i) => {
        expect(result.data).toBe('Response')
        expect(result.requestId).toBeDefined()
        expect(result.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
      })
    })

    it('should generate unique request IDs', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
      }

      mockClient.chat.completions.create.mockResolvedValue(mockResponse)

      const promises = Array.from({ length: 5 }, () =>
        openaiClient.createCompletion('Test prompt')
      )

      const results = await Promise.all(promises)
      const requestIds = results.map(r => r.requestId)
      const uniqueIds = new Set(requestIds)

      expect(uniqueIds.size).toBe(5) // All IDs should be unique
    })
  })
})