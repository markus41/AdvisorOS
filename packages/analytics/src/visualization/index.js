"use strict";
/**
 * Visualization Engine - Advanced Data Visualization and Interactive Charts
 * Creates sophisticated financial visualizations, dashboards, and interactive charts
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
exports.DataExplorer = exports.RealtimeChart = exports.Dashboard = exports.AnimationEngine = exports.InteractionManager = exports.ThemeManager = exports.ChartRenderer = exports.VisualizationEngine = void 0;
var VisualizationEngine = /** @class */ (function () {
    function VisualizationEngine(config) {
        this.config = config;
        this.chartRenderers = new Map();
        this.themeManager = new ThemeManager();
        this.interactionManager = new InteractionManager();
        this.animationEngine = new AnimationEngine();
    }
    VisualizationEngine.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Initialize chart renderers
                        this.chartRenderers.set('line', new LineChartRenderer());
                        this.chartRenderers.set('bar', new BarChartRenderer());
                        this.chartRenderers.set('pie', new PieChartRenderer());
                        this.chartRenderers.set('scatter', new ScatterPlotRenderer());
                        this.chartRenderers.set('heatmap', new HeatmapRenderer());
                        this.chartRenderers.set('gauge', new GaugeChartRenderer());
                        this.chartRenderers.set('table', new TableRenderer());
                        this.chartRenderers.set('waterfall', new WaterfallChartRenderer());
                        this.chartRenderers.set('treemap', new TreemapRenderer());
                        this.chartRenderers.set('funnel', new FunnelChartRenderer());
                        // Load themes
                        return [4 /*yield*/, this.themeManager.initialize()];
                    case 1:
                        // Load themes
                        _a.sent();
                        console.log('Visualization Engine initialized');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create comprehensive financial dashboard
     */
    VisualizationEngine.prototype.createFinancialDashboard = function (organizationId_1, clientId_1) {
        return __awaiter(this, arguments, void 0, function (organizationId, clientId, config) {
            var dashboard, overviewSection, revenueSection, cashFlowSection, expenseSection, kpiSection, riskSection;
            if (config === void 0) { config = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dashboard = new Dashboard(organizationId, clientId, config);
                        return [4 /*yield*/, this.createFinancialOverview(organizationId, clientId)];
                    case 1:
                        overviewSection = _a.sent();
                        dashboard.addSection('overview', overviewSection);
                        return [4 /*yield*/, this.createRevenueAnalysis(organizationId, clientId)];
                    case 2:
                        revenueSection = _a.sent();
                        dashboard.addSection('revenue', revenueSection);
                        return [4 /*yield*/, this.createCashFlowAnalysis(organizationId, clientId)];
                    case 3:
                        cashFlowSection = _a.sent();
                        dashboard.addSection('cashflow', cashFlowSection);
                        return [4 /*yield*/, this.createExpenseAnalysis(organizationId, clientId)];
                    case 4:
                        expenseSection = _a.sent();
                        dashboard.addSection('expenses', expenseSection);
                        return [4 /*yield*/, this.createKPISection(organizationId, clientId)];
                    case 5:
                        kpiSection = _a.sent();
                        dashboard.addSection('kpis', kpiSection);
                        return [4 /*yield*/, this.createRiskIndicators(organizationId, clientId)];
                    case 6:
                        riskSection = _a.sent();
                        dashboard.addSection('risk', riskSection);
                        return [2 /*return*/, dashboard];
                }
            });
        });
    };
    /**
     * Generate visualization from specification
     */
    VisualizationEngine.prototype.generateVisualization = function (spec) {
        return __awaiter(this, void 0, void 0, function () {
            var renderer, startTime, themedConfig, processedData, renderedData, renderTime, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        renderer = this.chartRenderers.get(spec.type);
                        if (!renderer) {
                            throw new Error("Unsupported visualization type: ".concat(spec.type));
                        }
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        themedConfig = this.themeManager.applyTheme(spec.config);
                        return [4 /*yield*/, this.prepareData(spec.data, spec.type)];
                    case 2:
                        processedData = _a.sent();
                        return [4 /*yield*/, renderer.render(processedData, themedConfig)];
                    case 3:
                        renderedData = _a.sent();
                        // Add interactions if enabled
                        if (themedConfig.interactive) {
                            this.interactionManager.addInteractions(renderedData, themedConfig);
                        }
                        // Add animations if enabled
                        if (themedConfig.animations !== false) {
                            this.animationEngine.addAnimations(renderedData, spec.type);
                        }
                        renderTime = Date.now() - startTime;
                        return [2 /*return*/, {
                                id: this.generateVisualizationId(),
                                spec: spec,
                                renderedData: renderedData,
                                metadata: {
                                    generatedAt: new Date(),
                                    dataPoints: processedData.length,
                                    renderTime: renderTime
                                }
                            }];
                    case 4:
                        error_1 = _a.sent();
                        throw new Error("Visualization generation failed: ".concat(error_1.message));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create real-time chart with live data updates
     */
    VisualizationEngine.prototype.createRealtimeChart = function (spec_1) {
        return __awaiter(this, arguments, void 0, function (spec, updateInterval) {
            var chart, initialVisualization;
            var _this = this;
            if (updateInterval === void 0) { updateInterval = 5000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chart = new RealtimeChart(spec, updateInterval);
                        return [4 /*yield*/, this.generateVisualization(spec)];
                    case 1:
                        initialVisualization = _a.sent();
                        chart.setVisualization(initialVisualization);
                        // Set up data update mechanism
                        chart.onDataUpdate(function (newData) { return __awaiter(_this, void 0, void 0, function () {
                            var updatedSpec, updatedVisualization;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        updatedSpec = __assign(__assign({}, spec), { data: newData });
                                        return [4 /*yield*/, this.generateVisualization(updatedSpec)];
                                    case 1:
                                        updatedVisualization = _a.sent();
                                        chart.updateVisualization(updatedVisualization);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/, chart];
                }
            });
        });
    };
    /**
     * Create interactive data explorer
     */
    VisualizationEngine.prototype.createDataExplorer = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            var explorer, summaryChart;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        explorer = new DataExplorer(data, config);
                        return [4 /*yield*/, this.createSummaryVisualization(data)];
                    case 1:
                        summaryChart = _a.sent();
                        explorer.setSummaryChart(summaryChart);
                        // Set up drill-down capabilities
                        if (config.enableDrillDown) {
                            explorer.enableDrillDown(function (filters) { return __awaiter(_this, void 0, void 0, function () {
                                var filteredData;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            filteredData = this.applyFilters(data, filters);
                                            return [4 /*yield*/, this.createDetailVisualization(filteredData, config)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); });
                        }
                        // Add comparison capabilities
                        if (config.enableComparison) {
                            explorer.enableComparison(function (compareData) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.createComparisonVisualization(data, compareData)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); });
                        }
                        return [2 /*return*/, explorer];
                }
            });
        });
    };
    /**
     * Financial Overview Visualizations
     */
    VisualizationEngine.prototype.createFinancialOverview = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, visualizations, metricsSpec, _a, _b, healthSpec, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.fetchFinancialOverviewData(organizationId, clientId)];
                    case 1:
                        data = _e.sent();
                        visualizations = [];
                        metricsSpec = {
                            type: 'metric_cards',
                            data: data.keyMetrics,
                            config: {
                                layout: 'grid',
                                columns: 4,
                                showTrends: true,
                                showBenchmarks: true,
                                responsive: true,
                                interactive: false
                            },
                            title: 'Key Financial Metrics'
                        };
                        _b = (_a = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(metricsSpec)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        healthSpec = {
                            type: 'gauge',
                            data: [{ value: data.healthScore, max: 100, label: 'Financial Health' }],
                            config: {
                                colors: ['#dc2626', '#f59e0b', '#10b981'],
                                thresholds: [30, 70],
                                responsive: true,
                                interactive: true
                            },
                            title: 'Financial Health Score'
                        };
                        _d = (_c = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(healthSpec)];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                id: 'financial_overview',
                                title: 'Financial Overview',
                                visualizations: visualizations,
                                layout: { columns: 2, gap: 16 }
                            }];
                }
            });
        });
    };
    /**
     * Revenue Analysis Visualizations
     */
    VisualizationEngine.prototype.createRevenueAnalysis = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, visualizations, trendSpec, _a, _b, categorySpec, _c, _d, growthSpec, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, this.fetchRevenueData(organizationId, clientId)];
                    case 1:
                        data = _g.sent();
                        visualizations = [];
                        trendSpec = {
                            type: 'line',
                            data: data.monthlyRevenue,
                            config: {
                                xAxis: { label: 'Month', type: 'time' },
                                yAxis: { label: 'Revenue', type: 'linear', format: 'currency' },
                                colors: ['#3b82f6'],
                                showPoints: true,
                                showTrendline: true,
                                responsive: true,
                                interactive: true,
                                annotations: data.seasonalMarkers
                            },
                            title: 'Revenue Trend'
                        };
                        _b = (_a = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(trendSpec)];
                    case 2:
                        _b.apply(_a, [_g.sent()]);
                        categorySpec = {
                            type: 'pie',
                            data: data.revenueByCategory,
                            config: {
                                colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                                showLabels: true,
                                showPercentages: true,
                                responsive: true,
                                interactive: true
                            },
                            title: 'Revenue by Category'
                        };
                        _d = (_c = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(categorySpec)];
                    case 3:
                        _d.apply(_c, [_g.sent()]);
                        growthSpec = {
                            type: 'waterfall',
                            data: data.revenueGrowthFactors,
                            config: {
                                positiveColor: '#10b981',
                                negativeColor: '#ef4444',
                                totalColor: '#3b82f6',
                                responsive: true,
                                interactive: true
                            },
                            title: 'Revenue Growth Analysis'
                        };
                        _f = (_e = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(growthSpec)];
                    case 4:
                        _f.apply(_e, [_g.sent()]);
                        return [2 /*return*/, {
                                id: 'revenue_analysis',
                                title: 'Revenue Analysis',
                                visualizations: visualizations,
                                layout: { columns: 2, gap: 16 }
                            }];
                }
            });
        });
    };
    /**
     * Cash Flow Analysis Visualizations
     */
    VisualizationEngine.prototype.createCashFlowAnalysis = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, visualizations, statementSpec, _a, _b, balanceSpec, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.fetchCashFlowData(organizationId, clientId)];
                    case 1:
                        data = _e.sent();
                        visualizations = [];
                        statementSpec = {
                            type: 'bar',
                            data: data.cashFlowStatement,
                            config: {
                                xAxis: { label: 'Period', type: 'category' },
                                yAxis: { label: 'Cash Flow', type: 'linear', format: 'currency' },
                                groupBy: 'category',
                                colors: ['#10b981', '#3b82f6', '#f59e0b'],
                                stacked: false,
                                showZeroLine: true,
                                responsive: true,
                                interactive: true
                            },
                            title: 'Cash Flow Statement'
                        };
                        _b = (_a = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(statementSpec)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        balanceSpec = {
                            type: 'line',
                            data: data.dailyCashBalance,
                            config: {
                                xAxis: { label: 'Date', type: 'time' },
                                yAxis: { label: 'Cash Balance', type: 'linear', format: 'currency' },
                                colors: ['#3b82f6'],
                                area: true,
                                showPoints: false,
                                responsive: true,
                                interactive: true,
                                annotations: data.criticalLevels
                            },
                            title: 'Daily Cash Balance'
                        };
                        _d = (_c = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(balanceSpec)];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                id: 'cashflow_analysis',
                                title: 'Cash Flow Analysis',
                                visualizations: visualizations,
                                layout: { columns: 2, gap: 16 }
                            }];
                }
            });
        });
    };
    /**
     * Expense Analysis Visualizations
     */
    VisualizationEngine.prototype.createExpenseAnalysis = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, visualizations, treemapSpec, _a, _b, trendSpec, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.fetchExpenseData(organizationId, clientId)];
                    case 1:
                        data = _e.sent();
                        visualizations = [];
                        treemapSpec = {
                            type: 'treemap',
                            data: data.expenseHierarchy,
                            config: {
                                valueField: 'amount',
                                labelField: 'category',
                                colorField: 'change',
                                colors: ['#ef4444', '#f59e0b', '#10b981'],
                                responsive: true,
                                interactive: true
                            },
                            title: 'Expense Breakdown'
                        };
                        _b = (_a = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(treemapSpec)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        trendSpec = {
                            type: 'line',
                            data: data.expenseTrends,
                            config: {
                                xAxis: { label: 'Month', type: 'time' },
                                yAxis: { label: 'Amount', type: 'linear', format: 'currency' },
                                groupBy: 'category',
                                colors: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
                                responsive: true,
                                interactive: true
                            },
                            title: 'Expense Trends by Category'
                        };
                        _d = (_c = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(trendSpec)];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                id: 'expense_analysis',
                                title: 'Expense Analysis',
                                visualizations: visualizations,
                                layout: { columns: 2, gap: 16 }
                            }];
                }
            });
        });
    };
    /**
     * KPI Section Visualizations
     */
    VisualizationEngine.prototype.createKPISection = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, visualizations, scorecardSpec, _a, _b, radarSpec, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.fetchKPIData(organizationId, clientId)];
                    case 1:
                        data = _e.sent();
                        visualizations = [];
                        scorecardSpec = {
                            type: 'scorecard',
                            data: data.kpis,
                            config: {
                                layout: 'grid',
                                columns: 3,
                                showTrends: true,
                                showTargets: true,
                                showBenchmarks: true,
                                responsive: true,
                                interactive: true
                            },
                            title: 'Key Performance Indicators'
                        };
                        _b = (_a = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(scorecardSpec)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        radarSpec = {
                            type: 'radar',
                            data: data.kpiComparison,
                            config: {
                                axes: data.kpiNames,
                                series: ['current', 'previous', 'target'],
                                colors: ['#3b82f6', '#94a3b8', '#10b981'],
                                responsive: true,
                                interactive: true
                            },
                            title: 'KPI Performance Comparison'
                        };
                        _d = (_c = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(radarSpec)];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                id: 'kpi_section',
                                title: 'Key Performance Indicators',
                                visualizations: visualizations,
                                layout: { columns: 2, gap: 16 }
                            }];
                }
            });
        });
    };
    /**
     * Risk Indicators Visualizations
     */
    VisualizationEngine.prototype.createRiskIndicators = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, visualizations, heatmapSpec, _a, _b, trendSpec, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.fetchRiskData(organizationId, clientId)];
                    case 1:
                        data = _e.sent();
                        visualizations = [];
                        heatmapSpec = {
                            type: 'heatmap',
                            data: data.riskMatrix,
                            config: {
                                xAxis: { label: 'Probability', type: 'category' },
                                yAxis: { label: 'Impact', type: 'category' },
                                colorScale: ['#10b981', '#f59e0b', '#ef4444'],
                                responsive: true,
                                interactive: true
                            },
                            title: 'Risk Assessment Matrix'
                        };
                        _b = (_a = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(heatmapSpec)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        trendSpec = {
                            type: 'line',
                            data: data.riskTrends,
                            config: {
                                xAxis: { label: 'Date', type: 'time' },
                                yAxis: { label: 'Risk Score', type: 'linear' },
                                groupBy: 'riskType',
                                colors: ['#ef4444', '#f59e0b', '#3b82f6'],
                                responsive: true,
                                interactive: true
                            },
                            title: 'Risk Score Trends'
                        };
                        _d = (_c = visualizations).push;
                        return [4 /*yield*/, this.generateVisualization(trendSpec)];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        return [2 /*return*/, {
                                id: 'risk_indicators',
                                title: 'Risk Indicators',
                                visualizations: visualizations,
                                layout: { columns: 2, gap: 16 }
                            }];
                }
            });
        });
    };
    // Data preparation methods
    VisualizationEngine.prototype.prepareData = function (data, chartType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Apply data transformations based on chart type
                switch (chartType) {
                    case 'line':
                    case 'bar':
                        return [2 /*return*/, this.prepareTimeSeriesData(data)];
                    case 'pie':
                        return [2 /*return*/, this.prepareCategoricalData(data)];
                    case 'scatter':
                        return [2 /*return*/, this.prepareScatterData(data)];
                    case 'heatmap':
                        return [2 /*return*/, this.prepareMatrixData(data)];
                    default:
                        return [2 /*return*/, data];
                }
                return [2 /*return*/];
            });
        });
    };
    VisualizationEngine.prototype.prepareTimeSeriesData = function (data) {
        // Sort by date and ensure proper formatting
        return data
            .sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); })
            .map(function (d) { return (__assign(__assign({}, d), { date: new Date(d.date), value: typeof d.value === 'string' ? parseFloat(d.value) : d.value })); });
    };
    VisualizationEngine.prototype.prepareCategoricalData = function (data) {
        // Aggregate by category if needed
        var aggregated = data.reduce(function (acc, item) {
            var key = item.category || item.label;
            if (!acc[key]) {
                acc[key] = { category: key, value: 0 };
            }
            acc[key].value += typeof item.value === 'string' ? parseFloat(item.value) : item.value;
            return acc;
        }, {});
        return Object.values(aggregated);
    };
    VisualizationEngine.prototype.prepareScatterData = function (data) {
        // Ensure x and y values are numeric
        return data
            .filter(function (d) { return d.x !== undefined && d.y !== undefined; })
            .map(function (d) { return (__assign(__assign({}, d), { x: typeof d.x === 'string' ? parseFloat(d.x) : d.x, y: typeof d.y === 'string' ? parseFloat(d.y) : d.y })); });
    };
    VisualizationEngine.prototype.prepareMatrixData = function (data) {
        // Prepare data for heatmap matrix
        return data.map(function (d) { return (__assign(__assign({}, d), { value: typeof d.value === 'string' ? parseFloat(d.value) : d.value })); });
    };
    // Data fetching methods (would be implemented with actual database calls)
    VisualizationEngine.prototype.fetchFinancialOverviewData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        keyMetrics: [],
                        healthScore: 75
                    }];
            });
        });
    };
    VisualizationEngine.prototype.fetchRevenueData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        monthlyRevenue: [],
                        revenueByCategory: [],
                        revenueGrowthFactors: [],
                        seasonalMarkers: []
                    }];
            });
        });
    };
    VisualizationEngine.prototype.fetchCashFlowData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        cashFlowStatement: [],
                        dailyCashBalance: [],
                        criticalLevels: []
                    }];
            });
        });
    };
    VisualizationEngine.prototype.fetchExpenseData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        expenseHierarchy: [],
                        expenseTrends: []
                    }];
            });
        });
    };
    VisualizationEngine.prototype.fetchKPIData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        kpis: [],
                        kpiComparison: [],
                        kpiNames: []
                    }];
            });
        });
    };
    VisualizationEngine.prototype.fetchRiskData = function (organizationId, clientId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        riskMatrix: [],
                        riskTrends: []
                    }];
            });
        });
    };
    // Utility methods
    VisualizationEngine.prototype.generateVisualizationId = function () {
        return "viz_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    VisualizationEngine.prototype.applyFilters = function (data, filters) {
        // Apply filters to data
        return data.filter(function (item) {
            return Object.entries(filters).every(function (_a) {
                var key = _a[0], value = _a[1];
                return item[key] === value;
            });
        });
    };
    VisualizationEngine.prototype.createSummaryVisualization = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var spec;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spec = {
                            type: 'bar',
                            data: data.slice(0, 10), // Top 10 items
                            config: {
                                responsive: true,
                                interactive: true
                            },
                            title: 'Data Summary'
                        };
                        return [4 /*yield*/, this.generateVisualization(spec)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VisualizationEngine.prototype.createDetailVisualization = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            var spec;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        spec = {
                            type: config.detailChartType || 'line',
                            data: data,
                            config: {
                                responsive: true,
                                interactive: true
                            },
                            title: 'Detailed View'
                        };
                        return [4 /*yield*/, this.generateVisualization(spec)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VisualizationEngine.prototype.createComparisonVisualization = function (data1, data2) {
        return __awaiter(this, void 0, void 0, function () {
            var combinedData, spec;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        combinedData = __spreadArray(__spreadArray([], data1.map(function (d) { return (__assign(__assign({}, d), { series: 'Current' })); }), true), data2.map(function (d) { return (__assign(__assign({}, d), { series: 'Comparison' })); }), true);
                        spec = {
                            type: 'line',
                            data: combinedData,
                            config: {
                                groupBy: 'series',
                                responsive: true,
                                interactive: true
                            },
                            title: 'Comparison View'
                        };
                        return [4 /*yield*/, this.generateVisualization(spec)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VisualizationEngine.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Visualization Engine shut down');
                return [2 /*return*/];
            });
        });
    };
    return VisualizationEngine;
}());
exports.VisualizationEngine = VisualizationEngine;
// Supporting classes (simplified implementations)
var ChartRenderer = /** @class */ (function () {
    function ChartRenderer() {
    }
    ChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Base render method
                return [2 /*return*/, { svg: '', data: data }];
            });
        });
    };
    return ChartRenderer;
}());
exports.ChartRenderer = ChartRenderer;
var LineChartRenderer = /** @class */ (function (_super) {
    __extends(LineChartRenderer, _super);
    function LineChartRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LineChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Line chart implementation using D3
                return [2 /*return*/, { type: 'line', data: data, config: config }];
            });
        });
    };
    return LineChartRenderer;
}(ChartRenderer));
var BarChartRenderer = /** @class */ (function (_super) {
    __extends(BarChartRenderer, _super);
    function BarChartRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BarChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Bar chart implementation
                return [2 /*return*/, { type: 'bar', data: data, config: config }];
            });
        });
    };
    return BarChartRenderer;
}(ChartRenderer));
var PieChartRenderer = /** @class */ (function (_super) {
    __extends(PieChartRenderer, _super);
    function PieChartRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PieChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Pie chart implementation
                return [2 /*return*/, { type: 'pie', data: data, config: config }];
            });
        });
    };
    return PieChartRenderer;
}(ChartRenderer));
var ScatterPlotRenderer = /** @class */ (function (_super) {
    __extends(ScatterPlotRenderer, _super);
    function ScatterPlotRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ScatterPlotRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Scatter plot implementation
                return [2 /*return*/, { type: 'scatter', data: data, config: config }];
            });
        });
    };
    return ScatterPlotRenderer;
}(ChartRenderer));
var HeatmapRenderer = /** @class */ (function (_super) {
    __extends(HeatmapRenderer, _super);
    function HeatmapRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HeatmapRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Heatmap implementation
                return [2 /*return*/, { type: 'heatmap', data: data, config: config }];
            });
        });
    };
    return HeatmapRenderer;
}(ChartRenderer));
var GaugeChartRenderer = /** @class */ (function (_super) {
    __extends(GaugeChartRenderer, _super);
    function GaugeChartRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GaugeChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Gauge chart implementation
                return [2 /*return*/, { type: 'gauge', data: data, config: config }];
            });
        });
    };
    return GaugeChartRenderer;
}(ChartRenderer));
var TableRenderer = /** @class */ (function (_super) {
    __extends(TableRenderer, _super);
    function TableRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TableRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Table implementation
                return [2 /*return*/, { type: 'table', data: data, config: config }];
            });
        });
    };
    return TableRenderer;
}(ChartRenderer));
var WaterfallChartRenderer = /** @class */ (function (_super) {
    __extends(WaterfallChartRenderer, _super);
    function WaterfallChartRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WaterfallChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Waterfall chart implementation
                return [2 /*return*/, { type: 'waterfall', data: data, config: config }];
            });
        });
    };
    return WaterfallChartRenderer;
}(ChartRenderer));
var TreemapRenderer = /** @class */ (function (_super) {
    __extends(TreemapRenderer, _super);
    function TreemapRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TreemapRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Treemap implementation
                return [2 /*return*/, { type: 'treemap', data: data, config: config }];
            });
        });
    };
    return TreemapRenderer;
}(ChartRenderer));
var FunnelChartRenderer = /** @class */ (function (_super) {
    __extends(FunnelChartRenderer, _super);
    function FunnelChartRenderer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FunnelChartRenderer.prototype.render = function (data, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Funnel chart implementation
                return [2 /*return*/, { type: 'funnel', data: data, config: config }];
            });
        });
    };
    return FunnelChartRenderer;
}(ChartRenderer));
var ThemeManager = /** @class */ (function () {
    function ThemeManager() {
        this.themes = new Map();
    }
    ThemeManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Load default themes
                this.themes.set('light', {
                    background: '#ffffff',
                    text: '#374151',
                    primary: '#3b82f6',
                    secondary: '#64748b',
                    accent: '#10b981',
                    grid: '#f3f4f6'
                });
                this.themes.set('dark', {
                    background: '#1f2937',
                    text: '#f9fafb',
                    primary: '#60a5fa',
                    secondary: '#9ca3af',
                    accent: '#34d399',
                    grid: '#374151'
                });
                return [2 /*return*/];
            });
        });
    };
    ThemeManager.prototype.applyTheme = function (config) {
        var theme = this.themes.get(config.theme || 'light');
        return __assign(__assign({}, config), { colors: config.colors || (theme === null || theme === void 0 ? void 0 : theme.colors) || ['#3b82f6', '#10b981', '#f59e0b'], backgroundColor: theme === null || theme === void 0 ? void 0 : theme.background, textColor: theme === null || theme === void 0 ? void 0 : theme.text });
    };
    return ThemeManager;
}());
exports.ThemeManager = ThemeManager;
var InteractionManager = /** @class */ (function () {
    function InteractionManager() {
    }
    InteractionManager.prototype.addInteractions = function (renderedData, config) {
        // Add interactive capabilities
        if (config.enableZoom) {
            this.addZoomInteraction(renderedData);
        }
        if (config.enablePan) {
            this.addPanInteraction(renderedData);
        }
        if (config.enableTooltips) {
            this.addTooltips(renderedData);
        }
    };
    InteractionManager.prototype.addZoomInteraction = function (renderedData) {
        // Add zoom functionality
    };
    InteractionManager.prototype.addPanInteraction = function (renderedData) {
        // Add pan functionality
    };
    InteractionManager.prototype.addTooltips = function (renderedData) {
        // Add tooltip functionality
    };
    return InteractionManager;
}());
exports.InteractionManager = InteractionManager;
var AnimationEngine = /** @class */ (function () {
    function AnimationEngine() {
    }
    AnimationEngine.prototype.addAnimations = function (renderedData, chartType) {
        switch (chartType) {
            case 'line':
                this.addLineAnimations(renderedData);
                break;
            case 'bar':
                this.addBarAnimations(renderedData);
                break;
            case 'pie':
                this.addPieAnimations(renderedData);
                break;
        }
    };
    AnimationEngine.prototype.addLineAnimations = function (renderedData) {
        // Add line drawing animations
    };
    AnimationEngine.prototype.addBarAnimations = function (renderedData) {
        // Add bar growth animations
    };
    AnimationEngine.prototype.addPieAnimations = function (renderedData) {
        // Add pie slice animations
    };
    return AnimationEngine;
}());
exports.AnimationEngine = AnimationEngine;
var Dashboard = /** @class */ (function () {
    function Dashboard(organizationId, clientId, config) {
        this.organizationId = organizationId;
        this.clientId = clientId;
        this.config = config;
        this.sections = new Map();
    }
    Dashboard.prototype.addSection = function (id, section) {
        this.sections.set(id, section);
    };
    Dashboard.prototype.getSections = function () {
        return Array.from(this.sections.values());
    };
    Dashboard.prototype.getSection = function (id) {
        return this.sections.get(id);
    };
    return Dashboard;
}());
exports.Dashboard = Dashboard;
var RealtimeChart = /** @class */ (function () {
    function RealtimeChart(spec, updateInterval) {
        this.spec = spec;
        this.updateInterval = updateInterval;
        this.visualization = null;
        this.updateCallbacks = [];
    }
    RealtimeChart.prototype.setVisualization = function (visualization) {
        this.visualization = visualization;
    };
    RealtimeChart.prototype.updateVisualization = function (visualization) {
        this.visualization = visualization;
        // Trigger UI update
    };
    RealtimeChart.prototype.onDataUpdate = function (callback) {
        this.updateCallbacks.push(callback);
    };
    return RealtimeChart;
}());
exports.RealtimeChart = RealtimeChart;
var DataExplorer = /** @class */ (function () {
    function DataExplorer(data, config) {
        this.data = data;
        this.config = config;
        this.summaryChart = null;
        this.drillDownCallback = null;
        this.comparisonCallback = null;
    }
    DataExplorer.prototype.setSummaryChart = function (chart) {
        this.summaryChart = chart;
    };
    DataExplorer.prototype.enableDrillDown = function (callback) {
        this.drillDownCallback = callback;
    };
    DataExplorer.prototype.enableComparison = function (callback) {
        this.comparisonCallback = callback;
    };
    return DataExplorer;
}());
exports.DataExplorer = DataExplorer;
