/**
 * AdvisorOS Multi-Agent Parallel Execution Framework
 * Dependency Tracking Dashboard Component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Users,
  TrendingUp,
  GitBranch,
  Zap
} from 'lucide-react';
import { orchestrator, AgentTask, WaveConfiguration, Risk } from '../agent-coordination-system';

interface DashboardProps {
  refreshInterval?: number;
}

const statusColors = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  blocked: '#8b5cf6'
};

const statusIcons = {
  pending: Clock,
  in_progress: PlayCircle,
  completed: CheckCircle,
  failed: XCircle,
  blocked: PauseCircle
};

const riskColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626'
};

export function DependencyTrackingDashboard({ refreshInterval = 30000 }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedWave, setSelectedWave] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      try {
        const data = orchestrator.getDashboardData();
        setDashboardData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { projectMetrics, waves, readyTasks, criticalPath, risks, dailyStandup } = dashboardData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AdvisorOS Multi-Agent Execution Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time coordination and dependency tracking across all agent workstreams
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(projectMetrics.overallProgress)}%</div>
            <Progress value={projectMetrics.overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {projectMetrics.completedTasks} of {projectMetrics.totalTasks} tasks complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectMetrics.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {readyTasks.length} ready to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockers</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{projectMetrics.blockedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {projectMetrics.currentRisks.length} active risks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Completion</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectMetrics.estimatedCompletion.toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current velocity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Risks Alert */}
      {projectMetrics.currentRisks.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Active Risks Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            {projectMetrics.currentRisks.length} risk(s) require attention.
            Check the Risk Management tab for details.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="waves" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waves">Wave Progress</TabsTrigger>
          <TabsTrigger value="tasks">Task Details</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="risks">Risk Management</TabsTrigger>
          <TabsTrigger value="standup">Daily Standup</TabsTrigger>
        </TabsList>

        {/* Wave Progress Tab */}
        <TabsContent value="waves" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wave Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Wave Completion Status</CardTitle>
                <CardDescription>Progress across all execution waves</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={waves.map(wave => ({
                    name: `Wave ${wave.waveNumber}`,
                    completed: wave.tasks.filter(t => t.status === 'completed').length,
                    total: wave.tasks.length,
                    progress: (wave.tasks.filter(t => t.status === 'completed').length / wave.tasks.length) * 100
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="progress" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Wave Details */}
            <Card>
              <CardHeader>
                <CardTitle>Wave Details</CardTitle>
                <CardDescription>Detailed status for each execution wave</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {waves.map((wave: WaveConfiguration) => (
                    <div key={wave.waveNumber} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Wave {wave.waveNumber}: {wave.name}</h3>
                        <Badge
                          variant={wave.status === 'completed' ? 'default' : 'secondary'}
                          className={`${
                            wave.status === 'completed' ? 'bg-green-100 text-green-800' :
                            wave.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            wave.status === 'blocked' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {wave.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{wave.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {wave.tasks.filter(t => t.status === 'completed').length} / {wave.tasks.length} tasks
                        </span>
                      </div>
                      <Progress
                        value={(wave.tasks.filter(t => t.status === 'completed').length / wave.tasks.length) * 100}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Task Details Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: projectMetrics.completedTasks, color: statusColors.completed },
                        { name: 'In Progress', value: projectMetrics.inProgressTasks, color: statusColors.in_progress },
                        { name: 'Blocked', value: projectMetrics.blockedTasks, color: statusColors.blocked },
                        { name: 'Pending', value: projectMetrics.totalTasks - projectMetrics.completedTasks - projectMetrics.inProgressTasks - projectMetrics.blockedTasks, color: statusColors.pending }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { name: 'Completed', value: projectMetrics.completedTasks, color: statusColors.completed },
                        { name: 'In Progress', value: projectMetrics.inProgressTasks, color: statusColors.in_progress },
                        { name: 'Blocked', value: projectMetrics.blockedTasks, color: statusColors.blocked },
                        { name: 'Pending', value: projectMetrics.totalTasks - projectMetrics.completedTasks - projectMetrics.inProgressTasks - projectMetrics.blockedTasks, color: statusColors.pending }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ready Tasks */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Ready to Start ({readyTasks.length})
                </CardTitle>
                <CardDescription>Tasks with all dependencies satisfied</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {readyTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks ready to start</p>
                  ) : (
                    readyTasks.map((task: AgentTask) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{task.name}</h4>
                          <p className="text-sm text-muted-foreground">Wave {task.wave} • {task.estimatedHours}h estimated</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.agentType}</Badge>
                          <Badge
                            className={`${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Critical Path Analysis
              </CardTitle>
              <CardDescription>
                Tasks on the critical path that determine overall project completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalPath.map((task: AgentTask, index: number) => {
                  const StatusIcon = statusIcons[task.status];
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                        <StatusIcon
                          className={`h-4 w-4`}
                          style={{ color: statusColors[task.status] }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Wave {task.wave} • {task.estimatedHours}h • {task.agentType}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={task.progressPercentage} className="w-24" />
                        <span className="text-sm font-medium">{task.progressPercentage}%</span>
                      </div>
                      <Badge
                        className={`${
                          task.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          task.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.riskLevel} risk
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Management Tab */}
        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Risks</CardTitle>
                <CardDescription>Risks requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectMetrics.currentRisks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active risks identified</p>
                  ) : (
                    projectMetrics.currentRisks.map((risk: Risk) => (
                      <div key={risk.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{risk.description}</h4>
                          <Badge
                            className={`${
                              risk.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{risk.impact}</p>
                        <div className="text-sm">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Owner: {risk.owner} • {risk.type}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Risk distribution and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: projectMetrics.currentRisks.filter(r => r.severity === 'critical').length, color: riskColors.critical },
                        { name: 'High', value: projectMetrics.currentRisks.filter(r => r.severity === 'high').length, color: riskColors.high },
                        { name: 'Medium', value: projectMetrics.currentRisks.filter(r => r.severity === 'medium').length, color: riskColors.medium },
                        { name: 'Low', value: projectMetrics.currentRisks.filter(r => r.severity === 'low').length, color: riskColors.low }
                      ].filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {[
                        { name: 'Critical', value: projectMetrics.currentRisks.filter(r => r.severity === 'critical').length, color: riskColors.critical },
                        { name: 'High', value: projectMetrics.currentRisks.filter(r => r.severity === 'high').length, color: riskColors.high },
                        { name: 'Medium', value: projectMetrics.currentRisks.filter(r => r.severity === 'medium').length, color: riskColors.medium },
                        { name: 'Low', value: projectMetrics.currentRisks.filter(r => r.severity === 'low').length, color: riskColors.low }
                      ].filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Standup Tab */}
        <TabsContent value="standup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Completed Yesterday
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyStandup.completedYesterday.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks completed yesterday</p>
                  ) : (
                    dailyStandup.completedYesterday.map((task: any) => (
                      <div key={task.id} className="text-sm">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-muted-foreground">Wave {task.wave}</div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                  Working On Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyStandup.workingOnToday.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active tasks today</p>
                  ) : (
                    dailyStandup.workingOnToday.map((task: any) => (
                      <div key={task.id} className="space-y-1">
                        <div className="text-sm font-medium">{task.name}</div>
                        <div className="text-xs text-muted-foreground">Wave {task.wave}</div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Blockers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyStandup.blockers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No blockers identified</p>
                  ) : (
                    dailyStandup.blockers.map((task: any) => (
                      <div key={task.id} className="text-sm">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-muted-foreground">Wave {task.wave}</div>
                        {task.blockedBy.length > 0 && (
                          <div className="text-xs text-red-600">
                            Blocked by: {task.blockedBy.join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}