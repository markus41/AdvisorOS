"use strict";
/**
 * Insight Engine - Automated Financial Analysis and Narrative Generation
 * Generates intelligent insights, identifies anomalies, and provides actionable recommendations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightEngine = void 0;
var decimal_js_1 = require("decimal.js");
var stats = require("../utils/statistics");
var date_fns_1 = require("date-fns");
var InsightEngine = /** @class */ (function () {
    function InsightEngine(config) {
        this.config = config;
        this.anomalyDetectors = new Map();
        this.narrativeTemplates = new Map();
        this.benchmarkData = new Map();
    }
    InsightEngine.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Initialize anomaly detection algorithms
                        this.anomalyDetectors.set('statistical', new StatisticalAnomalyDetector());
                        this.anomalyDetectors.set('ml', new MLAnomalyDetector());
                        this.anomalyDetectors.set('rule_based', new RuleBasedAnomalyDetector());
                        // Load narrative templates
                        return [4 /*yield*/, this.loadNarrativeTemplates()];
                    case 1:
                        // Load narrative templates
                        _a.sent();
                        // Load benchmark data
                        return [4 /*yield*/, this.loadBenchmarkData()];
                    case 2:
                        // Load benchmark data
                        _a.sent();
                        console.log('Insight Engine initialized');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate comprehensive financial insights
     */
    InsightEngine.prototype.generateInsights = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, financialData, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _i, insights_1, insight, _s, error_1;
            return __generator(this, function (_t) {
                switch (_t.label) {
                    case 0:
                        insights = [];
                        _t.label = 1;
                    case 1:
                        _t.trys.push([1, 20, , 21]);
                        return [4 /*yield*/, this.fetchFinancialData(request)];
                    case 2:
                        financialData = _t.sent();
                        _a = request.analysisType;
                        switch (_a) {
                            case 'financial_health': return [3 /*break*/, 3];
                            case 'variance_analysis': return [3 /*break*/, 5];
                            case 'trend_analysis': return [3 /*break*/, 7];
                            case 'anomaly_detection': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 3:
                        _c = (_b = insights.push).apply;
                        _d = [insights];
                        return [4 /*yield*/, this.analyzeFinancialHealth(financialData, request)];
                    case 4:
                        _c.apply(_b, _d.concat([_t.sent()]));
                        return [3 /*break*/, 13];
                    case 5:
                        _f = (_e = insights.push).apply;
                        _g = [insights];
                        return [4 /*yield*/, this.analyzeVariances(financialData, request)];
                    case 6:
                        _f.apply(_e, _g.concat([_t.sent()]));
                        return [3 /*break*/, 13];
                    case 7:
                        _j = (_h = insights.push).apply;
                        _k = [insights];
                        return [4 /*yield*/, this.analyzeTrends(financialData, request)];
                    case 8:
                        _j.apply(_h, _k.concat([_t.sent()]));
                        return [3 /*break*/, 13];
                    case 9:
                        _m = (_l = insights.push).apply;
                        _o = [insights];
                        return [4 /*yield*/, this.detectAnomalies(financialData, request)];
                    case 10:
                        _m.apply(_l, _o.concat([_t.sent()]));
                        return [3 /*break*/, 13];
                    case 11:
                        _q = 
                        // Generate all types of insights
                        (_p = insights.push).apply;
                        _r = [
                            // Generate all types of insights
                            insights];
                        return [4 /*yield*/, this.generateComprehensiveInsights(financialData, request)];
                    case 12:
                        // Generate all types of insights
                        _q.apply(_p, _r.concat([_t.sent()]));
                        _t.label = 13;
                    case 13:
                        if (!request.includeBenchmarks) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.addBenchmarkComparisons(insights, request)];
                    case 14:
                        _t.sent();
                        _t.label = 15;
                    case 15:
                        _i = 0, insights_1 = insights;
                        _t.label = 16;
                    case 16:
                        if (!(_i < insights_1.length)) return [3 /*break*/, 19];
                        insight = insights_1[_i];
                        _s = insight;
                        return [4 /*yield*/, this.generateNarrative(insight)];
                    case 17:
                        _s.narrative = _t.sent();
                        _t.label = 18;
                    case 18:
                        _i++;
                        return [3 /*break*/, 16];
                    case 19: return [2 /*return*/, insights];
                    case 20:
                        error_1 = _t.sent();
                        throw new Error("Insight generation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Financial Health Assessment
     */
    InsightEngine.prototype.analyzeFinancialHealth = function (data, request) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, metrics, cashFlowInsight, profitabilityInsight, liquidityInsight, debtInsight;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        insights = [];
                        metrics = this.calculateFinancialHealthMetrics(data);
                        return [4 /*yield*/, this.analyzeCashFlow(data, metrics)];
                    case 1:
                        cashFlowInsight = _a.sent();
                        if (cashFlowInsight)
                            insights.push(cashFlowInsight);
                        return [4 /*yield*/, this.analyzeProfitability(data, metrics)];
                    case 2:
                        profitabilityInsight = _a.sent();
                        if (profitabilityInsight)
                            insights.push(profitabilityInsight);
                        return [4 /*yield*/, this.analyzeLiquidity(data, metrics)];
                    case 3:
                        liquidityInsight = _a.sent();
                        if (liquidityInsight)
                            insights.push(liquidityInsight);
                        return [4 /*yield*/, this.analyzeDebt(data, metrics)];
                    case 4:
                        debtInsight = _a.sent();
                        if (debtInsight)
                            insights.push(debtInsight);
                        return [2 /*return*/, insights];
                }
            });
        });
    };
    /**
     * Budget Variance Analysis
     */
    InsightEngine.prototype.analyzeVariances = function (data, request) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, budgetData, variances, significantVariances, _i, significantVariances_1, variance, insight, overallInsight;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        insights = [];
                        return [4 /*yield*/, this.fetchBudgetData(request.organizationId, request.clientId)];
                    case 1:
                        budgetData = _a.sent();
                        variances = this.calculateVariances(data, budgetData, request.period);
                        significantVariances = variances.filter(function (v) { return Math.abs(v.percentageVariance) > 10; });
                        _i = 0, significantVariances_1 = significantVariances;
                        _a.label = 2;
                    case 2:
                        if (!(_i < significantVariances_1.length)) return [3 /*break*/, 5];
                        variance = significantVariances_1[_i];
                        return [4 /*yield*/, this.createVarianceInsight(variance, data)];
                    case 3:
                        insight = _a.sent();
                        insights.push(insight);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.createOverallBudgetInsight(variances)];
                    case 6:
                        overallInsight = _a.sent();
                        insights.push(overallInsight);
                        return [2 /*return*/, insights];
                }
            });
        });
    };
    /**
     * Trend Analysis
     */
    InsightEngine.prototype.analyzeTrends = function (data, request) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, revenueTrend, _a, _b, expenseTrend, _c, _d, categories, _loop_1, this_1, _i, categories_1, category;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        insights = [];
                        revenueTrend = this.calculateTrend(data.filter(function (d) { return d.type === 'income'; }), 'revenue');
                        if (!(revenueTrend.significance > 0.7)) return [3 /*break*/, 2];
                        _b = (_a = insights).push;
                        return [4 /*yield*/, this.createTrendInsight(revenueTrend, 'revenue')];
                    case 1:
                        _b.apply(_a, [_e.sent()]);
                        _e.label = 2;
                    case 2:
                        expenseTrend = this.calculateTrend(data.filter(function (d) { return d.type === 'expense'; }), 'expenses');
                        if (!(expenseTrend.significance > 0.7)) return [3 /*break*/, 4];
                        _d = (_c = insights).push;
                        return [4 /*yield*/, this.createTrendInsight(expenseTrend, 'expenses')];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        _e.label = 4;
                    case 4:
                        categories = __spreadArray([], new Set(data.map(function (d) { return d.category; })), true);
                        _loop_1 = function (category) {
                            var categoryData, trend, _f, _g;
                            return __generator(this, function (_h) {
                                switch (_h.label) {
                                    case 0:
                                        categoryData = data.filter(function (d) { return d.category === category; });
                                        if (!(categoryData.length > 5)) return [3 /*break*/, 2];
                                        trend = this_1.calculateTrend(categoryData, category);
                                        if (!(trend.significance > 0.8)) return [3 /*break*/, 2];
                                        _g = (_f = insights).push;
                                        return [4 /*yield*/, this_1.createTrendInsight(trend, category)];
                                    case 1:
                                        _g.apply(_f, [_h.sent()]);
                                        _h.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, categories_1 = categories;
                        _e.label = 5;
                    case 5:
                        if (!(_i < categories_1.length)) return [3 /*break*/, 8];
                        category = categories_1[_i];
                        return [5 /*yield**/, _loop_1(category)];
                    case 6:
                        _e.sent();
                        _e.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8: return [2 /*return*/, insights];
                }
            });
        });
    };
    /**
     * Anomaly Detection
     */
    InsightEngine.prototype.detectAnomalies = function (data, request) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, config, transactionAnomalies, _i, transactionAnomalies_1, anomaly, _a, _b, patternAnomalies, _c, patternAnomalies_1, anomaly, _d, _e, benchmarkAnomalies, _f, benchmarkAnomalies_1, anomaly, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        insights = [];
                        config = {
                            sensitivity: 0.8,
                            methods: ['statistical', 'ml', 'rule_based'],
                            thresholds: {
                                transaction: 3.0, // Standard deviations
                                pattern: 0.9, // Probability threshold
                                benchmark: 0.2 // 20% deviation threshold
                            },
                            exclusions: []
                        };
                        return [4 /*yield*/, this.detectTransactionAnomalies(data, config)];
                    case 1:
                        transactionAnomalies = _j.sent();
                        _i = 0, transactionAnomalies_1 = transactionAnomalies;
                        _j.label = 2;
                    case 2:
                        if (!(_i < transactionAnomalies_1.length)) return [3 /*break*/, 5];
                        anomaly = transactionAnomalies_1[_i];
                        _b = (_a = insights).push;
                        return [4 /*yield*/, this.createAnomalyInsight(anomaly)];
                    case 3:
                        _b.apply(_a, [_j.sent()]);
                        _j.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.detectPatternAnomalies(data, config)];
                    case 6:
                        patternAnomalies = _j.sent();
                        _c = 0, patternAnomalies_1 = patternAnomalies;
                        _j.label = 7;
                    case 7:
                        if (!(_c < patternAnomalies_1.length)) return [3 /*break*/, 10];
                        anomaly = patternAnomalies_1[_c];
                        _e = (_d = insights).push;
                        return [4 /*yield*/, this.createAnomalyInsight(anomaly)];
                    case 8:
                        _e.apply(_d, [_j.sent()]);
                        _j.label = 9;
                    case 9:
                        _c++;
                        return [3 /*break*/, 7];
                    case 10:
                        if (!request.includeBenchmarks) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.detectBenchmarkAnomalies(data, config, request)];
                    case 11:
                        benchmarkAnomalies = _j.sent();
                        _f = 0, benchmarkAnomalies_1 = benchmarkAnomalies;
                        _j.label = 12;
                    case 12:
                        if (!(_f < benchmarkAnomalies_1.length)) return [3 /*break*/, 15];
                        anomaly = benchmarkAnomalies_1[_f];
                        _h = (_g = insights).push;
                        return [4 /*yield*/, this.createAnomalyInsight(anomaly)];
                    case 13:
                        _h.apply(_g, [_j.sent()]);
                        _j.label = 14;
                    case 14:
                        _f++;
                        return [3 /*break*/, 12];
                    case 15: return [2 /*return*/, insights];
                }
            });
        });
    };
    /**
     * Client Risk Scoring
     */
    InsightEngine.prototype.generateRiskScore = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var clientId, includeFinancial, includeBehavioral, includeMarket, timeWindow, financialData, behavioralData, _a, marketData, _b, financialScore, behavioralScore, marketScore, weights, overallScore, historicalScores, trend, factors, recommendations;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        clientId = input.clientId, includeFinancial = input.includeFinancial, includeBehavioral = input.includeBehavioral, includeMarket = input.includeMarket, timeWindow = input.timeWindow;
                        return [4 /*yield*/, this.fetchClientFinancialData(clientId, timeWindow)];
                    case 1:
                        financialData = _c.sent();
                        if (!includeBehavioral) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.fetchBehavioralData(clientId, timeWindow)];
                    case 2:
                        _a = _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = null;
                        _c.label = 4;
                    case 4:
                        behavioralData = _a;
                        if (!includeMarket) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.fetchMarketData(timeWindow)];
                    case 5:
                        _b = _c.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _b = null;
                        _c.label = 7;
                    case 7:
                        marketData = _b;
                        financialScore = includeFinancial ? this.calculateFinancialRisk(financialData) : 50;
                        behavioralScore = includeBehavioral ? this.calculateBehavioralRisk(behavioralData) : 50;
                        marketScore = includeMarket ? this.calculateMarketRisk(marketData) : 50;
                        weights = this.getRiskWeights(includeFinancial, includeBehavioral, includeMarket);
                        overallScore = Math.round(financialScore * weights.financial +
                            behavioralScore * weights.behavioral +
                            marketScore * weights.market);
                        return [4 /*yield*/, this.getHistoricalRiskScores(clientId)];
                    case 8:
                        historicalScores = _c.sent();
                        trend = this.calculateRiskTrend(historicalScores, overallScore);
                        factors = this.identifyRiskFactors(financialData, behavioralData, marketData);
                        recommendations = this.generateRiskRecommendations(overallScore, factors);
                        return [2 /*return*/, {
                                clientId: clientId,
                                overallScore: overallScore,
                                components: {
                                    financial: financialScore,
                                    behavioral: behavioralScore,
                                    market: marketScore
                                },
                                factors: factors,
                                trend: trend,
                                recommendations: recommendations,
                                lastUpdated: new Date()
                            }];
                }
            });
        });
    };
    /**
     * Automated KPI Analysis
     */
    InsightEngine.prototype.analyzeKPIs = function (organizationId, clientId, period) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, kpis, currentKPIs, previousPeriod, previousKPIs, _i, kpis_1, kpi, current, previous, change, insight;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        insights = [];
                        kpis = [
                            'revenue_growth',
                            'gross_margin',
                            'operating_margin',
                            'current_ratio',
                            'quick_ratio',
                            'debt_to_equity',
                            'return_on_assets',
                            'days_sales_outstanding',
                            'inventory_turnover',
                            'cash_conversion_cycle'
                        ];
                        return [4 /*yield*/, this.calculateKPIs(organizationId, clientId, period)];
                    case 1:
                        currentKPIs = _a.sent();
                        previousPeriod = {
                            start: (0, date_fns_1.subDays)(period.start, 365),
                            end: (0, date_fns_1.subDays)(period.end, 365)
                        };
                        return [4 /*yield*/, this.calculateKPIs(organizationId, clientId, previousPeriod)];
                    case 2:
                        previousKPIs = _a.sent();
                        _i = 0, kpis_1 = kpis;
                        _a.label = 3;
                    case 3:
                        if (!(_i < kpis_1.length)) return [3 /*break*/, 6];
                        kpi = kpis_1[_i];
                        current = currentKPIs[kpi];
                        previous = previousKPIs[kpi];
                        if (!(current !== undefined && previous !== undefined)) return [3 /*break*/, 5];
                        change = ((current - previous) / previous) * 100;
                        return [4 /*yield*/, this.createKPIInsight(kpi, current, previous, change)];
                    case 4:
                        insight = _a.sent();
                        if (insight)
                            insights.push(insight);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, insights];
                }
            });
        });
    };
    // Helper methods for financial health analysis
    InsightEngine.prototype.calculateFinancialHealthMetrics = function (data) {
        var revenue = this.sumByType(data, 'income');
        var expenses = this.sumByType(data, 'expense');
        var assets = this.sumByType(data, 'asset');
        var liabilities = this.sumByType(data, 'liability');
        return {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netIncome: revenue.minus(expenses),
            totalAssets: assets,
            totalLiabilities: liabilities,
            equity: assets.minus(liabilities),
            grossMargin: revenue.gt(0) ? revenue.minus(expenses).div(revenue) : new decimal_js_1.Decimal(0),
            debtToEquity: assets.minus(liabilities).gt(0) ? liabilities.div(assets.minus(liabilities)) : new decimal_js_1.Decimal(0),
            currentRatio: this.calculateCurrentRatio(data),
            quickRatio: this.calculateQuickRatio(data)
        };
    };
    InsightEngine.prototype.analyzeCashFlow = function (data, metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var cashFlowData, avgCashFlow, cashFlowVolatility, severity, title, description, recommendations;
            return __generator(this, function (_a) {
                cashFlowData = this.calculateCashFlow(data);
                if (cashFlowData.length === 0)
                    return [2 /*return*/, null];
                avgCashFlow = stats.mean(cashFlowData.map(function (cf) { return parseFloat(cf.netFlow.toString()); }));
                cashFlowVolatility = stats.standardDeviation(cashFlowData.map(function (cf) { return parseFloat(cf.netFlow.toString()); }));
                severity = 'low';
                title = 'Cash Flow Analysis';
                description = '';
                recommendations = [];
                if (avgCashFlow < 0) {
                    severity = avgCashFlow < -10000 ? 'critical' : 'high';
                    title = 'Negative Cash Flow Detected';
                    description = "Average cash flow is negative at ".concat((0, date_fns_1.format)(avgCashFlow, '$0,0'), " per period.");
                    recommendations.push('Review expense categories for cost reduction opportunities');
                    recommendations.push('Accelerate accounts receivable collection');
                    recommendations.push('Consider invoice factoring or line of credit');
                }
                else if (cashFlowVolatility > avgCashFlow * 0.5) {
                    severity = 'medium';
                    title = 'High Cash Flow Volatility';
                    description = "Cash flow shows high volatility with standard deviation of ".concat((0, date_fns_1.format)(cashFlowVolatility, '$0,0'), ".");
                    recommendations.push('Implement better cash flow forecasting');
                    recommendations.push('Diversify revenue streams');
                    recommendations.push('Build larger cash reserves');
                }
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'cash_flow_analysis',
                        severity: severity,
                        title: title,
                        description: description,
                        narrative: '', // Will be generated later
                        recommendations: recommendations,
                        metrics: [
                            {
                                name: 'Average Cash Flow',
                                value: new decimal_js_1.Decimal(avgCashFlow),
                                trend: avgCashFlow > 0 ? 'up' : 'down',
                                unit: 'currency'
                            },
                            {
                                name: 'Cash Flow Volatility',
                                value: new decimal_js_1.Decimal(cashFlowVolatility),
                                trend: 'stable',
                                unit: 'currency'
                            }
                        ],
                        visualizations: [
                            {
                                type: 'line',
                                data: cashFlowData.map(function (cf) { return ({
                                    date: cf.date,
                                    value: parseFloat(cf.netFlow.toString())
                                }); }),
                                config: {
                                    responsive: true,
                                    interactive: true,
                                    theme: 'light'
                                },
                                title: 'Cash Flow Trend',
                                description: 'Net cash flow over time'
                            }
                        ],
                        confidence: 0.9,
                        createdAt: new Date()
                    }];
            });
        });
    };
    InsightEngine.prototype.analyzeProfitability = function (data, metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var grossMargin, netIncome, totalRevenue, netMargin, severity, recommendations;
            return __generator(this, function (_a) {
                grossMargin = metrics.grossMargin, netIncome = metrics.netIncome, totalRevenue = metrics.totalRevenue;
                if (totalRevenue.lte(0))
                    return [2 /*return*/, null];
                netMargin = netIncome.div(totalRevenue);
                severity = 'low';
                recommendations = [];
                if (netMargin.lt(0)) {
                    severity = 'critical';
                    recommendations.push('Immediate cost reduction required');
                    recommendations.push('Review pricing strategy');
                    recommendations.push('Eliminate unprofitable products/services');
                }
                else if (netMargin.lt(0.05)) {
                    severity = 'high';
                    recommendations.push('Improve operational efficiency');
                    recommendations.push('Optimize pricing and product mix');
                }
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'profitability_analysis',
                        severity: severity,
                        title: "Profitability Analysis - ".concat(netMargin.mul(100).toFixed(1), "% Net Margin"),
                        description: "Net margin is ".concat(netMargin.mul(100).toFixed(1), "% with gross margin of ").concat(grossMargin.mul(100).toFixed(1), "%."),
                        narrative: '',
                        recommendations: recommendations,
                        metrics: [
                            {
                                name: 'Net Margin',
                                value: netMargin.mul(100),
                                trend: netMargin.gt(0.1) ? 'up' : 'down',
                                unit: 'percentage'
                            },
                            {
                                name: 'Gross Margin',
                                value: grossMargin.mul(100),
                                trend: 'stable',
                                unit: 'percentage'
                            }
                        ],
                        visualizations: [],
                        confidence: 0.85,
                        createdAt: new Date()
                    }];
            });
        });
    };
    InsightEngine.prototype.analyzeLiquidity = function (data, metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var currentRatio, quickRatio, severity, recommendations;
            return __generator(this, function (_a) {
                currentRatio = metrics.currentRatio, quickRatio = metrics.quickRatio;
                severity = 'low';
                recommendations = [];
                if (currentRatio.lt(1.0)) {
                    severity = 'critical';
                    recommendations.push('Immediate liquidity concerns - current liabilities exceed current assets');
                    recommendations.push('Consider emergency funding options');
                }
                else if (currentRatio.lt(1.5)) {
                    severity = 'medium';
                    recommendations.push('Monitor liquidity closely');
                    recommendations.push('Improve working capital management');
                }
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'liquidity_analysis',
                        severity: severity,
                        title: "Liquidity Analysis - Current Ratio: ".concat(currentRatio.toFixed(2)),
                        description: "Current ratio is ".concat(currentRatio.toFixed(2), " and quick ratio is ").concat(quickRatio.toFixed(2), "."),
                        narrative: '',
                        recommendations: recommendations,
                        metrics: [
                            {
                                name: 'Current Ratio',
                                value: currentRatio,
                                trend: currentRatio.gt(1.5) ? 'up' : 'down',
                                unit: 'ratio'
                            },
                            {
                                name: 'Quick Ratio',
                                value: quickRatio,
                                trend: 'stable',
                                unit: 'ratio'
                            }
                        ],
                        visualizations: [],
                        confidence: 0.8,
                        createdAt: new Date()
                    }];
            });
        });
    };
    InsightEngine.prototype.analyzeDebt = function (data, metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var debtToEquity, totalLiabilities, equity, severity, recommendations;
            return __generator(this, function (_a) {
                debtToEquity = metrics.debtToEquity, totalLiabilities = metrics.totalLiabilities, equity = metrics.equity;
                severity = 'low';
                recommendations = [];
                if (debtToEquity.gt(3.0)) {
                    severity = 'critical';
                    recommendations.push('Debt levels are concerning - consider debt restructuring');
                    recommendations.push('Focus on debt reduction strategy');
                }
                else if (debtToEquity.gt(2.0)) {
                    severity = 'high';
                    recommendations.push('Monitor debt levels closely');
                    recommendations.push('Avoid taking on additional debt');
                }
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'debt_analysis',
                        severity: severity,
                        title: "Debt Analysis - D/E Ratio: ".concat(debtToEquity.toFixed(2)),
                        description: "Debt-to-equity ratio is ".concat(debtToEquity.toFixed(2), " with total liabilities of ").concat(totalLiabilities.toFixed(0), "."),
                        narrative: '',
                        recommendations: recommendations,
                        metrics: [
                            {
                                name: 'Debt-to-Equity Ratio',
                                value: debtToEquity,
                                trend: debtToEquity.lt(1.5) ? 'down' : 'up',
                                unit: 'ratio'
                            },
                            {
                                name: 'Total Liabilities',
                                value: totalLiabilities,
                                trend: 'stable',
                                unit: 'currency'
                            }
                        ],
                        visualizations: [],
                        confidence: 0.8,
                        createdAt: new Date()
                    }];
            });
        });
    };
    // Utility methods
    InsightEngine.prototype.sumByType = function (data, type) {
        return data
            .filter(function (d) { return d.type === type; })
            .reduce(function (sum, d) { return sum.plus(d.amount); }, new decimal_js_1.Decimal(0));
    };
    InsightEngine.prototype.calculateCurrentRatio = function (data) {
        var currentAssets = this.sumByCategory(data, 'asset', ['cash', 'accounts_receivable', 'inventory']);
        var currentLiabilities = this.sumByCategory(data, 'liability', ['accounts_payable', 'short_term_debt']);
        return currentLiabilities.gt(0) ? currentAssets.div(currentLiabilities) : new decimal_js_1.Decimal(0);
    };
    InsightEngine.prototype.calculateQuickRatio = function (data) {
        var quickAssets = this.sumByCategory(data, 'asset', ['cash', 'accounts_receivable']);
        var currentLiabilities = this.sumByCategory(data, 'liability', ['accounts_payable', 'short_term_debt']);
        return currentLiabilities.gt(0) ? quickAssets.div(currentLiabilities) : new decimal_js_1.Decimal(0);
    };
    InsightEngine.prototype.sumByCategory = function (data, type, categories) {
        return data
            .filter(function (d) { return d.type === type && categories.includes(d.category); })
            .reduce(function (sum, d) { return sum.plus(d.amount); }, new decimal_js_1.Decimal(0));
    };
    InsightEngine.prototype.calculateCashFlow = function (data) {
        // Implementation would calculate actual cash flow from financial data
        return [];
    };
    InsightEngine.prototype.calculateTrend = function (data, metric) {
        var values = data.map(function (d) { return parseFloat(d.amount.toString()); });
        var dates = data.map(function (d) { return d.timestamp.getTime(); });
        // Linear regression for trend
        var regression = stats.linearRegression(dates.map(function (d, i) { return [i, values[i]]; }));
        return {
            slope: regression.m,
            intercept: regression.b,
            correlation: stats.sampleCorrelation(dates.map(function (_, i) { return i; }), values),
            significance: Math.abs(stats.sampleCorrelation(dates.map(function (_, i) { return i; }), values)),
            direction: regression.m > 0 ? 'increasing' : 'decreasing'
        };
    };
    InsightEngine.prototype.createTrendInsight = function (trend, metric) {
        return __awaiter(this, void 0, void 0, function () {
            var severity, direction;
            return __generator(this, function (_a) {
                severity = trend.significance > 0.9 ? 'high' : 'medium';
                direction = trend.direction === 'increasing' ? 'rising' : 'falling';
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'trend_analysis',
                        severity: severity,
                        title: "".concat(metric.toUpperCase(), " Trend: ").concat(direction),
                        description: "".concat(metric, " shows a ").concat(direction, " trend with ").concat((trend.significance * 100).toFixed(0), "% confidence."),
                        narrative: '',
                        recommendations: this.getTrendRecommendations(metric, trend.direction),
                        metrics: [],
                        visualizations: [],
                        confidence: trend.significance,
                        createdAt: new Date()
                    }];
            });
        });
    };
    InsightEngine.prototype.getTrendRecommendations = function (metric, direction) {
        var _a;
        var recommendations = {
            revenue: {
                increasing: ['Continue successful strategies', 'Scale operations', 'Monitor market saturation'],
                decreasing: ['Review marketing strategy', 'Analyze customer churn', 'Diversify revenue streams']
            },
            expenses: {
                increasing: ['Review cost control measures', 'Identify efficiency opportunities', 'Renegotiate vendor contracts'],
                decreasing: ['Maintain cost discipline', 'Ensure quality is not compromised', 'Consider strategic investments']
            }
        };
        return ((_a = recommendations[metric]) === null || _a === void 0 ? void 0 : _a[direction]) || ['Monitor trend closely', 'Investigate underlying causes'];
    };
    InsightEngine.prototype.generateInsightId = function () {
        return "insight_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    InsightEngine.prototype.fetchFinancialData = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch from database
                return [2 /*return*/, []];
            });
        });
    };
    InsightEngine.prototype.fetchBudgetData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch budget data
                return [2 /*return*/, []];
            });
        });
    };
    InsightEngine.prototype.fetchClientFinancialData = function (clientId, timeWindow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch client financial data
                return [2 /*return*/, []];
            });
        });
    };
    InsightEngine.prototype.fetchBehavioralData = function (clientId, timeWindow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch behavioral data
                return [2 /*return*/, {}];
            });
        });
    };
    InsightEngine.prototype.fetchMarketData = function (timeWindow) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch market data
                return [2 /*return*/, {}];
            });
        });
    };
    // Missing method implementations
    /**
     * Load narrative templates for insight generation
     */
    InsightEngine.prototype.loadNarrativeTemplates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation - load narrative templates
                this.narrativeTemplates.set('financial_health', {
                    pattern: 'financial_health',
                    template: 'Financial health analysis shows {metrics} with {trend} trend.',
                    variables: ['metrics', 'trend']
                });
                this.narrativeTemplates.set('variance_analysis', {
                    pattern: 'variance_analysis',
                    template: 'Budget variance analysis reveals {variance}% difference from planned values.',
                    variables: ['variance']
                });
                this.narrativeTemplates.set('trend_analysis', {
                    pattern: 'trend_analysis',
                    template: '{metric} shows a {direction} trend with {confidence}% confidence.',
                    variables: ['metric', 'direction', 'confidence']
                });
                console.log('Narrative templates loaded');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Load benchmark data for comparisons
     */
    InsightEngine.prototype.loadBenchmarkData = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation - load industry benchmark data
                this.benchmarkData.set('technology', {
                    industry: 'technology',
                    metrics: {
                        gross_margin: 0.65,
                        operating_margin: 0.20,
                        current_ratio: 2.1,
                        debt_to_equity: 0.4
                    }
                });
                this.benchmarkData.set('healthcare', {
                    industry: 'healthcare',
                    metrics: {
                        gross_margin: 0.45,
                        operating_margin: 0.15,
                        current_ratio: 1.8,
                        debt_to_equity: 0.6
                    }
                });
                console.log('Benchmark data loaded');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate comprehensive insights for all analysis types
     */
    InsightEngine.prototype.generateComprehensiveInsights = function (data, request) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        insights = [];
                        _b = 
                        // Generate all types of insights
                        (_a = insights.push).apply;
                        _c = [
                            // Generate all types of insights
                            insights];
                        return [4 /*yield*/, this.analyzeFinancialHealth(data, request)];
                    case 1:
                        // Generate all types of insights
                        _b.apply(_a, _c.concat([_o.sent()]));
                        _e = (_d = insights.push).apply;
                        _f = [insights];
                        return [4 /*yield*/, this.analyzeVariances(data, request)];
                    case 2:
                        _e.apply(_d, _f.concat([_o.sent()]));
                        _h = (_g = insights.push).apply;
                        _j = [insights];
                        return [4 /*yield*/, this.analyzeTrends(data, request)];
                    case 3:
                        _h.apply(_g, _j.concat([_o.sent()]));
                        _l = (_k = insights.push).apply;
                        _m = [insights];
                        return [4 /*yield*/, this.detectAnomalies(data, request)];
                    case 4:
                        _l.apply(_k, _m.concat([_o.sent()]));
                        return [2 /*return*/, insights];
                }
            });
        });
    };
    /**
     * Add benchmark comparisons to insights
     */
    InsightEngine.prototype.addBenchmarkComparisons = function (insights, request) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, insights_2, insight;
            var _this = this;
            return __generator(this, function (_a) {
                // Placeholder implementation - add benchmark comparisons
                for (_i = 0, insights_2 = insights; _i < insights_2.length; _i++) {
                    insight = insights_2[_i];
                    // Add benchmark data to insight metrics
                    insight.metrics.forEach(function (metric) {
                        if (metric.name === 'Gross Margin' && _this.benchmarkData.has('technology')) {
                            var benchmark = _this.benchmarkData.get('technology');
                            metric.benchmark = new decimal_js_1.Decimal(benchmark.metrics.gross_margin * 100);
                        }
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate narrative description for insights
     */
    InsightEngine.prototype.generateNarrative = function (insight) {
        return __awaiter(this, void 0, void 0, function () {
            var template, narrative;
            var _a;
            return __generator(this, function (_b) {
                template = this.narrativeTemplates.get(insight.type);
                if (!template) {
                    return [2 /*return*/, "Analysis of ".concat(insight.type, " reveals ").concat(insight.description)];
                }
                narrative = template.template;
                // Replace common variables
                narrative = narrative.replace('{metrics}', insight.metrics.map(function (m) { return m.name; }).join(', '));
                narrative = narrative.replace('{trend}', ((_a = insight.metrics[0]) === null || _a === void 0 ? void 0 : _a.trend) || 'stable');
                narrative = narrative.replace('{confidence}', Math.round(insight.confidence * 100).toString());
                return [2 /*return*/, narrative];
            });
        });
    };
    /**
     * Calculate variances between actual and budget data
     */
    InsightEngine.prototype.calculateVariances = function (actualData, budgetData, period) {
        // Placeholder implementation - calculate budget variances
        var variances = [];
        // Group actual data by category
        var actualByCategory = this.groupByCategory(actualData);
        // Compare with budget (simplified implementation)
        Object.keys(actualByCategory).forEach(function (category) {
            var actualAmount = actualByCategory[category];
            var budgetAmount = 10000; // Placeholder budget amount
            var variance = actualAmount - budgetAmount;
            var percentageVariance = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
            variances.push({
                category: category,
                actual: actualAmount,
                budget: budgetAmount,
                variance: variance,
                percentageVariance: percentageVariance
            });
        });
        return variances;
    };
    /**
     * Create variance insight from variance data
     */
    InsightEngine.prototype.createVarianceInsight = function (variance, data) {
        return __awaiter(this, void 0, void 0, function () {
            var severity;
            return __generator(this, function (_a) {
                severity = Math.abs(variance.percentageVariance) > 25 ? 'high' : 'medium';
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'variance_analysis',
                        severity: severity,
                        title: "".concat(variance.category, " Budget Variance: ").concat(variance.percentageVariance.toFixed(1), "%"),
                        description: "".concat(variance.category, " shows ").concat(variance.percentageVariance > 0 ? 'over' : 'under', " budget by ").concat(Math.abs(variance.percentageVariance).toFixed(1), "%"),
                        narrative: '',
                        recommendations: this.getVarianceRecommendations(variance),
                        metrics: [
                            {
                                name: 'Actual Amount',
                                value: new decimal_js_1.Decimal(variance.actual),
                                trend: 'stable',
                                unit: 'currency'
                            },
                            {
                                name: 'Budget Amount',
                                value: new decimal_js_1.Decimal(variance.budget),
                                trend: 'stable',
                                unit: 'currency'
                            },
                            {
                                name: 'Variance %',
                                value: new decimal_js_1.Decimal(variance.percentageVariance),
                                trend: variance.percentageVariance > 0 ? 'up' : 'down',
                                unit: 'percentage'
                            }
                        ],
                        visualizations: [],
                        confidence: 0.85,
                        createdAt: new Date()
                    }];
            });
        });
    };
    /**
     * Create overall budget insight
     */
    InsightEngine.prototype.createOverallBudgetInsight = function (variances) {
        return __awaiter(this, void 0, void 0, function () {
            var totalVariance, avgVariancePercent, severity;
            return __generator(this, function (_a) {
                totalVariance = variances.reduce(function (sum, v) { return sum + v.variance; }, 0);
                avgVariancePercent = stats.mean(variances.map(function (v) { return Math.abs(v.percentageVariance); }));
                severity = 'low';
                if (avgVariancePercent > 25)
                    severity = 'high';
                else if (avgVariancePercent > 15)
                    severity = 'medium';
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'budget_performance',
                        severity: severity,
                        title: "Overall Budget Performance",
                        description: "Budget performance shows average variance of ".concat(avgVariancePercent.toFixed(1), "%"),
                        narrative: '',
                        recommendations: [
                            'Review budget planning process',
                            'Implement more frequent budget reviews',
                            'Improve forecasting accuracy'
                        ],
                        metrics: [
                            {
                                name: 'Total Variance',
                                value: new decimal_js_1.Decimal(totalVariance),
                                trend: totalVariance > 0 ? 'up' : 'down',
                                unit: 'currency'
                            },
                            {
                                name: 'Average Variance %',
                                value: new decimal_js_1.Decimal(avgVariancePercent),
                                trend: 'stable',
                                unit: 'percentage'
                            }
                        ],
                        visualizations: [],
                        confidence: 0.8,
                        createdAt: new Date()
                    }];
            });
        });
    };
    // Helper methods
    InsightEngine.prototype.groupByCategory = function (data) {
        return data.reduce(function (acc, item) {
            var category = item.category;
            acc[category] = (acc[category] || 0) + parseFloat(item.amount.toString());
            return acc;
        }, {});
    };
    InsightEngine.prototype.getVarianceRecommendations = function (variance) {
        if (variance.percentageVariance > 15) {
            return [
                "Investigate causes of ".concat(variance.category, " overspend"),
                'Implement tighter cost controls',
                'Review approval processes'
            ];
        }
        else if (variance.percentageVariance < -15) {
            return [
                "Analyze ".concat(variance.category, " underspend"),
                'Consider budget reallocation',
                'Review if targets are realistic'
            ];
        }
        return ['Monitor variance trends', 'Maintain current controls'];
    };
    InsightEngine.prototype.detectTransactionAnomalies = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, []];
            });
        });
    };
    InsightEngine.prototype.detectPatternAnomalies = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, []];
            });
        });
    };
    InsightEngine.prototype.detectBenchmarkAnomalies = function (data, config, request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, []];
            });
        });
    };
    InsightEngine.prototype.createAnomalyInsight = function (anomaly) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'anomaly_detection',
                        severity: anomaly.severity,
                        title: "Anomaly Detected: ".concat(anomaly.type),
                        description: anomaly.description,
                        narrative: '',
                        recommendations: anomaly.suggestedActions,
                        metrics: [],
                        visualizations: [],
                        confidence: anomaly.confidence,
                        createdAt: new Date()
                    }];
            });
        });
    };
    InsightEngine.prototype.calculateKPIs = function (organizationId, clientId, period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, {
                        revenue_growth: 10.5,
                        gross_margin: 65.2,
                        operating_margin: 20.1,
                        current_ratio: 2.1,
                        quick_ratio: 1.8,
                        debt_to_equity: 0.4,
                        return_on_assets: 15.3,
                        days_sales_outstanding: 45,
                        inventory_turnover: 6.2,
                        cash_conversion_cycle: 35
                    }];
            });
        });
    };
    InsightEngine.prototype.createKPIInsight = function (kpi, current, previous, change) {
        return __awaiter(this, void 0, void 0, function () {
            var severity;
            return __generator(this, function (_a) {
                if (Math.abs(change) < 5)
                    return [2 /*return*/, null]; // Only create insights for significant changes
                severity = Math.abs(change) > 20 ? 'high' : 'medium';
                return [2 /*return*/, {
                        id: this.generateInsightId(),
                        type: 'kpi_analysis',
                        severity: severity,
                        title: "".concat(kpi.replace('_', ' ').toUpperCase(), " Change: ").concat(change.toFixed(1), "%"),
                        description: "".concat(kpi, " has ").concat(change > 0 ? 'increased' : 'decreased', " by ").concat(Math.abs(change).toFixed(1), "%"),
                        narrative: '',
                        recommendations: this.getKPIRecommendations(kpi, change),
                        metrics: [
                            {
                                name: 'Current Value',
                                value: new decimal_js_1.Decimal(current),
                                trend: change > 0 ? 'up' : 'down',
                                unit: this.getKPIUnit(kpi)
                            },
                            {
                                name: 'Previous Value',
                                value: new decimal_js_1.Decimal(previous),
                                trend: 'stable',
                                unit: this.getKPIUnit(kpi)
                            },
                            {
                                name: 'Change %',
                                value: new decimal_js_1.Decimal(change),
                                trend: change > 0 ? 'up' : 'down',
                                unit: 'percentage'
                            }
                        ],
                        visualizations: [],
                        confidence: 0.85,
                        createdAt: new Date()
                    }];
            });
        });
    };
    InsightEngine.prototype.getKPIRecommendations = function (kpi, change) {
        var _a;
        var recommendations = {
            revenue_growth: {
                positive: ['Scale successful strategies', 'Invest in growth opportunities'],
                negative: ['Review marketing effectiveness', 'Analyze customer retention']
            },
            gross_margin: {
                positive: ['Maintain cost discipline', 'Consider price optimization'],
                negative: ['Review supplier costs', 'Improve operational efficiency']
            }
        };
        var direction = change > 0 ? 'positive' : 'negative';
        return ((_a = recommendations[kpi]) === null || _a === void 0 ? void 0 : _a[direction]) || ['Monitor trend closely'];
    };
    InsightEngine.prototype.getKPIUnit = function (kpi) {
        var units = {
            revenue_growth: 'percentage',
            gross_margin: 'percentage',
            operating_margin: 'percentage',
            current_ratio: 'ratio',
            quick_ratio: 'ratio',
            debt_to_equity: 'ratio',
            return_on_assets: 'percentage',
            days_sales_outstanding: 'days',
            inventory_turnover: 'ratio',
            cash_conversion_cycle: 'days'
        };
        return units[kpi] || 'number';
    };
    InsightEngine.prototype.calculateFinancialRisk = function (data) {
        // Placeholder implementation
        return 35; // Low to medium risk
    };
    InsightEngine.prototype.calculateBehavioralRisk = function (data) {
        // Placeholder implementation
        return 25; // Low risk
    };
    InsightEngine.prototype.calculateMarketRisk = function (data) {
        // Placeholder implementation
        return 45; // Medium risk
    };
    InsightEngine.prototype.getRiskWeights = function (includeFinancial, includeBehavioral, includeMarket) {
        var weights = { financial: 0, behavioral: 0, market: 0 };
        var total = 0;
        if (includeFinancial) {
            weights.financial = 0.5;
            total += 0.5;
        }
        if (includeBehavioral) {
            weights.behavioral = 0.3;
            total += 0.3;
        }
        if (includeMarket) {
            weights.market = 0.2;
            total += 0.2;
        }
        // Normalize weights
        if (total > 0) {
            weights.financial /= total;
            weights.behavioral /= total;
            weights.market /= total;
        }
        return weights;
    };
    InsightEngine.prototype.calculateRiskTrend = function (historicalScores, currentScore) {
        if (historicalScores.length === 0)
            return 'stable';
        var recentScore = historicalScores[historicalScores.length - 1];
        var change = currentScore - recentScore;
        if (change > 5)
            return 'deteriorating';
        if (change < -5)
            return 'improving';
        return 'stable';
    };
    InsightEngine.prototype.identifyRiskFactors = function (financialData, behavioralData, marketData) {
        // Placeholder implementation
        return [
            {
                category: 'financial',
                factor: 'cash_flow_volatility',
                impact: -15,
                confidence: 0.8,
                description: 'High volatility in cash flow patterns'
            }
        ];
    };
    InsightEngine.prototype.generateRiskRecommendations = function (score, factors) {
        var recommendations = ['Monitor risk factors regularly'];
        if (score > 70) {
            recommendations.push('Implement immediate risk mitigation strategies');
            recommendations.push('Consider professional risk assessment');
        }
        else if (score > 50) {
            recommendations.push('Develop risk monitoring procedures');
            recommendations.push('Review financial controls');
        }
        return recommendations;
    };
    InsightEngine.prototype.getHistoricalRiskScores = function (clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation
                return [2 /*return*/, [45, 42, 38, 35]]; // Improving trend
            });
        });
    };
    InsightEngine.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Insight Engine shut down');
                return [2 /*return*/];
            });
        });
    };
    return InsightEngine;
}());
exports.InsightEngine = InsightEngine;
// Supporting classes for anomaly detection
var StatisticalAnomalyDetector = /** @class */ (function () {
    function StatisticalAnomalyDetector() {
    }
    StatisticalAnomalyDetector.prototype.detect = function (data, config) {
        // Implementation for statistical anomaly detection
        return [];
    };
    return StatisticalAnomalyDetector;
}());
var MLAnomalyDetector = /** @class */ (function () {
    function MLAnomalyDetector() {
    }
    MLAnomalyDetector.prototype.detect = function (data, config) {
        // Implementation for ML-based anomaly detection
        return [];
    };
    return MLAnomalyDetector;
}());
var RuleBasedAnomalyDetector = /** @class */ (function () {
    function RuleBasedAnomalyDetector() {
    }
    RuleBasedAnomalyDetector.prototype.detect = function (data, config) {
        // Implementation for rule-based anomaly detection
        return [];
    };
    return RuleBasedAnomalyDetector;
}());
__exportStar(require("./narratives"), exports);
__exportStar(require("./kpi-analyzer"), exports);
__exportStar(require("./anomaly-detector"), exports);
