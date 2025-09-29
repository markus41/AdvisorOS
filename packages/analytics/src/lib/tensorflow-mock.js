"use strict";
/**
 * Mock TensorFlow.js implementation for development/build purposes
 * This provides minimal interface compatibility when TensorFlow.js Node is not available
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.tf = void 0;
// Mock tensor implementation
var TensorImpl = /** @class */ (function () {
    function TensorImpl(_data) {
        this._data = _data;
    }
    TensorImpl.prototype.dispose = function () {
        // No-op for mock
    };
    TensorImpl.prototype.data = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._data];
            });
        });
    };
    TensorImpl.prototype.dataSync = function () {
        return new Float32Array(this._data);
    };
    return TensorImpl;
}());
// Mock model implementation
var LayersModelImpl = /** @class */ (function () {
    function LayersModelImpl() {
    }
    LayersModelImpl.prototype.predict = function (input) {
        // Return mock prediction (random value between 0 and 1 for simplicity)
        return new TensorImpl([Math.random()]);
    };
    LayersModelImpl.prototype.dispose = function () {
        // No-op for mock
    };
    LayersModelImpl.prototype.add = function (layer) {
        // No-op for mock
    };
    LayersModelImpl.prototype.compile = function (config) {
        // No-op for mock
    };
    LayersModelImpl.prototype.fit = function (x, y, config) {
        return Promise.resolve({
            history: {
                loss: [0.5, 0.3, 0.1],
                accuracy: [0.7, 0.8, 0.9]
            }
        });
    };
    return LayersModelImpl;
}());
// Mock TensorFlow functions
exports.tf = {
    ready: function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    }); },
    tensor2d: function (values, shape) {
        var flatData = values.flat();
        return new TensorImpl(flatData);
    },
    tensor1d: function (values) {
        return new TensorImpl(values);
    },
    sequential: function (config) {
        return new LayersModelImpl();
    },
    layers: {
        dense: function (config) { return config; },
        dropout: function (config) { return config; },
        batchNormalization: function (config) { return config; }
    },
    train: {
        adam: function (learningRate) { return ({ learningRate: learningRate || 0.001 }); }
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
exports.default = exports.tf;
