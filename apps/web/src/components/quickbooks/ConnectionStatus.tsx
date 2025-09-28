'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConnectionInfo {
  connected: boolean;
  token?: {
    lastSyncAt: string | null;
    expiresAt: string;
    realmId: string;
  };
}

export function ConnectionStatus() {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quickbooks/auth/connect', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
      toast.error('Failed to check QuickBooks connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await fetch('/api/quickbooks/auth/connect');

      if (response.ok) {
        const data = await response.json();
        // Redirect to QuickBooks OAuth
        window.location.href = data.authUrl;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to initiate QuickBooks connection');
      }
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error);
      toast.error('Failed to connect to QuickBooks');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks? This will stop all synchronization.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await fetch('/api/quickbooks/auth/disconnect', {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('QuickBooks disconnected successfully');
        await fetchConnectionStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to disconnect QuickBooks');
      }
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
      toast.error('Failed to disconnect QuickBooks');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshTokens = async () => {
    try {
      const response = await fetch('/api/quickbooks/auth/refresh', {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Tokens refreshed successfully');
        await fetchConnectionStatus();
      } else {
        const error = await response.json();
        if (error.code === 'REFRESH_TOKEN_EXPIRED') {
          toast.error('Refresh token expired. Please reconnect QuickBooks.');
        } else {
          toast.error(error.error || 'Failed to refresh tokens');
        }
      }
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      toast.error('Failed to refresh tokens');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            QuickBooks Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectionInfo?.connected;
  const token = connectionInfo?.token;
  const expiresAt = token ? new Date(token.expiresAt) : null;
  const expiresInHours = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)) : 0;
  const isExpiringSoon = expiresInHours < 24;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          QuickBooks Connection
        </CardTitle>
        <CardDescription>
          {isConnected
            ? 'Your QuickBooks account is connected and syncing data'
            : 'Connect your QuickBooks Online account to sync financial data'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {isConnected && token && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Company ID</span>
              <span className="text-sm text-gray-600">{token.realmId}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-gray-600">
                {token.lastSyncAt
                  ? new Date(token.lastSyncAt).toLocaleString()
                  : 'Never'
                }
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Expires</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {expiresAt?.toLocaleDateString()}
                </span>
                {isExpiringSoon && (
                  <Badge variant="outline" className="text-yellow-600">
                    Expires in {expiresInHours}h
                  </Badge>
                )}
              </div>
            </div>

            {isExpiringSoon && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Your QuickBooks tokens will expire soon. Refresh them to maintain connectivity.
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2 pt-2">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                onClick={handleRefreshTokens}
                size="sm"
              >
                Refresh Tokens
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnecting}
                size="sm"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? 'Connecting...' : 'Connect QuickBooks'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}