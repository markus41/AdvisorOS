'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SyncRecord {
  id: string;
  syncType: string;
  entityType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  recordsTotal?: number;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errorMessage?: string;
}

interface SyncStatusData {
  syncs: SyncRecord[];
  currentSync?: SyncRecord;
  lastSyncAt: string | null;
}

export function SyncStatus() {
  const [syncData, setSyncData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyncStatus();

    // Poll for updates every 10 seconds if there's an active sync
    const interval = setInterval(() => {
      if (syncData?.currentSync) {
        fetchSyncStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [syncData?.currentSync]);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quickbooks/sync');

      if (response.ok) {
        const data = await response.json();
        setSyncData(data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className={colors[status as keyof typeof colors] || ''}>
          {status.replace('_', ' ').toUpperCase()}
        </span>
      </Badge>
    );
  };

  const calculateProgress = (sync: SyncRecord) => {
    if (!sync.recordsTotal || sync.recordsTotal === 0) return 0;
    return Math.round((sync.recordsProcessed / sync.recordsTotal) * 100);
  };

  const formatEntityType = (entityType: string) => {
    return entityType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  if (loading && !syncData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sync Status
        </CardTitle>
        <CardDescription>
          {syncData?.lastSyncAt
            ? `Last sync: ${new Date(syncData.lastSyncAt).toLocaleString()}`
            : 'No syncs completed yet'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncData?.currentSync && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(syncData.currentSync.status)}
                <span className="font-medium">
                  {formatEntityType(syncData.currentSync.entityType)} Sync
                </span>
              </div>
              {getStatusBadge(syncData.currentSync.status)}
            </div>

            {syncData.currentSync.recordsTotal && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {syncData.currentSync.recordsProcessed} of {syncData.currentSync.recordsTotal} records
                  </span>
                  <span>{calculateProgress(syncData.currentSync)}%</span>
                </div>
                <Progress value={calculateProgress(syncData.currentSync)} />
              </div>
            )}

            <div className="text-xs text-gray-600 mt-2">
              Started: {new Date(syncData.currentSync.startedAt).toLocaleString()}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recent Syncs</h4>
          {syncData?.syncs && syncData.syncs.length > 0 ? (
            <div className="space-y-2">
              {syncData.syncs.slice(0, 5).map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <div className="font-medium text-sm">
                        {formatEntityType(sync.entityType)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(sync.startedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {getStatusBadge(sync.status)}
                    {sync.status === 'completed' && (
                      <div className="text-xs text-gray-600 mt-1">
                        {sync.recordsSuccess}/{sync.recordsTotal || sync.recordsProcessed} records
                      </div>
                    )}
                    {sync.status === 'failed' && sync.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 max-w-48 truncate">
                        {sync.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No sync history available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
