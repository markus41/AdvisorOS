'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Target,
  Lightbulb,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'trend' | 'risk' | 'opportunity' | 'metric' | 'recommendation';
  title: string;
  description: string;
  value?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  category: string;
  actionRequired?: boolean;
  deadline?: Date;
}

interface MetricCard {
  name: string;
  value: number;
  benchmark?: number;
  variance?: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'caution' | 'concern';
  format?: 'currency' | 'percentage' | 'number';
}

interface InsightsPanelProps {
  insights: Insight[];
  keyMetrics: MetricCard[];
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

export function InsightsPanel({
  insights,
  keyMetrics,
  loading = false,
  onRefresh,
  onExport,
  className
}: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  // Filter insights based on confidence threshold
  const filteredInsights = insights.filter(insight =>
    showLowConfidence || insight.confidence >= 0.7
  );

  // Group insights by type
  const insightsByType = filteredInsights.reduce((acc, insight) => {
    if (!acc[insight.type]) acc[insight.type] = [];
    acc[insight.type].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  const getInsightIcon = (type: string, severity?: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity':
        return <Target className="h-4 w-4" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string, severity?: string) => {
    if (type === 'risk') {
      switch (severity) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'secondary';
        default: return 'outline';
      }
    }

    switch (type) {
      case 'trend': return 'default';
      case 'opportunity': return 'default';
      case 'recommendation': return 'secondary';
      default: return 'outline';
    }
  };

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />; // Stable
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'caution': return 'text-yellow-600';
      case 'concern': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Insights</h2>
          <p className="text-gray-600">
            {filteredInsights.length} insights • {keyMetrics.length} key metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLowConfidence(!showLowConfidence)}
            className="gap-2"
          >
            {showLowConfidence ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showLowConfidence ? 'Hide' : 'Show'} Low Confidence
          </Button>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="insights">Detailed Insights</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(insightsByType).map(([type, typeInsights]) => (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(type)}
                      <span className="text-sm font-medium capitalize">{type}s</span>
                    </div>
                    <span className="text-2xl font-bold">{typeInsights.length}</span>
                  </div>

                  {type === 'risk' && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">
                        {typeInsights.filter(i => i.severity === 'critical' || i.severity === 'high').length} high priority
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Insights</CardTitle>
              <CardDescription>
                Most important insights requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInsights
                  .filter(insight => insight.actionRequired || insight.severity === 'high' || insight.severity === 'critical')
                  .slice(0, 5)
                  .map((insight) => (
                    <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="mt-1">
                        {getInsightIcon(insight.type, insight.severity)}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{insight.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={getInsightColor(insight.type, insight.severity) as any}>
                              {insight.type}
                            </Badge>
                            {insight.confidence < 1 && (
                              <span className="text-xs text-gray-500">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">{insight.description}</p>

                        {insight.deadline && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <Clock className="h-3 w-3" />
                            Due: {insight.deadline.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keyMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{metric.name}</span>
                    {getTrendIcon(metric.trend)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {formatValue(metric.value, metric.format)}
                      </span>
                      <span className={`text-sm ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>

                    {metric.benchmark && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>vs Benchmark</span>
                          <span>{formatValue(metric.benchmark, metric.format)}</span>
                        </div>

                        {metric.variance && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className={metric.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                              {metric.variance > 0 ? '+' : ''}{formatValue(metric.variance, metric.format)}
                            </span>
                            <span className="text-gray-500">
                              ({metric.variance > 0 ? 'above' : 'below'} benchmark)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detailed Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {Object.entries(insightsByType).map(([type, typeInsights]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getInsightIcon(type)}
                  {type}s ({typeInsights.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typeInsights.map((insight) => (
                    <div key={insight.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          {insight.severity && (
                            <Badge variant={getInsightColor(insight.type, insight.severity) as any}>
                              {insight.severity}
                            </Badge>
                          )}
                          <div className="text-xs text-gray-500">
                            {Math.round(insight.confidence * 100)}%
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Category: {insight.category}</span>
                          {insight.value && (
                            <span>Value: {formatValue(insight.value, 'currency')}</span>
                          )}
                          {insight.change && (
                            <span className={insight.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                              {insight.changeType === 'increase' ? '+' : ''}{insight.change}%
                            </span>
                          )}
                        </div>

                        <Progress
                          value={insight.confidence * 100}
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>
                Insights that require immediate attention or action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInsights
                  .filter(insight => insight.actionRequired || insight.type === 'recommendation')
                  .sort((a, b) => {
                    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
                           (severityOrder[a.severity as keyof typeof severityOrder] || 0);
                  })
                  .map((insight, index) => (
                    <div key={insight.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={getInsightColor(insight.type, insight.severity) as any}>
                              {insight.severity || insight.type}
                            </Badge>
                            {insight.deadline && (
                              <Badge variant="outline" className="text-xs">
                                Due: {insight.deadline.toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{insight.description}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </span>
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                {filteredInsights.filter(insight =>
                  insight.actionRequired || insight.type === 'recommendation'
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                    <p>No immediate actions required based on current insights.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}