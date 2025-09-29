// Mock TensorFlow types and functionality for development builds
// This allows the project to build without requiring full TensorFlow installation

declare namespace tf {
  interface Tensor {
    dataSync(): Float32Array | Int32Array | Uint8Array;
    dispose(): void;
  }
  
  interface LayersModel {
    predict(x: Tensor): Tensor;
    compile(args: any): void;
    fit(x: Tensor, y: Tensor, config?: any): Promise<History>;
    add?(layer: any): void;
  }
  
  interface History {
    history: Record<string, number[]>;
  }
  
  const train: {
    sgd: (learningRate: number) => any;
    adam: (learningRate?: number) => any;
  };
  
  const layers: {
    dense: (config: any) => any;
    dropout: (config: any) => any;
  };
  
  const losses: {
    meanSquaredError: string;
    categoricalCrossentropy: string;
    absoluteDifference?: string;
  };
  
  function tensor(values: any[], shape?: number[]): Tensor;
  function sequential(): LayersModel;
}

// Mock ml-regression
declare module 'ml-regression' {
  export const regression: any;
}

// Mock TensorFlow.js module
declare module '@tensorflow/tfjs-node' {
  export = tf;
}

export { tf };