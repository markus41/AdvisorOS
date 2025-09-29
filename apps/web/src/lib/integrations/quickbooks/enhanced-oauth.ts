import { randomBytes, createHmac } from 'crypto';
import { prisma, redis } from '@/server/db';
import { decrypt, encrypt } from '@/lib/encryption';

export interface QuickBooksOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  discoveryDocumentUrl: string;
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: Date;
}

export interface QuickBooksAuthState {
  organizationId: string;
  state: string;
  redirectUrl?: string;
  createdAt: Date;
  attemptCount?: number;
  lastAttemptAt?: Date;
  connectionId?: string;
}

export interface ConnectionMetadata {
  connectionId: string;
  organizationId: string;
  connectionName?: string;
  isDefault: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  status: 'active' | 'expired' | 'revoked' | 'error';
  errorDetails?: string;
  realmId: string;
}

export interface OAuthAttemptMetrics {
  organizationId: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lastAttemptAt: Date;
  averageAttemptDuration: number;
  commonErrors: Array<{ error: string; count: number }>;
}

export class EnhancedQuickBooksOAuthService {
  private config: QuickBooksOAuthConfig;
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED']
  };

  constructor(config: QuickBooksOAuthConfig) {
    this.config = {
      ...config,
      retryConfig: { ...this.defaultRetryConfig, ...config.retryConfig }
    };
  }

  /**
   * Generate OAuth authorization URL with enhanced connection management
   */
  async generateAuthUrl(
    organizationId: string,
    options: {
      redirectUrl?: string;
      connectionName?: string;
      isAdditionalConnection?: boolean;
    } = {}
  ): Promise<{ url: string; state: string; connectionId: string }> {
    const startTime = Date.now();
    const state = this.generateState();
    const connectionId = this.generateConnectionId();
    const scope = 'com.intuit.quickbooks.accounting';

    try {
      // Store state for verification with enhanced metadata
      await this.storeAuthState({
        organizationId,
        state,
        redirectUrl: options.redirectUrl,
        createdAt: new Date(),
        connectionId,
        attemptCount: 1
      });

      // Log OAuth attempt for security monitoring
      await this.logSecurityEvent(organizationId, 'oauth_attempt', {
        connectionId,
        connectionName: options.connectionName,
        isAdditionalConnection: options.isAdditionalConnection,
        redirectUrl: options.redirectUrl
      });

      // Update metrics
      await this.updateOAuthMetrics(organizationId, 'attempt', Date.now() - startTime);

      const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
      authUrl.searchParams.set('client_id', this.config.clientId);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('state', state);

      return {
        url: authUrl.toString(),
        state,
        connectionId
      };
    } catch (error) {
      await this.updateOAuthMetrics(organizationId, 'failure', Date.now() - startTime, error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens with enhanced retry mechanism
   */
  async exchangeCodeForTokens(
    code: string,
    state: string,
    realmId: string
  ): Promise<QuickBooksTokens & { connectionId: string }> {
    const startTime = Date.now();

    return this.executeWithRetry(async () => {
      try {
        // Verify state
        const authState = await this.verifyAndGetAuthState(state);
        if (!authState) {
          await this.logSecurityEvent('unknown', 'oauth_invalid_state', { state, realmId });
          throw new Error('Invalid or expired state parameter');
        }

        // Update attempt count
        await this.updateAuthStateAttempt(state);

        // Exchange code for tokens
        const tokenResponse = await this.requestTokens({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri
        });

        const tokens: QuickBooksTokens = {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          realmId,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000)
        };

        // Store tokens securely with connection metadata
        await this.storeTokensWithConnection(
          authState.organizationId,
          tokens,
          authState.connectionId || 'default'
        );

        // Log successful connection
        await this.logSecurityEvent(authState.organizationId, 'oauth_success', {
          connectionId: authState.connectionId,
          realmId,
          expiresAt: tokens.expiresAt
        });

        // Update metrics
        await this.updateOAuthMetrics(authState.organizationId, 'success', Date.now() - startTime);

        // Clean up state
        await this.cleanupAuthState(state);

        return {
          ...tokens,
          connectionId: authState.connectionId || 'default'
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        await this.updateOAuthMetrics('unknown', 'failure', duration, error);
        await this.logSecurityEvent('unknown', 'oauth_failure', {
          error: error instanceof Error ? error.message : 'Unknown error',
          state,
          realmId,
          duration
        });
        throw error;
      }
    });
  }

  /**
   * Refresh access token with enhanced retry logic and monitoring
   */
  async refreshTokens(
    organizationId: string,
    connectionId = 'default'
  ): Promise<QuickBooksTokens> {
    const startTime = Date.now();

    return this.executeWithRetry(async () => {
      try {
        const tokenRecord = await this.findTokenRecord(organizationId, connectionId);

        if (!tokenRecord || !tokenRecord.isActive) {
          throw new Error('No active QuickBooks tokens found');
        }

        const refreshToken = await decrypt(tokenRecord.refreshToken);

        const tokenResponse = await this.requestTokens({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        });

        const tokens: QuickBooksTokens = {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || refreshToken,
          realmId: tokenRecord.realmId,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000)
        };

        // Update stored tokens
        await this.storeTokensWithConnection(organizationId, tokens, connectionId);

        // Update connection metadata
        await this.updateConnectionMetadata(organizationId, connectionId, {
          lastUsedAt: new Date(),
          status: 'active',
          errorDetails: undefined
        });

        // Log successful refresh
        await this.logSecurityEvent(organizationId, 'token_refresh_success', {
          connectionId,
          realmId: tokenRecord.realmId,
          expiresAt: tokens.expiresAt,
          duration: Date.now() - startTime
        });

        return tokens;
      } catch (error) {
        // Update connection status on failure
        await this.updateConnectionMetadata(organizationId, connectionId, {
          status: 'error',
          errorDetails: error instanceof Error ? error.message : 'Unknown error'
        });

        await this.logSecurityEvent(organizationId, 'token_refresh_failure', {
          connectionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        });

        throw error;
      }
    });
  }

  /**
   * Get valid access token with automatic refresh and monitoring
   */
  async getValidAccessToken(
    organizationId: string,
    connectionId = 'default'
  ): Promise<string> {
    try {
      const tokenRecord = await this.findTokenRecord(organizationId, connectionId);

      if (!tokenRecord || !tokenRecord.isActive) {
        throw new Error('No active QuickBooks tokens found');
      }

      // Check if token expires within next 5 minutes
      const expiryBuffer = 5 * 60 * 1000;
      const isExpiringSoon = tokenRecord.expiresAt.getTime() - Date.now() < expiryBuffer;

      if (isExpiringSoon) {
        console.log(`Token expiring soon for connection ${connectionId}, refreshing...`);
        const refreshedTokens = await this.refreshTokens(organizationId, connectionId);
        return refreshedTokens.accessToken;
      }

      // Update last used timestamp
      await this.updateConnectionMetadata(organizationId, connectionId, {
        lastUsedAt: new Date()
      });

      return await decrypt(tokenRecord.accessToken);
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw error;
    }
  }

  /**
   * Revoke QuickBooks access with connection support
   */
  async revokeAccess(
    organizationId: string,
    connectionId?: string,
    revokeAll = false
  ): Promise<void> {
    try {
      if (revokeAll) {
        const connections = await this.getOrganizationConnections(organizationId);
        for (const conn of connections) {
          await this.revokeConnection(organizationId, conn.connectionId);
        }
      } else {
        await this.revokeConnection(organizationId, connectionId || 'default');
      }
    } catch (error) {
      console.error('Error revoking QuickBooks access:', error);
      throw new Error('Failed to revoke QuickBooks access');
    }
  }

  /**
   * Get all connections for an organization
   */
  async getOrganizationConnections(organizationId: string): Promise<ConnectionMetadata[]> {
    try {
      const connections = await prisma.quickBooksToken.findMany({
        where: {
          organizationId,
          isActive: true,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return connections.map(conn => ({
        connectionId: conn.connectionId || 'default',
        organizationId: conn.organizationId,
        connectionName: conn.connectionName || undefined,
        isDefault: conn.isDefault || false,
        createdAt: conn.createdAt,
        lastUsedAt: conn.lastUsedAt || conn.createdAt,
        status: this.determineConnectionStatus(conn),
        errorDetails: conn.errorDetails || undefined,
        realmId: conn.realmId
      }));
    } catch (error) {
      console.error('Error getting organization connections:', error);
      return [];
    }
  }

  /**
   * Get OAuth metrics for monitoring
   */
  async getOAuthMetrics(organizationId: string): Promise<OAuthAttemptMetrics | null> {
    try {
      const metricsKey = `qb_oauth_metrics:${organizationId}`;

      if (redis) {
        const stored = await redis.get(metricsKey);
        return stored ? JSON.parse(stored) : null;
      }

      // Fallback to database aggregation
      const attempts = await prisma.quickBooksOAuthAttempt.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      if (attempts.length === 0) return null;

      const successful = attempts.filter(a => a.success);
      const failed = attempts.filter(a => !a.success);

      const errorCounts = failed.reduce((acc, attempt) => {
        const error = attempt.errorMessage || 'Unknown error';
        acc[error] = (acc[error] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonErrors = Object.entries(errorCounts)
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const totalDuration = attempts.reduce((sum, a) => sum + (a.duration || 0), 0);

      return {
        organizationId,
        totalAttempts: attempts.length,
        successfulAttempts: successful.length,
        failedAttempts: failed.length,
        lastAttemptAt: attempts[0]?.createdAt || new Date(),
        averageAttemptDuration: totalDuration / attempts.length,
        commonErrors
      };
    } catch (error) {
      console.error('Error getting OAuth metrics:', error);
      return null;
    }
  }

  /**
   * Health check for OAuth service
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: any;
  }> {
    const checks = {
      configValid: this.validateConfig(),
      redisConnection: await this.checkRedisConnection(),
      databaseConnection: await this.checkDatabaseConnection(),
      quickbooksEndpoint: await this.checkQuickBooksEndpoint()
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const metrics = await this.getServiceMetrics();

    return { status, checks, metrics };
  }

  // Private helper methods

  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  private generateConnectionId(): string {
    return `conn_${randomBytes(16).toString('hex')}`;
  }

  private async findTokenRecord(organizationId: string, connectionId: string) {
    try {
      return await prisma.quickBooksToken.findFirst({
        where: {
          organizationId,
          connectionId,
          isActive: true,
          deletedAt: null
        }
      });
    } catch (error) {
      console.error('Error finding token record:', error);
      return null;
    }
  }

  private async storeAuthState(authState: QuickBooksAuthState): Promise<void> {
    const key = `qb_auth_state:${authState.state}`;
    const ttl = 600; // 10 minutes

    try {
      if (redis) {
        await redis.setex(key, ttl, JSON.stringify(authState));
      } else {
        // Fallback to database storage
        await prisma.quickBooksAuthState.create({
          data: {
            state: authState.state,
            organizationId: authState.organizationId,
            connectionId: authState.connectionId,
            redirectUrl: authState.redirectUrl,
            expiresAt: new Date(Date.now() + ttl * 1000),
            metadata: authState
          }
        });
      }
    } catch (error) {
      console.error('Failed to store auth state:', error);
      throw new Error('Failed to store authentication state');
    }
  }

  private async verifyAndGetAuthState(state: string): Promise<QuickBooksAuthState | null> {
    const key = `qb_auth_state:${state}`;

    try {
      if (redis) {
        const stored = await redis.get(key);
        return stored ? JSON.parse(stored) : null;
      } else {
        const authStateRecord = await prisma.quickBooksAuthState.findUnique({
          where: { state }
        });

        if (!authStateRecord || authStateRecord.expiresAt < new Date()) {
          return null;
        }

        return authStateRecord.metadata as QuickBooksAuthState;
      }
    } catch (error) {
      console.error('Failed to verify auth state:', error);
      return null;
    }
  }

  private async cleanupAuthState(state: string): Promise<void> {
    const key = `qb_auth_state:${state}`;

    try {
      if (redis) {
        await redis.del(key);
      } else {
        await prisma.quickBooksAuthState.delete({
          where: { state }
        }).catch(() => {}); // Ignore if already deleted
      }
    } catch (error) {
      console.warn('Failed to cleanup auth state:', error);
    }
  }

  private async updateAuthStateAttempt(state: string): Promise<void> {
    const key = `qb_auth_state:${state}`;

    try {
      if (redis) {
        const stored = await redis.get(key);
        if (stored) {
          const authState = JSON.parse(stored);
          authState.attemptCount = (authState.attemptCount || 0) + 1;
          authState.lastAttemptAt = new Date();
          await redis.setex(key, 600, JSON.stringify(authState));
        }
      } else {
        await prisma.quickBooksAuthState.update({
          where: { state },
          data: {
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date()
          }
        }).catch(() => {});
      }
    } catch (error) {
      console.warn('Failed to update auth state attempt:', error);
    }
  }

  private async requestTokens(params: Record<string, string>): Promise<any> {
    const body = new URLSearchParams(params);

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        'Accept': 'application/json',
        'User-Agent': 'AdvisorOS-QBIntegration/2.0'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token request failed:', response.status, errorData);

      let errorDetails: any = {};
      try {
        errorDetails = JSON.parse(errorData);
      } catch {
        errorDetails = { error: errorData };
      }

      if (response.status === 400) {
        throw new Error(`Invalid request: ${errorDetails.error_description || errorDetails.error}`);
      } else if (response.status === 401) {
        throw new Error('Invalid client credentials');
      } else if (response.status >= 500) {
        throw new Error('QuickBooks OAuth service temporarily unavailable');
      } else {
        throw new Error(`Token request failed: ${response.status} - ${errorDetails.error_description || errorDetails.error}`);
      }
    }

    return await response.json();
  }

  private async revokeTokens(refreshToken: string): Promise<void> {
    const body = new URLSearchParams({
      token: refreshToken
    });

    const response = await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token revocation failed:', response.status, errorData);
      throw new Error(`Token revocation failed: ${response.status}`);
    }
  }

  private async storeTokensWithConnection(
    organizationId: string,
    tokens: QuickBooksTokens,
    connectionId: string,
    connectionName?: string
  ): Promise<void> {
    const encryptedAccessToken = await encrypt(tokens.accessToken);
    const encryptedRefreshToken = await encrypt(tokens.refreshToken);

    // Check if this is the first connection
    const existingConnections = await prisma.quickBooksToken.count({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null
      }
    });

    const isDefault = existingConnections === 0;

    await prisma.quickBooksToken.upsert({
      where: {
        organizationId_connectionId: {
          organizationId,
          connectionId
        }
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        realmId: tokens.realmId,
        expiresAt: tokens.expiresAt,
        connectionName,
        isActive: true,
        deletedAt: null,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
        errorDetails: null
      },
      create: {
        organizationId,
        connectionId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        realmId: tokens.realmId,
        expiresAt: tokens.expiresAt,
        connectionName,
        isDefault,
        isActive: true,
        lastUsedAt: new Date()
      }
    });
  }

  private async revokeConnection(organizationId: string, connectionId: string): Promise<void> {
    const tokenRecord = await this.findTokenRecord(organizationId, connectionId);

    if (tokenRecord) {
      try {
        const refreshToken = await decrypt(tokenRecord.refreshToken);
        await this.revokeTokens(refreshToken);
      } catch (error) {
        console.warn(`Failed to revoke tokens with QuickBooks for connection ${connectionId}:`, error);
      }

      await prisma.quickBooksToken.update({
        where: {
          organizationId_connectionId: {
            organizationId,
            connectionId
          }
        },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      await this.logSecurityEvent(organizationId, 'connection_revoked', {
        connectionId,
        realmId: tokenRecord.realmId
      });
    }
  }

  private async updateConnectionMetadata(
    organizationId: string,
    connectionId: string,
    updates: Partial<ConnectionMetadata>
  ): Promise<void> {
    try {
      await prisma.quickBooksToken.update({
        where: {
          organizationId_connectionId: {
            organizationId,
            connectionId
          }
        },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.warn('Failed to update connection metadata:', error);
    }
  }

  private determineConnectionStatus(tokenRecord: any): 'active' | 'expired' | 'revoked' | 'error' {
    if (!tokenRecord.isActive || tokenRecord.deletedAt) {
      return 'revoked';
    }
    if (tokenRecord.expiresAt <= new Date()) {
      return 'expired';
    }
    if (tokenRecord.errorDetails) {
      return 'error';
    }
    return 'active';
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const retryConfig = this.config.retryConfig!;
    let lastError: Error;
    let delay = retryConfig.baseDelay;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        const isRetryable = retryConfig.retryableErrors.some(retryableError =>
          lastError.message.includes(retryableError) ||
          lastError.name.includes(retryableError)
        );

        if (!isRetryable || attempt === retryConfig.maxRetries) {
          break;
        }

        console.log(`OAuth operation failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${lastError.message}`);

        const actualDelay = Math.min(delay, retryConfig.maxDelay);
        console.log(`Retrying in ${actualDelay}ms...`);

        await this.delay(actualDelay);
        delay *= retryConfig.backoffMultiplier;
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logSecurityEvent(
    organizationId: string,
    eventType: string,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          organizationId,
          eventType: `quickbooks_${eventType}`,
          severity: eventType.includes('failure') || eventType.includes('invalid') ? 'high' : 'medium',
          metadata: {
            integration: 'quickbooks',
            timestamp: new Date(),
            ...metadata
          }
        }
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }

  private async updateOAuthMetrics(
    organizationId: string,
    type: 'attempt' | 'success' | 'failure',
    duration: number,
    error?: any
  ): Promise<void> {
    try {
      await prisma.quickBooksOAuthAttempt.create({
        data: {
          organizationId,
          success: type === 'success',
          duration,
          errorMessage: error ? (error instanceof Error ? error.message : String(error)) : null,
          metadata: { type, timestamp: new Date() }
        }
      });

      // Update Redis metrics cache
      if (redis) {
        const metricsKey = `qb_oauth_metrics:${organizationId}`;
        const cached = await redis.get(metricsKey);
        let metrics = cached ? JSON.parse(cached) : {
          organizationId,
          totalAttempts: 0,
          successfulAttempts: 0,
          failedAttempts: 0,
          lastAttemptAt: new Date(),
          averageAttemptDuration: 0,
          commonErrors: []
        };

        metrics.totalAttempts++;
        if (type === 'success') metrics.successfulAttempts++;
        if (type === 'failure') metrics.failedAttempts++;
        metrics.lastAttemptAt = new Date();
        metrics.averageAttemptDuration = ((metrics.averageAttemptDuration * (metrics.totalAttempts - 1)) + duration) / metrics.totalAttempts;

        await redis.setex(metricsKey, 3600, JSON.stringify(metrics)); // 1 hour TTL
      }
    } catch (error) {
      console.warn('Failed to update OAuth metrics:', error);
    }
  }

  private validateConfig(): boolean {
    return !!(
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.redirectUri &&
      this.config.baseUrl
    );
  }

  private async checkRedisConnection(): Promise<boolean> {
    try {
      if (!redis) return true; // Redis is optional
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkQuickBooksEndpoint(): Promise<boolean> {
    try {
      const response = await fetch(this.config.discoveryDocumentUrl, {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async getServiceMetrics(): Promise<any> {
    try {
      const [
        totalConnections,
        activeConnections,
        recentAttempts
      ] = await Promise.all([
        prisma.quickBooksToken.count(),
        prisma.quickBooksToken.count({
          where: {
            isActive: true,
            deletedAt: null,
            expiresAt: { gt: new Date() }
          }
        }),
        prisma.quickBooksOAuthAttempt.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      return {
        totalConnections,
        activeConnections,
        recentAttempts,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to get service metrics:', error);
      return null;
    }
  }
}

// Factory function
export function createEnhancedQuickBooksOAuthService(
  customRetryConfig?: Partial<RetryConfig>
): EnhancedQuickBooksOAuthService {
  const config: QuickBooksOAuthConfig = {
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
    baseUrl: process.env.QUICKBOOKS_SANDBOX === 'true'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com',
    discoveryDocumentUrl: process.env.QUICKBOOKS_SANDBOX === 'true'
      ? 'https://developer.api.intuit.com/.well-known/connect/discovery'
      : 'https://developer.api.intuit.com/.well-known/connect/discovery',
    retryConfig: customRetryConfig
  };

  return new EnhancedQuickBooksOAuthService(config);
}

// Environment validation
export function validateQuickBooksEnvironment(): void {
  const requiredVars = [
    'QUICKBOOKS_CLIENT_ID',
    'QUICKBOOKS_CLIENT_SECRET',
    'QUICKBOOKS_REDIRECT_URI'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required QuickBooks environment variables: ${missingVars.join(', ')}`);
  }
}

// Initialize validation
validateQuickBooksEnvironment();

// Export types
export type {
  QuickBooksOAuthConfig,
  QuickBooksTokens,
  QuickBooksAuthState,
  RetryConfig,
  ConnectionMetadata,
  OAuthAttemptMetrics
};