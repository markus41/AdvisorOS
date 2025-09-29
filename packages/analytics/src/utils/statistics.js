"use strict";
/**
 * Statistics Utility Module
 * Basic statistical functions to replace simple-statistics dependency
 */
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
exports.mean = mean;
exports.standardDeviation = standardDeviation;
exports.sampleCorrelation = sampleCorrelation;
exports.linearRegression = linearRegression;
exports.median = median;
exports.variance = variance;
exports.min = min;
exports.max = max;
exports.sum = sum;
exports.percentile = percentile;
exports.zScore = zScore;
exports.detectOutliers = detectOutliers;
exports.movingAverage = movingAverage;
exports.exponentialMovingAverage = exponentialMovingAverage;
exports.coefficientOfVariation = coefficientOfVariation;
/**
 * Calculate the mean (average) of an array of numbers
 */
function mean(values) {
    if (values.length === 0)
        return 0;
    return values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
}
/**
 * Calculate the standard deviation of an array of numbers
 */
function standardDeviation(values) {
    if (values.length === 0)
        return 0;
    var avg = mean(values);
    var squaredDifferences = values.map(function (value) { return Math.pow(value - avg, 2); });
    var avgSquaredDiff = mean(squaredDifferences);
    return Math.sqrt(avgSquaredDiff);
}
/**
 * Calculate the sample correlation coefficient between two arrays
 */
function sampleCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0)
        return 0;
    var n = x.length;
    var meanX = mean(x);
    var meanY = mean(y);
    var numerator = 0;
    var sumXSquared = 0;
    var sumYSquared = 0;
    for (var i = 0; i < n; i++) {
        var xDiff = x[i] - meanX;
        var yDiff = y[i] - meanY;
        numerator += xDiff * yDiff;
        sumXSquared += xDiff * xDiff;
        sumYSquared += yDiff * yDiff;
    }
    var denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
}
/**
 * Calculate linear regression for a set of (x, y) points
 */
function linearRegression(points) {
    if (points.length === 0)
        return { m: 0, b: 0 };
    var n = points.length;
    var x = points.map(function (p) { return p[0]; });
    var y = points.map(function (p) { return p[1]; });
    var meanX = mean(x);
    var meanY = mean(y);
    var numerator = 0;
    var denominator = 0;
    for (var i = 0; i < n; i++) {
        var xDiff = x[i] - meanX;
        var yDiff = y[i] - meanY;
        numerator += xDiff * yDiff;
        denominator += xDiff * xDiff;
    }
    var slope = denominator === 0 ? 0 : numerator / denominator;
    var intercept = meanY - slope * meanX;
    return { m: slope, b: intercept };
}
/**
 * Calculate the median of an array of numbers
 */
function median(values) {
    if (values.length === 0)
        return 0;
    var sorted = __spreadArray([], values, true).sort(function (a, b) { return a - b; });
    var middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    else {
        return sorted[middle];
    }
}
/**
 * Calculate the variance of an array of numbers
 */
function variance(values) {
    if (values.length === 0)
        return 0;
    var avg = mean(values);
    var squaredDifferences = values.map(function (value) { return Math.pow(value - avg, 2); });
    return mean(squaredDifferences);
}
/**
 * Calculate the minimum value in an array
 */
function min(values) {
    if (values.length === 0)
        return 0;
    return Math.min.apply(Math, values);
}
/**
 * Calculate the maximum value in an array
 */
function max(values) {
    if (values.length === 0)
        return 0;
    return Math.max.apply(Math, values);
}
/**
 * Calculate the sum of an array of numbers
 */
function sum(values) {
    return values.reduce(function (total, value) { return total + value; }, 0);
}
/**
 * Calculate percentiles for an array of numbers
 */
function percentile(values, p) {
    if (values.length === 0)
        return 0;
    var sorted = __spreadArray([], values, true).sort(function (a, b) { return a - b; });
    var index = (p / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
        return sorted[index];
    }
    else {
        var lower = sorted[Math.floor(index)];
        var upper = sorted[Math.ceil(index)];
        var weight = index - Math.floor(index);
        return lower + weight * (upper - lower);
    }
}
/**
 * Calculate z-score for a value given mean and standard deviation
 */
function zScore(value, populationMean, populationStdDev) {
    if (populationStdDev === 0)
        return 0;
    return (value - populationMean) / populationStdDev;
}
/**
 * Detect outliers using the IQR method
 */
function detectOutliers(values) {
    if (values.length < 4)
        return [];
    var q1 = percentile(values, 25);
    var q3 = percentile(values, 75);
    var iqr = q3 - q1;
    var lowerBound = q1 - 1.5 * iqr;
    var upperBound = q3 + 1.5 * iqr;
    return values.filter(function (value) { return value < lowerBound || value > upperBound; });
}
/**
 * Calculate moving average with specified window size
 */
function movingAverage(values, windowSize) {
    if (windowSize <= 0 || windowSize > values.length)
        return values;
    var result = [];
    for (var i = 0; i <= values.length - windowSize; i++) {
        var window_1 = values.slice(i, i + windowSize);
        result.push(mean(window_1));
    }
    return result;
}
/**
 * Calculate exponential moving average
 */
function exponentialMovingAverage(values, alpha) {
    if (values.length === 0)
        return [];
    var result = [values[0]];
    for (var i = 1; i < values.length; i++) {
        var ema = alpha * values[i] + (1 - alpha) * result[i - 1];
        result.push(ema);
    }
    return result;
}
/**
 * Calculate coefficient of variation (CV)
 */
function coefficientOfVariation(values) {
    var avg = mean(values);
    if (avg === 0)
        return 0;
    return standardDeviation(values) / avg;
}
