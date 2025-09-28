'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Calendar,
  User
} from 'lucide-react';

interface SuggestionAction {
  id: string;
  title: string;
  description: string;
  type: 'immediate' | 'short_term' | 'long_term';
  estimatedEffort: 'low' | 'medium' | 'high';
  resources?: string[];
  deadline?: Date;
}

interface SuggestionMetric {
  name: string;
  current?: number;
  target: number;
  timeframe: string;
  format?: 'currency' | 'percentage' | 'number';
}

interface Suggestion {
  id: string;
  type: 'optimization' | 'deduction' | 'compliance' | 'growth' | 'risk_mitigation' | 'efficiency';
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: {
    financial?: number;
    timeframe: string;
    description: string;
  };
  implementation: {
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: string;
    requirements: string[];
    actions: SuggestionAction[];
  };
  metrics?: SuggestionMetric[];
  tags?: string[];
  source: string;
  createdAt: Date;
  assignee?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
  onAssign?: (suggestionId: string, assignee: string) => void;
  onFeedback?: (suggestionId: string, feedback: 'positive' | 'negative', comment?: string) => void;
  className?: string;
  compact?: boolean;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onAssign,
  onFeedback,
  className,
  compact = false
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <TrendingUp className="h-4 w-4" />;
      case 'deduction':
        return <DollarSign className="h-4 w-4" />;
      case 'compliance':
        return <AlertTriangle className="h-4 w-4" />;
      case 'growth':
        return <Target className="h-4 w-4" />;
      case 'risk_mitigation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'efficiency':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'optimization':
        return 'bg-blue-100 text-blue-800';
      case 'deduction':
        return 'bg-green-100 text-green-800';
      case 'compliance':
        return 'bg-red-100 text-red-800';
      case 'growth':
        return 'bg-purple-100 text-purple-800';
      case 'risk_mitigation':
        return 'bg-orange-100 text-orange-800';
      case 'efficiency':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return '🟢';
      case 'moderate':
        return '🟡';
      case 'complex':
        return '🔴';
      default:
        return '⚪';
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

  const handleAccept = () => {
    onAccept?.(suggestion.id);
  };

  const handleDismiss = () => {
    onDismiss?.(suggestion.id);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    onFeedback?.(suggestion.id, type);
    setShowFeedback(false);
  };

  if (compact) {
    return (
      <Card className={`${className} cursor-pointer hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${getTypeColor(suggestion.type)}`}>
              {getTypeIcon(suggestion.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium truncate">{suggestion.title}</h4>
                <Badge variant={getPriorityColor(suggestion.priority) as any} className="ml-2">
                  {suggestion.priority}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {suggestion.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {suggestion.impact.financial && (
                    <span>{formatValue(suggestion.impact.financial, 'currency')}</span>
                  )}
                  <span>{suggestion.impact.timeframe}</span>
                  <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
                </div>

                <Button size="sm" variant="outline" onClick={handleAccept}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${getTypeColor(suggestion.type)}`}>
              {getTypeIcon(suggestion.type)}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                <Badge variant={getPriorityColor(suggestion.priority) as any}>
                  {suggestion.priority}
                </Badge>
              </div>

              <CardDescription className="text-sm">
                {suggestion.category} • Generated by {suggestion.source}
              </CardDescription>

              {suggestion.tags && suggestion.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {suggestion.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <div className="text-gray-500">Confidence</div>
              <div className="font-medium">{Math.round(suggestion.confidence * 100)}%</div>
            </div>
            <Progress
              value={suggestion.confidence * 100}
              className="w-16 h-2"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-gray-700">{suggestion.description}</p>

        {/* Impact Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Expected Impact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestion.impact.financial && (
              <div>
                <div className="text-xs text-gray-500">Financial Impact</div>
                <div className="font-medium text-green-600">
                  {formatValue(suggestion.impact.financial, 'currency')}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500">Timeframe</div>
              <div className="font-medium">{suggestion.impact.timeframe}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Complexity</div>
              <div className="flex items-center gap-1">
                <span>{getComplexityIcon(suggestion.implementation.complexity)}</span>
                <span className="font-medium capitalize">{suggestion.implementation.complexity}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{suggestion.impact.description}</p>
        </div>

        {/* Metrics */}
        {suggestion.metrics && suggestion.metrics.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Target Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestion.metrics.map((metric, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className="text-xs text-gray-500">{metric.timeframe}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {metric.current && (
                      <>
                        <span className="text-sm text-gray-500">
                          {formatValue(metric.current, metric.format)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </>
                    )}
                    <span className="text-sm font-medium text-green-600">
                      {formatValue(metric.target, metric.format)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="font-medium">Implementation Details</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 mt-4">
            {/* Requirements */}
            <div>
              <h5 className="font-medium text-sm mb-2">Requirements</h5>
              <ul className="space-y-1">
                {suggestion.implementation.requirements.map((req, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div>
              <h5 className="font-medium text-sm mb-2">Action Steps</h5>
              <div className="space-y-3">
                {suggestion.implementation.actions.map((action, index) => (
                  <div key={action.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h6 className="font-medium text-sm">{action.title}</h6>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {action.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {action.estimatedEffort} effort
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {action.resources && action.resources.length > 0 && (
                          <span>Resources: {action.resources.join(', ')}</span>
                        )}
                        {action.deadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {action.deadline.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <span>Estimated Time: {suggestion.implementation.estimatedTime}</span>
              <span>Created: {suggestion.createdAt.toLocaleDateString()}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Assignment & Status */}
        {suggestion.assignee && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Assigned to: {suggestion.assignee}</span>
            {suggestion.status && (
              <Badge variant="outline" className="ml-auto">
                {suggestion.status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowFeedback(!showFeedback)}
              variant="outline"
              className="gap-1"
            >
              <ThumbsUp className="h-3 w-3" />
              Feedback
            </Button>

            {showFeedback && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('positive')}
                  className="gap-1"
                >
                  <ThumbsUp className="h-3 w-3" />
                  Helpful
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback('negative')}
                  className="gap-1"
                >
                  <ThumbsDown className="h-3 w-3" />
                  Not Helpful
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDismiss && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            )}

            {onAccept && (
              <Button
                size="sm"
                onClick={handleAccept}
                className="gap-1"
              >
                Accept Suggestion
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}