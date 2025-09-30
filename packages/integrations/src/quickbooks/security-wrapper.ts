/**
 * QuickBooks API SSRF Protection Wrapper
 *
 * This module provides security validation for QuickBooks API calls to prevent
 * Server-Side Request Forgery (SSRF) attacks through the deprecated node-quickbooks
 * library which uses the vulnerable 'request' package.
 *
 * SECURITY CONTEXT:
 * - node-quickbooks@2.0.40 depends on deprecated 'request' package
 * - 'request' has known SSRF vulnerabilities (CVE-2023-28155)
 * - This wrapper provides temporary protection until migration to axios-based solution
 *
 * @module quickbooks/security-wrapper
 */

import { URL } from 'url';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

/**
 * Allowed QuickBooks API hosts (strict allowlist)
 * Only official Intuit QuickBooks API endpoints are permitted
 */
const ALLOWED_QUICKBOOKS_HOSTS = [
  'quickbooks.api.intuit.com',
  'sandbox-quickbooks.api.intuit.com',
  'oauth.platform.intuit.com',
  'developer.api.intuit.com'
] as const;

/**
 * Regular expressions for detecting private/internal IP addresses
 * Blocks access to RFC1918 private networks and localhost
 */
const PRIVATE_IP_RANGES = [
  /^10\./,                          // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16.0.0/12
  /^192\.168\./,                    // 192.168.0.0/16
  /^127\./,                         // 127.0.0.0/8 (loopback)
  /^169\.254\./,                    // 169.254.0.0/16 (link-local)
  /^localhost$/i,                   // localhost hostname
  /^0\.0\.0\.0$/,                   // 0.0.0.0 (wildcard)
  /^255\.255\.255\.255$/,           // 255.255.255.255 (broadcast)
  /^::1$/,                          // IPv6 loopback
  /^fe80:/i,                        // IPv6 link-local
  /^fc00:/i,                        // IPv6 unique local
  /^fd00:/i,                        // IPv6 unique local
] as const;

/**
 * Blocked URL patterns that indicate potential SSRF attempts
 */
const BLOCKED_URL_PATTERNS = [
  /@/,                              // URL with embedded credentials
  /\.\./,                           // Path traversal attempt
  /file:/i,                         // File protocol
  /gopher:/i,                       // Gopher protocol
  /ftp:/i,                          // FTP protocol
  /data:/i,                         // Data URI scheme
] as const;

/**
 * Error class for SSRF validation failures
 */
export class SSRFValidationError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly reason: string
  ) {
    super(message);
    this.name = 'SSRFValidationError';
  }
}

/**
 * Validates if an IP address is private/internal
 * @param ip - IP address to validate
 * @returns true if IP is private, false otherwise
 */
function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_RANGES.some(pattern => pattern.test(ip));
}

/**
 * Performs DNS lookup and validates resolved IP addresses
 * Prevents DNS rebinding attacks by validating resolved IPs
 *
 * @param hostname - Hostname to resolve and validate
 * @throws {SSRFValidationError} If DNS resolution fails or resolves to private IP
 */
async function validateDNSResolution(hostname: string): Promise<void> {
  try {
    const { address } = await dnsLookup(hostname);

    if (isPrivateIP(address)) {
      throw new SSRFValidationError(
        `DNS resolution blocked: ${hostname} resolves to private IP ${address}`,
        hostname,
        'PRIVATE_IP_RESOLVED'
      );
    }
  } catch (error) {
    if (error instanceof SSRFValidationError) {
      throw error;
    }
    throw new SSRFValidationError(
      `DNS resolution failed for ${hostname}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      hostname,
      'DNS_RESOLUTION_FAILED'
    );
  }
}

/**
 * Validates QuickBooks API URL against SSRF attack vectors
 *
 * This function performs comprehensive validation to prevent SSRF:
 * 1. URL parsing and structure validation
 * 2. Protocol validation (HTTPS only)
 * 3. Hostname allowlist verification
 * 4. Blocked pattern detection
 * 5. Private IP address detection
 * 6. DNS resolution validation (optional)
 *
 * @param urlString - The URL to validate
 * @param options - Validation options
 * @param options.checkDNS - Whether to perform DNS resolution check (default: true)
 * @returns Promise<true> if validation passes
 * @throws {SSRFValidationError} If any validation check fails
 *
 * @example
 * ```typescript
 * try {
 *   await validateQuickBooksUrl('https://quickbooks.api.intuit.com/v3/company/123/invoice');
 *   // URL is safe to use
 * } catch (error) {
 *   if (error instanceof SSRFValidationError) {
 *     console.error('SSRF attempt blocked:', error.reason);
 *   }
 * }
 * ```
 */
export async function validateQuickBooksUrl(
  urlString: string,
  options: { checkDNS?: boolean } = {}
): Promise<boolean> {
  const { checkDNS = true } = options;

  let url: URL;

  // Step 1: Parse and validate URL structure
  try {
    url = new URL(urlString);
  } catch (error) {
    throw new SSRFValidationError(
      `Invalid URL format: ${urlString}`,
      urlString,
      'INVALID_URL_FORMAT'
    );
  }

  // Step 2: Ensure HTTPS protocol
  if (url.protocol !== 'https:') {
    throw new SSRFValidationError(
      `QuickBooks API must use HTTPS protocol, got: ${url.protocol}`,
      urlString,
      'INVALID_PROTOCOL'
    );
  }

  // Step 3: Validate hostname against allowlist
  if (!ALLOWED_QUICKBOOKS_HOSTS.includes(url.hostname as any)) {
    throw new SSRFValidationError(
      `Unauthorized QuickBooks host: ${url.hostname}. Only official Intuit API endpoints are allowed.`,
      urlString,
      'UNAUTHORIZED_HOST'
    );
  }

  // Step 4: Check for blocked URL patterns
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(urlString)) {
      throw new SSRFValidationError(
        `URL contains blocked pattern: ${pattern.source}`,
        urlString,
        'BLOCKED_PATTERN'
      );
    }
  }

  // Step 5: Check for private IP addresses in hostname
  if (isPrivateIP(url.hostname)) {
    throw new SSRFValidationError(
      `Private IP addresses not allowed: ${url.hostname}`,
      urlString,
      'PRIVATE_IP_ADDRESS'
    );
  }

  // Step 6: Perform DNS resolution check (if enabled)
  if (checkDNS) {
    await validateDNSResolution(url.hostname);
  }

  return true;
}

/**
 * Synchronous version of URL validation (without DNS check)
 * Use this for lightweight validation when DNS resolution is not required
 *
 * @param urlString - The URL to validate
 * @returns true if validation passes
 * @throws {SSRFValidationError} If any validation check fails
 */
export function validateQuickBooksUrlSync(urlString: string): boolean {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch (error) {
    throw new SSRFValidationError(
      `Invalid URL format: ${urlString}`,
      urlString,
      'INVALID_URL_FORMAT'
    );
  }

  if (url.protocol !== 'https:') {
    throw new SSRFValidationError(
      `QuickBooks API must use HTTPS protocol, got: ${url.protocol}`,
      urlString,
      'INVALID_PROTOCOL'
    );
  }

  if (!ALLOWED_QUICKBOOKS_HOSTS.includes(url.hostname as any)) {
    throw new SSRFValidationError(
      `Unauthorized QuickBooks host: ${url.hostname}. Only official Intuit API endpoints are allowed.`,
      urlString,
      'UNAUTHORIZED_HOST'
    );
  }

  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(urlString)) {
      throw new SSRFValidationError(
        `URL contains blocked pattern: ${pattern.source}`,
        urlString,
        'BLOCKED_PATTERN'
      );
    }
  }

  if (isPrivateIP(url.hostname)) {
    throw new SSRFValidationError(
      `Private IP addresses not allowed: ${url.hostname}`,
      urlString,
      'PRIVATE_IP_ADDRESS'
    );
  }

  return true;
}

/**
 * Wraps QuickBooks API configuration with SSRF protection
 * Use this to validate configuration objects before passing to node-quickbooks
 *
 * @param config - QuickBooks configuration object
 * @returns Validated configuration
 * @throws {SSRFValidationError} If configuration contains invalid URLs
 */
export async function validateQuickBooksConfig(config: {
  endpoint?: string;
  oauth2_endpoint?: string;
  [key: string]: any;
}): Promise<typeof config> {
  // Validate endpoint URLs if present
  if (config.endpoint) {
    await validateQuickBooksUrl(config.endpoint);
  }

  if (config.oauth2_endpoint) {
    await validateQuickBooksUrl(config.oauth2_endpoint);
  }

  return config;
}

/**
 * Audit logging for SSRF validation events
 * Logs all validation attempts for security monitoring
 */
export function logSSRFValidation(
  result: 'success' | 'blocked',
  url: string,
  reason?: string,
  metadata?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'ssrf_validation',
    result,
    url,
    reason,
    ...metadata
  };

  if (result === 'blocked') {
    console.warn('[SECURITY] SSRF attempt blocked:', JSON.stringify(logEntry));
  } else {
    console.info('[SECURITY] QuickBooks URL validated:', JSON.stringify(logEntry));
  }
}