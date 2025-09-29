"use strict";
/**
 * Analytics Utilities - Performance Optimization and Helper Functions
 * Provides caching, performance monitoring, data validation, and utility functions
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = exports.SecurityUtils = exports.DataAggregator = exports.MetricsCalculator = exports.DataValidator = exports.CacheManager = exports.PerformanceMonitor = void 0;
var decimal_js_1 = require("decimal.js");
var perf_hooks_1 = require("perf_hooks");
var crypto = require("crypto");
var date_fns_1 = require("date-fns");
/**
 * Performance Monitor - Tracks and optimizes analytics performance
 */
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.metrics = new Map();
        this.activeOperations = new Map();
    }
    /**
     * Start timing an operation
     */
    PerformanceMonitor.prototype.startOperation = function (operationName) {
        var operationId = this.generateOperationId();
        var startTime = perf_hooks_1.performance.now();
        this.activeOperations.set(operationId, startTime);
        return operationId;
    };
    /**
     * End timing an operation and record metrics
     */
    PerformanceMonitor.prototype.endOperation = function (operationId, operationName, metadata) {
        if (metadata === void 0) { metadata = {}; }
        var startTime = this.activeOperations.get(operationId);
        if (!startTime) {
            throw new Error("Operation ".concat(operationId, " not found"));
        }
        var endTime = perf_hooks_1.performance.now();
        var duration = endTime - startTime;
        var metric = {
            operationName: operationName,
            duration: duration,
            timestamp: new Date(),
            metadata: metadata,
            memoryUsage: process.memoryUsage()
        };
        // Store metric
        if (!this.metrics.has(operationName)) {
            this.metrics.set(operationName, []);
        }
        this.metrics.get(operationName).push(metric);
        // Cleanup
        this.activeOperations.delete(operationId);
        // Log slow operations
        if (duration > 5000) { // 5 seconds
            console.warn("Slow operation detected: ".concat(operationName, " took ").concat(duration.toFixed(2), "ms"));
        }
        return metric;
    };
    /**
     * Get performance statistics for an operation
     */
    PerformanceMonitor.prototype.getOperationStats = function (operationName) {
        var metrics = this.metrics.get(operationName);
        if (!metrics || metrics.length === 0) {
            return null;
        }
        var durations = metrics.map(function (m) { return m.duration; });
        return {
            operationName: operationName,
            totalCalls: metrics.length,
            averageDuration: durations.reduce(function (a, b) { return a + b; }, 0) / durations.length,
            minDuration: Math.min.apply(Math, durations),
            maxDuration: Math.max.apply(Math, durations),
            p95Duration: this.calculatePercentile(durations, 95),
            p99Duration: this.calculatePercentile(durations, 99),
            lastUpdated: new Date()
        };
    };
    /**
     * Get all performance statistics
     */
    PerformanceMonitor.prototype.getAllStats = function () {
        var _this = this;
        return Array.from(this.metrics.keys())
            .map(function (name) { return _this.getOperationStats(name); })
            .filter(function (stats) { return stats !== null; });
    };
    /**
     * Clear old metrics to prevent memory leaks
     */
    PerformanceMonitor.prototype.cleanup = function (olderThanHours) {
        if (olderThanHours === void 0) { olderThanHours = 24; }
        var cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        for (var _i = 0, _a = this.metrics.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], operationName = _b[0], metrics = _b[1];
            var filteredMetrics = metrics.filter(function (m) { return m.timestamp > cutoffTime; });
            this.metrics.set(operationName, filteredMetrics);
        }
    };
    PerformanceMonitor.prototype.generateOperationId = function () {
        return "op_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    PerformanceMonitor.prototype.calculatePercentile = function (values, percentile) {
        var sorted = values.slice().sort(function (a, b) { return a - b; });
        var index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    };
    return PerformanceMonitor;
}());
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Cache Manager - Intelligent caching for analytics data
 */
var CacheManager = /** @class */ (function () {
    function CacheManager(maxSize, defaultTTL // 5 minutes
    ) {
        if (maxSize === void 0) { maxSize = 1000; }
        if (defaultTTL === void 0) { defaultTTL = 300000; }
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0
        };
    }
    /**
     * Get value from cache
     */
    CacheManager.prototype.get = function (key) {
        var entry = this.cache.get(key);
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
        return entry.value;
    };
    /**
     * Set value in cache
     */
    CacheManager.prototype.set = function (key, value, ttl) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        var entry = {
            value: value,
            createdAt: new Date(),
            lastAccessed: new Date(),
            expiresAt: new Date(Date.now() + (ttl || this.defaultTTL)),
            size: this.calculateSize(value)
        };
        this.cache.set(key, entry);
        this.updateCacheStats();
    };
    /**
     * Remove value from cache
     */
    CacheManager.prototype.delete = function (key) {
        var deleted = this.cache.delete(key);
        if (deleted) {
            this.updateCacheStats();
        }
        return deleted;
    };
    /**
     * Clear all cache entries
     */
    CacheManager.prototype.clear = function () {
        this.cache.clear();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0
        };
    };
    /**
     * Get cache statistics
     */
    CacheManager.prototype.getStats = function () {
        var total = this.cacheStats.hits + this.cacheStats.misses;
        var hitRate = total > 0 ? this.cacheStats.hits / total : 0;
        return __assign(__assign({}, this.cacheStats), { hitRate: hitRate, size: this.cache.size });
    };
    /**
     * Cache decorator for methods
     */
    CacheManager.prototype.cached = function (keyGenerator, ttl) {
        return function (target, propertyKey, descriptor) {
            var originalMethod = descriptor.value;
            descriptor.value = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return __awaiter(this, void 0, void 0, function () {
                    var cacheKey, cached, result;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                cacheKey = keyGenerator.apply(void 0, args);
                                cached = this.get(cacheKey);
                                if (cached !== null) {
                                    return [2 /*return*/, cached];
                                }
                                return [4 /*yield*/, originalMethod.apply(this, args)];
                            case 1:
                                result = _a.sent();
                                // Cache the result
                                this.set(cacheKey, result, ttl);
                                return [2 /*return*/, result];
                        }
                    });
                });
            };
            return descriptor;
        };
    };
    CacheManager.prototype.isExpired = function (entry) {
        return new Date() > entry.expiresAt;
    };
    CacheManager.prototype.evictLRU = function () {
        var oldestKey = null;
        var oldestTime = Date.now();
        for (var _i = 0, _a = this.cache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            if (entry.lastAccessed.getTime() < oldestTime) {
                oldestTime = entry.lastAccessed.getTime();
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.cacheStats.evictions++;
        }
    };
    CacheManager.prototype.calculateSize = function (value) {
        // Rough size calculation
        return JSON.stringify(value).length;
    };
    CacheManager.prototype.updateCacheStats = function () {
        this.cacheStats.totalSize = Array.from(this.cache.values())
            .reduce(function (total, entry) { return total + entry.size; }, 0);
    };
    return CacheManager;
}());
exports.CacheManager = CacheManager;
/**
 * Data Validator - Validates and sanitizes analytics data
 */
var DataValidator = /** @class */ (function () {
    function DataValidator() {
    }
    /**
     * Validate financial data
     */
    DataValidator.validateFinancialData = function (data) {
        var errors = [];
        var warnings = [];
        // Required fields
        if (!data.id)
            errors.push('Missing required field: id');
        if (!data.organizationId)
            errors.push('Missing required field: organizationId');
        if (!data.amount)
            errors.push('Missing required field: amount');
        if (!data.type)
            errors.push('Missing required field: type');
        // Data type validation
        if (data.amount && isNaN(parseFloat(data.amount.toString()))) {
            errors.push('Amount must be a valid number');
        }
        if (data.timestamp && !(0, date_fns_1.isValid)(new Date(data.timestamp))) {
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
            errors: errors,
            warnings: warnings
        };
    };
    /**
     * Validate prediction input
     */
    DataValidator.validatePredictionInput = function (input) {
        var errors = [];
        var warnings = [];
        if (!input.organizationId)
            errors.push('Missing required field: organizationId');
        if (!input.predictionType)
            errors.push('Missing required field: predictionType');
        if (!input.timeHorizon)
            errors.push('Missing required field: timeHorizon');
        if (input.timeHorizon && (input.timeHorizon < 1 || input.timeHorizon > 365)) {
            errors.push('Time horizon must be between 1 and 365 days');
        }
        if (input.confidence && (input.confidence < 0 || input.confidence > 1)) {
            errors.push('Confidence must be between 0 and 1');
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    };
    /**
     * Sanitize data for security
     */
    DataValidator.sanitizeData = function (data) {
        var _this = this;
        if (typeof data === 'string') {
            // Remove potentially dangerous characters
            return data.replace(/[<>\"']/g, '');
        }
        if (Array.isArray(data)) {
            return data.map(function (item) { return _this.sanitizeData(item); });
        }
        if (typeof data === 'object' && data !== null) {
            var sanitized = {};
            for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                sanitized[key] = this.sanitizeData(value);
            }
            return sanitized;
        }
        return data;
    };
    return DataValidator;
}());
exports.DataValidator = DataValidator;
/**
 * Analytics Metrics Calculator
 */
var MetricsCalculator = /** @class */ (function () {
    function MetricsCalculator() {
    }
    /**
     * Calculate financial ratios
     */
    MetricsCalculator.calculateFinancialRatios = function (data) {
        return {
            currentRatio: data.currentLiabilities.gt(0)
                ? data.currentAssets.div(data.currentLiabilities)
                : new decimal_js_1.Decimal(0),
            debtToEquity: data.equity.gt(0)
                ? data.totalLiabilities.div(data.equity)
                : new decimal_js_1.Decimal(0),
            returnOnAssets: data.totalAssets.gt(0)
                ? data.netIncome.div(data.totalAssets)
                : new decimal_js_1.Decimal(0),
            returnOnEquity: data.equity.gt(0)
                ? data.netIncome.div(data.equity)
                : new decimal_js_1.Decimal(0),
            grossMargin: data.revenue.gt(0)
                ? data.grossProfit.div(data.revenue)
                : new decimal_js_1.Decimal(0),
            netMargin: data.revenue.gt(0)
                ? data.netIncome.div(data.revenue)
                : new decimal_js_1.Decimal(0),
            assetTurnover: data.totalAssets.gt(0)
                ? data.revenue.div(data.totalAssets)
                : new decimal_js_1.Decimal(0)
        };
    };
    /**
     * Calculate growth rates
     */
    MetricsCalculator.calculateGrowthRate = function (currentValue, previousValue) {
        if (previousValue.eq(0))
            return new decimal_js_1.Decimal(0);
        return currentValue.minus(previousValue).div(previousValue);
    };
    /**
     * Calculate moving averages
     */
    MetricsCalculator.calculateMovingAverage = function (values, window) {
        var result = [];
        for (var i = 0; i < values.length; i++) {
            var start = Math.max(0, i - window + 1);
            var slice = values.slice(start, i + 1);
            var average = slice.reduce(function (sum, val) { return sum + val; }, 0) / slice.length;
            result.push(average);
        }
        return result;
    };
    /**
     * Calculate volatility (standard deviation)
     */
    MetricsCalculator.calculateVolatility = function (values) {
        if (values.length < 2)
            return 0;
        var mean = values.reduce(function (sum, val) { return sum + val; }, 0) / values.length;
        var squaredDifferences = values.map(function (val) { return Math.pow(val - mean, 2); });
        var variance = squaredDifferences.reduce(function (sum, val) { return sum + val; }, 0) / (values.length - 1);
        return Math.sqrt(variance);
    };
    /**
     * Calculate correlation coefficient
     */
    MetricsCalculator.calculateCorrelation = function (x, y) {
        if (x.length !== y.length || x.length < 2)
            return 0;
        var n = x.length;
        var sumX = x.reduce(function (a, b) { return a + b; }, 0);
        var sumY = y.reduce(function (a, b) { return a + b; }, 0);
        var sumXY = x.reduce(function (sum, xi, i) { return sum + xi * y[i]; }, 0);
        var sumXX = x.reduce(function (sum, xi) { return sum + xi * xi; }, 0);
        var sumYY = y.reduce(function (sum, yi) { return sum + yi * yi; }, 0);
        var numerator = n * sumXY - sumX * sumY;
        var denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    };
    return MetricsCalculator;
}());
exports.MetricsCalculator = MetricsCalculator;
/**
 * Data Aggregator - Aggregates data for analytics
 */
var DataAggregator = /** @class */ (function () {
    function DataAggregator() {
    }
    /**
     * Aggregate by time period
     */
    DataAggregator.aggregateByPeriod = function (data, dateField, valueField, period, aggregation) {
        if (aggregation === void 0) { aggregation = 'sum'; }
        var grouped = new Map();
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            var date = new Date(item[dateField]);
            var periodKey = this.formatPeriod(date, period);
            if (!grouped.has(periodKey)) {
                grouped.set(periodKey, []);
            }
            grouped.get(periodKey).push(item);
        }
        var result = [];
        for (var _a = 0, _b = grouped.entries(); _a < _b.length; _a++) {
            var _c = _b[_a], periodKey = _c[0], items = _c[1];
            var values = items.map(function (item) { return parseFloat(item[valueField]) || 0; });
            var aggregatedValue = void 0;
            switch (aggregation) {
                case 'sum':
                    aggregatedValue = values.reduce(function (a, b) { return a + b; }, 0);
                    break;
                case 'avg':
                    aggregatedValue = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
                    break;
                case 'count':
                    aggregatedValue = values.length;
                    break;
                case 'min':
                    aggregatedValue = Math.min.apply(Math, values);
                    break;
                case 'max':
                    aggregatedValue = Math.max.apply(Math, values);
                    break;
                default:
                    aggregatedValue = values.reduce(function (a, b) { return a + b; }, 0);
            }
            result.push({
                period: periodKey,
                value: aggregatedValue,
                count: items.length,
                date: new Date(periodKey)
            });
        }
        return result.sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
    };
    /**
     * Group by category
     */
    DataAggregator.groupByCategory = function (data, categoryField, valueField, aggregation) {
        if (aggregation === void 0) { aggregation = 'sum'; }
        var grouped = new Map();
        for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
            var item = data_2[_i];
            var category = item[categoryField] || 'Unknown';
            var value = parseFloat(item[valueField]) || 0;
            if (!grouped.has(category)) {
                grouped.set(category, []);
            }
            grouped.get(category).push(value);
        }
        var result = [];
        for (var _a = 0, _b = grouped.entries(); _a < _b.length; _a++) {
            var _c = _b[_a], category = _c[0], values = _c[1];
            var aggregatedValue = void 0;
            switch (aggregation) {
                case 'sum':
                    aggregatedValue = values.reduce(function (a, b) { return a + b; }, 0);
                    break;
                case 'avg':
                    aggregatedValue = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
                    break;
                case 'count':
                    aggregatedValue = values.length;
                    break;
                default:
                    aggregatedValue = values.reduce(function (a, b) { return a + b; }, 0);
            }
            result.push({
                category: category,
                value: aggregatedValue,
                count: values.length
            });
        }
        return result.sort(function (a, b) { return b.value - a.value; });
    };
    DataAggregator.formatPeriod = function (date, period) {
        switch (period) {
            case 'day':
                return (0, date_fns_1.format)(date, 'yyyy-MM-dd');
            case 'week':
                // Start of week (Monday)
                var weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + 1);
                return (0, date_fns_1.format)(weekStart, 'yyyy-MM-dd');
            case 'month':
                return (0, date_fns_1.format)(date, 'yyyy-MM');
            case 'quarter':
                var quarter = Math.floor(date.getMonth() / 3) + 1;
                return "".concat(date.getFullYear(), "-Q").concat(quarter);
            case 'year':
                return (0, date_fns_1.format)(date, 'yyyy');
            default:
                return (0, date_fns_1.format)(date, 'yyyy-MM-dd');
        }
    };
    return DataAggregator;
}());
exports.DataAggregator = DataAggregator;
/**
 * Security utilities for analytics
 */
var SecurityUtils = /** @class */ (function () {
    function SecurityUtils() {
    }
    /**
     * Hash sensitive data
     */
    SecurityUtils.hashData = function (data, algorithm) {
        if (algorithm === void 0) { algorithm = 'sha256'; }
        return crypto.createHash(algorithm).update(data).digest('hex');
    };
    /**
     * Encrypt sensitive data
     */
    SecurityUtils.encryptData = function (data, key) {
        var cipher = crypto.createCipher('aes192', key);
        var encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    };
    /**
     * Decrypt sensitive data
     */
    SecurityUtils.decryptData = function (encryptedData, key) {
        var decipher = crypto.createDecipher('aes192', key);
        var decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    };
    /**
     * Mask sensitive information
     */
    SecurityUtils.maskSensitiveData = function (data, visibleChars) {
        if (visibleChars === void 0) { visibleChars = 4; }
        if (data.length <= visibleChars)
            return '*'.repeat(data.length);
        var visible = data.slice(-visibleChars);
        var masked = '*'.repeat(data.length - visibleChars);
        return masked + visible;
    };
    return SecurityUtils;
}());
exports.SecurityUtils = SecurityUtils;
/**
 * Rate limiter for API calls
 */
var RateLimiter = /** @class */ (function () {
    function RateLimiter(maxRequests, windowMs // 1 minute
    ) {
        if (maxRequests === void 0) { maxRequests = 100; }
        if (windowMs === void 0) { windowMs = 60000; }
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }
    /**
     * Check if request is allowed
     */
    RateLimiter.prototype.isAllowed = function (identifier) {
        var now = Date.now();
        var windowStart = now - this.windowMs;
        // Get existing requests for this identifier
        var requests = this.requests.get(identifier) || [];
        // Filter out requests outside the window
        var recentRequests = requests.filter(function (timestamp) { return timestamp > windowStart; });
        // Update the requests array
        this.requests.set(identifier, recentRequests);
        // Check if under the limit
        if (recentRequests.length < this.maxRequests) {
            recentRequests.push(now);
            this.requests.set(identifier, recentRequests);
            return true;
        }
        return false;
    };
    /**
     * Get remaining requests for identifier
     */
    RateLimiter.prototype.getRemaining = function (identifier) {
        var now = Date.now();
        var windowStart = now - this.windowMs;
        var requests = this.requests.get(identifier) || [];
        var recentRequests = requests.filter(function (timestamp) { return timestamp > windowStart; });
        return Math.max(0, this.maxRequests - recentRequests.length);
    };
    return RateLimiter;
}());
exports.RateLimiter = RateLimiter;
