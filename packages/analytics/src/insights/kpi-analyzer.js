"use strict";
/**
 * KPI Analyzer - Key Performance Indicators Analysis and Monitoring
 * Provides comprehensive KPI tracking, comparison, and alerting capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KPIAnalyzer = void 0;
var stats = require("simple-statistics");
var date_fns_1 = require("date-fns");
var KPIAnalyzer = /** @class */ (function () {
    function KPIAnalyzer() {
        this.kpiDefinitions = new Map();
        this.kpiHistory = new Map();
        this.initializeStandardKPIs();
    }
    /**
     * Initialize standard financial KPIs
     */
    KPIAnalyzer.prototype.initializeStandardKPIs = function () {
        var _this = this;
        var standardKPIs = [
            {
                id: 'revenue_growth',
                name: 'Revenue Growth Rate',
                category: 'financial',
                description: 'Month-over-month revenue growth percentage',
                formula: '((Current Revenue - Previous Revenue) / Previous Revenue) * 100',
                target: 10,
                thresholds: { critical: -5, warning: 0, good: 10 },
                frequency: 'monthly',
                dataSource: 'financial_statements',
                unit: '%'
            },
            {
                id: 'client_retention',
                name: 'Client Retention Rate',
                category: 'client',
                description: 'Percentage of clients retained over the period',
                formula: '(Retained Clients / Total Clients at Start) * 100',
                target: 95,
                thresholds: { critical: 80, warning: 90, good: 95 },
                frequency: 'monthly',
                dataSource: 'client_database',
                unit: '%'
            },
            {
                id: 'avg_invoice_value',
                name: 'Average Invoice Value',
                category: 'financial',
                description: 'Average value of invoices generated',
                formula: 'Total Invoice Value / Number of Invoices',
                target: 5000,
                thresholds: { critical: 3000, warning: 4000, good: 5000 },
                frequency: 'monthly',
                dataSource: 'billing_system',
                unit: '$'
            },
            {
                id: 'task_completion_rate',
                name: 'Task Completion Rate',
                category: 'operational',
                description: 'Percentage of tasks completed on time',
                formula: '(Completed Tasks / Total Tasks) * 100',
                target: 90,
                thresholds: { critical: 70, warning: 80, good: 90 },
                frequency: 'weekly',
                dataSource: 'task_management',
                unit: '%'
            }
        ];
        standardKPIs.forEach(function (kpi) {
            _this.kpiDefinitions.set(kpi.id, kpi);
        });
    };
    /**
     * Calculate KPI value based on raw data
     */
    KPIAnalyzer.prototype.calculateKPI = function (kpiId, data, period) {
        if (period === void 0) { period = new Date(); }
        var definition = this.kpiDefinitions.get(kpiId);
        if (!definition) {
            throw new Error("KPI definition not found: ".concat(kpiId));
        }
        var value;
        // Calculate based on KPI type
        switch (kpiId) {
            case 'revenue_growth':
                value = this.calculateRevenueGrowth(data);
                break;
            case 'client_retention':
                value = this.calculateClientRetention(data);
                break;
            case 'avg_invoice_value':
                value = this.calculateAverageInvoiceValue(data);
                break;
            case 'task_completion_rate':
                value = this.calculateTaskCompletionRate(data);
                break;
            default:
                throw new Error("Unknown KPI calculation: ".concat(kpiId));
        }
        // Determine status
        var status = this.determineKPIStatus(value, definition.thresholds);
        // Calculate trend if historical data exists
        var trend = this.calculateTrend(kpiId, value);
        var kpiValue = {
            kpiId: kpiId,
            value: value,
            date: period,
            period: (0, date_fns_1.format)(period, 'yyyy-MM'),
            status: status,
            trend: trend
        };
        // Store in history
        this.addToHistory(kpiId, kpiValue);
        return kpiValue;
    };
    /**
     * Compare current KPI with previous period
     */
    KPIAnalyzer.prototype.compareKPI = function (kpiId, currentPeriod, previousPeriod) {
        var history = this.kpiHistory.get(kpiId) || [];
        var current = history.find(function (h) {
            return (0, date_fns_1.format)(h.date, 'yyyy-MM') === (0, date_fns_1.format)(currentPeriod, 'yyyy-MM');
        });
        var previous = history.find(function (h) {
            return (0, date_fns_1.format)(h.date, 'yyyy-MM') === (0, date_fns_1.format)(previousPeriod, 'yyyy-MM');
        });
        if (!current || !previous) {
            return null;
        }
        var variance = current.value - previous.value;
        var variancePercent = previous.value !== 0 ? (variance / previous.value) * 100 : 0;
        var trend;
        if (Math.abs(variancePercent) < 2) {
            trend = 'flat';
        }
        else {
            trend = variance > 0 ? 'up' : 'down';
        }
        var significance = Math.abs(variancePercent) > 10 ? 'high' :
            Math.abs(variancePercent) > 5 ? 'medium' : 'low';
        return {
            kpiId: kpiId,
            current: current.value,
            previous: previous.value,
            variance: variance,
            variancePercent: variancePercent,
            trend: trend,
            significance: significance
        };
    };
    /**
     * Generate KPI alerts based on thresholds
     */
    KPIAnalyzer.prototype.generateAlerts = function (kpiValues) {
        var _this = this;
        var alerts = [];
        kpiValues.forEach(function (kpiValue) {
            var definition = _this.kpiDefinitions.get(kpiValue.kpiId);
            if (!definition)
                return;
            if (kpiValue.status === 'critical' || kpiValue.status === 'warning') {
                var alert_1 = {
                    kpiId: kpiValue.kpiId,
                    severity: kpiValue.status,
                    message: _this.generateAlertMessage(kpiValue, definition),
                    value: kpiValue.value,
                    threshold: _this.getRelevantThreshold(kpiValue.value, definition.thresholds),
                    timestamp: new Date(),
                    acknowledged: false
                };
                alerts.push(alert_1);
            }
        });
        return alerts;
    };
    /**
     * Get KPI definition
     */
    KPIAnalyzer.prototype.getKPIDefinition = function (kpiId) {
        return this.kpiDefinitions.get(kpiId);
    };
    /**
     * Get KPI history
     */
    KPIAnalyzer.prototype.getKPIHistory = function (kpiId, limit) {
        var history = this.kpiHistory.get(kpiId) || [];
        return limit ? history.slice(-limit) : history;
    };
    // Private helper methods
    KPIAnalyzer.prototype.calculateRevenueGrowth = function (data) {
        var currentRevenue = data.currentRevenue || 0;
        var previousRevenue = data.previousRevenue || 0;
        if (previousRevenue === 0)
            return 0;
        return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    };
    KPIAnalyzer.prototype.calculateClientRetention = function (data) {
        var startClients = data.startClients || 0;
        var retainedClients = data.retainedClients || 0;
        if (startClients === 0)
            return 0;
        return (retainedClients / startClients) * 100;
    };
    KPIAnalyzer.prototype.calculateAverageInvoiceValue = function (data) {
        var totalValue = data.totalInvoiceValue || 0;
        var invoiceCount = data.invoiceCount || 0;
        if (invoiceCount === 0)
            return 0;
        return totalValue / invoiceCount;
    };
    KPIAnalyzer.prototype.calculateTaskCompletionRate = function (data) {
        var completedTasks = data.completedTasks || 0;
        var totalTasks = data.totalTasks || 0;
        if (totalTasks === 0)
            return 0;
        return (completedTasks / totalTasks) * 100;
    };
    KPIAnalyzer.prototype.determineKPIStatus = function (value, thresholds) {
        if (value <= thresholds.critical)
            return 'critical';
        if (value <= thresholds.warning)
            return 'warning';
        if (value >= thresholds.good)
            return 'good';
        return 'unknown';
    };
    KPIAnalyzer.prototype.calculateTrend = function (kpiId, currentValue) {
        var history = this.kpiHistory.get(kpiId) || [];
        if (history.length < 2)
            return 'stable';
        var recentValues = history.slice(-3).map(function (h) { return h.value; });
        var trend = stats.linearRegression(recentValues.map(function (v, i) { return [i, v]; }));
        if (Math.abs(trend.m) < 0.1)
            return 'stable';
        return trend.m > 0 ? 'increasing' : 'decreasing';
    };
    KPIAnalyzer.prototype.addToHistory = function (kpiId, kpiValue) {
        if (!this.kpiHistory.has(kpiId)) {
            this.kpiHistory.set(kpiId, []);
        }
        var history = this.kpiHistory.get(kpiId);
        history.push(kpiValue);
        // Keep only last 24 months of history
        if (history.length > 24) {
            history.splice(0, history.length - 24);
        }
    };
    KPIAnalyzer.prototype.generateAlertMessage = function (kpiValue, definition) {
        var status = kpiValue.status === 'critical' ? 'critically low' : 'below target';
        return "".concat(definition.name, " is ").concat(status, " at ").concat(kpiValue.value).concat(definition.unit);
    };
    KPIAnalyzer.prototype.getRelevantThreshold = function (value, thresholds) {
        if (value <= thresholds.critical)
            return thresholds.critical;
        if (value <= thresholds.warning)
            return thresholds.warning;
        return thresholds.good;
    };
    return KPIAnalyzer;
}());
exports.KPIAnalyzer = KPIAnalyzer;
exports.default = KPIAnalyzer;
