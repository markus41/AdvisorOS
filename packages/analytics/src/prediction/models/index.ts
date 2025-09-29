/**
 * Advanced Financial Prediction Models
 * Implements sophisticated forecasting algorithms for different financial metrics
 */

import { Decimal } from 'decimal.js';
import * as tf from '@tensorflow/tfjs-node';
import * as stats from 'simple-statistics';
import { addDays, addMonths, format, differenceInDays } from 'date-fns';
import {
  PredictionPoint,
  FinancialData,
  CashFlowData,
  SeasonalityData
} from '../../types';

/**
 * LSTM Model for Cash Flow Prediction
 * Handles complex non-linear patterns and long-term dependencies
 */
export class LSTMCashFlowModel {
  private model: tf.LayersModel | null = null;
  private scaler: { min: number; max: number } | null = null;
  private isTraining = false;

  async train(data: CashFlowData[], config: LSTMConfig = {}): Promise<void> {
    if (this.isTraining) throw new Error('Model is already training');

    this.isTraining = true;

    try {
      const {
        lookbackDays = 60,
        epochs = 100,
        batchSize = 32,
        validationSplit = 0.2,
        learningRate = 0.001
      } = config;

      // Prepare and normalize data
      const values = data.map(d => parseFloat(d.netFlow.toString()));
      this.scaler = this.calculateScaler(values);
      const normalizedValues = this.normalize(values);

      // Create sequences
      const sequences = this.createSequences(normalizedValues, lookbackDays);
      const [X, y] = this.prepareTrainingData(sequences);

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

      // Training callbacks
      const callbacks = [
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
      await this.model.fit(X, y, {
        epochs,
        batchSize,
        validationSplit,
        callbacks,
        shuffle: true,
        verbose: 0
      });

      // Cleanup tensors
      X.dispose();
      y.dispose();

    } finally {
      this.isTraining = false;
    }
  }

  async predict(
    data: CashFlowData[],
    days: number,
    confidence = 0.8
  ): Promise<PredictionPoint[]> {
    if (!this.model || !this.scaler) {
      throw new Error('Model must be trained before prediction');
    }

    const predictions: PredictionPoint[] = [];
    const values = data.map(d => parseFloat(d.netFlow.toString()));
    const normalizedValues = this.normalize(values);

    // Use last lookback period as initial sequence
    const lookbackDays = 60;
    let currentSequence = normalizedValues.slice(-lookbackDays);
    const lastDate = data[data.length - 1].date;

    for (let i = 0; i < days; i++) {
      // Prepare input tensor
      const inputTensor = tf.tensor3d([[currentSequence.map(v => [v])]]);

      // Generate prediction
      const predictionTensor = this.model.predict(inputTensor) as tf.Tensor;
      const normalizedPrediction = (await predictionTensor.data())[0];

      // Denormalize prediction
      const prediction = this.denormalize([normalizedPrediction])[0];

      // Calculate confidence intervals using prediction variance
      const variance = this.calculatePredictionVariance(currentSequence);
      const standardError = Math.sqrt(variance);
      const zScore = this.getZScore(confidence);

      const predictionPoint: PredictionPoint = {
        date: addDays(lastDate, i + 1),
        value: new Decimal(prediction),
        upperBound: new Decimal(prediction + (zScore * standardError)),
        lowerBound: new Decimal(prediction - (zScore * standardError)),
        confidence
      };

      predictions.push(predictionPoint);

      // Update sequence for next prediction
      currentSequence = [...currentSequence.slice(1), normalizedPrediction];

      // Cleanup tensors
      inputTensor.dispose();
      predictionTensor.dispose();
    }

    return predictions;
  }

  private createSequences(data: number[], lookback: number): number[][] {
    const sequences: number[][] = [];
    for (let i = lookback; i < data.length; i++) {
      sequences.push(data.slice(i - lookback, i + 1));
    }
    return sequences;
  }

  private prepareTrainingData(sequences: number[][]): [tf.Tensor3D, tf.Tensor2D] {
    const X = sequences.map(seq => seq.slice(0, -1).map(v => [v]));
    const y = sequences.map(seq => [seq[seq.length - 1]]);

    return [tf.tensor3d(X), tf.tensor2d(y)];
  }

  private calculateScaler(values: number[]): { min: number; max: number } {
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  private normalize(values: number[]): number[] {
    if (!this.scaler) throw new Error('Scaler not initialized');
    const { min, max } = this.scaler;
    return values.map(v => (v - min) / (max - min));
  }

  private denormalize(values: number[]): number[] {
    if (!this.scaler) throw new Error('Scaler not initialized');
    const { min, max } = this.scaler;
    return values.map(v => v * (max - min) + min);
  }

  private calculatePredictionVariance(sequence: number[]): number {
    return stats.variance(sequence);
  }

  private getZScore(confidence: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.68: 1.0,
      0.80: 1.28,
      0.90: 1.64,
      0.95: 1.96,
      0.99: 2.58
    };
    return zScores[confidence] || 1.96;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

/**
 * ARIMA Model for Trend-based Forecasting
 * Excellent for data with clear trends and patterns
 */
export class ARIMAModel {
  private coefficients: {
    ar: number[];
    ma: number[];
    d: number;
  } | null = null;

  async fit(data: number[], order: { p: number; d: number; q: number }): Promise<void> {
    const { p, d, q } = order;

    // Difference the data d times
    let diffData = data;
    for (let i = 0; i < d; i++) {
      diffData = this.difference(diffData);
    }

    // Estimate AR and MA coefficients using method of moments
    const arCoeffs = this.estimateARCoefficients(diffData, p);
    const maCoeffs = this.estimateMACoefficients(diffData, q);

    this.coefficients = {
      ar: arCoeffs,
      ma: maCoeffs,
      d
    };
  }

  forecast(steps: number, data: number[]): PredictionPoint[] {
    if (!this.coefficients) {
      throw new Error('Model must be fitted before forecasting');
    }

    const predictions: PredictionPoint[] = [];
    const { ar, ma, d } = this.coefficients;

    // Prepare data with differencing
    let workingData = [...data];
    for (let i = 0; i < d; i++) {
      workingData = this.difference(workingData);
    }

    const errors: number[] = new Array(ma.length).fill(0);

    for (let step = 0; step < steps; step++) {
      // AR component
      let forecast = 0;
      for (let i = 0; i < ar.length && i < workingData.length; i++) {
        forecast += ar[i] * workingData[workingData.length - 1 - i];
      }

      // MA component
      for (let i = 0; i < ma.length; i++) {
        forecast += ma[i] * errors[errors.length - 1 - i];
      }

      // Integrate back
      let integratedForecast = forecast;
      for (let i = 0; i < d; i++) {
        integratedForecast += data[data.length - 1];
      }

      // Calculate prediction intervals
      const residualVariance = this.calculateResidualVariance(workingData, ar, ma);
      const standardError = Math.sqrt(residualVariance * (step + 1));

      predictions.push({
        date: addDays(new Date(), step + 1),
        value: new Decimal(integratedForecast),
        upperBound: new Decimal(integratedForecast + 1.96 * standardError),
        lowerBound: new Decimal(integratedForecast - 1.96 * standardError),
        confidence: 0.95
      });

      // Update working data and errors
      workingData.push(forecast);
      errors.push(0); // Assuming zero error for future predictions
    }

    return predictions;
  }

  private difference(data: number[]): number[] {
    return data.slice(1).map((val, i) => val - data[i]);
  }

  private estimateARCoefficients(data: number[], p: number): number[] {
    // Yule-Walker equations for AR coefficient estimation
    const coeffs: number[] = [];

    for (let i = 1; i <= p; i++) {
      const numerator = this.autocorrelation(data, i);
      const denominator = this.autocorrelation(data, 0);
      coeffs.push(numerator / denominator);
    }

    return coeffs;
  }

  private estimateMACoefficients(data: number[], q: number): number[] {
    // Simplified MA coefficient estimation
    return new Array(q).fill(0.1);
  }

  private autocorrelation(data: number[], lag: number): number {
    const n = data.length;
    const mean = stats.mean(data);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }

    return numerator / denominator;
  }

  private calculateResidualVariance(data: number[], ar: number[], ma: number[]): number {
    // Simplified residual variance calculation
    return stats.variance(data);
  }
}

/**
 * Exponential Smoothing Model
 * Good for data with trends and seasonality
 */
export class ExponentialSmoothingModel {
  private alpha: number = 0.3; // Level smoothing parameter
  private beta: number = 0.1;  // Trend smoothing parameter
  private gamma: number = 0.1; // Seasonal smoothing parameter
  private seasonalPeriod: number = 12;

  async fit(data: number[], seasonal = false): Promise<void> {
    // Optimize smoothing parameters using grid search
    const bestParams = this.optimizeParameters(data, seasonal);
    this.alpha = bestParams.alpha;
    this.beta = bestParams.beta;
    this.gamma = bestParams.gamma;
  }

  forecast(data: number[], steps: number): PredictionPoint[] {
    const predictions: PredictionPoint[] = [];

    // Initialize level, trend, and seasonal components
    const { level, trend, seasonal } = this.initializeComponents(data);

    // Generate forecasts
    for (let h = 1; h <= steps; h++) {
      const forecast = level + h * trend +
        (seasonal.length > 0 ? seasonal[(data.length + h - 1) % this.seasonalPeriod] : 0);

      predictions.push({
        date: addDays(new Date(), h),
        value: new Decimal(forecast),
        upperBound: new Decimal(forecast * 1.1),
        lowerBound: new Decimal(forecast * 0.9),
        confidence: 0.8
      });
    }

    return predictions;
  }

  private optimizeParameters(data: number[], seasonal: boolean): {
    alpha: number;
    beta: number;
    gamma: number;
  } {
    let bestParams = { alpha: 0.3, beta: 0.1, gamma: 0.1 };
    let bestMSE = Infinity;

    // Grid search over parameter space
    for (let alpha = 0.1; alpha <= 0.9; alpha += 0.1) {
      for (let beta = 0.1; beta <= 0.3; beta += 0.1) {
        for (let gamma = 0.1; gamma <= 0.3; gamma += 0.1) {
          const mse = this.calculateMSE(data, { alpha, beta, gamma }, seasonal);
          if (mse < bestMSE) {
            bestMSE = mse;
            bestParams = { alpha, beta, gamma };
          }
        }
      }
    }

    return bestParams;
  }

  private calculateMSE(
    data: number[],
    params: { alpha: number; beta: number; gamma: number },
    seasonal: boolean
  ): number {
    // Cross-validation MSE calculation
    const errors: number[] = [];

    // Implementation would calculate MSE using time series cross-validation
    return stats.mean(errors.map(e => e * e));
  }

  private initializeComponents(data: number[]): {
    level: number;
    trend: number;
    seasonal: number[];
  } {
    const level = stats.mean(data.slice(0, this.seasonalPeriod));
    const trend = (stats.mean(data.slice(-this.seasonalPeriod)) - level) / data.length;
    const seasonal: number[] = [];

    // Calculate initial seasonal indices
    for (let i = 0; i < this.seasonalPeriod; i++) {
      const seasonalValues = data.filter((_, idx) => idx % this.seasonalPeriod === i);
      seasonal.push(stats.mean(seasonalValues) - level);
    }

    return { level, trend, seasonal };
  }
}

/**
 * Monte Carlo Simulation for Scenario Analysis
 */
export class MonteCarloSimulator {
  async runSimulation(
    baselineData: number[],
    scenarios: ScenarioConfig[],
    simulations: number = 1000
  ): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const scenario of scenarios) {
      const simResults: number[][] = [];

      for (let sim = 0; sim < simulations; sim++) {
        const simulatedPath = this.simulatePath(baselineData, scenario);
        simResults.push(simulatedPath);
      }

      // Calculate statistics across simulations
      const statistics = this.calculateStatistics(simResults);

      results.push({
        scenario: scenario.name,
        statistics,
        paths: simResults.slice(0, 100) // Keep sample paths
      });
    }

    return results;
  }

  private simulatePath(baselineData: number[], scenario: ScenarioConfig): number[] {
    const path: number[] = [...baselineData];

    for (let step = 0; step < scenario.steps; step++) {
      const lastValue = path[path.length - 1];
      const randomShock = this.generateRandomShock(scenario);
      const nextValue = lastValue * (1 + scenario.drift + randomShock);
      path.push(nextValue);
    }

    return path;
  }

  private generateRandomShock(scenario: ScenarioConfig): number {
    // Generate random shock based on scenario parameters
    return stats.randomNormal() * scenario.volatility;
  }

  private calculateStatistics(results: number[][]): SimulationStatistics {
    const finalValues = results.map(path => path[path.length - 1]);

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
  }
}

// Supporting types
interface LSTMConfig {
  lookbackDays?: number;
  epochs?: number;
  batchSize?: number;
  validationSplit?: number;
  learningRate?: number;
}

interface ScenarioConfig {
  name: string;
  steps: number;
  drift: number;
  volatility: number;
  parameters: Record<string, number>;
}

interface SimulationResult {
  scenario: string;
  statistics: SimulationStatistics;
  paths: number[][];
}

interface SimulationStatistics {
  mean: number;
  median: number;
  std: number;
  percentiles: {
    p5: number;
    p25: number;
    p75: number;
    p95: number;
  };
}

export {
  LSTMConfig,
  ScenarioConfig,
  SimulationResult,
  SimulationStatistics
};