'use client'

import React from 'react'
import { Card, Title, Text, Metric, AreaChart, DonutChart, BarChart } from '@tremor/react'
import { Eye, Users, TrendingUp, Clock, Target, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobAnalyticsProps {
  jobId: string
  data: {
    viewCount: number
    applicationCount: number
    viewTrend?: { date: string; views: number }[]
    applicationTrend?: { date: string; applications: number }[]
    pipelineStats?: {
      stage: string
      count: number
      color?: string
    }[]
    timeToFill?: number
    averageTimeInStage?: {
      stage: string
      days: number
    }[]
  }
  className?: string
}

export function JobAnalytics({ jobId, data, className }: JobAnalyticsProps) {
  const conversionRate = data.viewCount > 0
    ? ((data.applicationCount / data.viewCount) * 100).toFixed(1)
    : '0.0'

  const formatDays = (days: number) => {
    if (days === 1) return '1 day'
    return `${days} days`
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card decoration="top" decorationColor="blue">
          <div className="flex items-start justify-between">
            <div>
              <Text>Total Views</Text>
              <Metric className="mt-2">{data.viewCount.toLocaleString()}</Metric>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="green">
          <div className="flex items-start justify-between">
            <div>
              <Text>Applications</Text>
              <Metric className="mt-2">{data.applicationCount.toLocaleString()}</Metric>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="purple">
          <div className="flex items-start justify-between">
            <div>
              <Text>Conversion Rate</Text>
              <Metric className="mt-2">{conversionRate}%</Metric>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* View and Application Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.viewTrend && data.viewTrend.length > 0 && (
          <Card>
            <Title>View Trends</Title>
            <Text>Daily views over time</Text>
            <AreaChart
              className="h-72 mt-4"
              data={data.viewTrend}
              index="date"
              categories={['views']}
              colors={['blue']}
              valueFormatter={(value) => value.toLocaleString()}
              showLegend={false}
              showGridLines={true}
            />
          </Card>
        )}

        {data.applicationTrend && data.applicationTrend.length > 0 && (
          <Card>
            <Title>Application Trends</Title>
            <Text>Daily applications over time</Text>
            <AreaChart
              className="h-72 mt-4"
              data={data.applicationTrend}
              index="date"
              categories={['applications']}
              colors={['green']}
              valueFormatter={(value) => value.toLocaleString()}
              showLegend={false}
              showGridLines={true}
            />
          </Card>
        )}
      </div>

      {/* Pipeline Distribution */}
      {data.pipelineStats && data.pipelineStats.length > 0 && (
        <Card>
          <Title>Application Pipeline</Title>
          <Text>Distribution of candidates across pipeline stages</Text>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <DonutChart
              className="h-72"
              data={data.pipelineStats}
              category="count"
              index="stage"
              valueFormatter={(value) => `${value} candidates`}
              colors={['blue', 'cyan', 'indigo', 'violet', 'green']}
              showTooltip={true}
              showLegend={true}
            />
            <div className="space-y-3">
              {data.pipelineStats.map((stage, index) => (
                <div
                  key={stage.stage}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        stage.color || 'bg-blue-500'
                      )}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stage.stage}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {stage.count}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {data.applicationCount > 0
                        ? `${((stage.count / data.applicationCount) * 100).toFixed(0)}%`
                        : '0%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Time to Fill and Stage Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.timeToFill !== undefined && (
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <Title>Time to Fill</Title>
                <Text>Average time to hire for this position</Text>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-6">
              <Metric>{formatDays(data.timeToFill)}</Metric>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Industry Average</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDays(30)}
                  </span>
                </div>
                {data.timeToFill < 30 && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Below industry average</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {data.averageTimeInStage && data.averageTimeInStage.length > 0 && (
          <Card>
            <Title>Average Time per Stage</Title>
            <Text>How long candidates spend in each stage</Text>
            <BarChart
              className="h-72 mt-4"
              data={data.averageTimeInStage}
              index="stage"
              categories={['days']}
              colors={['blue']}
              valueFormatter={(value) => `${value} days`}
              showLegend={false}
              showGridLines={true}
              layout="vertical"
            />
          </Card>
        )}
      </div>

      {/* Empty State */}
      {!data.viewTrend &&
        !data.applicationTrend &&
        !data.pipelineStats &&
        data.viewCount === 0 &&
        data.applicationCount === 0 && (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mb-4" />
              <Title>No Analytics Data Yet</Title>
              <Text className="mt-2 max-w-md">
                Analytics will appear here once your job posting receives views and applications.
                Share your job posting to start gathering data.
              </Text>
            </div>
          </Card>
        )}
    </div>
  )
}