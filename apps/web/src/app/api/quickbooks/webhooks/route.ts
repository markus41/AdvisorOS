import { NextRequest, NextResponse } from 'next/server';
import { db } from '@cpa-platform/database';
import crypto from 'crypto';

// Webhook verification signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.QUICKBOOKS_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('QuickBooks webhook secret not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('intuit-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const payload = await request.text();
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = JSON.parse(payload);

    // Process each event in the webhook payload
    for (const event of webhookData.eventNotifications || []) {
      await processWebhookEvent(event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('QuickBooks webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(event: any) {
  try {
    const realmId = event.realmId;
    const eventTime = new Date(event.eventTime);

    // Find the organization associated with this realmId
    const token = await db.quickBooksToken.findFirst({
      where: { realmId, isActive: true }
    });

    if (!token) {
      console.warn(`No active token found for realmId: ${realmId}`);
      return;
    }

    // Process each data change in the event
    for (const dataChange of event.dataChangeEvent?.entities || []) {
      const webhookEventData = {
        organizationId: token.organizationId,
        eventId: `${event.realmId}-${dataChange.name}-${dataChange.id}-${eventTime.getTime()}`,
        eventType: dataChange.operation, // CREATE, UPDATE, DELETE, VOID
        entityName: dataChange.name, // Customer, Invoice, Item, etc.
        entityId: dataChange.id,
        realmId,
        eventTime,
        status: 'pending',
        payload: event,
        retryCount: 0,
        maxRetries: 3
      };

      // Store webhook event in database
      await db.quickBooksWebhookEvent.upsert({
        where: { eventId: webhookEventData.eventId },
        update: {
          status: 'pending',
          retryCount: 0,
          updatedAt: new Date()
        },
        create: webhookEventData
      });

      // Process the event immediately
      await processEntityChange(webhookEventData);
    }

  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
}

async function processEntityChange(webhookEvent: any) {
  try {
    const { organizationId, entityName, entityId, eventType, realmId } = webhookEvent;

    // Get QuickBooks tokens for API calls
    const token = await db.quickBooksToken.findFirst({
      where: { organizationId, isActive: true }
    });

    if (!token) {
      throw new Error('No valid QuickBooks token found');
    }

    // Process different entity types
    switch (entityName.toLowerCase()) {
      case 'customer':
        await processCustomerChange(organizationId, entityId, eventType, token);
        break;
      case 'invoice':
        await processInvoiceChange(organizationId, entityId, eventType, token);
        break;
      case 'item':
        await processItemChange(organizationId, entityId, eventType, token);
        break;
      case 'account':
        await processAccountChange(organizationId, entityId, eventType, token);
        break;
      case 'bill':
        await processBillChange(organizationId, entityId, eventType, token);
        break;
      case 'payment':
        await processPaymentChange(organizationId, entityId, eventType, token);
        break;
      default:
        console.log(`Unhandled entity type: ${entityName}`);
    }

    // Mark webhook event as processed
    await db.quickBooksWebhookEvent.update({
      where: { eventId: webhookEvent.eventId },
      data: {
        status: 'processed',
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error(`Error processing ${webhookEvent.entityName} change:`, error);

    // Update webhook event with error and retry logic
    const updatedRetryCount = webhookEvent.retryCount + 1;
    const shouldRetry = updatedRetryCount < webhookEvent.maxRetries;

    await db.quickBooksWebhookEvent.update({
      where: { eventId: webhookEvent.eventId },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: updatedRetryCount,
        nextRetryAt: shouldRetry ? new Date(Date.now() + Math.pow(2, updatedRetryCount) * 60000) : null, // Exponential backoff
        updatedAt: new Date()
      }
    });

    if (!shouldRetry) {
      console.error(`Max retries exceeded for webhook event: ${webhookEvent.eventId}`);
    }
  }
}

async function processCustomerChange(organizationId: string, entityId: string, eventType: string, token: any) {
  if (eventType === 'DELETE') {
    // Remove QuickBooks ID from client
    await db.client.updateMany({
      where: { organizationId, quickbooksId: entityId },
      data: { quickbooksId: null }
    });
    return;
  }

  // Fetch updated customer data from QuickBooks
  const baseUrl = process.env.QUICKBOOKS_SANDBOX === 'true'
    ? 'https://sandbox-quickbooks.api.intuit.com'
    : 'https://quickbooks.api.intuit.com';

  const response = await fetch(`${baseUrl}/v3/company/${token.realmId}/customer/${entityId}`, {
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch customer data: ${response.statusText}`);
  }

  const customerData = await response.json();
  const customer = customerData.QueryResponse?.Customer?.[0];

  if (!customer) {
    console.warn(`Customer ${entityId} not found in QuickBooks response`);
    return;
  }

  // Update or create client record
  const existingClient = await db.client.findFirst({
    where: { organizationId, quickbooksId: entityId }
  });

  const clientData = {
    businessName: customer.Name || '',
    primaryContactEmail: customer.PrimaryEmailAddr?.Address || '',
    primaryContactName: customer.FullyQualifiedName || customer.Name || '',
    primaryContactPhone: customer.PrimaryPhone?.FreeFormNumber || null,
    businessAddress: customer.BillAddr ?
      `${customer.BillAddr.Line1 || ''} ${customer.BillAddr.City || ''} ${customer.BillAddr.CountrySubDivisionCode || ''} ${customer.BillAddr.PostalCode || ''}`.trim() : null,
    quickbooksId: entityId,
    updatedAt: new Date()
  };

  if (existingClient) {
    await db.client.update({
      where: { id: existingClient.id },
      data: clientData
    });
  } else {
    await db.client.create({
      data: {
        ...clientData,
        organizationId,
        status: 'active'
      }
    });
  }
}

async function processInvoiceChange(organizationId: string, entityId: string, eventType: string, token: any) {
  // Similar pattern for invoices - fetch from QB and update local records
  console.log(`Processing invoice change: ${entityId}, type: ${eventType}`);
  // Implementation would fetch invoice data and update local invoice records
}

async function processItemChange(organizationId: string, entityId: string, eventType: string, token: any) {
  console.log(`Processing item change: ${entityId}, type: ${eventType}`);
  // Implementation would handle item/service changes
}

async function processAccountChange(organizationId: string, entityId: string, eventType: string, token: any) {
  console.log(`Processing account change: ${entityId}, type: ${eventType}`);
  // Implementation would handle chart of accounts changes
}

async function processBillChange(organizationId: string, entityId: string, eventType: string, token: any) {
  console.log(`Processing bill change: ${entityId}, type: ${eventType}`);
  // Implementation would handle bill/expense changes
}

async function processPaymentChange(organizationId: string, entityId: string, eventType: string, token: any) {
  console.log(`Processing payment change: ${entityId}, type: ${eventType}`);
  // Implementation would handle payment changes
}

// GET endpoint for webhook verification during setup
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // QuickBooks webhook verification challenge
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    message: 'QuickBooks webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}