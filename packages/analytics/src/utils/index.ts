/**
 * Analytics Utilities - Performance Optimization and Helper Functions
 * Provides caching, performance monitoring, data validation, and utility functions
 */

import { Decimal } from 'decimal.js';
import { performance } from 'perf_hooks';
import * as crypto from 'crypto';
import { addDays, format, isValid } from 'date-fns';

/**
 * Performance Monitor - Tracks and optimizes analytics performance
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private activeOperations: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startOperation(operationName: string): string {
    const operationId = this.generateOperationId();
    const startTime = performance.now();

    this.activeOperations.set(operationId, startTime);

    return operationId;
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(operationId: string, operationName: string, metadata: Record<string, any> = {}): PerformanceMetric {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      throw new Error(`Operation ${operationId} not found`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      operationName,
      duration,
      timestamp: new Date(),
      metadata,
      memoryUsage: process.memoryUsage()
    };

    // Store metric
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    this.metrics.get(operationName)!.push(metric);

    // Cleanup
    this.activeOperations.delete(operationId);

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operationName: string): OperationStats | null {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);

    return {
      operationName,
      totalCalls: metrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      lastUpdated: new Date()
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): OperationStats[] {
    return Array.from(this.metrics.keys())
      .map(name => this.getOperationStats(name))
      .filter(stats => stats !== null) as OperationStats[];
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    for (const [operationName, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      this.metrics.set(operationName, filteredMetrics);
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

/**
 * Cache Manager - Intelligent caching for analytics data
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  };

  constructor(
    private maxSize: number = 1000,
    private defaultTTL: number = 300000 // 5 minutes
  ) {}

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.cacheStats.evictions++;
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = new Date();
    this.cacheStats.hits++;

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      value,
      createdAt: new Date(),
      lastAccessed: new Date(),
      expiresAt: new Date(Date.now() + (ttl || this.defaultTTL)),
      size: this.calculateSize(value)
    };

    this.cache.set(key, entry);
    this.updateCacheStats();
  }

  /**
   * Remove value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateCacheStats();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; size: number } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? this.cacheStats.hits / total : 0;

    return {
      ...this.cacheStats,
      hitRate,
      size: this.cache.size
    };
  }

  /**
   * Cache decorator for methods
   */
  cached<T extends any[], R>(
    keyGenerator: (...args: T) => string,
    ttl?: number
  ) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: T): Promise<R> {
        const cacheKey = keyGenerator(...args);

        // Try to get from cache
        const cached = this.get<R>(cacheKey);
        if (cached !== null) {
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Cache the result
        this.set(cacheKey, result, ttl);

        return result;
      };

      return descriptor;
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheStats.evictions++;
    }
  }

  private calculateSize(value: any): number {
    // Rough size calculation
    return JSON.stringify(value).length;
  }

  private updateCacheStats(): void {
    this.cacheStats.totalSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }
}

/**
 * Data Validator - Validates and sanitizes analytics data
 */
export class DataValidator {
  /**
   * Validate financial data
   */
  static validateFinancialData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.id) errors.push('Missing required field: id');
    if (!data.organizationId) errors.push('Missing required field: organizationId');
    if (!data.amount) errors.push('Missing required field: amount');
    if (!data.type) errors.push('Missing required field: type');

    // Data type validation
    if (data.amount && isNaN(parseFloat(data.amount.toString()))) {
      errors.push('Amount must be a valid number');
    }

    if (data.timestamp && !isValid(new Date(data.timestamp))) {
      errors.push('Timestamp must be a valid date');
    }

    // Business rule validation
    if (data.amount && parseFloat(data.amount.toString()) < 0 && data.type === 'income') {
      warnings.push('Negative amount for income transaction');
    }

    // Data consistency checks
    if (data.category && typeof data.category !== 'string') {
      errors.push('Category must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate prediction input
   */
  static validatePredictionInput(input: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.organizationId) errors.push('Missing required field: organizationId');
    if (!input.predictionType) errors.push('Missing required field: predictionType');
    if (!input.timeHorizon) errors.push('Missing required field: timeHorizon');

    if (input.timeHorizon && (input.timeHorizon < 1 || input.timeHorizon > 365)) {
      errors.push('Time horizon must be between 1 and 365 days');
    }

    if (input.confidence && (input.confidence < 0 || input.confidence > 1)) {
      errors.push('Confidence must be between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize data for security
   */
  static sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Remove potentially dangerous characters
      return data.replace(/[<>\"']/g, '');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }
}

/**
 * Analytics Metrics Calculator
 */
export class MetricsCalculator {
  /**
   * Calculate financial ratios
   */
  static calculateFinancialRatios(data: {
    currentAssets: Decimal;
    currentLiabilities: Decimal;
    totalAssets: Decimal;
    totalLiabilities: Decimal;
    equity: Decimal;
    revenue: Decimal;
    netIncome: Decimal;
    grossProfit: Decimal;
  }): FinancialRatios {
    return {
      currentRatio: data.currentLiabilities.gt(0)
        ? data.currentAssets.div(data.currentLiabilities)
        : new Decimal(0),

      debtToEquity: data.equity.gt(0)
        ? data.totalLiabilities.div(data.equity)
        : new Decimal(0),

      returnOnAssets: data.totalAssets.gt(0)
        ? data.netIncome.div(data.totalAssets)
        : new Decimal(0),

      returnOnEquity: data.equity.gt(0)
        ? data.netIncome.div(data.equity)
        : new Decimal(0),

      grossMargin: data.revenue.gt(0)
        ? data.grossProfit.div(data.revenue)
        : new Decimal(0),

      netMargin: data.revenue.gt(0)
        ? data.netIncome.div(data.revenue)
        : new Decimal(0),

      assetTurnover: data.totalAssets.gt(0)
        ? data.revenue.div(data.totalAssets)
        : new Decimal(0)
    };
  }

  /**
   * Calculate growth rates
   */
  static calculateGrowthRate(currentValue: Decimal, previousValue: Decimal): Decimal {
    if (previousValue.eq(0)) return new Decimal(0);
    return currentValue.minus(previousValue).div(previousValue);
  }

  /**
   * Calculate moving averages
   */
  static calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = values.slice(start, i + 1);
      const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      result.push(average);
    }

    return result;
  }

  /**
   * Calculate volatility (standard deviation)
   */
  static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (values.length - 1);

    return Math.sqrt(variance);
  }

  /**
   * Calculate correlation coefficient
   */
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

/**
 * Data Aggregator - Aggregates data for analytics
 */
export class DataAggregator {
  /**
   * Aggregate by time period
   */
  static aggregateByPeriod(
    data: any[],
    dateField: string,
    valueField: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
  ): any[] {
    const grouped = new Map<string, any[]>();

    for (const item of data) {
      const date = new Date(item[dateField]);
      const periodKey = this.formatPeriod(date, period);

      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, []);
      }
      grouped.get(periodKey)!.push(item);
    }

    const result: any[] = [];
    for (const [periodKey, items] of grouped.entries()) {
      const values = items.map(item => parseFloat(item[valueField]) || 0);

      let aggregatedValue: number;
      switch (aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        default:
          aggregatedValue = values.reduce((a, b) => a + b, 0);
      }

      result.push({
        period: periodKey,
        value: aggregatedValue,
        count: items.length,
        date: new Date(periodKey)
      });
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Group by category
   */
  static groupByCategory(
    data: any[],
    categoryField: string,
    valueField: string,
    aggregation: 'sum' | 'avg' | 'count' = 'sum'
  ): any[] {
    const grouped = new Map<string, number[]>();

    for (const item of data) {
      const category = item[categoryField] || 'Unknown';
      const value = parseFloat(item[valueField]) || 0;

      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(value);
    }

    const result: any[] = [];
    for (const [category, values] of grouped.entries()) {
      let aggregatedValue: number;

      switch (aggregation) {
        case 'sum':
          aggregatedValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        default:
          aggregatedValue = values.reduce((a, b) => a + b, 0);
      }

      result.push({
        category,
        value: aggregatedValue,
        count: values.length
      });
    }

    return result.sort((a, b) => b.value - a.value);
  }

  private static formatPeriod(date: Date, period: string): string {
    switch (period) {
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        // Start of week (Monday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        return format(weekStart, 'yyyy-MM-dd');
      case 'month':
        return format(date, 'yyyy-MM');
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case 'year':
        return format(date, 'yyyy');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  }
}

/**
 * Security utilities for analytics
 */
export class SecurityUtils {
  /**
   * Hash sensitive data
   */
  static hashData(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Encrypt sensitive data
   */
  static encryptData(data: string, key: string): string {
    const cipher = crypto.createCipher('aes192', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData: string, key: string): string {
    const decipher = crypto.createDecipher('aes192', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Mask sensitive information
   */
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) return '*'.repeat(data.length);

    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + visible;
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    // Update the requests array
    this.requests.set(identifier, recentRequests);

    // Check if under the limit
    if (recentRequests.length < this.maxRequests) {
      recentRequests.push(now);
      this.requests.set(identifier, recentRequests);
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// Type definitions
interface PerformanceMetric {
  operationName: string;
  duration: number;
  timestamp: Date;
  metadata: Record<string, any>;
  memoryUsage: NodeJS.MemoryUsage;
}

interface OperationStats {
  operationName: string;
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
  lastUpdated: Date;
}

interface CacheEntry {
  value: any;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FinancialRatios {
  currentRatio: Decimal;
  debtToEquity: Decimal;
  returnOnAssets: Decimal;
  returnOnEquity: Decimal;
  grossMargin: Decimal;
  netMargin: Decimal;
  assetTurnover: Decimal;
}

export type {
  PerformanceMetric,
  OperationStats,
  CacheEntry,
  CacheStats,
  ValidationResult,
  FinancialRatios
};