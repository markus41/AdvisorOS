'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SyncRecord {
  id: string;
  syncType: string;
  entityType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  recordsProcessed?: number;
  recordsSuccess?: number;
  recordsFailed?: number;
  errorMessage?: string;
  triggeredBy?: string;
  metadata?: any;
}

interface SyncHistoryData {
  history: SyncRecord[];
  summary: {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    totalRecordsProcessed: number;
    totalRecordsSuccess: number;
    totalRecordsFailed: number;
  };
  pagination: {
    limit: number;
    hasMore: boolean;
  };
}

export function SyncHistory() {
  const [historyData, setHistoryData] = useState<SyncHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSyncHistory = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(entityFilter !== 'all' && { entityType: entityFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/quickbooks/sync/history?${params}`);
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncHistory();
  }, [entityFilter, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 1000) return '< 1s';

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSuccessRate = (record: SyncRecord) => {
    if (!record.recordsProcessed || record.recordsProcessed === 0) return 'N/A';
    const rate = (record.recordsSuccess || 0) / record.recordsProcessed * 100;
    return `${rate.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Sync History...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sync History</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSyncHistory}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {historyData?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">{historyData.summary.total}</div>
              <div className="text-sm text-muted-foreground">Total Syncs</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{historyData.summary.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{historyData.summary.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{historyData.summary.totalRecordsProcessed}</div>
              <div className="text-sm text-muted-foreground">Records Processed</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Entity:</span>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="accounts">Accounts</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* History Table */}
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Triggered By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData?.history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      {getStatusBadge(record.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {record.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateTime(record.startedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDuration(record.startedAt, record.completedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.recordsProcessed ? (
                      <div className="text-sm">
                        <div>{record.recordsProcessed} processed</div>
                        {record.recordsFailed && record.recordsFailed > 0 && (
                          <div className="text-red-600">{record.recordsFailed} failed</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getSuccessRate(record)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {record.triggeredBy || 'System'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {historyData?.history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sync history found
            </div>
          )}
        </ScrollArea>

        {historyData?.pagination.hasMore && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}