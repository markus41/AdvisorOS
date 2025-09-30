'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Bell,
  TrendingUp,
  TrendingDown,
  Download,
  Settings,
  Info,
  ExternalLink,
  ChevronRight,
  Calendar,
  Users,
  Lock,
  Database,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface ComplianceScore {
  overall: number; // 0-100
  sox: number;
  gaap: number;
  dataPrivacy: number;
  auditReadiness: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface ComplianceRisk {
  id: string;
  category: 'data_privacy' | 'financial_reporting' | 'access_controls' | 'audit_trail';
  area: 'client_data' | 'documents' | 'reports' | 'users';
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-10
  description: string;
  recommendation: string;
}

export interface ActionItem {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  dueDate: Date;
  impact: string;
  effort: string;
  steps: string[];
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  source: string;
  publishedDate: Date;
  effectiveDate?: Date;
  impact: 'low' | 'medium' | 'high';
  summary: string;
  url: string;
  isRead: boolean;
}

export interface AuditTrailMetrics {
  totalEvents: number;
  eventsThisMonth: number;
  integrityStatus: 'verified' | 'warning' | 'error';
  lastAudit: Date;
  nextAudit: Date;
  violations: number;
}

export interface VisualComplianceDashboardProps {
  organizationId: string;
  score: ComplianceScore;
  risks: ComplianceRisk[];
  actionItems: ActionItem[];
  updates: RegulatoryUpdate[];
  auditTrail: AuditTrailMetrics;
}

export function VisualComplianceDashboard({
  organizationId,
  score,
  risks,
  actionItems,
  updates,
  auditTrail,
}: VisualComplianceDashboardProps) {
  const [selectedRisk, setSelectedRisk] = useState<ComplianceRisk | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const getScoreLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'EXCELLENT', color: 'text-green-600 dark:text-green-400' };
    if (score >= 80) return { label: 'GOOD', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 70) return { label: 'FAIR', color: 'text-yellow-600 dark:text-yellow-400' };
    if (score >= 60) return { label: 'NEEDS IMPROVEMENT', color: 'text-orange-600 dark:text-orange-400' };
    return { label: 'CRITICAL', color: 'text-red-600 dark:text-red-400' };
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const scoreLevel = getScoreLevel(score.overall);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Organization: {organizationId} • Updated: 2 min ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Certificate
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Audit
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Compliance Health Score - Mobile Optimized */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Compliance Health Score
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Main Score Circle - Responsive Size */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    strokeLinecap="round"
                    className={cn(
                      score.overall >= 90
                        ? 'text-green-500'
                        : score.overall >= 80
                        ? 'text-blue-500'
                        : score.overall >= 70
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    )}
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 80 * (1 - score.overall / 100),
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={cn('text-4xl font-bold', scoreLevel.color)}>{score.overall}%</p>
                  <p className={cn('text-sm font-medium', scoreLevel.color)}>{scoreLevel.label}</p>
                </div>
              </div>

              {/* Score Breakdown - Stack on Mobile */}
              <div className="flex-1 w-full space-y-4">
                <ScoreBar label="SOX Compliance" score={score.sox} icon={<Lock className="w-4 h-4" />} />
                <ScoreBar label="GAAP Standards" score={score.gaap} icon={<FileText className="w-4 h-4" />} />
                <ScoreBar
                  label="Data Privacy"
                  score={score.dataPrivacy}
                  icon={<Shield className="w-4 h-4" />}
                />
                <ScoreBar
                  label="Audit Readiness"
                  score={score.auditReadiness}
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                {score.trend === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : score.trend === 'down' ? (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                ) : (
                  <span className="text-gray-500">—</span>
                )}
                <span className="text-sm font-medium">
                  {score.trend === 'up' ? '+' : score.trend === 'down' ? '-' : ''}
                  {score.trendPercentage}% from last month
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Historical Trend
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Risk Heatmap - Mobile: Collapse to List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Compliance Risk Heatmap</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="lg:hidden"
                >
                  {showHeatmap ? 'List View' : 'Heatmap View'}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop: Heatmap Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left text-sm font-medium"></th>
                    <th className="p-3 text-center text-sm font-medium">Data Privacy</th>
                    <th className="p-3 text-center text-sm font-medium">Financial Reporting</th>
                    <th className="p-3 text-center text-sm font-medium">Access Controls</th>
                    <th className="p-3 text-center text-sm font-medium">Audit Trail</th>
                  </tr>
                </thead>
                <tbody>
                  {['Client Data', 'Documents', 'Financial Reports', 'User Management'].map(
                    (area, rowIndex) => (
                      <tr key={area} className="border-b">
                        <td className="p-3 text-sm font-medium">{area}</td>
                        {['data_privacy', 'financial_reporting', 'access_controls', 'audit_trail'].map(
                          (category, colIndex) => {
                            const risk = risks.find(
                              (r) =>
                                r.area === area.toLowerCase().replace(' ', '_') &&
                                r.category === category
                            ) || { level: 'low', score: 2 };

                            return (
                              <td
                                key={`${rowIndex}-${colIndex}`}
                                className="p-3 text-center cursor-pointer hover:opacity-80"
                                onClick={() => setSelectedRisk(risk as ComplianceRisk)}
                              >
                                <div
                                  className={cn(
                                    'inline-flex items-center justify-center w-20 h-12 rounded text-xs font-medium',
                                    getRiskColor(risk.level)
                                  )}
                                >
                                  {risk.level === 'low' && '🟢'}
                                  {risk.level === 'medium' && '🟡'}
                                  {risk.level === 'high' && '🟠'}
                                  {risk.level === 'critical' && '🔴'}
                                  <span className="ml-1 capitalize">{risk.level}</span>
                                </div>
                              </td>
                            );
                          }
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: Risk List */}
            <div className="lg:hidden space-y-3">
              {risks.slice(0, 5).map((risk) => (
                <motion.div
                  key={risk.id}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setSelectedRisk(risk)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getRiskColor(risk.level)}>
                          {risk.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Risk Score: {risk.score}/10
                        </span>
                      </div>
                      <p className="text-sm font-medium capitalize">
                        {risk.category.replace('_', ' ')} • {risk.area.replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Low Risk (0-3)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span>Medium Risk (4-6)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>High Risk (7-10)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items - Mobile: Collapsible Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Action Items ({actionItems.filter((a) => a.status !== 'completed').length} requiring
                attention)
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionItems.slice(0, 3).map((item) => (
              <ActionItemCard key={item.id} item={item} onClick={setSelectedAction} />
            ))}
          </CardContent>
        </Card>

        {/* Two Column: Regulatory Updates + Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Regulatory Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                Regulatory Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">🆕 New This Week: {updates.filter((u) => !u.isRead).length}</span>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    Mark All Read
                  </Button>
                </div>
                <Separator />
                {updates.slice(0, 3).map((update) => (
                  <div
                    key={update.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                      !update.isRead && 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{update.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{update.source}</p>
                      </div>
                      <Badge
                        variant={
                          update.impact === 'high'
                            ? 'destructive'
                            : update.impact === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs flex-shrink-0"
                      >
                        {update.impact}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        Read Summary
                      </Button>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        View Impact
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  View All Updates
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail Integrity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-green-500" />
                Audit Trail Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Events Logged</span>
                  <span className="text-sm font-semibold">
                    {auditTrail.totalEvents.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Events This Month</span>
                  <span className="text-sm font-semibold">
                    {auditTrail.eventsThisMonth.toLocaleString()}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No integrity violations detected</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>All events properly attributed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Encryption verified</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Backup verification passed</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Audit</span>
                  <span className="font-medium">
                    {auditTrail.lastAudit.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Audit</span>
                  <span className="font-medium">
                    {auditTrail.nextAudit.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  View Trail
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Export Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Item Detail Modal */}
        <AnimatePresence>
          {selectedAction && (
            <ActionItemModal action={selectedAction} onClose={() => setSelectedAction(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper Components
function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

function ActionItemCard({
  item,
  onClick,
}: {
  item: ActionItem;
  onClick: (item: ActionItem) => void;
}) {
  const daysUntil = Math.ceil((item.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      onClick={() => onClick(item)}
    >
      <div className="flex items-start gap-3">
        {getPriorityIcon(item.priority)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={
                item.priority === 'critical' || item.priority === 'high'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-xs"
            >
              {item.priority.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">Due in {daysUntil} days</span>
          </div>
          <p className="text-sm font-medium mb-1">{item.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Impact: {item.impact}</span>
            <span>Effort: {item.effort}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.div>
  );
}

function ActionItemModal({ action, onClose }: { action: ActionItem; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Priority</p>
                <Badge
                  variant={
                    action.priority === 'critical' || action.priority === 'high'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {action.priority.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Due Date</p>
                <p className="text-sm">
                  {action.dueDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Impact</p>
                <p className="text-sm">{action.impact}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Effort</p>
                <p className="text-sm">{action.effort}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">Recommended Steps</p>
              <ol className="space-y-2">
                {action.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">Start Wizard</Button>
              <Button variant="outline" className="flex-1">
                Delegate
              </Button>
              <Button variant="ghost">Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'medium':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}