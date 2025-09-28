import { NextRequest, NextResponse } from 'next/server';
import { createQuickBooksOAuthService } from '@/lib/integrations/quickbooks/oauth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('QuickBooks OAuth error:', error, errorDescription);

      // Redirect to frontend with error
      const redirectUrl = new URL('/integrations/quickbooks', request.nextUrl.origin);
      redirectUrl.searchParams.set('error', error);
      redirectUrl.searchParams.set('error_description', errorDescription || 'Unknown error');

      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state || !realmId) {
      console.error('Missing required OAuth parameters:', { code: !!code, state: !!state, realmId: !!realmId });

      const redirectUrl = new URL('/integrations/quickbooks', request.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'invalid_request');
      redirectUrl.searchParams.set('error_description', 'Missing required parameters');

      return NextResponse.redirect(redirectUrl);
    }

    // Create OAuth service
    const oauthService = createQuickBooksOAuthService();

    // Exchange authorization code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(code, state, realmId);

    console.log('QuickBooks OAuth successful for realm:', realmId);

    // Redirect to success page
    const redirectUrl = new URL('/integrations/quickbooks', request.nextUrl.origin);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('realmId', realmId);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('QuickBooks OAuth callback error:', error);

    // Redirect to frontend with error
    const redirectUrl = new URL('/integrations/quickbooks', request.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'server_error');
    redirectUrl.searchParams.set('error_description', 'Failed to process OAuth callback');

    return NextResponse.redirect(redirectUrl);
  }
}

// Handle POST requests for manual callback processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state, realmId } = body;

    if (!code || !state || !realmId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create OAuth service
    const oauthService = createQuickBooksOAuthService();

    // Exchange authorization code for tokens
    const tokens = await oauthService.exchangeCodeForTokens(code, state, realmId);

    return NextResponse.json({
      success: true,
      realmId,
      expiresAt: tokens.expiresAt.toISOString(),
      message: 'QuickBooks connection established successfully'
    });

  } catch (error) {
    console.error('QuickBooks OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process OAuth callback' },
      { status: 500 }
    );
  }
}