import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma as db } from "@/server/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const realmId = searchParams.get('realmId');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('QuickBooks OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=oauth_error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state || !realmId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=missing_parameters`
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/signin?error=unauthorized`
      );
    }

    // Verify state parameter
    if (state !== session.user.organizationId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=invalid_state`
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(code, realmId);
    if (!tokenResponse) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=token_exchange_failed`
      );
    }

    // Store tokens in database
    await db.quickBooksToken.upsert({
      where: { organizationId: session.user.organizationId },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        realmId,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        isActive: true,
        updatedAt: new Date(),
        updatedBy: session.user.id
      },
      create: {
        organizationId: session.user.organizationId,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        realmId,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        isActive: true,
        createdBy: session.user.id,
        updatedBy: session.user.id
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        entityType: 'quickbooks_token',
        entityId: realmId,
        newValues: { realmId, isActive: true },
        organizationId: session.user.organizationId,
        userId: session.user.id,
        metadata: { source: 'oauth_callback' }
      }
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?success=quickbooks_connected`
    );

  } catch (error) {
    console.error('QuickBooks OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=callback_error`
    );
  }
}

async function exchangeCodeForTokens(code: string, realmId: string) {
  try {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/quickbooks/auth/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks credentials not configured');
    }

    const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
}
