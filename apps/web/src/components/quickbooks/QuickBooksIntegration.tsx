'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Settings, Activity, Clock, BarChart3, AlertCircle } from 'lucide-react';

import { SyncStatus } from './SyncStatus';
import { SyncHistory } from './SyncHistory';
import { SyncSettings } from './SyncSettings';
import { DataFreshness } from './DataFreshness';

interface ConnectionStatus {
  connected: boolean;
  realmId?: string;
  expiresAt?: string;
  lastSyncAt?: string;
  needsRefresh?: boolean;
  error?: string;
}

export function QuickBooksIntegration() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/quickbooks/auth/connect');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error('Failed to check connection status:', error);
      setConnectionStatus({ connected: false, error: 'Failed to check connection status' });
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    try {
      const response = await fetch('/api/quickbooks/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to QuickBooks authorization
        window.location.href = data.authUrl;
      } else {
        alert('Failed to generate authorization URL');
      }
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      alert('Failed to connect to QuickBooks');
    }
  };

  const disconnectQuickBooks = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks? This will stop all synchronization.')) {
      return;
    }

    try {
      const response = await fetch('/api/quickbooks/auth/disconnect', {
        method: 'POST'
      });

      if (response.ok) {
        setConnectionStatus({ connected: false });
        alert('QuickBooks disconnected successfully');
      } else {
        const error = await response.json();
        alert(`Failed to disconnect: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to disconnect QuickBooks:', error);
      alert('Failed to disconnect QuickBooks');
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading QuickBooks Integration...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Not connected state
  if (!connectionStatus?.connected) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              QuickBooks Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStatus?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectionStatus.error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect to QuickBooks Online</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Seamlessly sync your QuickBooks data with your CPA platform. Access customers,
                  invoices, financial reports, and more in real-time.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8 text-sm">
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-1">Real-time Sync</h4>
                  <p className="text-muted-foreground">Automatic synchronization with webhook support</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-1">Financial Reports</h4>
                  <p className="text-muted-foreground">P&L, Balance Sheet, and Cash Flow reports</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Settings className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-1">Configurable</h4>
                  <p className="text-muted-foreground">Choose what data to sync and when</p>
                </div>
              </div>

              <Button
                onClick={initiateConnection}
                size="lg"
                className="px-8"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to QuickBooks
              </Button>

              <div className="mt-6 text-xs text-muted-foreground">
                <p>
                  By connecting, you authorize this application to access your QuickBooks data.
                  <br />
                  You can disconnect at any time from the settings page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected state - show full dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              QuickBooks Integration
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectQuickBooks}
            >
              Disconnect
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Realm ID:</span>
              <p className="text-muted-foreground">{connectionStatus.realmId}</p>
            </div>
            <div>
              <span className="font-medium">Token Expires:</span>
              <p className="text-muted-foreground">
                {connectionStatus.expiresAt
                  ? new Date(connectionStatus.expiresAt).toLocaleDateString()
                  : 'Unknown'
                }
                {connectionStatus.needsRefresh && (
                  <Badge variant="outline" className="ml-2 text-amber-600">
                    Needs Refresh
                  </Badge>
                )}
              </p>
            </div>
            <div>
              <span className="font-medium">Last Sync:</span>
              <p className="text-muted-foreground">
                {connectionStatus.lastSyncAt
                  ? new Date(connectionStatus.lastSyncAt).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="status" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">
            <Activity className="h-4 w-4 mr-2" />
            Sync Status
          </TabsTrigger>
          <TabsTrigger value="freshness">
            <Clock className="h-4 w-4 mr-2" />
            Data Freshness
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <SyncStatus />
        </TabsContent>

        <TabsContent value="freshness" className="space-y-4">
          <DataFreshness />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <SyncHistory />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SyncSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}