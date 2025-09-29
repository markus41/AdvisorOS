---
layout: default
title: Integration Guides
nav_order: 50
---

# AdvisorOS Integration Guides

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [QuickBooks Online Integration](#quickbooks-online-integration)
3. [Stripe Payment Integration](#stripe-payment-integration)
4. [Azure Services Integration](#azure-services-integration)
5. [OpenAI Integration](#openai-integration)
6. [Email Service Integration](#email-service-integration)
7. [Custom API Integrations](#custom-api-integrations)
8. [Webhook Configuration](#webhook-configuration)
9. [Integration Testing](#integration-testing)
10. [Troubleshooting Integrations](#troubleshooting-integrations)
11. [Security Best Practices](#security-best-practices)
12. [Rate Limiting and Monitoring](#rate-limiting-and-monitoring)

---

## Integration Overview

AdvisorOS integrates with multiple third-party services to provide comprehensive functionality for CPA firms. This guide covers setup, configuration, and troubleshooting for all major integrations.

### Supported Integrations

| Service | Purpose | Required Plan | Setup Complexity |
|---------|---------|---------------|------------------|
| QuickBooks Online | Financial data sync | Professional+ | Medium |
| Stripe | Payment processing | All plans | Easy |
| Azure Storage | Document storage | All plans | Medium |
| OpenAI | AI document analysis | Professional+ | Easy |
| SendGrid | Email delivery | All plans | Easy |
| Azure AD | Single Sign-On | Enterprise | Complex |
| Zapier | Workflow automation | Professional+ | Easy |

### Integration Architecture

```mermaid
graph TB
    A[AdvisorOS Platform] --> B[QuickBooks Online]
    A --> C[Stripe]
    A --> D[Azure Storage]
    A --> E[OpenAI]
    A --> F[SendGrid]
    A --> G[Azure AD]
    A --> H[Zapier]

    B --> I[Financial Data Sync]
    C --> J[Payment Processing]
    D --> K[Document Storage]
    E --> L[AI Analysis]
    F --> M[Email Notifications]
    G --> N[User Authentication]
    H --> O[External Automations]
```

---

## QuickBooks Online Integration

### Prerequisites

#### QuickBooks Requirements
- QuickBooks Online subscription (any plan)
- Company Administrator access
- Active internet connection
- Modern browser (Chrome, Firefox, Safari, Edge)

#### AdvisorOS Requirements
- Professional or Enterprise subscription
- Organization Administrator role
- Configured client records

### Setting Up QuickBooks Integration

#### 1. Register QuickBooks App (Development)
```bash
# Create QuickBooks Developer Account
1. Visit https://developer.intuit.com
2. Sign up for developer account
3. Create new app in dashboard
4. Select "QuickBooks Online and Payments"
5. Note Client ID and Client Secret
```

#### 2. Configure OAuth Settings
```javascript
// QuickBooks OAuth Configuration
const qbConfig = {
  clientId: process.env.QUICKBOOKS_CLIENT_ID,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
  environment: process.env.QUICKBOOKS_ENVIRONMENT, // 'sandbox' or 'production'
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/quickbooks/callback`,
  scope: [
    'com.intuit.quickbooks.accounting'
  ],
  discoveryDocument: 'https://appcenter.intuit.com/connect/oauth2'
};
```

#### 3. Environment Variables
```bash
# .env.local (Development)
QUICKBOOKS_CLIENT_ID="your_sandbox_client_id"
QUICKBOOKS_CLIENT_SECRET="your_sandbox_client_secret"
QUICKBOOKS_ENVIRONMENT="sandbox"
QUICKBOOKS_BASE_URL="https://sandbox-quickbooks.api.intuit.com"

# .env.production (Production)
QUICKBOOKS_CLIENT_ID="your_production_client_id"
QUICKBOOKS_CLIENT_SECRET="your_production_client_secret"
QUICKBOOKS_ENVIRONMENT="production"
QUICKBOOKS_BASE_URL="https://quickbooks.api.intuit.com"
```

#### 4. OAuth Flow Implementation
```typescript
// pages/api/auth/quickbooks/connect.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
  authUrl.searchParams.set('client_id', process.env.QUICKBOOKS_CLIENT_ID!);
  authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting');
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/quickbooks/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('state', session.user.organizationId);

  res.redirect(authUrl.toString());
}

// pages/api/auth/quickbooks/callback.ts
export default async function callback(req: NextApiRequest, res: NextApiResponse) {
  const { code, realmId, state } = req.query;

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/quickbooks/callback`
      })
    });

    const tokens = await tokenResponse.json();

    // Store tokens in database
    await prisma.quickBooksToken.upsert({
      where: { organizationId: state as string },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId: realmId as string,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope
      },
      create: {
        organizationId: state as string,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId: realmId as string,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope
      }
    });

    res.redirect('/settings/integrations?quickbooks=connected');
  } catch (error) {
    console.error('QuickBooks OAuth error:', error);
    res.redirect('/settings/integrations?quickbooks=error');
  }
}
```

### Data Synchronization

#### 1. Sync Service Implementation
```typescript
// services/quickbooksSync.ts
export class QuickBooksSync {
  private client: QuickBooksAPI;

  constructor(private organizationId: string) {
    this.client = new QuickBooksAPI(organizationId);
  }

  async fullSync(): Promise<SyncResult> {
    const syncId = generateSyncId();

    try {
      await this.updateSyncStatus(syncId, 'in_progress');

      const results = await Promise.allSettled([
        this.syncCompanyInfo(),
        this.syncChartOfAccounts(),
        this.syncCustomers(),
        this.syncVendors(),
        this.syncItems(),
        this.syncTransactions()
      ]);

      const summary = this.calculateSyncSummary(results);
      await this.updateSyncStatus(syncId, 'completed', summary);

      return { syncId, status: 'completed', summary };
    } catch (error) {
      await this.updateSyncStatus(syncId, 'failed', { error: error.message });
      throw error;
    }
  }

  async syncCompanyInfo(): Promise<void> {
    const companyInfo = await this.client.getCompanyInfo();

    await prisma.quickBooksCompany.upsert({
      where: { organizationId: this.organizationId },
      update: {
        companyName: companyInfo.Name,
        legalName: companyInfo.LegalName,
        email: companyInfo.Email,
        phone: companyInfo.PrimaryPhone?.FreeFormNumber,
        address: this.formatAddress(companyInfo.CompanyAddr),
        fiscalYearStart: companyInfo.FiscalYearStartMonth,
        taxForm: companyInfo.TaxForm,
        lastSyncAt: new Date()
      },
      create: {
        organizationId: this.organizationId,
        quickbooksId: companyInfo.Id,
        companyName: companyInfo.Name,
        // ... other fields
      }
    });
  }

  async syncChartOfAccounts(): Promise<void> {
    const accounts = await this.client.getAccounts();

    for (const account of accounts) {
      await prisma.quickBooksAccount.upsert({
        where: {
          organizationId_quickbooksId: {
            organizationId: this.organizationId,
            quickbooksId: account.Id
          }
        },
        update: {
          name: account.Name,
          accountType: account.AccountType,
          accountSubType: account.AccountSubType,
          classification: account.Classification,
          currentBalance: parseFloat(account.CurrentBalance || '0'),
          active: account.Active,
          lastSyncAt: new Date()
        },
        create: {
          organizationId: this.organizationId,
          quickbooksId: account.Id,
          name: account.Name,
          // ... other fields
        }
      });
    }
  }

  async syncCustomers(): Promise<void> {
    const customers = await this.client.getCustomers();

    for (const customer of customers) {
      // Try to match with existing client
      const existingClient = await prisma.client.findFirst({
        where: {
          organizationId: this.organizationId,
          OR: [
            { quickbooksId: customer.Id },
            { businessName: customer.Name },
            { primaryContactEmail: customer.PrimaryEmailAddr?.Address }
          ]
        }
      });

      if (existingClient) {
        // Update existing client with QuickBooks data
        await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            quickbooksId: customer.Id,
            businessName: customer.Name,
            primaryContactEmail: customer.PrimaryEmailAddr?.Address,
            primaryContactPhone: customer.PrimaryPhone?.FreeFormNumber,
            businessAddress: this.formatAddress(customer.BillAddr),
            lastSyncAt: new Date()
          }
        });
      } else {
        // Create new client
        await prisma.client.create({
          data: {
            organizationId: this.organizationId,
            quickbooksId: customer.Id,
            businessName: customer.Name,
            primaryContactEmail: customer.PrimaryEmailAddr?.Address || '',
            primaryContactName: customer.Name,
            status: 'active',
            source: 'quickbooks'
          }
        });
      }
    }
  }
}
```

#### 2. Incremental Sync
```typescript
// Incremental sync for better performance
export async function incrementalSync(organizationId: string, lastSyncTime: Date): Promise<SyncResult> {
  const client = new QuickBooksAPI(organizationId);

  const changedData = await client.getChangedData(lastSyncTime);

  const updates = {
    customers: changedData.customers.length,
    vendors: changedData.vendors.length,
    transactions: changedData.transactions.length,
    accounts: changedData.accounts.length
  };

  // Process each entity type
  await Promise.all([
    processChangedCustomers(changedData.customers, organizationId),
    processChangedVendors(changedData.vendors, organizationId),
    processChangedTransactions(changedData.transactions, organizationId),
    processChangedAccounts(changedData.accounts, organizationId)
  ]);

  return {
    type: 'incremental',
    updates,
    completedAt: new Date()
  };
}
```

#### 3. Real-time Webhooks
```typescript
// pages/api/webhooks/quickbooks.ts
import { verifyWebhookSignature } from '@/lib/quickbooks/webhooks';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const signature = req.headers['intuit-signature'] as string;
  const payload = JSON.stringify(req.body);

  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { eventNotifications } = req.body;

  for (const notification of eventNotifications) {
    const { realmId, dataChangeEvent } = notification;

    // Find organization by realm ID
    const qbToken = await prisma.quickBooksToken.findFirst({
      where: { realmId },
      include: { organization: true }
    });

    if (!qbToken) {
      console.warn(`No organization found for realm ID: ${realmId}`);
      continue;
    }

    // Process each entity change
    for (const entity of dataChangeEvent.entities) {
      await processEntityChange(qbToken.organizationId, entity);
    }
  }

  res.status(200).json({ success: true });
}

async function processEntityChange(organizationId: string, entity: any) {
  const { name, id, operation } = entity;

  switch (name.toLowerCase()) {
    case 'customer':
      if (operation === 'Create' || operation === 'Update') {
        await syncSingleCustomer(organizationId, id);
      } else if (operation === 'Delete') {
        await handleCustomerDeletion(organizationId, id);
      }
      break;

    case 'invoice':
      await syncSingleInvoice(organizationId, id);
      break;

    // Handle other entity types...
  }
}
```

### Error Handling and Recovery

#### 1. Token Refresh
```typescript
// lib/quickbooks/auth.ts
export class QuickBooksAuth {
  static async refreshToken(organizationId: string): Promise<string> {
    const qbToken = await prisma.quickBooksToken.findUnique({
      where: { organizationId }
    });

    if (!qbToken || !qbToken.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: qbToken.refreshToken
        })
      });

      const tokens = await response.json();

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${tokens.error_description}`);
      }

      // Update stored tokens
      await prisma.quickBooksToken.update({
        where: { organizationId },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || qbToken.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
        }
      });

      return tokens.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
}
```

#### 2. Sync Error Recovery
```typescript
// Handle sync errors gracefully
export class SyncErrorHandler {
  static async handleSyncError(error: any, context: SyncContext): Promise<void> {
    const errorLog = {
      organizationId: context.organizationId,
      syncId: context.syncId,
      entityType: context.entityType,
      entityId: context.entityId,
      errorType: this.classifyError(error),
      errorMessage: error.message,
      stackTrace: error.stack,
      retryCount: context.retryCount || 0,
      createdAt: new Date()
    };

    await prisma.syncError.create({ data: errorLog });

    // Determine if error is retryable
    if (this.isRetryableError(error) && context.retryCount < 3) {
      const delay = Math.pow(2, context.retryCount) * 1000; // Exponential backoff
      setTimeout(() => {
        this.retrySyncOperation(context);
      }, delay);
    } else {
      // Mark as failed and notify administrators
      await this.notifyAdministrators(errorLog);
    }
  }

  static classifyError(error: any): string {
    if (error.status === 401) return 'AUTHENTICATION_ERROR';
    if (error.status === 403) return 'AUTHORIZATION_ERROR';
    if (error.status === 429) return 'RATE_LIMIT_ERROR';
    if (error.status >= 500) return 'SERVER_ERROR';
    if (error.code === 'ECONNRESET') return 'NETWORK_ERROR';
    return 'UNKNOWN_ERROR';
  }

  static isRetryableError(error: any): boolean {
    const retryableErrors = ['RATE_LIMIT_ERROR', 'NETWORK_ERROR', 'SERVER_ERROR'];
    return retryableErrors.includes(this.classifyError(error));
  }
}
```

---

## Stripe Payment Integration

### Prerequisites

#### Stripe Requirements
- Stripe account (live or test mode)
- API keys (publishable and secret)
- Webhook endpoint capability
- SSL certificate for production

### Setting Up Stripe Integration

#### 1. Environment Configuration
```bash
# .env.local (Development)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_ENVIRONMENT="test"

# .env.production (Production)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_ENVIRONMENT="live"
```

#### 2. Stripe Client Configuration
```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Client-side configuration
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
```

#### 3. Payment Method Setup
```typescript
// components/billing/PaymentMethodForm.tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PaymentMethodForm({ onSuccess }: { onSuccess: (paymentMethod: any) => void }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm onSuccess={onSuccess} />
    </Elements>
  );
}

function PaymentForm({ onSuccess }: { onSuccess: (paymentMethod: any) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const card = elements.getElement(CardElement);
    if (!card) return;

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: {
          name: 'Customer Name',
          email: 'customer@example.com'
        }
      });

      if (error) {
        console.error('Payment method creation failed:', error);
      } else {
        onSuccess(paymentMethod);
      }
    } catch (error) {
      console.error('Stripe error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Save Payment Method'}
      </button>
    </form>
  );
}
```

### Subscription Management

#### 1. Creating Subscriptions
```typescript
// pages/api/billing/subscriptions.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { priceId, paymentMethodId } = req.body;

    // Get or create Stripe customer
    let customer = await getStripeCustomer(session.user.organizationId);
    if (!customer) {
      customer = await createStripeCustomer(session.user.organizationId);
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in database
    await prisma.subscription.create({
      data: {
        organizationId: session.user.organizationId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: subscription.status,
        planName: getPlanName(priceId),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      }
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

async function getStripeCustomer(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId }
  });

  if (subscription?.stripeCustomerId) {
    return await stripe.customers.retrieve(subscription.stripeCustomerId);
  }

  return null;
}

async function createStripeCustomer(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  return await stripe.customers.create({
    name: organization?.name,
    metadata: {
      organizationId
    }
  });
}
```

#### 2. Handling Plan Changes
```typescript
// pages/api/billing/change-plan.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { newPriceId } = req.body;
    const session = await getServerSession(req, res, authOptions);

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice',
    });

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planName: getPlanName(newPriceId),
        status: updatedSubscription.status,
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Plan change error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
}
```

### Webhook Handling

#### 1. Webhook Endpoint
```typescript
// pages/api/webhooks/stripe.ts
import { buffer } from 'micro';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).end();
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'active' }
    });

    // Create invoice record
    await prisma.invoice.create({
      data: {
        organizationId: subscription.organizationId,
        stripeInvoiceId: invoice.id,
        amount: invoice.total,
        currency: invoice.currency,
        status: 'paid',
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
        dueDate: new Date(invoice.due_date! * 1000),
      }
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string }
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'past_due' }
    });

    // Notify administrators
    await sendPaymentFailedNotification(subscription.organizationId, invoice);
  }
}
```

#### 2. Customer Portal Integration
```typescript
// pages/api/billing/portal.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
}
```

---

## Azure Services Integration

### Azure Storage Configuration

#### 1. Storage Account Setup
```bash
# Azure CLI commands
az storage account create \
  --name advisorosstorage \
  --resource-group advisoros-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Create container for documents
az storage container create \
  --name documents \
  --account-name advisorosstorage \
  --public-access off
```

#### 2. Environment Configuration
```bash
# Azure Storage connection string
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=advisoros;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER="documents"
```

#### 3. Storage Service Implementation
```typescript
// lib/azure/storage.ts
import { BlobServiceClient } from '@azure/storage-blob';

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    this.containerName = process.env.AZURE_STORAGE_CONTAINER!;
  }

  async uploadDocument(
    organizationId: string,
    clientId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const blobName = this.generateBlobName(organizationId, clientId, fileName);
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
      metadata: {
        organizationId,
        clientId,
        uploadedAt: new Date().toISOString(),
      }
    });

    return blockBlobClient.url;
  }

  async downloadDocument(blobUrl: string): Promise<Buffer> {
    const blobName = this.extractBlobNameFromUrl(blobUrl);
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download();
    return Buffer.from(await this.streamToBuffer(downloadResponse.readableStreamBody!));
  }

  async deleteDocument(blobUrl: string): Promise<void> {
    const blobName = this.extractBlobNameFromUrl(blobUrl);
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.deleteBlob(blobName);
  }

  async generateSasUrl(blobUrl: string, expiresInMinutes: number = 60): Promise<string> {
    const blobName = this.extractBlobNameFromUrl(blobUrl);
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const sasToken = generateBlobSASQueryParameters({
      containerName: this.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    }, this.blobServiceClient.credential as StorageSharedKeyCredential);

    return `${blockBlobClient.url}?${sasToken}`;
  }

  private generateBlobName(organizationId: string, clientId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${organizationId}/${clientId}/${timestamp}_${sanitizedFileName}`;
  }

  private extractBlobNameFromUrl(blobUrl: string): string {
    const url = new URL(blobUrl);
    return url.pathname.substring(url.pathname.indexOf('/', 1) + 1);
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', chunk => chunks.push(chunk));
      readableStream.on('end', () => resolve(Buffer.concat(chunks)));
      readableStream.on('error', reject);
    });
  }
}
```

### Azure AD Integration (SSO)

#### 1. App Registration Setup
```javascript
// Azure AD configuration
const azureADConfig = {
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/azure-ad`,
};
```

#### 2. NextAuth Provider Configuration
```typescript
// lib/auth.ts
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'azure-ad') {
        // Check if user exists or create new user
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        if (!existingUser) {
          // Create new user with default organization
          const organization = await findOrCreateOrganization(profile?.tenant_id);

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              organizationId: organization.id,
              role: 'staff', // Default role
              isActive: true,
            }
          });
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'azure-ad') {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
  },
};
```

---

## OpenAI Integration

### Configuration and Setup

#### 1. Environment Variables
```bash
OPENAI_API_KEY="sk-..."
OPENAI_ORGANIZATION_ID="org-..."  # Optional
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_MAX_TOKENS=4000
```

#### 2. OpenAI Service Implementation
```typescript
// lib/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  organization: process.env.OPENAI_ORGANIZATION_ID,
});

export class DocumentAnalysisService {
  async analyzeDocument(documentText: string, documentType: string): Promise<DocumentAnalysis> {
    const prompt = this.buildAnalysisPrompt(documentText, documentType);

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a CPA assistant that analyzes financial documents and extracts key information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content!);

      return {
        documentType: result.documentType,
        confidence: result.confidence,
        extractedData: result.extractedData,
        summary: result.summary,
        recommendations: result.recommendations || [],
        analysisDate: new Date(),
      };
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      throw new Error('Failed to analyze document');
    }
  }

  private buildAnalysisPrompt(documentText: string, documentType: string): string {
    const prompts = {
      tax_return: `
        Analyze this tax return document and extract key information. Return a JSON object with:
        {
          "documentType": "Form 1040/1120/etc",
          "confidence": 0.95,
          "extractedData": {
            "taxpayerName": "string",
            "taxYear": "number",
            "filingStatus": "string",
            "totalIncome": "number",
            "totalTax": "number",
            "refund": "number"
          },
          "summary": "Brief summary of the tax return",
          "recommendations": ["array of recommendations"]
        }
      `,
      financial_statement: `
        Analyze this financial statement and extract key metrics. Return a JSON object with:
        {
          "documentType": "Balance Sheet/Income Statement/Cash Flow",
          "confidence": 0.95,
          "extractedData": {
            "period": "string",
            "totalAssets": "number",
            "totalLiabilities": "number",
            "equity": "number",
            "revenue": "number",
            "netIncome": "number"
          },
          "summary": "Brief financial analysis",
          "recommendations": ["array of financial recommendations"]
        }
      `,
      receipt: `
        Analyze this receipt and extract transaction details. Return a JSON object with:
        {
          "documentType": "Receipt",
          "confidence": 0.95,
          "extractedData": {
            "vendor": "string",
            "date": "YYYY-MM-DD",
            "amount": "number",
            "taxAmount": "number",
            "category": "string",
            "paymentMethod": "string"
          },
          "summary": "Transaction summary",
          "recommendations": ["array of expense categorization suggestions"]
        }
      `
    };

    const promptTemplate = prompts[documentType as keyof typeof prompts] || prompts.receipt;

    return `${promptTemplate}\n\nDocument text:\n${documentText}`;
  }

  async generateInsights(clientData: ClientFinancialData): Promise<ClientInsights> {
    const prompt = `
      Analyze the following client financial data and provide insights:

      Client: ${clientData.clientName}
      Industry: ${clientData.industry}
      Annual Revenue: $${clientData.annualRevenue}

      Financial Metrics:
      - Current Ratio: ${clientData.currentRatio}
      - Debt-to-Equity: ${clientData.debtToEquity}
      - Profit Margin: ${clientData.profitMargin}%
      - Revenue Growth: ${clientData.revenueGrowth}%

      Provide a JSON response with:
      {
        "overallHealth": "Excellent/Good/Fair/Poor",
        "keyStrengths": ["array of strengths"],
        "areasOfConcern": ["array of concerns"],
        "recommendations": ["array of actionable recommendations"],
        "benchmarkComparison": "How client compares to industry benchmarks",
        "riskAssessment": "Low/Medium/High risk level with explanation"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a senior CPA providing financial analysis and advisory services.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content!);
  }
}
```

#### 3. Usage in API Routes
```typescript
// pages/api/ai/analyze-document.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { documentId, analysisType } = req.body;

    // Get document from database
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId: session.user.organizationId
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get OCR text or extract from document
    const documentText = document.ocrText || await extractTextFromDocument(document.fileUrl);

    // Analyze with OpenAI
    const analysisService = new DocumentAnalysisService();
    const analysis = await analysisService.analyzeDocument(documentText, analysisType);

    // Store analysis results
    await prisma.documentAnalysis.create({
      data: {
        documentId,
        organizationId: session.user.organizationId,
        analysisType,
        confidence: analysis.confidence,
        extractedData: analysis.extractedData,
        summary: analysis.summary,
        recommendations: analysis.recommendations,
      }
    });

    res.status(200).json({ success: true, analysis });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}
```

### Rate Limiting and Cost Management

#### 1. Usage Tracking
```typescript
// lib/openai/usage.ts
export class OpenAIUsageTracker {
  static async trackUsage(
    organizationId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    cost: number
  ): Promise<void> {
    await prisma.aiUsage.create({
      data: {
        organizationId,
        provider: 'openai',
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: cost,
        createdAt: new Date()
      }
    });
  }

  static async getMonthlyUsage(organizationId: string): Promise<AIUsageSummary> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await prisma.aiUsage.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth }
      },
      _sum: {
        totalTokens: true,
        estimatedCost: true
      },
      _count: {
        id: true
      }
    });

    return {
      totalRequests: usage._count.id || 0,
      totalTokens: usage._sum.totalTokens || 0,
      totalCost: usage._sum.estimatedCost || 0,
      period: 'monthly'
    };
  }

  static async checkUsageLimits(organizationId: string): Promise<boolean> {
    const monthlyUsage = await this.getMonthlyUsage(organizationId);
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId }
    });

    const limits = this.getUsageLimits(subscription?.planName || 'starter');

    return monthlyUsage.totalTokens < limits.monthlyTokens;
  }

  private static getUsageLimits(planName: string) {
    const limits = {
      starter: { monthlyTokens: 100000, monthlyCost: 50 },
      professional: { monthlyTokens: 500000, monthlyCost: 200 },
      enterprise: { monthlyTokens: 2000000, monthlyCost: 800 }
    };

    return limits[planName as keyof typeof limits] || limits.starter;
  }
}
```

---

## Email Service Integration

### SendGrid Configuration

#### 1. Environment Setup
```bash
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@advisoros.com"
SENDGRID_FROM_NAME="AdvisorOS"
```

#### 2. Email Service Implementation
```typescript
// lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailService {
  static async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    organizationName: string,
    inviteLink: string
  ): Promise<void> {
    const msg = {
      to: userEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!
      },
      templateId: 'welcome-template-id',
      dynamicTemplateData: {
        userName,
        organizationName,
        inviteLink,
        loginUrl: process.env.NEXTAUTH_URL
      }
    };

    try {
      await sgMail.send(msg);
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Welcome email failed:', error);
      throw error;
    }
  }

  static async sendDocumentProcessedNotification(
    userEmail: string,
    documentName: string,
    clientName: string,
    processingResult: 'success' | 'failed'
  ): Promise<void> {
    const templateId = processingResult === 'success'
      ? 'document-processed-success'
      : 'document-processed-failed';

    const msg = {
      to: userEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!
      },
      templateId,
      dynamicTemplateData: {
        documentName,
        clientName,
        dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`
      }
    };

    await sgMail.send(msg);
  }

  static async sendBulkNotification(
    recipients: string[],
    subject: string,
    content: string,
    templateId?: string
  ): Promise<void> {
    const msg = {
      to: recipients,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!
      },
      subject,
      html: content,
      ...(templateId && { templateId })
    };

    try {
      await sgMail.sendMultiple(msg);
      console.log(`Bulk email sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error('Bulk email failed:', error);
      throw error;
    }
  }
}
```

#### 3. Email Templates
```html
<!-- SendGrid Dynamic Template Example -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to AdvisorOS</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1>Welcome to {{organizationName}}</h1>

        <p>Hi {{userName}},</p>

        <p>You've been invited to join {{organizationName}} on AdvisorOS. Click the button below to get started:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{inviteLink}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Accept Invitation
            </a>
        </div>

        <p>If you have any questions, feel free to reach out to our support team.</p>

        <p>Best regards,<br>The AdvisorOS Team</p>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">

        <p style="font-size: 12px; color: #666;">
            If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
            {{inviteLink}}
        </p>
    </div>
</body>
</html>
```

### Email Event Handling

#### 1. Webhook Configuration
```typescript
// pages/api/webhooks/sendgrid.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const events = req.body;

  for (const event of events) {
    await processEmailEvent(event);
  }

  res.status(200).json({ success: true });
}

async function processEmailEvent(event: any) {
  const { event: eventType, email, timestamp, reason } = event;

  // Store email event in database
  await prisma.emailEvent.create({
    data: {
      eventType,
      email,
      timestamp: new Date(timestamp * 1000),
      reason,
      metadata: event
    }
  });

  // Handle specific events
  switch (eventType) {
    case 'bounce':
      await handleEmailBounce(email, reason);
      break;
    case 'dropped':
      await handleEmailDropped(email, reason);
      break;
    case 'unsubscribe':
      await handleUnsubscribe(email);
      break;
  }
}

async function handleEmailBounce(email: string, reason: string) {
  // Update user email status
  await prisma.user.updateMany({
    where: { email },
    data: { emailStatus: 'bounced' }
  });

  // Log for admin review
  console.warn(`Email bounced for ${email}: ${reason}`);
}
```

---

## Custom API Integrations

### Building Custom Integrations

#### 1. Integration Framework
```typescript
// lib/integrations/base.ts
export abstract class BaseIntegration {
  protected apiKey: string;
  protected baseUrl: string;
  protected organizationId: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.organizationId = config.organizationId;
  }

  abstract authenticate(): Promise<boolean>;
  abstract sync(): Promise<SyncResult>;
  abstract disconnect(): Promise<void>;

  protected async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AdvisorOS/1.0'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${url}:`, error);
      throw error;
    }
  }

  protected async handleRateLimit(retryAfter: number): Promise<void> {
    const delay = Math.min(retryAfter * 1000, 30000); // Max 30 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

#### 2. Example Custom Integration
```typescript
// lib/integrations/customAccounting.ts
export class CustomAccountingIntegration extends BaseIntegration {
  async authenticate(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/verify');
      return response.status === 'authenticated';
    } catch (error) {
      return false;
    }
  }

  async sync(): Promise<SyncResult> {
    const syncResult: SyncResult = {
      startTime: new Date(),
      endTime: null,
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsCreated: 0,
      errors: []
    };

    try {
      // Sync accounts
      const accounts = await this.makeRequest('/accounts');
      await this.syncAccounts(accounts);
      syncResult.recordsProcessed += accounts.length;

      // Sync transactions
      const transactions = await this.makeRequest('/transactions');
      await this.syncTransactions(transactions);
      syncResult.recordsProcessed += transactions.length;

      syncResult.endTime = new Date();
      return syncResult;
    } catch (error) {
      syncResult.errors.push(error.message);
      throw error;
    }
  }

  private async syncAccounts(accounts: any[]): Promise<void> {
    for (const account of accounts) {
      await prisma.customAccount.upsert({
        where: {
          organizationId_externalId: {
            organizationId: this.organizationId,
            externalId: account.id
          }
        },
        update: {
          name: account.name,
          type: account.type,
          balance: account.balance,
          lastSyncAt: new Date()
        },
        create: {
          organizationId: this.organizationId,
          externalId: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance
        }
      });
    }
  }

  async disconnect(): Promise<void> {
    await this.makeRequest('/auth/revoke', 'POST');

    // Clean up stored data
    await prisma.customIntegration.delete({
      where: { organizationId: this.organizationId }
    });
  }
}
```

#### 3. Integration Registry
```typescript
// lib/integrations/registry.ts
export class IntegrationRegistry {
  private static integrations = new Map<string, typeof BaseIntegration>();

  static register(name: string, integrationClass: typeof BaseIntegration): void {
    this.integrations.set(name, integrationClass);
  }

  static getIntegration(name: string, config: IntegrationConfig): BaseIntegration | null {
    const IntegrationClass = this.integrations.get(name);
    return IntegrationClass ? new IntegrationClass(config) : null;
  }

  static getAvailableIntegrations(): string[] {
    return Array.from(this.integrations.keys());
  }
}

// Register integrations
IntegrationRegistry.register('quickbooks', QuickBooksIntegration);
IntegrationRegistry.register('custom-accounting', CustomAccountingIntegration);
IntegrationRegistry.register('bank-api', BankAPIIntegration);
```

---

## Webhook Configuration

### Setting Up Webhooks

#### 1. Webhook Verification
```typescript
// lib/webhooks/verification.ts
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export function verifyStripeSignature(
  payload: Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const elements = signature.split(',');
    const signatureHash = elements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!signatureHash) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHash, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}
```

#### 2. Webhook Router
```typescript
// lib/webhooks/router.ts
export class WebhookRouter {
  private handlers = new Map<string, WebhookHandler>();

  register(source: string, handler: WebhookHandler): void {
    this.handlers.set(source, handler);
  }

  async handle(source: string, payload: any, headers: Record<string, string>): Promise<void> {
    const handler = this.handlers.get(source);

    if (!handler) {
      throw new Error(`No handler registered for webhook source: ${source}`);
    }

    await handler.process(payload, headers);
  }
}

export interface WebhookHandler {
  process(payload: any, headers: Record<string, string>): Promise<void>;
}

// Example handler
export class QuickBooksWebhookHandler implements WebhookHandler {
  async process(payload: any, headers: Record<string, string>): Promise<void> {
    const signature = headers['intuit-signature'];

    if (!verifyWebhookSignature(JSON.stringify(payload), signature, process.env.QB_WEBHOOK_SECRET!)) {
      throw new Error('Invalid webhook signature');
    }

    for (const notification of payload.eventNotifications) {
      await this.processNotification(notification);
    }
  }

  private async processNotification(notification: any): Promise<void> {
    const { realmId, dataChangeEvent } = notification;

    // Find organization
    const qbToken = await prisma.quickBooksToken.findFirst({
      where: { realmId }
    });

    if (!qbToken) return;

    // Process each entity change
    for (const entity of dataChangeEvent.entities) {
      await this.processEntityChange(qbToken.organizationId, entity);
    }
  }

  private async processEntityChange(organizationId: string, entity: any): Promise<void> {
    // Implementation for processing entity changes
    console.log(`Processing ${entity.name} change for organization ${organizationId}`);
  }
}
```

#### 3. Webhook Management API
```typescript
// pages/api/webhooks/manage.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'owner') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return getWebhooks(req, res, session.user.organizationId);
    case 'POST':
      return createWebhook(req, res, session.user.organizationId);
    case 'DELETE':
      return deleteWebhook(req, res, session.user.organizationId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function createWebhook(req: NextApiRequest, res: NextApiResponse, organizationId: string) {
  const { url, events, secret } = req.body;

  // Validate webhook URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid webhook URL' });
  }

  // Test webhook endpoint
  const testResult = await testWebhookEndpoint(url, secret);
  if (!testResult.success) {
    return res.status(400).json({ error: 'Webhook endpoint test failed' });
  }

  const webhook = await prisma.webhook.create({
    data: {
      organizationId,
      url,
      events,
      secret,
      active: true
    }
  });

  res.status(201).json(webhook);
}

async function testWebhookEndpoint(url: string, secret: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testPayload = { test: true, timestamp: Date.now() };
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      body: JSON.stringify(testPayload)
    });

    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Integration Testing

### Testing Strategy

#### 1. Integration Test Framework
```typescript
// tests/integrations/quickbooks.test.ts
import { QuickBooksIntegration } from '@/lib/integrations/quickbooks';

describe('QuickBooks Integration', () => {
  let integration: QuickBooksIntegration;
  let mockOrganizationId: string;

  beforeAll(async () => {
    // Setup test organization
    mockOrganizationId = 'test-org-id';
    integration = new QuickBooksIntegration({
      organizationId: mockOrganizationId,
      apiKey: process.env.TEST_QB_ACCESS_TOKEN!,
      environment: 'sandbox'
    });
  });

  describe('Authentication', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const isAuthenticated = await integration.authenticate();
      expect(isAuthenticated).toBe(true);
    });

    it('should fail authentication with invalid credentials', async () => {
      const invalidIntegration = new QuickBooksIntegration({
        organizationId: mockOrganizationId,
        apiKey: 'invalid-token',
        environment: 'sandbox'
      });

      const isAuthenticated = await invalidIntegration.authenticate();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Data Synchronization', () => {
    it('should sync company information', async () => {
      const result = await integration.syncCompanyInfo();

      expect(result).toBeDefined();
      expect(result.companyName).toBeTruthy();
    });

    it('should sync chart of accounts', async () => {
      const accounts = await integration.syncChartOfAccounts();

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);
    });

    it('should handle sync errors gracefully', async () => {
      // Mock API error
      jest.spyOn(integration, 'makeRequest').mockRejectedValueOnce(new Error('API Error'));

      await expect(integration.syncCustomers()).rejects.toThrow('API Error');
    });
  });

  describe('Error Handling', () => {
    it('should retry on rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      jest.spyOn(integration, 'makeRequest')
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce([]);

      const result = await integration.syncCustomers();
      expect(result).toBeDefined();
    });
  });
});
```

#### 2. Mock API Responses
```typescript
// tests/mocks/quickbooks.ts
export const mockQuickBooksResponses = {
  companyInfo: {
    QueryResponse: {
      CompanyInfo: [{
        Id: "1",
        Name: "Test Company",
        LegalName: "Test Company LLC",
        Email: { Address: "test@company.com" },
        PrimaryPhone: { FreeFormNumber: "555-0123" }
      }]
    }
  },

  customers: {
    QueryResponse: {
      Customer: [
        {
          Id: "1",
          Name: "Customer 1",
          Active: true,
          PrimaryEmailAddr: { Address: "customer1@test.com" },
          BillAddr: {
            Line1: "123 Main St",
            City: "Anytown",
            CountrySubDivisionCode: "CA",
            PostalCode: "12345"
          }
        }
      ]
    }
  },

  accounts: {
    QueryResponse: {
      Account: [
        {
          Id: "1",
          Name: "Checking",
          AccountType: "Bank",
          AccountSubType: "Checking",
          CurrentBalance: 5000.00,
          Active: true
        }
      ]
    }
  }
};

export function mockQuickBooksAPI() {
  jest.mock('@/lib/integrations/quickbooks', () => ({
    QuickBooksAPI: jest.fn().mockImplementation(() => ({
      getCompanyInfo: jest.fn().mockResolvedValue(mockQuickBooksResponses.companyInfo.QueryResponse.CompanyInfo[0]),
      getCustomers: jest.fn().mockResolvedValue(mockQuickBooksResponses.customers.QueryResponse.Customer),
      getAccounts: jest.fn().mockResolvedValue(mockQuickBooksResponses.accounts.QueryResponse.Account)
    }))
  }));
}
```

#### 3. End-to-End Integration Tests
```typescript
// tests/e2e/integration-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Integration Flows', () => {
  test('complete QuickBooks integration flow', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Navigate to integrations
    await page.goto('/settings/integrations');

    // Start QuickBooks connection
    await page.click('text=Connect QuickBooks');

    // Should redirect to QuickBooks OAuth
    await expect(page).toHaveURL(/.*appcenter\.intuit\.com.*/);

    // Mock QuickBooks OAuth (in test environment)
    await page.goto('/api/auth/quickbooks/callback?code=test-code&realmId=test-realm&state=test-org-id');

    // Should redirect back to integrations page
    await expect(page).toHaveURL(/.*\/settings\/integrations.*/);

    // Verify connection status
    await expect(page.locator('text=Connected')).toBeVisible();

    // Trigger sync
    await page.click('text=Sync Now');
    await expect(page.locator('text=Sync in progress')).toBeVisible();

    // Wait for sync completion
    await page.waitForSelector('text=Sync completed', { timeout: 30000 });
  });

  test('Stripe subscription flow', async ({ page }) => {
    await page.goto('/settings/billing');

    // Click upgrade plan
    await page.click('text=Upgrade to Professional');

    // Fill payment form
    await page.frameLocator('iframe[name*="stripe"]').locator('[placeholder="Card number"]').fill('4242424242424242');
    await page.frameLocator('iframe[name*="stripe"]').locator('[placeholder="MM / YY"]').fill('12/25');
    await page.frameLocator('iframe[name*="stripe"]').locator('[placeholder="CVC"]').fill('123');

    // Submit payment
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Subscription activated')).toBeVisible();
  });
});
```

---

## Troubleshooting Integrations

### Common Issues and Solutions

#### 1. QuickBooks Integration Issues

**Issue: "Connection failed" error**
```typescript
// Diagnostic function
export async function diagnoseQuickBooksConnection(organizationId: string): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    status: 'unknown',
    checks: [],
    recommendations: []
  };

  try {
    // Check if tokens exist
    const qbToken = await prisma.quickBooksToken.findUnique({
      where: { organizationId }
    });

    if (!qbToken) {
      result.checks.push({ name: 'Token Existence', status: 'failed', message: 'No QuickBooks token found' });
      result.recommendations.push('Reconnect to QuickBooks');
      return result;
    }

    result.checks.push({ name: 'Token Existence', status: 'passed' });

    // Check token expiry
    const isExpired = new Date() > qbToken.expiresAt;
    result.checks.push({
      name: 'Token Validity',
      status: isExpired ? 'failed' : 'passed',
      message: isExpired ? 'Token has expired' : undefined
    });

    if (isExpired) {
      result.recommendations.push('Refresh access token');
    }

    // Test API connectivity
    try {
      const qbApi = new QuickBooksAPI(organizationId);
      await qbApi.getCompanyInfo();
      result.checks.push({ name: 'API Connectivity', status: 'passed' });
    } catch (error) {
      result.checks.push({
        name: 'API Connectivity',
        status: 'failed',
        message: error.message
      });
      result.recommendations.push('Check network connectivity and API status');
    }

    result.status = result.checks.every(check => check.status === 'passed') ? 'healthy' : 'issues';
    return result;
  } catch (error) {
    result.status = 'error';
    result.checks.push({
      name: 'Diagnostic Error',
      status: 'failed',
      message: error.message
    });
    return result;
  }
}
```

**Issue: "Rate limit exceeded" errors**
```typescript
// Rate limit handler with exponential backoff
export class RateLimitHandler {
  private static retryQueue = new Map<string, number>();

  static async handleRateLimit(organizationId: string, operation: () => Promise<any>): Promise<any> {
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (error.status === 429 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }
}
```

#### 2. Stripe Integration Issues

**Issue: "Payment failed" errors**
```typescript
// Payment error handler
export function handleStripeError(error: any): { userMessage: string; action: string } {
  switch (error.code) {
    case 'card_declined':
      return {
        userMessage: 'Your card was declined. Please try a different payment method.',
        action: 'retry_with_different_card'
      };

    case 'insufficient_funds':
      return {
        userMessage: 'Your card has insufficient funds. Please use a different card.',
        action: 'retry_with_different_card'
      };

    case 'expired_card':
      return {
        userMessage: 'Your card has expired. Please update your payment information.',
        action: 'update_payment_method'
      };

    case 'processing_error':
      return {
        userMessage: 'A processing error occurred. Please try again.',
        action: 'retry'
      };

    default:
      return {
        userMessage: 'An unexpected error occurred. Please contact support.',
        action: 'contact_support'
      };
  }
}
```

#### 3. Azure Storage Issues

**Issue: "Blob not found" errors**
```typescript
// Storage diagnostic and recovery
export class StorageDiagnostic {
  static async diagnoseStorageIssues(blobUrl: string): Promise<StorageDiagnosticResult> {
    try {
      const blobName = this.extractBlobNameFromUrl(blobUrl);
      const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER!);
      const blobClient = containerClient.getBlobClient(blobName);

      // Check if blob exists
      const exists = await blobClient.exists();
      if (!exists) {
        return {
          status: 'not_found',
          issue: 'Blob does not exist',
          recommendations: [
            'Check if the file was deleted',
            'Verify the blob URL is correct',
            'Check if the file was moved to a different container'
          ]
        };
      }

      // Check blob properties
      const properties = await blobClient.getProperties();

      return {
        status: 'healthy',
        properties: {
          contentLength: properties.contentLength,
          contentType: properties.contentType,
          lastModified: properties.lastModified,
          etag: properties.etag
        }
      };
    } catch (error) {
      return {
        status: 'error',
        issue: error.message,
        recommendations: [
          'Check Azure Storage connection string',
          'Verify container exists and has proper permissions',
          'Check network connectivity to Azure'
        ]
      };
    }
  }

  static async repairBrokenBlobReferences(organizationId: string): Promise<RepairResult> {
    const documents = await prisma.document.findMany({
      where: { organizationId }
    });

    const results = {
      checked: 0,
      repaired: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const document of documents) {
      results.checked++;

      try {
        const diagnostic = await this.diagnoseStorageIssues(document.fileUrl);

        if (diagnostic.status === 'not_found') {
          // Try to find the file in backup locations
          const recoveredUrl = await this.attemptFileRecovery(document);

          if (recoveredUrl) {
            await prisma.document.update({
              where: { id: document.id },
              data: { fileUrl: recoveredUrl }
            });
            results.repaired++;
          } else {
            results.failed++;
            results.errors.push(`Could not recover file for document ${document.id}`);
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error checking document ${document.id}: ${error.message}`);
      }
    }

    return results;
  }
}
```

### Integration Health Monitoring

#### 1. Health Check Dashboard
```typescript
// lib/monitoring/integrationHealth.ts
export class IntegrationHealthMonitor {
  static async getHealthStatus(organizationId: string): Promise<IntegrationHealthStatus> {
    const status: IntegrationHealthStatus = {
      overall: 'healthy',
      integrations: {}
    };

    // Check QuickBooks health
    status.integrations.quickbooks = await this.checkQuickBooksHealth(organizationId);

    // Check Stripe health
    status.integrations.stripe = await this.checkStripeHealth(organizationId);

    // Check Azure Storage health
    status.integrations.azureStorage = await this.checkStorageHealth(organizationId);

    // Determine overall status
    const integrationStatuses = Object.values(status.integrations);
    if (integrationStatuses.some(s => s.status === 'error')) {
      status.overall = 'error';
    } else if (integrationStatuses.some(s => s.status === 'warning')) {
      status.overall = 'warning';
    }

    return status;
  }

  private static async checkQuickBooksHealth(organizationId: string): Promise<IntegrationStatus> {
    try {
      const qbToken = await prisma.quickBooksToken.findUnique({
        where: { organizationId }
      });

      if (!qbToken) {
        return { status: 'disconnected', message: 'Not connected' };
      }

      if (new Date() > qbToken.expiresAt) {
        return { status: 'warning', message: 'Token expired, needs refresh' };
      }

      // Test API call
      const qbApi = new QuickBooksAPI(organizationId);
      await qbApi.getCompanyInfo();

      return { status: 'healthy', message: 'Connected and working' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
```

#### 2. Automated Health Alerts
```typescript
// lib/monitoring/alerts.ts
export class IntegrationAlerts {
  static async checkAndSendAlerts(): Promise<void> {
    const organizations = await prisma.organization.findMany({
      include: { users: { where: { role: { in: ['owner', 'admin'] } } } }
    });

    for (const org of organizations) {
      const health = await IntegrationHealthMonitor.getHealthStatus(org.id);

      if (health.overall === 'error') {
        await this.sendCriticalAlert(org, health);
      } else if (health.overall === 'warning') {
        await this.sendWarningAlert(org, health);
      }
    }
  }

  private static async sendCriticalAlert(
    organization: any,
    health: IntegrationHealthStatus
  ): Promise<void> {
    const failedIntegrations = Object.entries(health.integrations)
      .filter(([_, status]) => status.status === 'error')
      .map(([name, status]) => `${name}: ${status.message}`)
      .join('\n');

    const adminEmails = organization.users.map((user: any) => user.email);

    await EmailService.sendBulkNotification(
      adminEmails,
      `[CRITICAL] Integration Failures - ${organization.name}`,
      `
        Critical integration failures detected:

        ${failedIntegrations}

        Please review and fix these issues immediately.

        Dashboard: ${process.env.NEXTAUTH_URL}/settings/integrations
      `
    );
  }
}
```

---

This comprehensive integration guide covers all major third-party services used by AdvisorOS and provides detailed implementation examples, troubleshooting steps, and best practices. Each integration includes complete setup instructions, error handling, and monitoring capabilities to ensure reliable operation in production environments.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Develop integration guides for QuickBooks, Stripe, and other third-party services", "activeForm": "Developing integration guides for QuickBooks, Stripe, and other third-party services", "status": "completed"}]
