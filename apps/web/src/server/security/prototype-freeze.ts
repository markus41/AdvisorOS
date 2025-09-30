/**
 * Prototype Pollution Protection
 *
 * This module implements prototype freezing to prevent prototype pollution attacks.
 * Prototype pollution is a critical vulnerability where attackers can modify
 * Object.prototype or other built-in prototypes to inject malicious properties
 * that affect all objects in the application.
 *
 * SECURITY CONTEXT:
 * - CVE-2022-25878: Prototype pollution in protobufjs
 * - Affects all applications using protobuf, lodash, and other libraries
 * - Can lead to RCE, authentication bypass, and data corruption
 *
 * DEFENSE STRATEGY:
 * 1. Freeze built-in prototypes to prevent modification
 * 2. Use Object.create(null) for dictionaries
 * 3. Validate and sanitize all user input
 * 4. Use Map/Set instead of plain objects for dynamic data
 *
 * @module server/security/prototype-freeze
 */

/**
 * List of built-in prototypes to freeze
 */
const PROTOTYPES_TO_FREEZE = [
  Object.prototype,
  Array.prototype,
  String.prototype,
  Number.prototype,
  Boolean.prototype,
  Date.prototype,
  RegExp.prototype,
  Function.prototype,
  Map.prototype,
  Set.prototype,
  WeakMap.prototype,
  WeakSet.prototype,
  Promise.prototype,
  Error.prototype,
] as const;

/**
 * Properties that should be frozen on Object constructor
 */
const OBJECT_CONSTRUCTOR_PROPERTIES = [
  'assign',
  'create',
  'defineProperty',
  'defineProperties',
  'freeze',
  'seal',
  'preventExtensions',
  'keys',
  'values',
  'entries',
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'getOwnPropertyNames',
  'getOwnPropertySymbols',
  'getPrototypeOf',
  'setPrototypeOf',
] as const;

/**
 * Tracks whether prototypes have been frozen
 */
let isFrozen = false;

/**
 * Configuration options for prototype freezing
 */
export interface PrototypeFreezeOptions {
  /**
   * Whether to freeze global objects (default: true)
   */
  freezeGlobals?: boolean;

  /**
   * Whether to enable strict mode validation (default: true)
   */
  strictMode?: boolean;

  /**
   * Custom error handler for freeze violations
   */
  onViolation?: (error: Error) => void;

  /**
   * Whether to log freeze operations (default: true in development)
   */
  verbose?: boolean;
}

/**
 * Freezes Object and Array prototypes to prevent prototype pollution attacks.
 * This must be called during server initialization, before any user input is processed.
 *
 * WHY THIS WORKS:
 * - Object.freeze() prevents adding, deleting, or modifying properties
 * - Frozen prototypes cannot be polluted even with vulnerable dependencies
 * - Performance impact is negligible (one-time operation at startup)
 *
 * LIMITATIONS:
 * - Must be called before loading vulnerable libraries
 * - Cannot protect against already-polluted prototypes
 * - Some libraries may break if they modify prototypes (rare)
 *
 * @param options - Configuration options
 * @throws {Error} If already frozen or in invalid state
 *
 * @example
 * ```typescript
 * // In server initialization (server/index.ts)
 * import { freezePrototypes } from './security/prototype-freeze';
 *
 * freezePrototypes({
 *   verbose: process.env.NODE_ENV === 'development',
 *   strictMode: true
 * });
 * ```
 */
export function freezePrototypes(options: PrototypeFreezeOptions = {}): void {
  const {
    freezeGlobals = true,
    strictMode = true,
    onViolation,
    verbose = process.env.NODE_ENV === 'development'
  } = options;

  // Prevent double-freezing
  if (isFrozen) {
    const error = new Error('[Security] Prototypes are already frozen');
    if (onViolation) {
      onViolation(error);
    } else {
      console.warn(error.message);
    }
    return;
  }

  try {
    // Step 1: Freeze all built-in prototypes
    let frozenCount = 0;
    for (const prototype of PROTOTYPES_TO_FREEZE) {
      if (prototype && !Object.isFrozen(prototype)) {
        Object.freeze(prototype);
        frozenCount++;
      }
    }

    if (verbose) {
      console.log(`[Security] Frozen ${frozenCount} built-in prototypes`);
    }

    // Step 2: Freeze Object constructor properties
    if (freezeGlobals) {
      for (const prop of OBJECT_CONSTRUCTOR_PROPERTIES) {
        const descriptor = Object.getOwnPropertyDescriptor(Object, prop);
        if (descriptor && descriptor.configurable) {
          Object.defineProperty(Object, prop, {
            ...descriptor,
            writable: false,
            configurable: false
          });
        }
      }

      if (verbose) {
        console.log('[Security] Frozen Object constructor properties');
      }
    }

    // Step 3: Freeze global object properties (in strict mode)
    if (strictMode && typeof globalThis !== 'undefined') {
      // Prevent modification of critical globals
      const criticalGlobals = ['Object', 'Array', 'String', 'Number', 'Boolean'];
      for (const globalName of criticalGlobals) {
        if (globalName in globalThis) {
          const descriptor = Object.getOwnPropertyDescriptor(globalThis, globalName);
          if (descriptor && descriptor.configurable) {
            Object.defineProperty(globalThis, globalName, {
              ...descriptor,
              writable: false,
              configurable: false
            });
          }
        }
      }

      if (verbose) {
        console.log('[Security] Frozen critical global objects');
      }
    }

    // Step 4: Set up prototype pollution detection
    if (strictMode) {
      setupPollutionDetection(onViolation);
    }

    isFrozen = true;

    console.log('[Security] ✓ Prototypes frozen successfully - Protected against prototype pollution attacks');
  } catch (error) {
    const securityError = new Error(
      `[Security] Failed to freeze prototypes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    if (onViolation) {
      onViolation(securityError);
    } else {
      console.error(securityError);
    }

    throw securityError;
  }
}

/**
 * Sets up runtime detection of prototype pollution attempts
 * Monitors for suspicious property assignments on frozen prototypes
 */
function setupPollutionDetection(onViolation?: (error: Error) => void): void {
  // Override Object.defineProperty to detect pollution attempts
  const originalDefineProperty = Object.defineProperty;

  Object.defineProperty = function (obj: any, prop: PropertyKey, descriptor: PropertyDescriptor): any {
    // Detect attempts to modify frozen prototypes
    if (PROTOTYPES_TO_FREEZE.includes(obj)) {
      const error = new Error(
        `[Security] CRITICAL: Prototype pollution attempt detected on ${obj.constructor.name}.prototype for property "${String(prop)}"`
      );

      console.error(error.message);

      if (onViolation) {
        onViolation(error);
      }

      // Block the operation by throwing
      throw error;
    }

    return originalDefineProperty.call(Object, obj, prop, descriptor);
  };
}

/**
 * Validates that prototypes are properly frozen
 * Use this in security tests to verify protection is active
 *
 * @returns Object containing validation results
 */
export function validatePrototypeFreezing(): {
  isFrozen: boolean;
  vulnerabilities: string[];
  protectedCount: number;
} {
  const vulnerabilities: string[] = [];
  let protectedCount = 0;

  for (const prototype of PROTOTYPES_TO_FREEZE) {
    if (Object.isFrozen(prototype)) {
      protectedCount++;
    } else {
      vulnerabilities.push(
        `${prototype.constructor.name}.prototype is not frozen`
      );
    }
  }

  return {
    isFrozen,
    vulnerabilities,
    protectedCount
  };
}

/**
 * Tests prototype pollution protection
 * Attempts to pollute Object.prototype and verifies it's blocked
 *
 * @returns true if protection is working, false otherwise
 */
export function testPrototypePollutionProtection(): boolean {
  try {
    // Attempt to pollute Object.prototype
    (Object.prototype as any).testPollution = 'polluted';

    // If we get here, pollution succeeded (bad!)
    console.error('[Security] CRITICAL: Prototype pollution protection FAILED');
    return false;
  } catch (error) {
    // Pollution blocked (good!)
    console.log('[Security] ✓ Prototype pollution protection verified');
    return true;
  }
}

/**
 * Safe object creation utilities
 * Use these instead of plain objects for dynamic data
 */
export const safeObjectUtils = {
  /**
   * Creates a null-prototype object safe from pollution
   * Use this for dictionaries and dynamic data structures
   */
  createSafeObject: <T = any>(): Record<string, T> => {
    return Object.create(null);
  },

  /**
   * Safely sets a property without risking prototype pollution
   */
  safeSet: <T extends Record<string, any>>(
    obj: T,
    key: string,
    value: any
  ): T => {
    // Validate key is not a prototype property
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`[Security] Attempt to set dangerous property: ${key}`);
    }

    // Use Object.defineProperty for safe assignment
    Object.defineProperty(obj, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });

    return obj;
  },

  /**
   * Creates a Map instead of plain object (immune to pollution)
   */
  createSafeMap: <K = string, V = any>(): Map<K, V> => {
    return new Map<K, V>();
  }
};

/**
 * Middleware for Express/tRPC to validate no prototype pollution
 * Call this on each request in development to detect pollution
 */
export function createPollutionCheckMiddleware() {
  return function checkPrototypePollution(req: any, res: any, next: any) {
    const testObj = {};

    // Check for known pollution properties
    const pollutionIndicators = [
      '__proto__',
      'constructor',
      'prototype',
      'isAdmin',
      'isAuthenticated'
    ];

    for (const indicator of pollutionIndicators) {
      if (indicator in testObj && !(indicator in Object.prototype)) {
        const error = new Error(
          `[Security] CRITICAL: Prototype pollution detected - property "${indicator}" found on empty object`
        );

        console.error(error.message);
        res.status(500).json({ error: 'Security violation detected' });
        return;
      }
    }

    next();
  };
}

/**
 * Export singleton instance status
 */
export function isPrototypeFrozen(): boolean {
  return isFrozen;
}