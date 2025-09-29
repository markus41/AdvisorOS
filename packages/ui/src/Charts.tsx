import React from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { format } from 'date-fns'
import { cn } from './utils/cn'

// Common chart colors
export const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gray: '#6B7280',
}

// Enhanced tooltip component
interface CustomTooltipProps extends TooltipProps<number, string> {
  formatValue?: (value: number) => string
  showLabel?: boolean
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatValue,
  showLabel = true,
}) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[120px]">
      {showLabel && label && (
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">{entry.name}:</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatValue ? formatValue(entry.value as number) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Revenue Chart Component
interface RevenueChartProps {
  data: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  height?: number
  className?: string
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  height = 300,
  className,
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.danger} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColors.danger} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip formatValue={formatCurrency} />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke={chartColors.primary}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Revenue"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stackId="2"
            stroke={chartColors.danger}
            fillOpacity={1}
            fill="url(#colorExpenses)"
            name="Expenses"
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke={chartColors.success}
            strokeWidth={3}
            name="Profit"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Client Distribution Chart
interface ClientDistributionProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  height?: number
  className?: string
}

export const ClientDistributionChart: React.FC<ClientDistributionProps> = ({
  data,
  height = 300,
  className,
}) => {
  const colors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.success,
    chartColors.warning,
    chartColors.info,
    chartColors.danger,
  ]

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Performance Metrics Chart
interface PerformanceMetricsProps {
  data: Array<{
    date: string
    clientsAcquired: number
    tasksCompleted: number
    revenueGenerated: number
  }>
  height?: number
  className?: string
}

export const PerformanceMetricsChart: React.FC<PerformanceMetricsProps> = ({
  data,
  height = 400,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(value)
            }
          />
          <Tooltip
            content={
              <CustomTooltip
                formatValue={(value) =>
                  new Intl.NumberFormat('en-US').format(value)
                }
              />
            }
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="clientsAcquired"
            fill={chartColors.primary}
            name="Clients Acquired"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="left"
            dataKey="tasksCompleted"
            fill={chartColors.success}
            name="Tasks Completed"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenueGenerated"
            stroke={chartColors.warning}
            strokeWidth={3}
            name="Revenue Generated"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Financial Trends Chart
interface FinancialTrendsProps {
  data: Array<{
    quarter: string
    revenue: number
    profit: number
    growth: number
  }>
  height?: number
  className?: string
}

export const FinancialTrendsChart: React.FC<FinancialTrendsProps> = ({
  data,
  height = 350,
  className,
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)

  const formatPercent = (value: number) => `${value}%`

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="quarter"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatPercent}
          />
          <Tooltip
            content={
              <CustomTooltip
                formatValue={(value) => formatCurrency(value)}
              />
            }
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke={chartColors.primary}
            strokeWidth={3}
            dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
            name="Revenue"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="profit"
            stroke={chartColors.success}
            strokeWidth={3}
            dot={{ fill: chartColors.success, strokeWidth: 2, r: 4 }}
            name="Profit"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="growth"
            stroke={chartColors.warning}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: chartColors.warning, strokeWidth: 2, r: 3 }}
            name="Growth %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Chart container with loading and error states
interface ChartContainerProps {
  title: string
  children: React.ReactNode
  loading?: boolean
  error?: string
  className?: string
  actions?: React.ReactNode
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  loading = false,
  error,
  className,
  actions,
}) => {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>Error loading chart: {error}</p>
        </div>
      )}

      {!loading && !error && children}
    </div>
  )
}