import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncManager } from '@/lib/integrations/quickbooks/sync-manager';

export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      enabledEntities,
      syncInterval,
      maxRetries,
      retryDelay,
      fullSyncFrequency,
      maxRecordsPerSync,
      enableWebhooks
    } = body;

    // Validate configuration
    const errors = [];

    if (enabledEntities && !Array.isArray(enabledEntities)) {
      errors.push('enabledEntities must be an array');
    }

    if (syncInterval && (typeof syncInterval !== 'number' || syncInterval < 1 || syncInterval > 168)) {
      errors.push('syncInterval must be between 1 and 168 hours');
    }

    if (maxRetries && (typeof maxRetries !== 'number' || maxRetries < 0 || maxRetries > 10)) {
      errors.push('maxRetries must be between 0 and 10');
    }

    if (retryDelay && (typeof retryDelay !== 'number' || retryDelay < 1 || retryDelay > 1440)) {
      errors.push('retryDelay must be between 1 and 1440 minutes');
    }

    if (fullSyncFrequency && (typeof fullSyncFrequency !== 'number' || fullSyncFrequency < 1 || fullSyncFrequency > 365)) {
      errors.push('fullSyncFrequency must be between 1 and 365 days');
    }

    if (maxRecordsPerSync && (typeof maxRecordsPerSync !== 'number' || maxRecordsPerSync < 100 || maxRecordsPerSync > 10000)) {
      errors.push('maxRecordsPerSync must be between 100 and 10000');
    }

    if (enableWebhooks && typeof enableWebhooks !== 'boolean') {
      errors.push('enableWebhooks must be a boolean');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Update sync configuration
    await syncManager.updateSyncConfiguration(organizationId, {
      ...(enabledEntities && { enabledEntities }),
      ...(syncInterval && { syncInterval }),
      ...(maxRetries && { maxRetries }),
      ...(retryDelay && { retryDelay }),
      ...(fullSyncFrequency && { fullSyncFrequency }),
      ...(maxRecordsPerSync && { maxRecordsPerSync }),
      ...(enableWebhooks !== undefined && { enableWebhooks })
    });

    return NextResponse.json({
      success: true,
      message: 'Sync configuration updated successfully'
    });

  } catch (error) {
    console.error('Sync configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to update sync configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return available configuration options and current settings
    const availableEntities = [
      { id: 'company', name: 'Company Information', description: 'Basic company details and settings' },
      { id: 'accounts', name: 'Chart of Accounts', description: 'All accounts and their balances' },
      { id: 'customers', name: 'Customers', description: 'Customer contact information and details' },
      { id: 'invoices', name: 'Invoices', description: 'Invoice data and payment status' },
      { id: 'reports', name: 'Financial Reports', description: 'P&L, Balance Sheet, Cash Flow reports' },
      { id: 'transactions', name: 'Transactions', description: 'Purchases, journal entries, and other transactions' }
    ];

    const defaultConfiguration = {
      enabledEntities: ['company', 'accounts', 'customers', 'invoices', 'reports', 'transactions'],
      syncInterval: 4, // hours
      maxRetries: 3,
      retryDelay: 15, // minutes
      fullSyncFrequency: 7, // days
      maxRecordsPerSync: 1000,
      enableWebhooks: true
    };

    return NextResponse.json({
      availableEntities,
      defaultConfiguration,
      limits: {
        syncInterval: { min: 1, max: 168, unit: 'hours' },
        maxRetries: { min: 0, max: 10 },
        retryDelay: { min: 1, max: 1440, unit: 'minutes' },
        fullSyncFrequency: { min: 1, max: 365, unit: 'days' },
        maxRecordsPerSync: { min: 100, max: 10000 }
      }
    });

  } catch (error) {
    console.error('Get sync configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync configuration' },
      { status: 500 }
    );
  }
}