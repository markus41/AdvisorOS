import { randomBytes, createHmac } from 'crypto';
import { prisma } from '@/packages/database';
import { decrypt, encrypt } from '@/lib/encryption';

export interface QuickBooksOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string; // 'https://sandbox-quickbooks.api.intuit.com' or 'https://quickbooks.api.intuit.com'
  discoveryDocumentUrl: string;
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
}

export class QuickBooksOAuthService {
  private config: QuickBooksOAuthConfig;

  constructor(config: QuickBooksOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL with proper scopes
   */
  generateAuthUrl(organizationId: string, redirectUrl?: string): { url: string; state: string } {
    const state = this.generateState();
    const scope = 'com.intuit.quickbooks.accounting';

    // Store state for verification
    this.storeAuthState({
      organizationId,
      state,
      redirectUrl
    });

    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('state', state);

    return {
      url: authUrl.toString(),
      state
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    state: string,
    realmId: string
  ): Promise<QuickBooksTokens> {
    try {
      // Verify state
      const authState = await this.verifyAndGetAuthState(state);
      if (!authState) {
        throw new Error('Invalid or expired state parameter');
      }

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

      // Store tokens securely
      await this.storeTokens(authState.organizationId, tokens);

      // Clean up state
      await this.cleanupAuthState(state);

      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(organizationId: string): Promise<QuickBooksTokens> {
    try {
      const tokenRecord = await prisma.quickBooksToken.findUnique({
        where: { organizationId }
      });

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
        refreshToken: tokenResponse.refresh_token || refreshToken, // QB doesn't always return new refresh token
        realmId: tokenRecord.realmId,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000)
      };

      // Update stored tokens
      await this.storeTokens(organizationId, tokens);

      return tokens;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw new Error('Failed to refresh QuickBooks tokens');
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(organizationId: string): Promise<string> {
    try {
      const tokenRecord = await prisma.quickBooksToken.findUnique({
        where: { organizationId }
      });

      if (!tokenRecord || !tokenRecord.isActive) {
        throw new Error('No active QuickBooks tokens found');
      }

      // Check if token expires within next 5 minutes
      const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
      const isExpiringSoon = tokenRecord.expiresAt.getTime() - Date.now() < expiryBuffer;

      if (isExpiringSoon) {
        console.log('Token expiring soon, refreshing...');
        const refreshedTokens = await this.refreshTokens(organizationId);
        return refreshedTokens.accessToken;
      }

      return await decrypt(tokenRecord.accessToken);
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw error;
    }
  }

  /**
   * Revoke QuickBooks access and cleanup tokens
   */
  async revokeAccess(organizationId: string): Promise<void> {
    try {
      const tokenRecord = await prisma.quickBooksToken.findUnique({
        where: { organizationId }
      });

      if (tokenRecord) {
        // Revoke tokens with QuickBooks
        try {
          const refreshToken = await decrypt(tokenRecord.refreshToken);
          await this.revokeTokens(refreshToken);
        } catch (error) {
          console.warn('Failed to revoke tokens with QuickBooks:', error);
          // Continue with local cleanup even if revocation fails
        }

        // Mark as inactive and set deleted timestamp
        await prisma.quickBooksToken.update({
          where: { organizationId },
          data: {
            isActive: false,
            deletedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error revoking QuickBooks access:', error);
      throw new Error('Failed to revoke QuickBooks access');
    }
  }

  /**
   * Check if organization has valid QuickBooks connection
   */
  async hasValidConnection(organizationId: string): Promise<boolean> {
    try {
      const tokenRecord = await prisma.quickBooksToken.findUnique({
        where: { organizationId }
      });

      return !!(
        tokenRecord &&
        tokenRecord.isActive &&
        !tokenRecord.deletedAt &&
        tokenRecord.expiresAt > new Date()
      );
    } catch (error) {
      console.error('Error checking QuickBooks connection:', error);
      return false;
    }
  }

  /**
   * Get token information for organization
   */
  async getTokenInfo(organizationId: string): Promise<{
    realmId: string;
    expiresAt: Date;
    isActive: boolean;
    lastSyncAt: Date | null;
  } | null> {
    try {
      const tokenRecord = await prisma.quickBooksToken.findUnique({
        where: { organizationId }
      });

      if (!tokenRecord) {
        return null;
      }

      return {
        realmId: tokenRecord.realmId,
        expiresAt: tokenRecord.expiresAt,
        isActive: tokenRecord.isActive,
        lastSyncAt: tokenRecord.lastSyncAt
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  // Private helper methods

  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  private async storeAuthState(authState: QuickBooksAuthState): Promise<void> {
    // Store in Redis or database with short TTL (10 minutes)
    // For now, we'll use a simple in-memory store (consider Redis for production)
    const key = `qb_auth_state:${authState.state}`;
    // This would be stored in Redis with TTL in production
    // await redis.setex(key, 600, JSON.stringify(authState));
  }

  private async verifyAndGetAuthState(state: string): Promise<QuickBooksAuthState | null> {
    // Retrieve and verify state from storage
    const key = `qb_auth_state:${state}`;
    // This would be retrieved from Redis in production
    // const stored = await redis.get(key);
    // return stored ? JSON.parse(stored) : null;

    // For now, return a mock state (implement proper state storage)
    return { organizationId: 'mock', state };
  }

  private async cleanupAuthState(state: string): Promise<void> {
    const key = `qb_auth_state:${state}`;
    // await redis.del(key);
  }

  private async requestTokens(params: Record<string, string>): Promise<any> {
    const body = new URLSearchParams(params);

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
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
      console.error('Token request failed:', response.status, errorData);
      throw new Error(`Token request failed: ${response.status}`);
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

  private async storeTokens(organizationId: string, tokens: QuickBooksTokens): Promise<void> {
    const encryptedAccessToken = await encrypt(tokens.accessToken);
    const encryptedRefreshToken = await encrypt(tokens.refreshToken);

    await prisma.quickBooksToken.upsert({
      where: { organizationId },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        realmId: tokens.realmId,
        expiresAt: tokens.expiresAt,
        isActive: true,
        deletedAt: null,
        updatedAt: new Date()
      },
      create: {
        organizationId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        realmId: tokens.realmId,
        expiresAt: tokens.expiresAt,
        isActive: true
      }
    });
  }
}

// Factory function to create OAuth service with environment config
export function createQuickBooksOAuthService(): QuickBooksOAuthService {
  const config: QuickBooksOAuthConfig = {
    clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
    baseUrl: process.env.QUICKBOOKS_SANDBOX === 'true'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com',
    discoveryDocumentUrl: process.env.QUICKBOOKS_SANDBOX === 'true'
      ? 'https://developer.api.intuit.com/.well-known/connect/discovery'
      : 'https://developer.api.intuit.com/.well-known/connect/discovery'
  };

  return new QuickBooksOAuthService(config);
}