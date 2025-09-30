'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  DollarSign,
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Download,
  Share2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'tax_return' | 'payment' | 'meeting' | 'document' | 'communication' | 'milestone';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled';
  metadata?: {
    revenue?: number;
    documentCount?: number;
    participants?: string[];
    relatedEntities?: string[];
  };
  isPredicted?: boolean;
}

export interface TimelineMetrics {
  totalEngagements: number;
  avgResponseTime: number; // hours
  clientSatisfaction: number; // 1-5
  revenueYTD: number;
  documentsProcessed: number;
  lastContact: Date;
}

export interface TimelineEngagementViewProps {
  clientId: string;
  clientName: string;
  events: TimelineEvent[];
  metrics: TimelineMetrics;
  onEventClick?: (event: TimelineEvent) => void;
}

type TimelineScale = 'day' | 'week' | 'month' | 'quarter' | 'year';
type EventFilter = 'all' | 'tax' | 'audit' | 'advisory' | 'communication';

export function TimelineEngagementView({
  clientId,
  clientName,
  events,
  metrics,
  onEventClick,
}: TimelineEngagementViewProps) {
  const [scale, setScale] = useState<TimelineScale>('year');
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [visibleYear, setVisibleYear] = useState(new Date().getFullYear());
  const [zoomLevel, setZoomLevel] = useState(1);

  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollX = useMotionValue(0);

  // Filter events based on selected filter
  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    if (filter === 'tax') return event.type === 'tax_return';
    if (filter === 'communication') return ['meeting', 'communication'].includes(event.type);
    return true;
  });

  // Group events by quarter for year view
  const groupedEvents = groupEventsByPeriod(filteredEvents, scale);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'tax_return':
        return FileText;
      case 'payment':
        return DollarSign;
      case 'meeting':
        return Calendar;
      case 'document':
        return FileText;
      case 'communication':
        return MessageSquare;
      case 'milestone':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'tax_return':
        return 'bg-blue-500';
      case 'payment':
        return 'bg-green-500';
      case 'meeting':
        return 'bg-purple-500';
      case 'document':
        return 'bg-orange-500';
      case 'communication':
        return 'bg-pink-500';
      case 'milestone':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{clientName}</h1>
            <p className="text-sm text-muted-foreground">Client Timeline & Engagement History</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metrics Cards - Mobile Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Total Engagements"
            value={metrics.totalEngagements.toString()}
            icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
          />
          <MetricCard
            label="Avg Response"
            value={`${metrics.avgResponseTime}h`}
            icon={<Clock className="w-4 h-4 text-green-500" />}
          />
          <MetricCard
            label="Satisfaction"
            value={`${metrics.clientSatisfaction}/5`}
            icon={<Sparkles className="w-4 h-4 text-yellow-500" />}
          />
          <MetricCard
            label="Revenue YTD"
            value={`$${(metrics.revenueYTD / 1000).toFixed(0)}K`}
            icon={<DollarSign className="w-4 h-4 text-purple-500" />}
          />
          <MetricCard
            label="Documents"
            value={metrics.documentsProcessed.toString()}
            icon={<FileText className="w-4 h-4 text-orange-500" />}
          />
          <MetricCard
            label="Last Contact"
            value={formatRelativeDate(metrics.lastContact)}
            icon={<MessageSquare className="w-4 h-4 text-pink-500" />}
          />
        </div>

        {/* Timeline Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-base">Timeline Controls</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Scale Selection */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {(['year', 'quarter', 'month'] as TimelineScale[]).map((s) => (
                    <Button
                      key={s}
                      variant={scale === s ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setScale(s)}
                      className="text-xs"
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Filter Selection */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  {(['all', 'tax', 'communication'] as EventFilter[]).map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(f)}
                      className="text-xs"
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Timeline Visualization */}
        <Card>
          <CardContent className="p-6">
            {/* Year Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleYear((prev) => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {visibleYear - 1}
              </Button>
              <h3 className="text-lg font-semibold">{visibleYear} Timeline</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleYear((prev) => prev + 1)}
              >
                {visibleYear + 1}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Timeline Track - Horizontal Scroll on Mobile */}
            <div className="relative overflow-x-auto pb-4" ref={timelineRef}>
              <div
                className="relative min-w-full"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: '0 0' }}
              >
                {/* Timeline Base Line */}
                <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-8">
                  {/* Current Date Indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg z-10"
                    style={{ left: `${getCurrentYearProgress()}%` }}
                  >
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Events on Timeline */}
                <div className="relative">
                  {filteredEvents
                    .filter((event) => event.date.getFullYear() === visibleYear)
                    .map((event, index) => {
                      const position = getEventPosition(event.date, visibleYear);
                      const EventIcon = getEventIcon(event.type);

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="absolute"
                          style={{ left: `${position}%`, top: `${(index % 3) * 60}px` }}
                        >
                          <button
                            onClick={() => handleEventClick(event)}
                            className={cn(
                              'group relative flex flex-col items-center gap-2',
                              'hover:scale-110 transition-transform duration-200'
                            )}
                          >
                            {/* Event Dot */}
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center',
                                'shadow-lg relative',
                                getEventColor(event.type),
                                event.isPredicted && 'ring-2 ring-dashed ring-gray-400'
                              )}
                            >
                              <EventIcon className="w-4 h-4 text-white" />
                              {event.isPredicted && (
                                <div className="absolute -top-1 -right-1">
                                  <Sparkles className="w-3 h-3 text-yellow-500" />
                                </div>
                              )}
                            </div>

                            {/* Event Label - Show on hover/mobile */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 z-20">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[250px]">
                                <p className="text-xs font-semibold truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {event.date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                                {event.metadata?.revenue && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ${event.metadata.revenue.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Connection Line to Base */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-12 bg-gray-300 dark:bg-gray-600" />
                          </button>
                        </motion.div>
                      );
                    })}
                </div>

                {/* Quarter Labels */}
                <div className="flex justify-between mt-24 px-2">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
                    <div key={quarter} className="text-center">
                      <p className="text-xs text-muted-foreground">{quarter}</p>
                      <p className="text-xs text-muted-foreground">
                        {getQuarterMonths(index)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zoom Slider - Mobile Friendly */}
            <div className="flex items-center gap-3 mt-6">
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Event Details Panel - Mobile Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
              onClick={() => setSelectedEvent(null)}
            >
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <EventDetailCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Predictive Insights */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              AI-Powered Predictive Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PredictiveInsight
              date={new Date(Date.now() + 23 * 24 * 60 * 60 * 1000)}
              title="Estimated Tax Payment Q1"
              description="Predicted Amount: $4,200 (based on YTD income)"
              confidence={0.92}
              actions={['Set Reminder', 'Calculate Exact', 'Schedule Payment']}
            />
            <Separator />
            <PredictiveInsight
              date={new Date(Date.now() + 87 * 24 * 60 * 60 * 1000)}
              title="Estimated Tax Payment Q2"
              description="Predicted Amount: $4,500 (seasonal adjustment applied)"
              confidence={0.85}
              actions={['Set Reminder', 'View Forecast']}
            />
            <Separator />
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Pattern Recognition
                  </p>
                  <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                    <li>• Client typically submits documents 15 days before deadline</li>
                    <li>• Best contact time: Tuesdays 2-4 PM (95% response rate)</li>
                    <li>• Revenue trend: +12% YoY (healthy growth)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">{icon}</div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EventDetailCard({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {event.date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Description</p>
          <p className="text-sm text-muted-foreground">{event.description}</p>
        </div>

        {event.metadata?.revenue && (
          <div>
            <p className="text-sm font-medium mb-1">Revenue</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ${event.metadata.revenue.toLocaleString()}
            </p>
          </div>
        )}

        {event.metadata?.documentCount && (
          <div>
            <p className="text-sm font-medium mb-1">Documents</p>
            <p className="text-sm">{event.metadata.documentCount} files processed</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            View Details
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            View Documents
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictiveInsight({
  date,
  title,
  description,
  confidence,
  actions,
}: {
  date: Date;
  title: string;
  description: string;
  confidence: number;
  actions: string[];
}) {
  const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {daysUntil} days
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button key={action} variant="outline" size="sm" className="text-xs">
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Helper Functions
function groupEventsByPeriod(events: TimelineEvent[], scale: TimelineScale) {
  // Implementation would group events by the selected time scale
  return events;
}

function getCurrentYearProgress(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const progress = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

function getEventPosition(date: Date, year: number): number {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const position = ((date.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100;
  return Math.min(Math.max(position, 0), 100);
}

function getQuarterMonths(quarterIndex: number): string {
  const months = [
    ['Jan', 'Feb', 'Mar'],
    ['Apr', 'May', 'Jun'],
    ['Jul', 'Aug', 'Sep'],
    ['Oct', 'Nov', 'Dec'],
  ];
  return months[quarterIndex].join(', ');
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}