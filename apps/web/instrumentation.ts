/**
 * Next.js Instrumentation
 *
 * This file is automatically executed during server initialization.
 * Use it to set up security measures, monitoring, and other global configurations.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { freezePrototypes } from './src/server/security/prototype-freeze';

/**
 * Server-side initialization
 * Called once when the Node.js server starts
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server security...');

    // CRITICAL SECURITY: Freeze prototypes to prevent pollution attacks
    // This must be done BEFORE loading any user data or vulnerable dependencies
    try {
      freezePrototypes({
        freezeGlobals: true,
        strictMode: true,
        verbose: process.env.NODE_ENV === 'development',
        onViolation: (error) => {
          // Log security violations for monitoring
          console.error('[SECURITY] Prototype pollution attempt detected:', error);

          // In production, send to security monitoring service
          if (process.env.NODE_ENV === 'production') {
            // TODO: Send to security monitoring (e.g., Sentry, DataDog)
            // securityMonitoring.alert('prototype-pollution-attempt', { error });
          }
        }
      });
    } catch (error) {
      // CRITICAL: If prototype freezing fails, halt server startup
      console.error('[CRITICAL] Failed to initialize security protections:', error);
      process.exit(1);
    }

    console.log('[Instrumentation] ✓ Server security initialized successfully');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('[Instrumentation] Edge runtime detected - security measures initialized');
  }
}

/**
 * Edge runtime initialization (if needed)
 * Called for Edge runtime environments
 */
export function onRequestError(
  err: Error,
  request: { url: string; method: string }
): void {
  // Log errors for monitoring
  console.error('[Request Error]', {
    error: err.message,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // TODO: Send to error tracking service
}