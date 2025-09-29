import React from 'react'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { cn } from './utils/cn'
import { Badge } from './Badge'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive?: boolean
    period?: string
  }
  icon?: React.ReactNode
  className?: string
  loading?: boolean
  format?: 'currency' | 'percentage' | 'number'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal' | 'featured'
}

const formatValue = (value: string | number, format?: string): string => {
  if (typeof value === 'string') return value

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value)
    case 'percentage':
      return `${value}%`
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

const getTrendIcon = (isPositive?: boolean) => {
  if (isPositive === undefined) return <Minus className="h-3 w-3" />
  return isPositive ? (
    <TrendingUp className="h-3 w-3" />
  ) : (
    <TrendingDown className="h-3 w-3" />
  )
}

const getTrendColor = (isPositive?: boolean) => {
  if (isPositive === undefined) return 'text-muted-foreground'
  return isPositive ? 'text-green-600' : 'text-red-600'
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon = <BarChart3 className="h-5 w-5" />,
  className,
  loading = false,
  format,
  size = 'md',
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const valueTextClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  const variantClasses = {
    default: 'bg-card border border-border',
    minimal: 'bg-background',
    featured: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20',
  }

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg',
          sizeClasses[size],
          variantClasses[variant],
          'animate-pulse',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-5 w-5 bg-muted rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="h-4 bg-muted rounded w-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200 hover:shadow-md',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground">{icon}</div>
      </div>

      <div className="space-y-2">
        <div className={cn('font-bold text-foreground', valueTextClasses[size])}>
          {formatValue(value, format)}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}

        {trend && (
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                'flex items-center space-x-1 text-sm',
                getTrendColor(trend.isPositive)
              )}
            >
              {getTrendIcon(trend.isPositive)}
              <span className="font-medium">
                {Math.abs(trend.value)}%
              </span>
            </div>
            {trend.period && (
              <span className="text-sm text-muted-foreground">
                vs {trend.period}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}