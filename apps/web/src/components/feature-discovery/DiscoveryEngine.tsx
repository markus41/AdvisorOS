'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  X,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  Play,
  Pause,
  Skip,
  BookOpen,
  Video,
  FileText,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFeatureTracking } from '@/lib/feature-analytics/tracker'

interface FeatureSpotlight {
  id: string
  featureId: string
  title: string
  description: string
  benefits: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  confidence: number
  targetElement?: string
  position: 'top' | 'bottom' | 'left' | 'right'
  type: 'tooltip' | 'modal' | 'banner' | 'tour'
  triggerCondition: string
  dismissible: boolean
  frequency: 'once' | 'daily' | 'weekly' | 'session'
  expiresAt?: Date
}

interface ContextualHint {
  id: string
  featureId: string
  content: string
  triggerEvent: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  delay: number
  duration: number
  showOnce: boolean
}

interface OnboardingTour {
  id: string
  name: string
  description: string
  steps: TourStep[]
  targetSegment: string[]
  isActive: boolean
  completionRate: number
  averageDuration: number
}

interface TourStep {
  id: string
  title: string
  content: string
  targetElement: string
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: string
  optional: boolean
  helpResource?: string
}

interface SmartRecommendation {
  id: string
  type: 'feature' | 'workflow' | 'integration' | 'optimization'
  title: string
  description: string
  reasoning: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  cta: string
  ctaAction: () => void
  dismissAction?: () => void
}

interface DiscoveryEngineProps {
  userId: string
  userSegment: string
  currentPage: string
  features: string[]
  onFeatureDiscovered?: (featureId: string) => void
  onTooltipInteraction?: (action: string, featureId: string) => void
}

const mockSpotlights: FeatureSpotlight[] = [
  {
    id: 'ai-insights-spotlight',
    featureId: 'ai-insights',
    title: 'Unlock AI-Powered Insights',
    description: 'Get intelligent analysis of your client data with automated insights and recommendations.',
    benefits: [
      'Save 2+ hours per week on analysis',
      'Identify trends automatically',
      'Get actionable recommendations'
    ],
    priority: 'high',
    confidence: 0.85,
    targetElement: '#ai-insights-menu',
    position: 'right',
    type: 'tooltip',
    triggerCondition: 'page_view_count > 5 && !used_ai_insights',
    dismissible: true,
    frequency: 'daily'
  },
  {
    id: 'workflow-automation-banner',
    featureId: 'workflow-automation',
    title: 'Automate Your Routine Tasks',
    description: 'Set up automated workflows to handle repetitive processes and focus on high-value work.',
    benefits: [
      'Reduce manual work by 60%',
      'Ensure consistency',
      'Never miss deadlines'
    ],
    priority: 'medium',
    confidence: 0.72,
    position: 'top',
    type: 'banner',
    triggerCondition: 'daily_tasks > 10 && !uses_automation',
    dismissible: true,
    frequency: 'weekly'
  }
]

const mockTours: OnboardingTour[] = [
  {
    id: 'new-user-tour',
    name: 'Welcome to AdvisorOS',
    description: 'A quick tour of the essential features to get you started',
    targetSegment: ['new_user'],
    isActive: true,
    completionRate: 78,
    averageDuration: 180,
    steps: [
      {
        id: 'step-1',
        title: 'Welcome to Your Dashboard',
        content: 'This is your central hub where you can see all your key metrics and recent activity.',
        targetElement: '#dashboard-overview',
        position: 'bottom',
        optional: false
      },
      {
        id: 'step-2',
        title: 'Client Management',
        content: 'Manage all your clients, their documents, and communications in one place.',
        targetElement: '#clients-menu',
        position: 'right',
        action: 'Click to explore',
        optional: false
      },
      {
        id: 'step-3',
        title: 'Document Processing',
        content: 'Upload documents and let AI extract key information automatically.',
        targetElement: '#documents-menu',
        position: 'right',
        optional: false
      },
      {
        id: 'step-4',
        title: 'Smart Insights',
        content: 'Get AI-powered insights about your practice and clients.',
        targetElement: '#analytics-menu',
        position: 'right',
        optional: true,
        helpResource: '/help/analytics'
      }
    ]
  }
]

const mockRecommendations: SmartRecommendation[] = [
  {
    id: 'rec-1',
    type: 'feature',
    title: 'Try QuickBooks Integration',
    description: 'Sync your financial data automatically to save hours of manual entry.',
    reasoning: 'You have multiple clients and frequently work with financial documents',
    confidence: 0.89,
    impact: 'high',
    effort: 'low',
    cta: 'Set Up Integration',
    ctaAction: () => console.log('Navigate to QuickBooks setup')
  },
  {
    id: 'rec-2',
    type: 'workflow',
    title: 'Automate Document Reviews',
    description: 'Create a workflow to automatically organize and categorize uploaded documents.',
    reasoning: 'You process 20+ documents weekly with similar patterns',
    confidence: 0.76,
    impact: 'medium',
    effort: 'medium',
    cta: 'Create Workflow',
    ctaAction: () => console.log('Open workflow builder')
  }
]

export function DiscoveryEngine({
  userId,
  userSegment,
  currentPage,
  features,
  onFeatureDiscovered,
  onTooltipInteraction
}: DiscoveryEngineProps) {
  const [activeSpotlight, setActiveSpotlight] = useState<FeatureSpotlight | null>(null)
  const [activeTour, setActiveTour] = useState<OnboardingTour | null>(null)
  const [currentTourStep, setCurrentTourStep] = useState(0)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [dismissedItems, setDismissedItems] = useState<Set<string>>(new Set())
  const [isDiscoveryEnabled, setIsDiscoveryEnabled] = useState(true)
  const [contextualHints, setContextualHints] = useState<ContextualHint[]>([])

  const { trackView, trackClick, trackComplete } = useFeatureTracking('discovery-engine')

  useEffect(() => {
    trackView({ page: currentPage, segment: userSegment })

    if (isDiscoveryEnabled) {
      checkForSpotlights()
      checkForTours()
      loadContextualHints()
    }
  }, [currentPage, isDiscoveryEnabled])

  const checkForSpotlights = () => {
    const eligibleSpotlights = mockSpotlights.filter(spotlight =>
      !dismissedItems.has(spotlight.id) &&
      evaluateTriggerCondition(spotlight.triggerCondition) &&
      (!spotlight.expiresAt || spotlight.expiresAt > new Date())
    )

    if (eligibleSpotlights.length > 0) {
      const highestPriority = eligibleSpotlights.reduce((prev, current) =>
        getPriorityWeight(current.priority) > getPriorityWeight(prev.priority) ? current : prev
      )
      setActiveSpotlight(highestPriority)
    }
  }

  const checkForTours = () => {
    const eligibleTours = mockTours.filter(tour =>
      tour.isActive &&
      tour.targetSegment.includes(userSegment) &&
      !dismissedItems.has(tour.id)
    )

    if (eligibleTours.length > 0 && !activeTour) {
      setActiveTour(eligibleTours[0])
      setCurrentTourStep(0)
    }
  }

  const loadContextualHints = () => {
    // Load contextual hints based on current context
    // This would be populated from backend based on user behavior patterns
  }

  const evaluateTriggerCondition = (condition: string): boolean => {
    // Simple condition evaluation - in production, this would be more sophisticated
    return Math.random() > 0.7
  }

  const getPriorityWeight = (priority: string): number => {
    const weights = { urgent: 4, high: 3, medium: 2, low: 1 }
    return weights[priority as keyof typeof weights] || 1
  }

  const handleSpotlightInteraction = (action: 'viewed' | 'clicked' | 'dismissed', spotlight: FeatureSpotlight) => {
    trackClick({ action, featureId: spotlight.featureId, spotlightId: spotlight.id })
    onTooltipInteraction?.(action, spotlight.featureId)

    if (action === 'clicked') {
      onFeatureDiscovered?.(spotlight.featureId)
      setActiveSpotlight(null)
    } else if (action === 'dismissed') {
      setDismissedItems(prev => new Set([...prev, spotlight.id]))
      setActiveSpotlight(null)
    }
  }

  const handleTourNavigation = (action: 'next' | 'prev' | 'skip' | 'complete') => {
    if (!activeTour) return

    trackClick({ action, tourId: activeTour.id, step: currentTourStep })

    switch (action) {
      case 'next':
        if (currentTourStep < activeTour.steps.length - 1) {
          setCurrentTourStep(prev => prev + 1)
        } else {
          handleTourNavigation('complete')
        }
        break
      case 'prev':
        if (currentTourStep > 0) {
          setCurrentTourStep(prev => prev - 1)
        }
        break
      case 'skip':
      case 'complete':
        trackComplete({ tourId: activeTour.id, completed: action === 'complete' })
        setActiveTour(null)
        setCurrentTourStep(0)
        setDismissedItems(prev => new Set([...prev, activeTour.id]))
        break
    }
  }

  const handleRecommendationAction = (recommendation: SmartRecommendation, action: 'cta' | 'dismiss') => {
    trackClick({ action, recommendationId: recommendation.id, type: recommendation.type })

    if (action === 'cta') {
      recommendation.ctaAction()
    } else if (action === 'dismiss') {
      recommendation.dismissAction?.()
      setDismissedItems(prev => new Set([...prev, recommendation.id]))
    }
  }

  return (
    <TooltipProvider>
      <div className="discovery-engine">
        {/* Discovery Controls */}
        <div className="fixed top-4 right-4 z-50">
          <Card className="w-64">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Discovery</span>
                </div>
                <Switch
                  checked={isDiscoveryEnabled}
                  onCheckedChange={setIsDiscoveryEnabled}
                />
              </div>
            </CardHeader>
            {isDiscoveryEnabled && (
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Active Hints:</span>
                    <span>{contextualHints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tour Progress:</span>
                    <span>
                      {activeTour ? `${currentTourStep + 1}/${activeTour.steps.length}` : 'None'}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Feature Spotlight */}
        <AnimatePresence>
          {activeSpotlight && isDiscoveryEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
              onClick={() => handleSpotlightInteraction('dismissed', activeSpotlight)}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <Badge variant="outline">{activeSpotlight.priority} priority</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSpotlightInteraction('dismissed', activeSpotlight)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {activeSpotlight.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {activeSpotlight.description}
                </p>

                <div className="space-y-2 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white">Benefits:</h4>
                  <ul className="space-y-1">
                    {activeSpotlight.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {Math.round(activeSpotlight.confidence * 100)}% confidence
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSpotlightInteraction('dismissed', activeSpotlight)}
                    >
                      Maybe Later
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSpotlightInteraction('clicked', activeSpotlight)}
                    >
                      Try It Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Tour */}
        <AnimatePresence>
          {activeTour && isDiscoveryEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/30"
            >
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full mx-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {currentTourStep + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {activeTour.steps[currentTourStep]?.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {currentTourStep + 1} of {activeTour.steps.length}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTourNavigation('skip')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTour.steps[currentTourStep]?.content}
                  </p>

                  <div className="mb-4">
                    <Progress
                      value={((currentTourStep + 1) / activeTour.steps.length) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTourNavigation('skip')}
                    >
                      Skip Tour
                    </Button>
                    <div className="flex gap-2">
                      {currentTourStep > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTourNavigation('prev')}
                        >
                          Previous
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleTourNavigation('next')}
                      >
                        {currentTourStep === activeTour.steps.length - 1 ? 'Finish' : 'Next'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Recommendations Panel */}
        {showRecommendations && isDiscoveryEnabled && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-6 top-1/2 transform -translate-y-1/2 z-20 w-80"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">Smart Suggestions</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecommendations(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Personalized recommendations to optimize your workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRecommendations
                  .filter(rec => !dismissedItems.has(rec.id))
                  .slice(0, 2)
                  .map((recommendation, index) => (
                    <motion.div
                      key={recommendation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {recommendation.title}
                        </h4>
                        <div className="flex gap-1">
                          <Badge variant={recommendation.impact === 'high' ? 'default' : 'secondary'}>
                            {recommendation.impact}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {recommendation.description}
                      </p>

                      <p className="text-xs text-gray-500 mb-3">
                        {recommendation.reasoning}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {Math.round(recommendation.confidence * 100)}% match
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecommendationAction(recommendation, 'dismiss')}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRecommendationAction(recommendation, 'cta')}
                          >
                            {recommendation.cta}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contextual Tooltips */}
        {contextualHints.map((hint) => (
          <Tooltip key={hint.id}>
            <TooltipTrigger asChild>
              <div className={`absolute ${hint.placement} pointer-events-none`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: hint.delay / 1000 }}
                  className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg"
                >
                  {hint.content}
                </motion.div>
              </div>
            </TooltipTrigger>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}