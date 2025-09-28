# CPA Platform Integrations Setup Guide

This guide covers the setup and configuration of QuickBooks Online and Stripe integrations for the CPA platform.

## Overview

The platform now includes comprehensive integrations for:
- **QuickBooks Online**: OAuth 2.0 authentication, data synchronization, webhook processing
- **Stripe**: Subscription billing, payment processing, customer portal access

## QuickBooks Integration

### 1. QuickBooks App Setup

1. Create a QuickBooks developer account at https://developer.intuit.com
2. Create a new app and obtain your credentials:
   - Client ID
   - Client Secret
   - Webhook Verification Token

### 2. Environment Variables

```bash
QUICKBOOKS_CLIENT_ID="your-quickbooks-client-id"
QUICKBOOKS_CLIENT_SECRET="your-quickbooks-client-secret"
QUICKBOOKS_WEBHOOK_SECRET="your-quickbooks-webhook-secret"
QUICKBOOKS_SANDBOX="true"  # Set to false for production
```

### 3. Webhook Configuration

Configure your QuickBooks app webhooks to point to:
```
https://your-domain.com/api/quickbooks/webhooks
```

### 4. OAuth Redirect URI

Set the redirect URI in your QuickBooks app to:
```
https://your-domain.com/api/quickbooks/auth/callback
```

### 5. API Endpoints

#### Authentication
- `GET /api/quickbooks/auth/connect` - Initiate OAuth flow
- `GET /api/quickbooks/auth/callback` - Handle OAuth callback
- `POST /api/quickbooks/auth/refresh` - Refresh access tokens
- `POST /api/quickbooks/auth/disconnect` - Revoke access

#### Data Synchronization
- `POST /api/quickbooks/sync` - Manual sync trigger
- `GET /api/quickbooks/sync` - Get sync history

#### Webhooks
- `POST /api/quickbooks/webhooks` - Process webhook events

### 6. React Components

Available components:
- `ConnectionStatus` - Shows QB connection status
- `SyncStatus` - Displays sync progress and history
- `SyncButton` - Manual sync trigger with options

Usage example:
```tsx
import { ConnectionStatus } from '@/components/quickbooks/ConnectionStatus';
import { SyncStatus } from '@/components/quickbooks/SyncStatus';
import { SyncButton } from '@/components/quickbooks/SyncButton';

function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <ConnectionStatus />
      <SyncStatus />
      <SyncButton
        onSyncStart={() => console.log('Sync started')}
        onSyncComplete={() => console.log('Sync completed')}
      />
    </div>
  );
}
```

## Stripe Integration

### 1. Stripe Account Setup

1. Create a Stripe account at https://stripe.com
2. Obtain your API keys from the dashboard
3. Create webhook endpoint for event processing

### 2. Environment Variables

```bash
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# Product/Price IDs (create these in Stripe Dashboard)
STRIPE_STARTER_PRICE_ID="price_starter_plan_id"
STRIPE_PROFESSIONAL_PRICE_ID="price_professional_plan_id"
STRIPE_ENTERPRISE_PRICE_ID="price_enterprise_plan_id"
STRIPE_ADDITIONAL_USER_PRICE_ID="price_additional_user_id"
STRIPE_ADDITIONAL_STORAGE_PRICE_ID="price_additional_storage_id"
```

### 3. Stripe Products Setup

Create the following products in your Stripe dashboard:

#### Subscription Plans
1. **Starter Plan** - $99/month
   - 10 clients, 3 users, 1GB storage
2. **Professional Plan** - $299/month
   - 50 clients, 10 users, 10GB storage
3. **Enterprise Plan** - $599/month
   - Unlimited clients/users, 100GB storage

#### Add-ons
1. **Additional User** - $29/month per user
2. **Additional Storage** - $10/month per 10GB

### 4. Webhook Configuration

Configure Stripe webhooks to point to:
```
https://your-domain.com/api/stripe/webhooks
```

Select these events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

### 5. API Endpoints

#### Subscriptions
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `POST /api/stripe/create-subscription` - Create subscription
- `PUT /api/stripe/create-subscription` - Update subscription
- `DELETE /api/stripe/create-subscription` - Cancel subscription
- `GET /api/stripe/create-subscription` - Get current subscription

#### Billing Portal
- `POST /api/stripe/create-portal-session` - Create portal session

#### Webhooks
- `POST /api/stripe/webhooks` - Process webhook events

### 6. React Components

Available components:
- `PricingCard` - Individual pricing tier display
- `SubscriptionStatus` - Current subscription and usage info

Usage example:
```tsx
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus';

function BillingPage() {
  return (
    <div className="space-y-6">
      <SubscriptionStatus />
    </div>
  );
}
```

## Azure Key Vault Integration

For production deployments, secrets should be stored in Azure Key Vault:

```bash
AZURE_KEY_VAULT_URL="https://your-keyvault.vault.azure.net/"
AZURE_CLIENT_ID="your-azure-client-id"
AZURE_CLIENT_SECRET="your-azure-client-secret"
AZURE_TENANT_ID="your-azure-tenant-id"
```

## Database Schema

The integrations use the following database models:

### QuickBooks
- `QuickBooksToken` - OAuth tokens and connection info
- `QuickBooksSync` - Sync operation history
- `QuickBooksWebhookEvent` - Webhook event processing

### Stripe
- `Subscription` - Subscription details and status
- `Organization.stripeCustomerId` - Link to Stripe customer

## Testing

### QuickBooks Testing
1. Use Intuit's sandbox environment
2. Test OAuth flow: connect → callback → refresh → disconnect
3. Test data sync for each entity type
4. Test webhook processing with sample events

### Stripe Testing
1. Use Stripe test mode
2. Test subscription creation with test cards
3. Test webhook events with Stripe CLI
4. Test billing portal access

### Test Cards
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Require 3DS: `4000002500003155`

## Monitoring and Logging

All integration activities are logged in the `AuditLog` table with:
- Action type (connect, sync, payment, etc.)
- Entity details
- Success/failure status
- Error messages
- User context

## Rate Limiting

### QuickBooks
- 500 requests per minute per app
- Implemented with 120ms delays between requests

### Stripe
- No specific limits for most operations
- Webhook retries with exponential backoff

## Error Handling

Both integrations include comprehensive error handling:
- Network timeouts and retries
- Invalid credentials detection
- Rate limit handling
- Webhook signature verification
- Database transaction safety

## Security Considerations

1. **Secrets Management**: Use Azure Key Vault in production
2. **Webhook Verification**: Always verify signatures
3. **Token Encryption**: Store sensitive tokens encrypted
4. **HTTPS**: All webhook endpoints must use HTTPS
5. **Input Validation**: Validate all API inputs
6. **Access Control**: Verify user permissions for all operations

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] QuickBooks app configured with correct URLs
- [ ] Stripe products and prices created
- [ ] Webhook endpoints registered
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Error notification system setup

## Support and Troubleshooting

Common issues and solutions:

1. **OAuth Failures**: Check redirect URIs and state parameters
2. **Webhook Failures**: Verify endpoint URLs and signatures
3. **Sync Errors**: Check API rate limits and token expiration
4. **Payment Failures**: Verify Stripe webhook configuration

For additional support, check the audit logs and error messages in the database.