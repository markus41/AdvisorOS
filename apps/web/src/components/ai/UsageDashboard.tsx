/**
 * AI Usage Dashboard Component
 * Displays token usage, costs, and analytics for AI features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface UsageStats {
  dailyUsage: {
    tokens: number;
    cost: number;
    requests: number;
  };
  monthlyUsage: {
    tokens: number;
    cost: number;
    requests: number;
  };
  topFeatures: Array<{
    feature: string;
    tokens: number;
    cost: number;
    percentage: number;
  }>;
  trends: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

interface UsageLimits {
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  perRequestLimit: number;
}

interface UsageDashboardProps {
  className?: string;
}

const FEATURE_COLORS = {
  'document-processing': '#8B5CF6',
  'financial-analysis': '#06B6D4',
  'email-composition': '#10B981',
  'smart-search': '#F59E0B',
  'insights-generation': '#EF4444',
  'compliance-review': '#6366F1'
};

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ className }) => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [limits, setLimits] = useState<{ limits: UsageLimits; current: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchUsageData();
  }, [period]);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const [statsResponse, limitsResponse] = await Promise.all([
        fetch(`/api/ai/usage?type=stats&days=${period === 'day' ? 1 : period === 'month' ? 30 : 365}`),
        fetch('/api/ai/usage?type=limits')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json();
        setLimits(limitsData);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await fetch('/api/ai/usage/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-usage-report.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getUsageStatus = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return { status: 'critical', color: 'destructive' };
    if (percentage >= 75) return { status: 'warning', color: 'secondary' };
    return { status: 'good', color: 'default' };
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Usage Dashboard</h2>
          <p className="text-gray-600">Monitor token usage, costs, and performance</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value: 'day' | 'month' | 'year') => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchUsageData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="limits">Limits & Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats?.monthlyUsage.cost || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.monthlyUsage.requests || 0} requests
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Tokens</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(stats?.monthlyUsage.tokens || 0)}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Avg: {stats?.monthlyUsage.requests ? Math.round((stats.monthlyUsage.tokens || 0) / stats.monthlyUsage.requests) : 0} per request
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Usage</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats?.dailyUsage.cost || 0)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {stats?.dailyUsage.requests || 0} requests today
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold">
                      {stats?.monthlyUsage.requests ? formatCurrency((stats.monthlyUsage.cost || 0) / stats.monthlyUsage.requests) : '$0.00'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Cost per request
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage by Feature */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Usage by Feature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.topFeatures || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ feature, percentage }) => `${feature}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cost"
                    >
                      {(stats?.topFeatures || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={FEATURE_COLORS[entry.feature as keyof typeof FEATURE_COLORS] || '#8884d8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Cost']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Feature Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(stats?.topFeatures || []).map((feature, index) => (
                    <div key={feature.feature} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: FEATURE_COLORS[feature.feature as keyof typeof FEATURE_COLORS] || '#8884d8'
                          }}
                        />
                        <span className="text-sm font-medium capitalize">
                          {feature.feature.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          {formatCurrency(feature.cost)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(feature.tokens)} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Details Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage Details</CardTitle>
                <CardDescription>Detailed breakdown of AI feature usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(stats?.topFeatures || []).map((feature) => (
                    <div key={feature.feature} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {feature.feature.replace('-', ' ')}
                        </span>
                        <Badge variant="outline">
                          {feature.percentage.toFixed(1)}% of usage
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Cost</div>
                          <div className="font-medium">{formatCurrency(feature.cost)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Tokens</div>
                          <div className="font-medium">{formatNumber(feature.tokens)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Efficiency</div>
                          <div className="font-medium">
                            {feature.tokens > 0 ? formatCurrency(feature.cost / feature.tokens * 1000) : '$0.00'}/K tokens
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Usage Metrics</CardTitle>
                <CardDescription>Latest usage statistics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.dailyUsage.requests || 0}
                      </div>
                      <div className="text-sm text-blue-600">Today's Requests</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats?.dailyUsage.cost || 0)}
                      </div>
                      <div className="text-sm text-green-600">Today's Cost</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average cost per request</span>
                      <span className="font-medium">
                        {stats?.monthlyUsage.requests ? formatCurrency((stats.monthlyUsage.cost || 0) / stats.monthlyUsage.requests) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average tokens per request</span>
                      <span className="font-medium">
                        {stats?.monthlyUsage.requests ? Math.round((stats.monthlyUsage.tokens || 0) / stats.monthlyUsage.requests) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Most used feature</span>
                      <span className="font-medium capitalize">
                        {stats?.topFeatures[0]?.feature.replace('-', ' ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage Trends Over Time
              </CardTitle>
              <CardDescription>Track your AI usage patterns and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="cost" orientation="left" />
                  <YAxis yAxisId="tokens" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'cost' ? formatCurrency(value) : formatNumber(value),
                      name === 'cost' ? 'Cost' : 'Tokens'
                    ]}
                  />
                  <Line
                    yAxisId="cost"
                    type="monotone"
                    dataKey="cost"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="cost"
                  />
                  <Line
                    yAxisId="tokens"
                    type="monotone"
                    dataKey="tokens"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="tokens"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits & Alerts Tab */}
        <TabsContent value="limits" className="space-y-4">
          {limits && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Monthly Limits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Cost Usage</span>
                        <span>
                          {formatCurrency(stats?.monthlyUsage.cost || 0)} / {formatCurrency(limits.limits.monthlyCostLimit)}
                        </span>
                      </div>
                      <Progress
                        value={(stats?.monthlyUsage.cost || 0) / limits.limits.monthlyCostLimit * 100}
                        className="h-3"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {limits.current.monthlyRemaining.cost > 0
                          ? `${formatCurrency(limits.current.monthlyRemaining.cost)} remaining`
                          : 'Limit exceeded'
                        }
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Token Usage</span>
                        <span>
                          {formatNumber(stats?.monthlyUsage.tokens || 0)} / {formatNumber(limits.limits.monthlyTokenLimit)}
                        </span>
                      </div>
                      <Progress
                        value={(stats?.monthlyUsage.tokens || 0) / limits.limits.monthlyTokenLimit * 100}
                        className="h-3"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {limits.current.monthlyRemaining.tokens > 0
                          ? `${formatNumber(limits.current.monthlyRemaining.tokens)} tokens remaining`
                          : 'Limit exceeded'
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Status & Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {limits.current.warnings.map((warning: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">{warning}</span>
                        </div>
                      ))}

                      {limits.current.warnings.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">All usage within limits</span>
                        </div>
                      )}

                      <div className="pt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daily cost remaining:</span>
                          <span className="font-medium">
                            {formatCurrency(limits.current.dailyRemaining.cost)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daily tokens remaining:</span>
                          <span className="font-medium">
                            {formatNumber(limits.current.dailyRemaining.tokens)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsageDashboard;