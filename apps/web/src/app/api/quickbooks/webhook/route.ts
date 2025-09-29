import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/server/db';
import { QuickBooksWebhookProcessor } from '@/lib/integrations/quickbooks/webhook-processor';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('intuit-signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const webhookPayload = JSON.parse(body);

    if (!webhookPayload.eventNotifications) {
      console.error('Invalid webhook payload format');
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Process each event notification
    const processor = new QuickBooksWebhookProcessor();
    const results = [];

    for (const eventNotification of webhookPayload.eventNotifications) {
      try {
        const result = await processor.processEventNotification(eventNotification);
        results.push(result);
      } catch (error) {
        console.error('Error processing event notification:', error);
        results.push({
          realmId: eventNotification.realmId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Return success response (QuickBooks expects 200 status)
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify QuickBooks webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    console.error('No signature provided');
    return false;
  }

  const webhookToken = process.env.QUICKBOOKS_WEBHOOK_TOKEN;
  if (!webhookToken) {
    console.error('QUICKBOOKS_WEBHOOK_TOKEN environment variable not set');
    return false;
  }

  try {
    // QuickBooks uses HMAC-SHA256 with base64 encoding
    const expectedSignature = createHmac('sha256', webhookToken)
      .update(payload)
      .digest('base64');

    // Compare signatures securely
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Handle GET requests for webhook verification (if needed)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Return the challenge for webhook verification
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  return NextResponse.json({
    message: 'QuickBooks webhook endpoint',
    status: 'active'
  });
}