'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Pause, Play, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SyncProgress {
  organizationId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  currentEntity?: string;
  totalEntities: number;
  completedEntities: number;
  startedAt?: string;
  estimatedCompletion?: string;
  lastError?: string;
}

interface ConnectionInfo {
  realmId: string;
  expiresAt: string;
  lastSyncAt?: string;
  needsRefresh: boolean;
}

interface SyncStatusData {
  connected: boolean;
  connection?: ConnectionInfo;
  currentSync?: SyncProgress;
  error?: string;
}

export function SyncStatus() {
  const [syncData, setSyncData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/quickbooks/sync/status');
      const data = await response.json();
      setSyncData(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
      setSyncData({ connected: false, error: 'Failed to fetch sync status' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerSync = async (syncType: 'full' | 'incremental' = 'incremental') => {
    try {
      const response = await fetch('/api/quickbooks/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType })
      });

      if (response.ok) {
        // Refresh status after triggering sync
        setTimeout(fetchSyncStatus, 1000);
      } else {
        const error = await response.json();
        alert(`Failed to trigger sync: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      alert('Failed to trigger sync');
    }
  };

  const controlSync = async (action: 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch('/api/quickbooks/sync/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchSyncStatus();
      } else {
        const error = await response.json();
        alert(`Failed to ${action} sync: ${error.error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} sync:`, error);
      alert(`Failed to ${action} sync`);
    }
  };

  const refreshStatus = () => {
    setRefreshing(true);
    fetchSyncStatus();
  };

  useEffect(() => {
    fetchSyncStatus();

    // Auto-refresh every 30 seconds if sync is running
    const interval = setInterval(() => {
      if (syncData?.currentSync?.status === 'running') {
        fetchSyncStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [syncData?.currentSync?.status]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Sync Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!syncData?.connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            QuickBooks Not Connected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {syncData?.error || 'Please connect your QuickBooks account to enable synchronization.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { connection, currentSync } = syncData;
  const hasActiveSync = currentSync && ['running', 'paused'].includes(currentSync.status);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">Idle</Badge>;
    }
  };

  const getProgressPercentage = () => {
    if (!currentSync || currentSync.totalEntities === 0) return 0;
    return Math.round((currentSync.completedEntities / currentSync.totalEntities) * 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getEstimatedCompletion = () => {
    if (!currentSync?.estimatedCompletion) return null;
    const estimated = new Date(currentSync.estimatedCompletion);
    const now = new Date();
    const diff = estimated.getTime() - now.getTime();

    if (diff <= 0) return 'Any moment now';

    const minutes = Math.ceil(diff / (1000 * 60));
    if (minutes < 60) return `~${minutes} minutes`;

    const hours = Math.ceil(minutes / 60);
    return `~${hours} hours`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            QuickBooks Sync Status
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Realm ID:</span>
            <p className="text-muted-foreground">{connection?.realmId}</p>
          </div>
          <div>
            <span className="font-medium">Token Expires:</span>
            <p className="text-muted-foreground">
              {connection?.expiresAt ? formatTime(connection.expiresAt) : 'Unknown'}
              {connection?.needsRefresh && (
                <Badge variant="outline" className="ml-2 text-amber-600">
                  Needs Refresh
                </Badge>
              )}
            </p>
          </div>
          <div>
            <span className="font-medium">Last Sync:</span>
            <p className="text-muted-foreground">
              {connection?.lastSyncAt ? formatTime(connection.lastSyncAt) : 'Never'}
            </p>
          </div>
        </div>

        {/* Current Sync Status */}
        {currentSync && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Sync:</span>
              {getStatusBadge(currentSync.status)}
            </div>

            {hasActiveSync && (
              <>
                <Progress value={getProgressPercentage()} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {currentSync.completedEntities} of {currentSync.totalEntities} entities completed
                    {currentSync.currentEntity && ` (${currentSync.currentEntity})`}
                  </span>
                  <span>{getProgressPercentage()}%</span>
                </div>

                {currentSync.estimatedCompletion && currentSync.status === 'running' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Estimated completion: {getEstimatedCompletion()}</span>
                  </div>
                )}
              </>
            )}

            {currentSync.lastError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{currentSync.lastError}</AlertDescription>
              </Alert>
            )}

            {currentSync.startedAt && (
              <p className="text-sm text-muted-foreground">
                Started: {formatTime(currentSync.startedAt)}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!hasActiveSync ? (
            <>
              <Button
                onClick={() => triggerSync('incremental')}
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
              <Button
                onClick={() => triggerSync('full')}
                variant="outline"
                size="sm"
              >
                Full Sync
              </Button>
            </>
          ) : (
            <>
              {currentSync?.status === 'running' && (
                <Button
                  onClick={() => controlSync('pause')}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {currentSync?.status === 'paused' && (
                <Button
                  onClick={() => controlSync('resume')}
                  variant="outline"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={() => controlSync('cancel')}
                variant="destructive"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}