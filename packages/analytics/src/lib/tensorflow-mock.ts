/**
 * Mock TensorFlow.js implementation for development/build purposes
 * This provides minimal interface compatibility when TensorFlow.js Node is not available
 */

// Mock tensor interface
export interface MockTensor {
  dispose(): void;
  data(): Promise<number[]>;
  dataSync(): Float32Array | Int32Array | Uint8Array;
}

// Mock history interface
export interface MockHistory {
  history: Record<string, number[]>;
}

// Mock model interface
export interface MockLayersModel {
  predict(input: MockTensor): MockTensor;
  dispose(): void;
  add(layer: any): void;
  compile(config: any): void;
  fit(x: MockTensor, y: MockTensor, config?: any): Promise<MockHistory>;
}

// Mock tensor implementation
class TensorImpl implements MockTensor {
  constructor(private _data: number[]) {}

  dispose(): void {
    // No-op for mock
  }

  async data(): Promise<number[]> {
    return this._data;
  }

  dataSync(): Float32Array {
    return new Float32Array(this._data);
  }
}

// Mock model implementation
class LayersModelImpl implements MockLayersModel {
  predict(input: MockTensor): MockTensor {
    // Return mock prediction (random value between 0 and 1 for simplicity)
    return new TensorImpl([Math.random()]);
  }

  dispose(): void {
    // No-op for mock
  }

  add(layer: any): void {
    // No-op for mock
  }

  compile(config: any): void {
    // No-op for mock
  }

  fit(x: MockTensor, y: MockTensor, config?: any): Promise<MockHistory> {
    return Promise.resolve({
      history: {
        loss: [0.5, 0.3, 0.1],
        accuracy: [0.7, 0.8, 0.9]
      }
    });
  }
}

// Mock TensorFlow functions
export const tf = {
  ready: async (): Promise<void> => {
    // No-op for mock
  },

  tensor2d: (values: number[][], shape?: [number, number]): MockTensor => {
    const flatData = values.flat();
    return new TensorImpl(flatData);
  },

  tensor1d: (values: number[]): MockTensor => {
    return new TensorImpl(values);
  },

  sequential: (config?: any): MockLayersModel => {
    return new LayersModelImpl();
  },

  layers: {
    dense: (config: any) => config,
    dropout: (config: any) => config,
    batchNormalization: (config: any) => config
  },

  train: {
    adam: (learningRate?: number) => ({ learningRate: learningRate || 0.001 })
  },

  losses: {
    meanSquaredError: 'meanSquaredError',
    categoricalCrossentropy: 'categoricalCrossentropy'
  },

  metrics: {
    accuracy: 'accuracy',
    meanAbsoluteError: 'meanAbsoluteError'
  }
};

// Export as default for compatibility
export default tf;

// Type definitions for compatibility
export type Tensor = MockTensor;
export type LayersModel = MockLayersModel;