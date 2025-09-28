import { createQuickBooksOAuthService } from './oauth';

export interface QuickBooksError {
  code: string;
  message: string;
  detail?: string;
  statusCode: number;
}

export interface QuickBooksResponse<T = any> {
  QueryResponse?: {
    [key: string]: T[];
    maxResults?: number;
    startPosition?: number;
  };
  Fault?: {
    Error: Array<{
      code: string;
      Detail: string;
    }>;
  };
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class QuickBooksApiClient {
  private baseUrl: string;
  private organizationId: string;
  private oauthService: ReturnType<typeof createQuickBooksOAuthService>;
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  constructor(organizationId: string, sandbox = false) {
    this.organizationId = organizationId;
    this.baseUrl = sandbox
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';
    this.oauthService = createQuickBooksOAuthService();
  }

  /**
   * Make authenticated API request with retry and rate limiting
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };

    return this.executeWithRetry(async () => {
      return this.queueRequest(() => this.makeRequest<T>(endpoint, options));
    }, config);
  }

  /**
   * Get company information
   */
  async getCompanyInfo(realmId: string): Promise<any> {
    return this.request(`/v3/company/${realmId}/companyinfo/${realmId}`);
  }

  /**
   * Get all items with pagination
   */
  async getItems(realmId: string, maxResults = 100, startPosition = 1): Promise<any> {
    const query = `SELECT * FROM Item MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Get all accounts with pagination
   */
  async getAccounts(realmId: string, maxResults = 100, startPosition = 1): Promise<any> {
    const query = `SELECT * FROM Account MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Get all customers with pagination
   */
  async getCustomers(realmId: string, maxResults = 100, startPosition = 1): Promise<any> {
    const query = `SELECT * FROM Customer MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Get all invoices with pagination
   */
  async getInvoices(realmId: string, maxResults = 100, startPosition = 1, modifiedSince?: Date): Promise<any> {
    let query = `SELECT * FROM Invoice`;

    if (modifiedSince) {
      const dateStr = modifiedSince.toISOString().split('T')[0];
      query += ` WHERE Metadata.LastUpdatedTime >= '${dateStr}'`;
    }

    query += ` MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Get vendors
   */
  async getVendors(realmId: string, maxResults = 100, startPosition = 1): Promise<any> {
    const query = `SELECT * FROM Vendor MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Get purchase orders
   */
  async getPurchases(realmId: string, maxResults = 100, startPosition = 1, modifiedSince?: Date): Promise<any> {
    let query = `SELECT * FROM Purchase`;

    if (modifiedSince) {
      const dateStr = modifiedSince.toISOString().split('T')[0];
      query += ` WHERE Metadata.LastUpdatedTime >= '${dateStr}'`;
    }

    query += ` MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Get journal entries
   */
  async getJournalEntries(realmId: string, maxResults = 100, startPosition = 1, modifiedSince?: Date): Promise<any> {
    let query = `SELECT * FROM JournalEntry`;

    if (modifiedSince) {
      const dateStr = modifiedSince.toISOString().split('T')[0];
      query += ` WHERE Metadata.LastUpdatedTime >= '${dateStr}'`;
    }

    query += ` MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;
    return this.query(realmId, query);
  }

  /**
   * Generate reports
   */
  async getReport(realmId: string, reportType: string, options: Record<string, any> = {}): Promise<any> {
    const params = new URLSearchParams();

    // Add report options as query parameters
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const endpoint = `/v3/company/${realmId}/reports/${reportType}${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  /**
   * Get Profit & Loss report
   */
  async getProfitLossReport(realmId: string, startDate?: string, endDate?: string): Promise<any> {
    const options: Record<string, any> = {};

    if (startDate) options.start_date = startDate;
    if (endDate) options.end_date = endDate;

    return this.getReport(realmId, 'ProfitAndLoss', options);
  }

  /**
   * Get Balance Sheet report
   */
  async getBalanceSheetReport(realmId: string, asOfDate?: string): Promise<any> {
    const options: Record<string, any> = {};

    if (asOfDate) options.as_of_date = asOfDate;

    return this.getReport(realmId, 'BalanceSheet', options);
  }

  /**
   * Get Cash Flow report
   */
  async getCashFlowReport(realmId: string, startDate?: string, endDate?: string): Promise<any> {
    const options: Record<string, any> = {};

    if (startDate) options.start_date = startDate;
    if (endDate) options.end_date = endDate;

    return this.getReport(realmId, 'CashFlow', options);
  }

  /**
   * Create new entity
   */
  async create<T>(realmId: string, entityType: string, data: any): Promise<T> {
    return this.request(`/v3/company/${realmId}/${entityType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  /**
   * Update existing entity
   */
  async update<T>(realmId: string, entityType: string, data: any): Promise<T> {
    return this.request(`/v3/company/${realmId}/${entityType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }

  /**
   * Execute SQL-style query
   */
  async query<T>(realmId: string, query: string): Promise<T> {
    const encodedQuery = encodeURIComponent(query);
    return this.request(`/v3/company/${realmId}/query?query=${encodedQuery}`);
  }

  /**
   * Get single entity by ID
   */
  async getById<T>(realmId: string, entityType: string, id: string): Promise<T> {
    return this.request(`/v3/company/${realmId}/${entityType}/${id}`);
  }

  // Private methods

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Get valid access token
    const accessToken = await this.oauthService.getValidAccessToken(this.organizationId);

    // Prepare request
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      ...options.headers
    };

    console.log(`Making QuickBooks API request: ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Update rate limit info from response headers
    this.updateRateLimitInfo(response);

    // Handle response
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = await response.json();

    // Check for QuickBooks-specific errors in response body
    if (data.Fault) {
      throw new QuickBooksError(
        data.Fault.Error[0]?.code || 'QUICKBOOKS_ERROR',
        data.Fault.Error[0]?.Detail || 'Unknown QuickBooks error',
        data.Fault.Error[0]?.Detail,
        response.status
      );
    }

    return data;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const error: QuickBooksError = {
      code: errorData.error || `HTTP_${response.status}`,
      message: errorData.error_description || response.statusText || 'Unknown error',
      detail: errorData.detail,
      statusCode: response.status
    };

    // Handle specific HTTP errors
    switch (response.status) {
      case 401:
        error.code = 'UNAUTHORIZED';
        error.message = 'QuickBooks authentication failed. Please reconnect your account.';
        break;
      case 403:
        error.code = 'FORBIDDEN';
        error.message = 'Access denied. Check your QuickBooks permissions.';
        break;
      case 429:
        error.code = 'RATE_LIMITED';
        error.message = 'QuickBooks API rate limit exceeded. Please try again later.';
        break;
      case 500:
        error.code = 'INTERNAL_ERROR';
        error.message = 'QuickBooks server error. Please try again later.';
        break;
    }

    console.error('QuickBooks API error:', error);
    throw error;
  }

  private updateRateLimitInfo(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');
    const limit = response.headers.get('x-ratelimit-limit');

    if (remaining && reset && limit) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining, 10),
        resetTime: parseInt(reset, 10) * 1000, // Convert to milliseconds
        limit: parseInt(limit, 10)
      };
    }
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      // Check rate limit
      if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 1) {
        const waitTime = this.rateLimitInfo.resetTime - Date.now();
        if (waitTime > 0) {
          console.log(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
          await this.delay(waitTime);
        }
      }

      const requestFn = this.requestQueue.shift();
      if (requestFn) {
        await requestFn();

        // Add small delay between requests to be respectful
        await this.delay(100);
      }
    }

    this.isProcessingQueue = false;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error;
    let delay = config.baseDelay;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof QuickBooksError) {
          if (['UNAUTHORIZED', 'FORBIDDEN', 'INVALID_REQUEST'].includes(error.code)) {
            throw error;
          }
        }

        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        console.log(`Request failed (attempt ${attempt + 1}/${config.maxRetries + 1}): ${lastError.message}`);

        // Calculate delay with exponential backoff
        const actualDelay = Math.min(delay, config.maxDelay);
        console.log(`Retrying in ${actualDelay}ms...`);

        await this.delay(actualDelay);
        delay *= config.backoffMultiplier;
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }
}

// Factory function to create API client
export function createQuickBooksApiClient(organizationId: string, sandbox = false): QuickBooksApiClient {
  return new QuickBooksApiClient(organizationId, sandbox);
}