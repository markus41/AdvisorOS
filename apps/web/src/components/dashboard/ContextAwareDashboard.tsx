'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LayoutGrid,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  ChevronRight,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  priority: number;
  gridPosition: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  data?: any;
}

interface AIRecommendation {
  id: string;
  type: 'urgent_task' | 'bottleneck_alert' | 'optimization' | 'quick_win';
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  impact: 'high' | 'medium' | 'low';
  actionUrl: string;
  aiConfidence: number; // 0-1
  reasoning: string[];
}

interface PriorityAction {
  id: string;
  title: string;
  urgency: 'urgent' | 'today' | 'this_week';
  estimatedTime: number;
  clientName?: string;
  actionType: string;
  dueDate?: Date;
}

interface DashboardContext {
  userId: string;
  role: 'owner' | 'admin' | 'cpa' | 'staff';
  currentSeason: 'tax_season' | 'audit_season' | 'normal';
  workloadCapacity: number; // percentage
  upcomingDeadlines: number;
}

interface ContextAwareDashboardProps {
  context: DashboardContext;
  onWidgetClick?: (widgetId: string) => void;
  onRecommendationAction?: (recommendationId: string) => void;
}

export function ContextAwareDashboard({
  context,
  onWidgetClick,
  onRecommendationAction,
}: ContextAwareDashboardProps) {
  const [isAIMinimized, setIsAIMinimized] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [context]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate AI-powered recommendation generation
      const mockRecommendations: AIRecommendation[] = [
        {
          id: '1',
          type: 'urgent_task',
          priority: 1,
          title: 'Johnson LLC Tax Return',
          description: 'You have 3 tax returns due tomorrow. Start with Johnson LLC (highest priority, missing Schedule C)',
          estimatedTime: 180,
          impact: 'high',
          actionUrl: '/dashboard/tax-returns/johnson-llc',
          aiConfidence: 0.94,
          reasoning: [
            'Due date is tomorrow',
            'Schedule C still incomplete',
            'Client has high revenue ($2.4M)',
            'Historical pattern: you prefer to complete high-value returns first',
          ],
        },
        {
          id: '2',
          type: 'bottleneck_alert',
          priority: 2,
          title: 'Document Review Bottleneck',
          description: 'You have 12 documents pending review. This is blocking 5 tax returns.',
          estimatedTime: 90,
          impact: 'high',
          actionUrl: '/dashboard/documents?filter=pending-review',
          aiConfidence: 0.89,
          reasoning: [
            '12 documents in queue',
            '5 tax returns dependent on these reviews',
            'Average review time: 7.5 minutes per document',
          ],
        },
        {
          id: '3',
          type: 'quick_win',
          priority: 3,
          title: 'Approve 5 Expense Reports',
          description: 'Quick 15-minute task that will unblock your team',
          estimatedTime: 15,
          impact: 'medium',
          actionUrl: '/dashboard/approvals',
          aiConfidence: 0.97,
          reasoning: [
            'All expense reports under $500 (within auto-approve threshold)',
            'Team members waiting for reimbursement',
            'High confidence - all have proper documentation',
          ],
        },
      ];

      const mockPriorityActions: PriorityAction[] = [
        {
          id: '1',
          title: 'Johnson LLC Tax Return',
          urgency: 'urgent',
          estimatedTime: 180,
          clientName: 'Johnson LLC',
          actionType: 'tax_return',
          dueDate: new Date(Date.now() + 86400000), // Tomorrow
        },
        {
          id: '2',
          title: 'Review 12 documents for Smithco',
          urgency: 'today',
          estimatedTime: 90,
          clientName: 'Smithco Industries',
          actionType: 'document_review',
        },
        {
          id: '3',
          title: 'Q4 Financial Analysis (3 hrs)',
          urgency: 'this_week',
          estimatedTime: 180,
          clientName: 'Acme Corp',
          actionType: 'financial_analysis',
        },
      ];

      setRecommendations(mockRecommendations);
      setPriorityActions(mockPriorityActions);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-500';
      case 'today':
        return 'bg-yellow-500';
      case 'this_week':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return { icon: AlertTriangle, label: 'URGENT', variant: 'destructive' as const };
      case 'today':
        return { icon: Clock, label: 'TODAY', variant: 'default' as const };
      case 'this_week':
        return { icon: CheckCircle, label: 'THIS WEEK', variant: 'secondary' as const };
      default:
        return { icon: Clock, label: 'PENDING', variant: 'outline' as const };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading your personalized dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* AI Assistant Card */}
        <AnimatePresence>
          <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI Assistant</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {context.currentSeason === 'tax_season'
                          ? 'Tax Season Mode'
                          : context.currentSeason === 'audit_season'
                          ? 'Audit Season Mode'
                          : 'Standard Mode'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAIMinimized(!isAIMinimized)}
                  >
                    {isAIMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {!isAIMinimized && (
                <CardContent className="space-y-4">
                  {/* Top Recommendation */}
                  {recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {recommendations[0].description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {recommendations[0].estimatedTime} min
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(recommendations[0].aiConfidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Workload & Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Workload</span>
                        <span className="text-sm text-muted-foreground">
                          {context.workloadCapacity}% capacity
                        </span>
                      </div>
                      <Progress value={context.workloadCapacity} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">38 hrs this week</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Bottlenecks</span>
                        <Badge variant="destructive" className="text-xs">
                          1 found
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Document reviews (12 pending)
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="default" className="text-xs">
                      View Recommendations
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Delegate Tasks
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Optimize Schedule
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Priority Actions Grid - Mobile First */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Priority Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Priority Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorityActions.map((action, index) => {
                const urgencyBadge = getUrgencyBadge(action.urgency);
                const UrgencyIcon = urgencyBadge.icon;

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => onWidgetClick?.(action.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0',
                          getUrgencyColor(action.urgency)
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={urgencyBadge.variant} className="text-xs">
                            <UrgencyIcon className="w-3 h-3 mr-1" />
                            {urgencyBadge.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{action.title}</p>
                        {action.clientName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {action.clientName}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full mt-2 h-8 text-xs"
                        >
                          Start Now
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Today's Focus */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <TimeBlock
                  time="9:00 AM - 10:30 AM"
                  title="Client Meeting"
                  subtitle="Acme Corp"
                  type="meeting"
                />
                <TimeBlock
                  time="11:00 AM - 1:00 PM"
                  title="Deep Work Block"
                  subtitle="Document Reviews"
                  type="focus"
                />
                <TimeBlock
                  time="2:00 PM - 3:00 PM"
                  title="Team Standup"
                  subtitle="Weekly sync"
                  type="meeting"
                />
                <TimeBlock
                  time="3:30 PM - 5:00 PM"
                  title="Johnson Tax Return"
                  subtitle="Form 1120-S completion"
                  type="task"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Win */}
          <Card className="lg:col-span-1 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                Quick Win
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium mb-1">15 minutes</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Approve 5 expense reports
                </p>
                <Button size="sm" className="w-full">
                  Do it now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Real-Time Metrics
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto-refresh: 30s</span>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Active Clients"
                value="47"
                progress={76}
                trend="+3"
                trendLabel="vs last month"
              />
              <MetricCard
                label="Revenue This Month"
                value="$127,340"
                progress={84}
                trend="+$12K"
                trendLabel="84% of goal"
              />
              <MetricCard
                label="Documents Processed"
                value="234"
                progress={100}
                trend="-15%"
                trendLabel="processing time"
                trendPositive={true}
              />
              <MetricCard
                label="Avg Response Time"
                value="2.3 hrs"
                progress={92}
                trend="-0.5h"
                trendLabel="vs last week"
                trendPositive={true}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper Components
function TimeBlock({
  time,
  title,
  subtitle,
  type,
}: {
  time: string;
  title: string;
  subtitle: string;
  type: 'meeting' | 'focus' | 'task';
}) {
  const typeColors = {
    meeting: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
    focus: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30',
    task: 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
  };

  return (
    <div className={cn('border-l-4 p-3 rounded-r-lg', typeColors[type])}>
      <p className="text-xs text-muted-foreground mb-1">{time}</p>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  progress,
  trend,
  trendLabel,
  trendPositive = true,
}: {
  label: string;
  value: string;
  progress: number;
  trend: string;
  trendLabel: string;
  trendPositive?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <Progress value={progress} className="h-1.5" />
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'text-xs font-medium',
            trendPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {trend}
        </span>
        <span className="text-xs text-muted-foreground">{trendLabel}</span>
      </div>
    </div>
  );
}