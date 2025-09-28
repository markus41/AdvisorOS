'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Clock, TrendingUp, Users, FileText, DollarSign, Building, CreditCard } from 'lucide-react';

interface EntityFreshness {
  entityType: string;
  lastSyncAt?: string;
  recordCount: number;
  successRate: number;
  isStale: boolean;
  staleDays: number;
  icon: any;
  displayName: string;
}

interface DataFreshnessInfo {
  lastFullSync?: string;
  lastIncrementalSync?: string;
  overallHealth: 'excellent' | 'good' | 'warning' | 'poor';
  entities: EntityFreshness[];
  recommendedAction?: string;
}

export function DataFreshness() {
  const [freshnessData, setFreshnessData] = useState<DataFreshnessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration - in real implementation, fetch from API
  const fetchDataFreshness = async () => {
    try {
      // This would be a real API call
      // const response = await fetch('/api/quickbooks/data-freshness');
      // const data = await response.json();

      // Mock data for demonstration
      const mockData: DataFreshnessInfo = {
        lastFullSync: '2024-01-15T08:00:00Z',
        lastIncrementalSync: '2024-01-15T14:30:00Z',
        overallHealth: 'good',
        entities: [
          {
            entityType: 'company',
            lastSyncAt: '2024-01-15T08:00:00Z',
            recordCount: 1,
            successRate: 100,
            isStale: false,
            staleDays: 0,
            icon: Building,
            displayName: 'Company Info'
          },
          {
            entityType: 'customers',
            lastSyncAt: '2024-01-15T14:30:00Z',
            recordCount: 147,
            successRate: 98,
            isStale: false,
            staleDays: 0,
            icon: Users,
            displayName: 'Customers'
          },
          {
            entityType: 'invoices',
            lastSyncAt: '2024-01-15T14:30:00Z',
            recordCount: 523,
            successRate: 95,
            isStale: false,
            staleDays: 0,
            icon: FileText,
            displayName: 'Invoices'
          },
          {
            entityType: 'accounts',
            lastSyncAt: '2024-01-14T08:00:00Z',
            recordCount: 45,
            successRate: 100,
            isStale: true,
            staleDays: 1,
            icon: DollarSign,
            displayName: 'Chart of Accounts'
          },
          {
            entityType: 'transactions',
            lastSyncAt: '2024-01-13T08:00:00Z',
            recordCount: 1289,
            successRate: 92,
            isStale: true,
            staleDays: 2,
            icon: CreditCard,
            displayName: 'Transactions'
          },
          {
            entityType: 'reports',
            lastSyncAt: '2024-01-15T08:00:00Z',
            recordCount: 12,
            successRate: 100,
            isStale: false,
            staleDays: 0,
            icon: TrendingUp,
            displayName: 'Financial Reports'
          }
        ]
      };

      setFreshnessData(mockData);
    } catch (error) {
      console.error('Failed to fetch data freshness:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (entityType?: string) => {
    try {
      const body = entityType
        ? { syncType: 'incremental', selectedEntities: [entityType] }
        : { syncType: 'incremental' };

      const response = await fetch('/api/quickbooks/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // Refresh data after a short delay
        setTimeout(fetchDataFreshness, 2000);
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-green-100 text-green-800">Good</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'poor':
        return <Badge variant="destructive">Poor</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getFreshnessStatus = (staleDays: number) => {
    if (staleDays === 0) return { label: 'Fresh', color: 'text-green-600' };
    if (staleDays <= 1) return { label: 'Recent', color: 'text-yellow-600' };
    if (staleDays <= 3) return { label: 'Stale', color: 'text-orange-600' };
    return { label: 'Very Stale', color: 'text-red-600' };
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    fetchDataFreshness();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDataFreshness, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Data Freshness...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!freshnessData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Freshness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load data freshness information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Freshness
          </div>
          <div className="flex items-center gap-2">
            {getHealthBadge(freshnessData.overallHealth)}
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSync()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg ${getHealthColor(freshnessData.overallHealth)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Overall Data Health</h3>
              <p className="text-sm opacity-80">
                Last full sync: {freshnessData.lastFullSync ? formatRelativeTime(freshnessData.lastFullSync) : 'Never'}
              </p>
              <p className="text-sm opacity-80">
                Last incremental sync: {freshnessData.lastIncrementalSync ? formatRelativeTime(freshnessData.lastIncrementalSync) : 'Never'}
              </p>
            </div>
            {freshnessData.recommendedAction && (
              <div className="text-right">
                <p className="text-sm font-medium">Recommended Action:</p>
                <p className="text-sm opacity-80">{freshnessData.recommendedAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* Entity Details */}
        <div className="grid gap-4">
          {freshnessData.entities.map((entity) => {
            const Icon = entity.icon;
            const freshness = getFreshnessStatus(entity.staleDays);

            return (
              <div key={entity.entityType} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{entity.displayName}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{entity.recordCount} records</span>
                      <span>•</span>
                      <span className={freshness.color}>{freshness.label}</span>
                      {entity.lastSyncAt && (
                        <>
                          <span>•</span>
                          <span>{formatRelativeTime(entity.lastSyncAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {entity.successRate}% success
                    </div>
                    <Progress
                      value={entity.successRate}
                      className="w-20 h-2"
                    />
                  </div>

                  {entity.isStale && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerSync(entity.entityType)}
                    >
                      Sync Now
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => triggerSync()}
            variant="default"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All Data
          </Button>

          <Button
            onClick={() => triggerSync()}
            variant="outline"
            size="sm"
          >
            Incremental Sync
          </Button>

          <Button
            onClick={() => {
              const staleEntities = freshnessData.entities
                .filter(e => e.isStale)
                .map(e => e.entityType);
              if (staleEntities.length > 0) {
                triggerSync(); // Would pass staleEntities in real implementation
              }
            }}
            variant="outline"
            size="sm"
            disabled={!freshnessData.entities.some(e => e.isStale)}
          >
            Sync Stale Data Only
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}