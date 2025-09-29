"use strict";
/**
 * Anomaly Detector - Advanced anomaly detection for financial data
 * Implements multiple detection algorithms including statistical, ML-based, and rule-based approaches
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.AnomalyDetector = exports.RuleBasedAnomalyDetector = exports.MLAnomalyDetector = exports.StatisticalAnomalyDetector = exports.BaseAnomalyDetector = void 0;
var stats = require("simple-statistics");
var date_fns_1 = require("date-fns");
var BaseAnomalyDetector = /** @class */ (function () {
    function BaseAnomalyDetector(config) {
        if (config === void 0) { config = {}; }
        this.config = __assign({ algorithm: 'statistical', sensitivity: 'medium', lookbackDays: 90, minDataPoints: 30, thresholdMultiplier: 2.5 }, config);
    }
    BaseAnomalyDetector.prototype.calculateBaseline = function (data) {
        var values = data.map(function (d) { return d.value; });
        return {
            mean: stats.mean(values),
            stdDev: stats.standardDeviation(values)
        };
    };
    BaseAnomalyDetector.prototype.calculateZScore = function (value, mean, stdDev) {
        return stdDev > 0 ? (value - mean) / stdDev : 0;
    };
    BaseAnomalyDetector.prototype.determineAnomalySeverity = function (deviationPercent) {
        var absDeviation = Math.abs(deviationPercent);
        if (absDeviation >= 100)
            return 'critical';
        if (absDeviation >= 50)
            return 'high';
        if (absDeviation >= 25)
            return 'medium';
        return 'low';
    };
    return BaseAnomalyDetector;
}());
exports.BaseAnomalyDetector = BaseAnomalyDetector;
var StatisticalAnomalyDetector = /** @class */ (function (_super) {
    __extends(StatisticalAnomalyDetector, _super);
    function StatisticalAnomalyDetector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    StatisticalAnomalyDetector.prototype.detectAnomalies = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var anomalies, baseline, threshold;
            var _this = this;
            return __generator(this, function (_a) {
                if (data.length < this.config.minDataPoints) {
                    return [2 /*return*/, []];
                }
                anomalies = [];
                baseline = this.calculateBaseline(data);
                threshold = baseline.stdDev * this.config.thresholdMultiplier;
                data.forEach(function (point, index) {
                    var zScore = _this.calculateZScore(point.value, baseline.mean, baseline.stdDev);
                    var deviation = point.value - baseline.mean;
                    var deviationPercent = baseline.mean !== 0 ? (deviation / baseline.mean) * 100 : 0;
                    if (Math.abs(zScore) > _this.config.thresholdMultiplier) {
                        var anomaly = {
                            id: "stat_".concat(Date.now(), "_").concat(index),
                            type: _this.categorizeAnomaly(point),
                            severity: _this.determineAnomalySeverity(deviationPercent),
                            value: point.value,
                            expectedValue: baseline.mean,
                            deviation: deviation,
                            deviationPercent: deviationPercent,
                            confidence: Math.min(Math.abs(zScore) / 5, 1),
                            timestamp: point.timestamp,
                            description: _this.generateDescription(point, baseline, deviation),
                            context: _this.buildContext(point, data),
                            recommendations: _this.generateRecommendations(point, deviation)
                        };
                        anomalies.push(anomaly);
                    }
                });
                return [2 /*return*/, anomalies];
            });
        });
    };
    StatisticalAnomalyDetector.prototype.categorizeAnomaly = function (point) {
        var _a;
        // Simple categorization based on metadata or default to 'pattern'
        if ((_a = point.metadata) === null || _a === void 0 ? void 0 : _a.type) {
            return point.metadata.type;
        }
        return 'pattern';
    };
    StatisticalAnomalyDetector.prototype.generateDescription = function (point, baseline, deviation) {
        var direction = deviation > 0 ? 'spike' : 'drop';
        var magnitude = Math.abs(deviation / baseline.mean * 100).toFixed(1);
        return "Unusual ".concat(direction, " detected: value ").concat(point.value.toFixed(2), " deviates ").concat(magnitude, "% from expected ").concat(baseline.mean.toFixed(2));
    };
    StatisticalAnomalyDetector.prototype.buildContext = function (point, data) {
        return {
            dataSource: 'statistical_analysis',
            period: (0, date_fns_1.format)(point.timestamp, 'yyyy-MM-dd'),
            affectedMetrics: ['value'],
            relatedEvents: [],
            historicalComparison: true
        };
    };
    StatisticalAnomalyDetector.prototype.generateRecommendations = function (point, deviation) {
        var recommendations = [];
        if (deviation > 0) {
            recommendations.push('Investigate potential revenue opportunity or data error');
            recommendations.push('Verify transaction accuracy and completeness');
        }
        else {
            recommendations.push('Review for potential issues affecting performance');
            recommendations.push('Check for system outages or process disruptions');
        }
        recommendations.push('Monitor trend over next few days');
        return recommendations;
    };
    return StatisticalAnomalyDetector;
}(BaseAnomalyDetector));
exports.StatisticalAnomalyDetector = StatisticalAnomalyDetector;
var MLAnomalyDetector = /** @class */ (function (_super) {
    __extends(MLAnomalyDetector, _super);
    function MLAnomalyDetector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MLAnomalyDetector.prototype.detectAnomalies = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var anomalies, features, isolationScores, thresholds, threshold;
            var _this = this;
            return __generator(this, function (_a) {
                // Simplified ML-based detection using isolation principles
                if (data.length < this.config.minDataPoints) {
                    return [2 /*return*/, []];
                }
                anomalies = [];
                features = this.extractFeatures(data);
                isolationScores = this.calculateIsolationScores(features);
                thresholds = {
                    low: 0.7,
                    medium: 0.6,
                    high: 0.5
                };
                threshold = thresholds[this.config.sensitivity];
                isolationScores.forEach(function (score, index) {
                    if (score > threshold) {
                        var point = data[index];
                        var baseline = _this.calculateBaseline(data);
                        var deviation = point.value - baseline.mean;
                        var deviationPercent = baseline.mean !== 0 ? (deviation / baseline.mean) * 100 : 0;
                        var anomaly = {
                            id: "ml_".concat(Date.now(), "_").concat(index),
                            type: 'pattern',
                            severity: _this.determineAnomalySeverity(deviationPercent),
                            value: point.value,
                            expectedValue: baseline.mean,
                            deviation: deviation,
                            deviationPercent: deviationPercent,
                            confidence: score,
                            timestamp: point.timestamp,
                            description: "ML algorithm detected anomalous pattern (isolation score: ".concat(score.toFixed(2), ")"),
                            context: {
                                dataSource: 'ml_isolation_forest',
                                period: (0, date_fns_1.format)(point.timestamp, 'yyyy-MM-dd'),
                                affectedMetrics: ['isolation_score', 'value'],
                                relatedEvents: [],
                                historicalComparison: true
                            },
                            recommendations: [
                                'Review data quality and collection process',
                                'Investigate external factors affecting normal patterns',
                                'Consider model retraining if pattern persists'
                            ]
                        };
                        anomalies.push(anomaly);
                    }
                });
                return [2 /*return*/, anomalies];
            });
        });
    };
    MLAnomalyDetector.prototype.extractFeatures = function (data) {
        return data.map(function (point, index) {
            // Simple feature extraction
            var features = [
                point.value,
                index > 0 ? point.value - data[index - 1].value : 0, // Change from previous
                index >= 7 ? point.value - data[index - 7].value : 0, // Weekly change
                (0, date_fns_1.differenceInDays)(point.timestamp, data[0].timestamp) // Days from start
            ];
            return features;
        });
    };
    MLAnomalyDetector.prototype.calculateIsolationScores = function (features) {
        var _this = this;
        // Simplified isolation forest implementation
        var scores = [];
        features.forEach(function (feature, index) {
            var isolationScore = 0;
            var comparisons = 0;
            // Compare with other points
            features.forEach(function (otherFeature, otherIndex) {
                if (index !== otherIndex) {
                    var distance = _this.euclideanDistance(feature, otherFeature);
                    isolationScore += distance;
                    comparisons++;
                }
            });
            // Normalize score
            scores.push(comparisons > 0 ? isolationScore / comparisons : 0);
        });
        // Normalize to 0-1 range
        var maxScore = Math.max.apply(Math, scores);
        return scores.map(function (score) { return maxScore > 0 ? score / maxScore : 0; });
    };
    MLAnomalyDetector.prototype.euclideanDistance = function (a, b) {
        var sum = 0;
        for (var i = 0; i < Math.min(a.length, b.length); i++) {
            sum += Math.pow(a[i] - b[i], 2);
        }
        return Math.sqrt(sum);
    };
    return MLAnomalyDetector;
}(BaseAnomalyDetector));
exports.MLAnomalyDetector = MLAnomalyDetector;
var RuleBasedAnomalyDetector = /** @class */ (function (_super) {
    __extends(RuleBasedAnomalyDetector, _super);
    function RuleBasedAnomalyDetector(config) {
        var _this = _super.call(this, config) || this;
        _this.rules = [];
        _this.initializeRules();
        return _this;
    }
    RuleBasedAnomalyDetector.prototype.detectAnomalies = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var anomalies;
            var _this = this;
            return __generator(this, function (_a) {
                anomalies = [];
                data.forEach(function (point, index) {
                    _this.rules.forEach(function (rule) {
                        if (rule.condition(point, data, index)) {
                            var anomaly = rule.createAnomaly(point, index);
                            anomalies.push(anomaly);
                        }
                    });
                });
                return [2 /*return*/, anomalies];
            });
        });
    };
    RuleBasedAnomalyDetector.prototype.initializeRules = function () {
        this.rules = [
            {
                id: 'sudden_spike',
                name: 'Sudden Value Spike',
                condition: function (point, data, index) {
                    if (index === 0)
                        return false;
                    var previous = data[index - 1];
                    var increase = point.value / previous.value;
                    return increase > 3; // 300% increase
                },
                createAnomaly: function (point, index) { return ({
                    id: "rule_spike_".concat(Date.now(), "_").concat(index),
                    type: 'revenue',
                    severity: 'high',
                    value: point.value,
                    expectedValue: 0, // Will be calculated based on context
                    deviation: 0,
                    deviationPercent: 0,
                    confidence: 0.9,
                    timestamp: point.timestamp,
                    description: 'Sudden spike detected: value increased dramatically from previous period',
                    context: {
                        dataSource: 'rule_based_detector',
                        period: (0, date_fns_1.format)(point.timestamp, 'yyyy-MM-dd'),
                        affectedMetrics: ['value'],
                        relatedEvents: ['sudden_increase'],
                        historicalComparison: false
                    },
                    recommendations: [
                        'Verify data accuracy and transaction legitimacy',
                        'Check for one-time events or bulk transactions',
                        'Review business activities for this period'
                    ]
                }); }
            },
            {
                id: 'consecutive_zeros',
                name: 'Consecutive Zero Values',
                condition: function (point, data, index) {
                    if (point.value !== 0)
                        return false;
                    // Check if previous 2 values are also zero
                    var consecutiveZeros = data
                        .slice(Math.max(0, index - 2), index + 1)
                        .every(function (p) { return p.value === 0; });
                    return consecutiveZeros && index >= 2;
                },
                createAnomaly: function (point, index) { return ({
                    id: "rule_zeros_".concat(Date.now(), "_").concat(index),
                    type: 'transaction',
                    severity: 'medium',
                    value: point.value,
                    expectedValue: 0,
                    deviation: 0,
                    deviationPercent: 0,
                    confidence: 0.85,
                    timestamp: point.timestamp,
                    description: 'Multiple consecutive zero values detected - possible system issue',
                    context: {
                        dataSource: 'rule_based_detector',
                        period: (0, date_fns_1.format)(point.timestamp, 'yyyy-MM-dd'),
                        affectedMetrics: ['value'],
                        relatedEvents: ['data_gap'],
                        historicalComparison: false
                    },
                    recommendations: [
                        'Check data collection systems for outages',
                        'Verify business operations during this period',
                        'Review data pipeline for processing issues'
                    ]
                }); }
            }
        ];
    };
    return RuleBasedAnomalyDetector;
}(BaseAnomalyDetector));
exports.RuleBasedAnomalyDetector = RuleBasedAnomalyDetector;
var AnomalyDetector = /** @class */ (function () {
    function AnomalyDetector() {
        this.detectors = new Map();
        this.initializeDetectors();
    }
    AnomalyDetector.prototype.initializeDetectors = function () {
        this.detectors.set('statistical', new StatisticalAnomalyDetector());
        this.detectors.set('ml', new MLAnomalyDetector());
        this.detectors.set('rule_based', new RuleBasedAnomalyDetector());
    };
    AnomalyDetector.prototype.detectAnomalies = function (data_1) {
        return __awaiter(this, arguments, void 0, function (data, algorithms) {
            var allAnomalies, _i, algorithms_1, algorithm, detector, anomalies;
            if (algorithms === void 0) { algorithms = ['statistical', 'rule_based']; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allAnomalies = [];
                        _i = 0, algorithms_1 = algorithms;
                        _a.label = 1;
                    case 1:
                        if (!(_i < algorithms_1.length)) return [3 /*break*/, 4];
                        algorithm = algorithms_1[_i];
                        detector = this.detectors.get(algorithm);
                        if (!detector) return [3 /*break*/, 3];
                        return [4 /*yield*/, detector.detectAnomalies(data)];
                    case 2:
                        anomalies = _a.sent();
                        allAnomalies.push.apply(allAnomalies, anomalies);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: 
                    // Remove duplicates and sort by severity
                    return [2 /*return*/, this.deduplicate(allAnomalies)];
                }
            });
        });
    };
    AnomalyDetector.prototype.deduplicate = function (anomalies) {
        var uniqueAnomalies = new Map();
        var severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        anomalies.forEach(function (anomaly) {
            var key = "".concat((0, date_fns_1.format)(anomaly.timestamp, 'yyyy-MM-dd'), "_").concat(anomaly.type);
            var existing = uniqueAnomalies.get(key);
            if (!existing || severityOrder[anomaly.severity] > severityOrder[existing.severity]) {
                uniqueAnomalies.set(key, anomaly);
            }
        });
        return Array.from(uniqueAnomalies.values()).sort(function (a, b) { return severityOrder[b.severity] - severityOrder[a.severity]; });
    };
    return AnomalyDetector;
}());
exports.AnomalyDetector = AnomalyDetector;
exports.default = AnomalyDetector;
