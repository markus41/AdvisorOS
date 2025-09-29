"use strict";
/**
 * Advanced Financial Prediction Models
 * Implements sophisticated forecasting algorithms for different financial metrics
 */
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
exports.MonteCarloSimulator = exports.ExponentialSmoothingModel = exports.ARIMAModel = exports.LSTMCashFlowModel = void 0;
var decimal_js_1 = require("decimal.js");
var tf = require("@tensorflow/tfjs-node");
var stats = require("simple-statistics");
var date_fns_1 = require("date-fns");
/**
 * LSTM Model for Cash Flow Prediction
 * Handles complex non-linear patterns and long-term dependencies
 */
var LSTMCashFlowModel = /** @class */ (function () {
    function LSTMCashFlowModel() {
        this.model = null;
        this.scaler = null;
        this.isTraining = false;
    }
    LSTMCashFlowModel.prototype.train = function (data_1) {
        return __awaiter(this, arguments, void 0, function (data, config) {
            var _a, lookbackDays, _b, epochs, _c, batchSize, _d, validationSplit, _e, learningRate, values, normalizedValues, sequences, _f, X, y, callbacks;
            if (config === void 0) { config = {}; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        if (this.isTraining)
                            throw new Error('Model is already training');
                        this.isTraining = true;
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, , 3, 4]);
                        _a = config.lookbackDays, lookbackDays = _a === void 0 ? 60 : _a, _b = config.epochs, epochs = _b === void 0 ? 100 : _b, _c = config.batchSize, batchSize = _c === void 0 ? 32 : _c, _d = config.validationSplit, validationSplit = _d === void 0 ? 0.2 : _d, _e = config.learningRate, learningRate = _e === void 0 ? 0.001 : _e;
                        values = data.map(function (d) { return parseFloat(d.netFlow.toString()); });
                        this.scaler = this.calculateScaler(values);
                        normalizedValues = this.normalize(values);
                        sequences = this.createSequences(normalizedValues, lookbackDays);
                        _f = this.prepareTrainingData(sequences), X = _f[0], y = _f[1];
                        // Build LSTM architecture
                        this.model = tf.sequential({
                            layers: [
                                tf.layers.lstm({
                                    units: 128,
                                    returnSequences: true,
                                    inputShape: [lookbackDays, 1],
                                    dropout: 0.2,
                                    recurrentDropout: 0.2
                                }),
                                tf.layers.lstm({
                                    units: 64,
                                    returnSequences: true,
                                    dropout: 0.2,
                                    recurrentDropout: 0.2
                                }),
                                tf.layers.lstm({
                                    units: 32,
                                    returnSequences: false,
                                    dropout: 0.2
                                }),
                                tf.layers.dense({ units: 16, activation: 'relu' }),
                                tf.layers.dropout({ rate: 0.2 }),
                                tf.layers.dense({ units: 1 })
                            ]
                        });
                        // Compile model
                        this.model.compile({
                            optimizer: tf.train.adam(learningRate),
                            loss: 'meanSquaredError',
                            metrics: ['mae', 'mape']
                        });
                        callbacks = [
                            tf.callbacks.earlyStopping({
                                monitor: 'val_loss',
                                patience: 10,
                                restoreBestWeights: true
                            }),
                            tf.callbacks.reduceLROnPlateau({
                                monitor: 'val_loss',
                                factor: 0.5,
                                patience: 5,
                                minLr: 0.0001
                            })
                        ];
                        // Train model
                        return [4 /*yield*/, this.model.fit(X, y, {
                                epochs: epochs,
                                batchSize: batchSize,
                                validationSplit: validationSplit,
                                callbacks: callbacks,
                                shuffle: true,
                                verbose: 0
                            })];
                    case 2:
                        // Train model
                        _g.sent();
                        // Cleanup tensors
                        X.dispose();
                        y.dispose();
                        return [3 /*break*/, 4];
                    case 3:
                        this.isTraining = false;
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LSTMCashFlowModel.prototype.predict = function (data_1, days_1) {
        return __awaiter(this, arguments, void 0, function (data, days, confidence) {
            var predictions, values, normalizedValues, lookbackDays, currentSequence, lastDate, i, inputTensor, predictionTensor, normalizedPrediction, prediction, variance, standardError, zScore, predictionPoint;
            if (confidence === void 0) { confidence = 0.8; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.model || !this.scaler) {
                            throw new Error('Model must be trained before prediction');
                        }
                        predictions = [];
                        values = data.map(function (d) { return parseFloat(d.netFlow.toString()); });
                        normalizedValues = this.normalize(values);
                        lookbackDays = 60;
                        currentSequence = normalizedValues.slice(-lookbackDays);
                        lastDate = data[data.length - 1].date;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < days)) return [3 /*break*/, 4];
                        inputTensor = tf.tensor3d([[currentSequence.map(function (v) { return [v]; })]]);
                        predictionTensor = this.model.predict(inputTensor);
                        return [4 /*yield*/, predictionTensor.data()];
                    case 2:
                        normalizedPrediction = (_a.sent())[0];
                        prediction = this.denormalize([normalizedPrediction])[0];
                        variance = this.calculatePredictionVariance(currentSequence);
                        standardError = Math.sqrt(variance);
                        zScore = this.getZScore(confidence);
                        predictionPoint = {
                            date: (0, date_fns_1.addDays)(lastDate, i + 1),
                            value: new decimal_js_1.Decimal(prediction),
                            upperBound: new decimal_js_1.Decimal(prediction + (zScore * standardError)),
                            lowerBound: new decimal_js_1.Decimal(prediction - (zScore * standardError)),
                            confidence: confidence
                        };
                        predictions.push(predictionPoint);
                        // Update sequence for next prediction
                        currentSequence = __spreadArray(__spreadArray([], currentSequence.slice(1), true), [normalizedPrediction], false);
                        // Cleanup tensors
                        inputTensor.dispose();
                        predictionTensor.dispose();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, predictions];
                }
            });
        });
    };
    LSTMCashFlowModel.prototype.createSequences = function (data, lookback) {
        var sequences = [];
        for (var i = lookback; i < data.length; i++) {
            sequences.push(data.slice(i - lookback, i + 1));
        }
        return sequences;
    };
    LSTMCashFlowModel.prototype.prepareTrainingData = function (sequences) {
        var X = sequences.map(function (seq) { return seq.slice(0, -1).map(function (v) { return [v]; }); });
        var y = sequences.map(function (seq) { return [seq[seq.length - 1]]; });
        return [tf.tensor3d(X), tf.tensor2d(y)];
    };
    LSTMCashFlowModel.prototype.calculateScaler = function (values) {
        return {
            min: Math.min.apply(Math, values),
            max: Math.max.apply(Math, values)
        };
    };
    LSTMCashFlowModel.prototype.normalize = function (values) {
        if (!this.scaler)
            throw new Error('Scaler not initialized');
        var _a = this.scaler, min = _a.min, max = _a.max;
        return values.map(function (v) { return (v - min) / (max - min); });
    };
    LSTMCashFlowModel.prototype.denormalize = function (values) {
        if (!this.scaler)
            throw new Error('Scaler not initialized');
        var _a = this.scaler, min = _a.min, max = _a.max;
        return values.map(function (v) { return v * (max - min) + min; });
    };
    LSTMCashFlowModel.prototype.calculatePredictionVariance = function (sequence) {
        return stats.variance(sequence);
    };
    LSTMCashFlowModel.prototype.getZScore = function (confidence) {
        // Z-scores for common confidence levels
        var zScores = {
            0.68: 1.0,
            0.80: 1.28,
            0.90: 1.64,
            0.95: 1.96,
            0.99: 2.58
        };
        return zScores[confidence] || 1.96;
    };
    LSTMCashFlowModel.prototype.dispose = function () {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
    };
    return LSTMCashFlowModel;
}());
exports.LSTMCashFlowModel = LSTMCashFlowModel;
/**
 * ARIMA Model for Trend-based Forecasting
 * Excellent for data with clear trends and patterns
 */
var ARIMAModel = /** @class */ (function () {
    function ARIMAModel() {
        this.coefficients = null;
    }
    ARIMAModel.prototype.fit = function (data, order) {
        return __awaiter(this, void 0, void 0, function () {
            var p, d, q, diffData, i, arCoeffs, maCoeffs;
            return __generator(this, function (_a) {
                p = order.p, d = order.d, q = order.q;
                diffData = data;
                for (i = 0; i < d; i++) {
                    diffData = this.difference(diffData);
                }
                arCoeffs = this.estimateARCoefficients(diffData, p);
                maCoeffs = this.estimateMACoefficients(diffData, q);
                this.coefficients = {
                    ar: arCoeffs,
                    ma: maCoeffs,
                    d: d
                };
                return [2 /*return*/];
            });
        });
    };
    ARIMAModel.prototype.forecast = function (steps, data) {
        if (!this.coefficients) {
            throw new Error('Model must be fitted before forecasting');
        }
        var predictions = [];
        var _a = this.coefficients, ar = _a.ar, ma = _a.ma, d = _a.d;
        // Prepare data with differencing
        var workingData = __spreadArray([], data, true);
        for (var i = 0; i < d; i++) {
            workingData = this.difference(workingData);
        }
        var errors = new Array(ma.length).fill(0);
        for (var step = 0; step < steps; step++) {
            // AR component
            var forecast = 0;
            for (var i = 0; i < ar.length && i < workingData.length; i++) {
                forecast += ar[i] * workingData[workingData.length - 1 - i];
            }
            // MA component
            for (var i = 0; i < ma.length; i++) {
                forecast += ma[i] * errors[errors.length - 1 - i];
            }
            // Integrate back
            var integratedForecast = forecast;
            for (var i = 0; i < d; i++) {
                integratedForecast += data[data.length - 1];
            }
            // Calculate prediction intervals
            var residualVariance = this.calculateResidualVariance(workingData, ar, ma);
            var standardError = Math.sqrt(residualVariance * (step + 1));
            predictions.push({
                date: (0, date_fns_1.addDays)(new Date(), step + 1),
                value: new decimal_js_1.Decimal(integratedForecast),
                upperBound: new decimal_js_1.Decimal(integratedForecast + 1.96 * standardError),
                lowerBound: new decimal_js_1.Decimal(integratedForecast - 1.96 * standardError),
                confidence: 0.95
            });
            // Update working data and errors
            workingData.push(forecast);
            errors.push(0); // Assuming zero error for future predictions
        }
        return predictions;
    };
    ARIMAModel.prototype.difference = function (data) {
        return data.slice(1).map(function (val, i) { return val - data[i]; });
    };
    ARIMAModel.prototype.estimateARCoefficients = function (data, p) {
        // Yule-Walker equations for AR coefficient estimation
        var coeffs = [];
        for (var i = 1; i <= p; i++) {
            var numerator = this.autocorrelation(data, i);
            var denominator = this.autocorrelation(data, 0);
            coeffs.push(numerator / denominator);
        }
        return coeffs;
    };
    ARIMAModel.prototype.estimateMACoefficients = function (data, q) {
        // Simplified MA coefficient estimation
        return new Array(q).fill(0.1);
    };
    ARIMAModel.prototype.autocorrelation = function (data, lag) {
        var n = data.length;
        var mean = stats.mean(data);
        var numerator = 0;
        var denominator = 0;
        for (var i = 0; i < n - lag; i++) {
            numerator += (data[i] - mean) * (data[i + lag] - mean);
        }
        for (var i = 0; i < n; i++) {
            denominator += Math.pow(data[i] - mean, 2);
        }
        return numerator / denominator;
    };
    ARIMAModel.prototype.calculateResidualVariance = function (data, ar, ma) {
        // Simplified residual variance calculation
        return stats.variance(data);
    };
    return ARIMAModel;
}());
exports.ARIMAModel = ARIMAModel;
/**
 * Exponential Smoothing Model
 * Good for data with trends and seasonality
 */
var ExponentialSmoothingModel = /** @class */ (function () {
    function ExponentialSmoothingModel() {
        this.alpha = 0.3; // Level smoothing parameter
        this.beta = 0.1; // Trend smoothing parameter
        this.gamma = 0.1; // Seasonal smoothing parameter
        this.seasonalPeriod = 12;
    }
    ExponentialSmoothingModel.prototype.fit = function (data_1) {
        return __awaiter(this, arguments, void 0, function (data, seasonal) {
            var bestParams;
            if (seasonal === void 0) { seasonal = false; }
            return __generator(this, function (_a) {
                bestParams = this.optimizeParameters(data, seasonal);
                this.alpha = bestParams.alpha;
                this.beta = bestParams.beta;
                this.gamma = bestParams.gamma;
                return [2 /*return*/];
            });
        });
    };
    ExponentialSmoothingModel.prototype.forecast = function (data, steps) {
        var predictions = [];
        // Initialize level, trend, and seasonal components
        var _a = this.initializeComponents(data), level = _a.level, trend = _a.trend, seasonal = _a.seasonal;
        // Generate forecasts
        for (var h = 1; h <= steps; h++) {
            var forecast = level + h * trend +
                (seasonal.length > 0 ? seasonal[(data.length + h - 1) % this.seasonalPeriod] : 0);
            predictions.push({
                date: (0, date_fns_1.addDays)(new Date(), h),
                value: new decimal_js_1.Decimal(forecast),
                upperBound: new decimal_js_1.Decimal(forecast * 1.1),
                lowerBound: new decimal_js_1.Decimal(forecast * 0.9),
                confidence: 0.8
            });
        }
        return predictions;
    };
    ExponentialSmoothingModel.prototype.optimizeParameters = function (data, seasonal) {
        var bestParams = { alpha: 0.3, beta: 0.1, gamma: 0.1 };
        var bestMSE = Infinity;
        // Grid search over parameter space
        for (var alpha = 0.1; alpha <= 0.9; alpha += 0.1) {
            for (var beta = 0.1; beta <= 0.3; beta += 0.1) {
                for (var gamma = 0.1; gamma <= 0.3; gamma += 0.1) {
                    var mse = this.calculateMSE(data, { alpha: alpha, beta: beta, gamma: gamma }, seasonal);
                    if (mse < bestMSE) {
                        bestMSE = mse;
                        bestParams = { alpha: alpha, beta: beta, gamma: gamma };
                    }
                }
            }
        }
        return bestParams;
    };
    ExponentialSmoothingModel.prototype.calculateMSE = function (data, params, seasonal) {
        // Cross-validation MSE calculation
        var errors = [];
        // Implementation would calculate MSE using time series cross-validation
        return stats.mean(errors.map(function (e) { return e * e; }));
    };
    ExponentialSmoothingModel.prototype.initializeComponents = function (data) {
        var _this = this;
        var level = stats.mean(data.slice(0, this.seasonalPeriod));
        var trend = (stats.mean(data.slice(-this.seasonalPeriod)) - level) / data.length;
        var seasonal = [];
        var _loop_1 = function (i) {
            var seasonalValues = data.filter(function (_, idx) { return idx % _this.seasonalPeriod === i; });
            seasonal.push(stats.mean(seasonalValues) - level);
        };
        // Calculate initial seasonal indices
        for (var i = 0; i < this.seasonalPeriod; i++) {
            _loop_1(i);
        }
        return { level: level, trend: trend, seasonal: seasonal };
    };
    return ExponentialSmoothingModel;
}());
exports.ExponentialSmoothingModel = ExponentialSmoothingModel;
/**
 * Monte Carlo Simulation for Scenario Analysis
 */
var MonteCarloSimulator = /** @class */ (function () {
    function MonteCarloSimulator() {
    }
    MonteCarloSimulator.prototype.runSimulation = function (baselineData_1, scenarios_1) {
        return __awaiter(this, arguments, void 0, function (baselineData, scenarios, simulations) {
            var results, _i, scenarios_2, scenario, simResults, sim, simulatedPath, statistics;
            if (simulations === void 0) { simulations = 1000; }
            return __generator(this, function (_a) {
                results = [];
                for (_i = 0, scenarios_2 = scenarios; _i < scenarios_2.length; _i++) {
                    scenario = scenarios_2[_i];
                    simResults = [];
                    for (sim = 0; sim < simulations; sim++) {
                        simulatedPath = this.simulatePath(baselineData, scenario);
                        simResults.push(simulatedPath);
                    }
                    statistics = this.calculateStatistics(simResults);
                    results.push({
                        scenario: scenario.name,
                        statistics: statistics,
                        paths: simResults.slice(0, 100) // Keep sample paths
                    });
                }
                return [2 /*return*/, results];
            });
        });
    };
    MonteCarloSimulator.prototype.simulatePath = function (baselineData, scenario) {
        var path = __spreadArray([], baselineData, true);
        for (var step = 0; step < scenario.steps; step++) {
            var lastValue = path[path.length - 1];
            var randomShock = this.generateRandomShock(scenario);
            var nextValue = lastValue * (1 + scenario.drift + randomShock);
            path.push(nextValue);
        }
        return path;
    };
    MonteCarloSimulator.prototype.generateRandomShock = function (scenario) {
        // Generate random shock based on scenario parameters
        return stats.randomNormal() * scenario.volatility;
    };
    MonteCarloSimulator.prototype.calculateStatistics = function (results) {
        var finalValues = results.map(function (path) { return path[path.length - 1]; });
        return {
            mean: stats.mean(finalValues),
            median: stats.median(finalValues),
            std: stats.standardDeviation(finalValues),
            percentiles: {
                p5: stats.quantile(finalValues, 0.05),
                p25: stats.quantile(finalValues, 0.25),
                p75: stats.quantile(finalValues, 0.75),
                p95: stats.quantile(finalValues, 0.95)
            }
        };
    };
    return MonteCarloSimulator;
}());
exports.MonteCarloSimulator = MonteCarloSimulator;
