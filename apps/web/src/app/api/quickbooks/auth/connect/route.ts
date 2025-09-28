import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { db } from "../../../../../server/db";

const QUICKBOOKS_SCOPE = 'com.intuit.quickbooks.accounting';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || session.user.organizationId;

    // Verify state parameter matches organization
    if (state !== session.user.organizationId) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // Check if already connected
    const existingToken = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId }
    });

    if (existingToken && existingToken.isActive) {
      return NextResponse.json({
        error: 'QuickBooks already connected',
        redirectTo: '/dashboard/integrations'
      }, { status: 400 });
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/quickbooks/auth/callback`;

    if (!clientId) {
      return NextResponse.json({ error: 'QuickBooks configuration missing' }, { status: 500 });
    }

    // Build OAuth URL
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('scope', QUICKBOOKS_SCOPE);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    });

  } catch (error) {
    console.error('QuickBooks OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks connection' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This endpoint can be used to check connection status
    const token = await db.quickBooksToken.findUnique({
      where: { organizationId: session.user.organizationId },
      select: {
        id: true,
        isActive: true,
        lastSyncAt: true,
        expiresAt: true,
        realmId: true
      }
    });

    return NextResponse.json({
      connected: !!token?.isActive,
      token: token ? {
        lastSyncAt: token.lastSyncAt,
        expiresAt: token.expiresAt,
        realmId: token.realmId
      } : null
    });

  } catch (error) {
    console.error('QuickBooks connection status error:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}
