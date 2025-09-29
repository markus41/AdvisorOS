'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Shield,
  Zap,
  Brain,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Info,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronRight,
  Clock,
  TrendingUp as Growth,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts'

// Real-time Data Interfaces
interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  unit: string;
  target?: number;
  lastUpdated: Date;
  sparklineData: Array<{ timestamp: Date; value: number }>;
}

interface AINarrative {
  id: string;
  type: 'executive_summary' | 'trend_analysis' | 'alert' | 'opportunity' | 'forecast';
  title: string;
  content: string;
  confidence: number;
  importance: 'high' | 'medium' | 'low';
  generatedAt: Date;
  keyInsights: string[];
  recommendations?: string[];
  supportingData?: Array<{
    metric: string;
    value: number;
    context: string;
  }>;
}

interface RealTimeAlert {
  id: string;
  type: 'anomaly' | 'threshold' | 'trend' | 'opportunity' | 'compliance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  affectedMetrics: string[];
  recommendedActions: string[];
  isRead: boolean;
  autoResolve: boolean;
}

interface StreamingDataPoint {
  timestamp: Date;
  metrics: Record<string, number>;
  metadata: {
    source: string;
    quality: number;
    latency: number;
  };
}

interface DashboardConfig {
  refreshInterval: number;
  autoNarrative: boolean;
  soundAlerts: boolean;
  realTimeMode: boolean;
  selectedMetrics: string[];
  alertThresholds: Record<string, { warning: number; critical: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

// Mock real-time data
const mockRealTimeMetrics: RealTimeMetric[] = [
  {
    id: 'revenue',
    name: 'Real-time Revenue',
    value: 487235,
    previousValue: 485000,
    change: 2235,
    changePercent: 0.46,
    trend: 'up',
    status: 'normal',
    unit: 'USD',
    target: 500000,
    lastUpdated: new Date(),
    sparklineData: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 60000),
      value: 485000 + Math.random() * 5000
    }))
  },
  {
    id: 'cashflow',
    name: 'Cash Flow',
    value: 127500,
    previousValue: 125000,
    change: 2500,
    changePercent: 2.0,
    trend: 'up',
    status: 'normal',
    unit: 'USD',
    target: 130000,
    lastUpdated: new Date(),
    sparklineData: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 60000),
      value: 125000 + Math.random() * 3000
    }))
  },
  {
    id: 'transactions',
    name: 'Transaction Volume',
    value: 342,
    previousValue: 356,
    change: -14,
    changePercent: -3.93,
    trend: 'down',
    status: 'warning',
    unit: 'count',
    lastUpdated: new Date(),
    sparklineData: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 60000),
      value: 350 + Math.random() * 30 - 15
    }))
  },
  {
    id: 'margin',
    name: 'Profit Margin',
    value: 31.8,
    previousValue: 32.4,
    change: -0.6,
    changePercent: -1.85,
    trend: 'down',
    status: 'warning',
    unit: '%',
    target: 35,
    lastUpdated: new Date(),
    sparklineData: Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 60000),
      value: 32 + Math.random() * 2 - 1
    }))
  }
];

const mockAINarratives: AINarrative[] = [
  {
    id: 'narrative_1',
    type: 'executive_summary',
    title: 'Executive Summary - November 2024',
    content: 'Revenue performance continues to show strong momentum with a 15.8% month-over-month increase, driven primarily by expanded service offerings and improved client retention. Cash flow remains healthy at $127,500, exceeding our target by 98%. However, transaction volume has declined by 3.9%, suggesting potential efficiency gains in processing workflows. Profit margins have compressed slightly to 31.8%, warranting attention to cost optimization initiatives.',
    confidence: 0.94,
    importance: 'high',
    generatedAt: new Date(),
    keyInsights: [
      'Revenue growth accelerating beyond projections',
      'Cash flow stability supports expansion plans',
      'Transaction efficiency opportunity identified',
      'Margin compression requires cost review'
    ],
    recommendations: [
      'Investigate transaction processing bottlenecks',
      'Implement automated workflow optimization',
      'Review vendor contracts for cost reduction opportunities'
    ],
    supportingData: [
      { metric: 'Revenue Growth', value: 15.8, context: 'vs 12% industry average' },
      { metric: 'Cash Flow Ratio', value: 98.1, context: 'vs 85% target' },
      { metric: 'Margin Compression', value: -1.85, context: 'industry trend -2.3%' }
    ]
  },
  {
    id: 'narrative_2',
    type: 'trend_analysis',
    title: 'Emerging Trend: Service Digitization Impact',
    content: 'Analysis of the past 30 days reveals a significant shift in service delivery patterns. Digital service consumption has increased by 67%, while traditional in-person consultations have decreased by 23%. This transition is driving cost efficiencies but may impact client satisfaction metrics. AI-powered document processing has reduced manual review time by 43%, contributing to improved throughput despite lower transaction volumes.',
    confidence: 0.87,
    importance: 'medium',
    generatedAt: new Date(),
    keyInsights: [
      'Digital transformation accelerating client adoption',
      'Efficiency gains offset volume concerns',
      'Client satisfaction monitoring critical',
      'AI automation showing measurable ROI'
    ],
    recommendations: [
      'Expand digital service portfolio',
      'Implement client satisfaction tracking for digital services',
      'Train staff on hybrid service delivery models'
    ]
  },
  {
    id: 'narrative_3',
    type: 'opportunity',
    title: 'Revenue Optimization Opportunity',
    content: 'Machine learning analysis has identified a potential 12% revenue increase opportunity through strategic pricing adjustments and service bundling. Current pricing elasticity analysis suggests clients in the professional services segment show low price sensitivity for premium advisory services. Additionally, 34% of current clients utilize only basic services, presenting significant upselling potential.',
    confidence: 0.82,
    importance: 'high',
    generatedAt: new Date(),
    keyInsights: [
      'Low price elasticity in premium services',
      'Significant upselling opportunity exists',
      'Service bundling could increase ARPU',
      'Professional services segment most responsive'
    ],
    recommendations: [
      'Implement graduated pricing strategy',
      'Design premium service bundles',
      'Target professional services clients for upselling'
    ]
  }
];

const mockAlerts: RealTimeAlert[] = [
  {
    id: 'alert_1',
    type: 'anomaly',
    severity: 'warning',
    title: 'Unusual Transaction Pattern Detected',
    description: 'AI anomaly detection has identified unusual transaction patterns in the past 2 hours. Transaction volumes are 34% below normal for this time period.',
    triggeredAt: new Date(Date.now() - 30 * 60000),
    affectedMetrics: ['transactions', 'revenue'],
    recommendedActions: [
      'Check system connectivity',
      'Review recent process changes',
      'Monitor for next 30 minutes'
    ],
    isRead: false,
    autoResolve: false
  },
  {
    id: 'alert_2',
    type: 'threshold',
    severity: 'error',
    title: 'Profit Margin Below Target',
    description: 'Profit margin has fallen below the warning threshold of 32%. Current margin is 31.8%, indicating potential cost management issues.',
    triggeredAt: new Date(Date.now() - 15 * 60000),
    affectedMetrics: ['margin'],
    recommendedActions: [
      'Review recent expense changes',
      'Analyze cost per transaction',
      'Consider pricing adjustments'
    ],
    isRead: false,
    autoResolve: false
  },
  {
    id: 'alert_3',
    type: 'opportunity',
    severity: 'info',
    title: 'High-Value Client Activity Spike',
    description: 'Increased activity detected from premium client segment. Revenue from this segment up 28% in the last hour.',
    triggeredAt: new Date(Date.now() - 5 * 60000),
    affectedMetrics: ['revenue'],
    recommendedActions: [
      'Monitor service capacity',
      'Ensure optimal service delivery',
      'Consider proactive outreach'
    ],
    isRead: false,
    autoResolve: true
  }
];

interface RealTimeAnalyticsDashboardProps {
  clientId?: string;
  organizationId: string;
  initialConfig?: Partial<DashboardConfig>;
}

export function RealTimeAnalyticsDashboard({
  clientId,
  organizationId,
  initialConfig = {}
}: RealTimeAnalyticsDashboardProps) {
  // State management
  const [config, setConfig] = useState<DashboardConfig>({
    refreshInterval: 30000, // 30 seconds
    autoNarrative: true,
    soundAlerts: false,
    realTimeMode: true,
    selectedMetrics: ['revenue', 'cashflow', 'transactions', 'margin'],
    alertThresholds: {
      revenue: { warning: 450000, critical: 400000 },
      margin: { warning: 32, critical: 30 }
    },
    ...initialConfig
  });

  const [metrics, setMetrics] = useState<RealTimeMetric[]>(mockRealTimeMetrics);
  const [narratives, setNarratives] = useState<AINarrative[]>(mockAINarratives);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>(mockAlerts);
  const [isStreaming, setIsStreaming] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNarrative, setSelectedNarrative] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');

  // Refs for streaming and audio
  const streamingInterval = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  // Simulate real-time data streaming
  useEffect(() => {
    if (isStreaming && config.realTimeMode) {
      streamingInterval.current = setInterval(() => {
        simulateDataUpdate();
      }, config.refreshInterval);
    } else if (streamingInterval.current) {
      clearInterval(streamingInterval.current);
    }

    return () => {
      if (streamingInterval.current) {
        clearInterval(streamingInterval.current);
      }
    };
  }, [isStreaming, config.refreshInterval, config.realTimeMode]);

  // Simulate incoming data updates
  const simulateDataUpdate = () => {
    setMetrics(prevMetrics =>
      prevMetrics.map(metric => {
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const newValue = metric.value * (1 + variation);
        const change = newValue - metric.value;
        const changePercent = (change / metric.value) * 100;

        // Update sparkline data
        const newSparklineData = [...metric.sparklineData.slice(1), {
          timestamp: new Date(),
          value: newValue
        }];

        // Determine trend and status
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (Math.abs(changePercent) > 0.5) {
          trend = changePercent > 0 ? 'up' : 'down';
        }

        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (metric.target) {
          const targetDiff = Math.abs(newValue - metric.target) / metric.target;
          if (targetDiff > 0.1) status = 'warning';
          if (targetDiff > 0.2) status = 'critical';
        }

        return {
          ...metric,
          previousValue: metric.value,
          value: newValue,
          change,
          changePercent,
          trend,
          status,
          lastUpdated: new Date(),
          sparklineData: newSparklineData
        };
      })
    );

    setLastUpdate(new Date());

    // Occasionally generate new AI narratives
    if (Math.random() < 0.1 && config.autoNarrative) {
      generateNewNarrative();
    }

    // Check for alert conditions
    checkAlertConditions();
  };

  const generateNewNarrative = () => {
    const narrativeTypes: Array<AINarrative['type']> = ['trend_analysis', 'alert', 'opportunity', 'forecast'];
    const randomType = narrativeTypes[Math.floor(Math.random() * narrativeTypes.length)];

    const newNarrative: AINarrative = {
      id: `narrative_${Date.now()}`,
      type: randomType,
      title: `Real-time ${randomType.replace('_', ' ')} Update`,
      content: `Automated analysis has detected significant patterns in the data stream. ${randomType === 'opportunity' ? 'New revenue optimization opportunity identified.' : 'Market conditions are showing interesting trends.'}`,
      confidence: 0.75 + Math.random() * 0.2,
      importance: Math.random() > 0.7 ? 'high' : 'medium',
      generatedAt: new Date(),
      keyInsights: [
        'Real-time pattern detected',
        'Statistical significance achieved',
        'Actionable insights available'
      ]
    };

    setNarratives(prev => [newNarrative, ...prev.slice(0, 4)]);
  };

  const checkAlertConditions = () => {
    metrics.forEach(metric => {
      const thresholds = config.alertThresholds[metric.id];
      if (!thresholds) return;

      if (metric.value <= thresholds.critical) {
        createAlert(metric, 'critical');
      } else if (metric.value <= thresholds.warning) {
        createAlert(metric, 'warning');
      }
    });
  };

  const createAlert = (metric: RealTimeMetric, severity: 'warning' | 'critical') => {
    const existingAlert = alerts.find(alert =>
      alert.affectedMetrics.includes(metric.id) &&
      alert.severity === severity &&
      !alert.isRead
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const newAlert: RealTimeAlert = {
      id: `alert_${Date.now()}`,
      type: 'threshold',
      severity,
      title: `${metric.name} ${severity.charAt(0).toUpperCase() + severity.slice(1)} Alert`,
      description: `${metric.name} value (${metric.value.toLocaleString()}) is ${severity === 'critical' ? 'critically' : ''} below threshold.`,
      triggeredAt: new Date(),
      affectedMetrics: [metric.id],
      recommendedActions: [
        'Investigate cause of decline',
        'Review recent changes',
        'Consider corrective action'
      ],
      isRead: false,
      autoResolve: false
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Play sound alert if enabled
    if (config.soundAlerts) {
      playAlertSound(severity);
    }
  };

  const playAlertSound = (severity: 'warning' | 'critical') => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = severity === 'critical' ? 800 : 600;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const toggleStreaming = () => {
    setIsStreaming(prev => !prev);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const criticalAlerts = unreadAlerts.filter(alert => alert.severity === 'critical');

  // Memoized components for performance
  const MetricCard = useMemo(() => ({ metric }: { metric: RealTimeMetric }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${isFullscreen ? 'col-span-1' : ''}`}
    >
      <Card className={`relative overflow-hidden ${
        metric.status === 'critical' ? 'border-red-500 bg-red-50/50' :
        metric.status === 'warning' ? 'border-yellow-500 bg-yellow-50/50' :
        'border-gray-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-700">{metric.name}</h3>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
            </div>
            {metric.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : metric.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <Activity className="w-4 h-4 text-gray-600" />
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-900">
              {metric.unit === 'USD' ? '$' : ''}{metric.value.toLocaleString()}{metric.unit === '%' ? '%' : ''}
            </span>
            <span className={`text-sm font-medium ${
              metric.changePercent > 0 ? 'text-green-600' :
              metric.changePercent < 0 ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(2)}%
            </span>
          </div>

          {metric.target && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Target: {metric.unit === 'USD' ? '$' : ''}{metric.target.toLocaleString()}</span>
                <span>{((metric.value / metric.target) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(metric.value / metric.target) * 100} className="h-1" />
            </div>
          )}

          {/* Mini sparkline */}
          <div className="h-8 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metric.sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={metric.trend === 'up' ? '#10B981' : metric.trend === 'down' ? '#EF4444' : '#6B7280'}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-gray-500 mt-1">
            Updated {metric.lastUpdated.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  ), [connectionStatus, isFullscreen]);

  return (
    <TooltipProvider>
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} space-y-6`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              Real-Time Financial Analytics
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {criticalAlerts.length} Critical
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
              Live financial data with AI-powered insights
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-xs">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isStreaming ? "default" : "outline"}
              size="sm"
              onClick={toggleStreaming}
              className="gap-2"
            >
              {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isStreaming ? 'Pause' : 'Resume'} Stream
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfig(prev => ({ ...prev, soundAlerts: !prev.soundAlerts }))}
              className="gap-2"
            >
              {config.soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Sound
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="gap-2"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </Button>

            <Select
              value={config.refreshInterval.toString()}
              onValueChange={(value) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(value) }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10000">10s</SelectItem>
                <SelectItem value="30000">30s</SelectItem>
                <SelectItem value="60000">1m</SelectItem>
                <SelectItem value="300000">5m</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Critical Alerts Active</AlertTitle>
            <AlertDescription className="text-red-700">
              {criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention.
              <Button variant="link" className="h-auto p-0 ml-2 text-red-700">
                View Details →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time Metrics Grid */}
        <div className={`grid ${isFullscreen ? 'grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
          {metrics.filter(metric => config.selectedMetrics.includes(metric.id)).map(metric => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="live-stream" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live-stream" className="gap-2">
              <Activity className="w-4 h-4" />
              Live Stream
            </TabsTrigger>
            <TabsTrigger value="ai-narratives" className="gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 relative">
              <Bell className="w-4 h-4" />
              Alerts
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs h-5 w-5 p-0 flex items-center justify-center">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live-stream" className="space-y-6">
            {/* Real-time Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Live Revenue Stream
                  </CardTitle>
                  <CardDescription>
                    Real-time revenue tracking with 30-second updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics[0]?.sparklineData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                        <RechartsTooltip
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                        {metrics[0]?.target && (
                          <ReferenceLine
                            y={metrics[0].target}
                            stroke="#EF4444"
                            strokeDasharray="5 5"
                            label="Target"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Metrics Comparison
                  </CardTitle>
                  <CardDescription>
                    Current vs. target performance across key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.filter(m => m.target).map(m => ({
                        name: m.name.replace('Real-time ', ''),
                        current: m.value,
                        target: m.target,
                        achievement: (m.value / (m.target || m.value)) * 100
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="current" fill="#3B82F6" name="Current" />
                        <Bar dataKey="target" fill="#10B981" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Transaction Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>
                  Real-time transaction and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Array.from({ length: 10 }, (_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          Transaction #{1000 + i} processed
                        </div>
                        <div className="text-xs text-gray-500">
                          Amount: ${(Math.random() * 5000 + 1000).toFixed(2)} •
                          Client: Professional Services Ltd •
                          {new Date(Date.now() - i * 30000).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="outline">Complete</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-narratives" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Narrative List */}
              <div className="lg:col-span-2 space-y-4">
                {narratives.map((narrative, index) => (
                  <motion.div
                    key={narrative.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedNarrative === narrative.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedNarrative(narrative.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={narrative.importance === 'high' ? 'default' : 'secondary'}>
                              {narrative.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {narrative.confidence * 100}% confidence
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {narrative.generatedAt.toLocaleTimeString()}
                          </div>
                        </div>
                        <CardTitle className="text-lg">{narrative.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {narrative.content.slice(0, 200)}...
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {narrative.keyInsights.slice(0, 3).map((insight, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {insight}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Narrative Detail */}
              <div className="lg:col-span-1">
                {selectedNarrative && (
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const narrative = narratives.find(n => n.id === selectedNarrative);
                        if (!narrative) return null;

                        return (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Full Analysis</h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {narrative.content}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Key Insights</h4>
                              <ul className="space-y-1">
                                {narrative.keyInsights.map((insight, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <ChevronRight className="w-3 h-3 mt-0.5 text-blue-600" />
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {narrative.recommendations && (
                              <div>
                                <h4 className="font-semibold mb-2">Recommendations</h4>
                                <ul className="space-y-1">
                                  {narrative.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                      <Target className="w-3 h-3 mt-0.5 text-green-600" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {narrative.supportingData && (
                              <div>
                                <h4 className="font-semibold mb-2">Supporting Data</h4>
                                <div className="space-y-2">
                                  {narrative.supportingData.map((data, i) => (
                                    <div key={i} className="bg-gray-50 p-2 rounded">
                                      <div className="font-medium text-sm">{data.metric}</div>
                                      <div className="text-lg font-bold text-blue-600">{data.value}%</div>
                                      <div className="text-xs text-gray-500">{data.context}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'error' ? 'border-red-400 bg-red-50' :
                    alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  } ${alert.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{alert.type}</Badge>
                        <span className="text-xs text-gray-500">
                          {alert.triggeredAt.toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{alert.title}</h3>
                      <p className="text-gray-700 mb-3">{alert.description}</p>

                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Affected Metrics:</h4>
                          <div className="flex flex-wrap gap-1">
                            {alert.affectedMetrics.map(metric => (
                              <Badge key={metric} variant="outline" className="text-xs">
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-1">Recommended Actions:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {alert.recommendedActions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!alert.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAlertAsRead(alert.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Investigate
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Forecasting</CardTitle>
                <CardDescription>
                  AI-powered predictions updated with live data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={[
                      { period: 'Nov', actual: 487235, forecast: 490000, confidence: 0.92 },
                      { period: 'Dec', forecast: 515000, confidence: 0.88 },
                      { period: 'Jan', forecast: 425000, confidence: 0.90 },
                      { period: 'Feb', forecast: 445000, confidence: 0.87 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="actual" fill="#3B82F6" name="Actual" />
                      <Line type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={3} name="Forecast" />
                      <Area dataKey="confidence" fill="#10B981" fillOpacity={0.1} name="Confidence Band" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Configuration</CardTitle>
                <CardDescription>
                  Customize your real-time analytics experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-narrative">Auto-generate AI Narratives</Label>
                      <Switch
                        id="auto-narrative"
                        checked={config.autoNarrative}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoNarrative: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound-alerts">Sound Alerts</Label>
                      <Switch
                        id="sound-alerts"
                        checked={config.soundAlerts}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, soundAlerts: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="real-time-mode">Real-time Mode</Label>
                      <Switch
                        id="real-time-mode"
                        checked={config.realTimeMode}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, realTimeMode: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Refresh Interval</Label>
                      <Select
                        value={config.refreshInterval.toString()}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, refreshInterval: parseInt(value) }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5000">5 seconds</SelectItem>
                          <SelectItem value="10000">10 seconds</SelectItem>
                          <SelectItem value="30000">30 seconds</SelectItem>
                          <SelectItem value="60000">1 minute</SelectItem>
                          <SelectItem value="300000">5 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Status Bar */}
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-center gap-4">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <span>•</span>
            <span>Next update: {new Date(lastUpdate.getTime() + config.refreshInterval).toLocaleTimeString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Streaming:
              <div className={`w-2 h-2 rounded-full ml-1 ${isStreaming ? 'bg-green-500' : 'bg-red-500'}`} />
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}