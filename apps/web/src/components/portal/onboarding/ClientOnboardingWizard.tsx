'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Users,
  FileText,
  MessageCircle,
  Calendar,
  Settings,
  ArrowRight,
  ArrowLeft,
  Star,
  Trophy,
  Target,
  Clock,
  Shield,
  Smartphone,
  Upload,
  Bell,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<any>
  isRequired: boolean
  estimatedTime: number // in minutes
  benefits: string[]
}

interface OnboardingProgress {
  currentStep: number
  completedSteps: string[]
  skippedSteps: string[]
  userPreferences: Record<string, any>
  timeSpent: number
  engagementScore: number
}

interface ClientOnboardingWizardProps {
  onComplete: (progress: OnboardingProgress) => void
  onSkip?: () => void
  className?: string
}

// Step Components
function WelcomeStep({ onNext, onBack, progress }: any) {
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [goals, setGoals] = useState<string[]>([])

  const goalOptions = [
    { id: 'organize-docs', label: 'Organize Financial Documents', icon: FileText },
    { id: 'tax-planning', label: 'Tax Planning & Preparation', icon: Calendar },
    { id: 'financial-insights', label: 'Financial Insights & Reports', icon: Target },
    { id: 'communication', label: 'Streamlined CPA Communication', icon: MessageCircle },
    { id: 'compliance', label: 'Stay Compliant & Updated', icon: Shield },
    { id: 'efficiency', label: 'Improve Business Efficiency', icon: Zap }
  ]

  const toggleGoal = (goalId: string) => {
    setGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const handleNext = () => {
    progress.userPreferences.userName = userName
    progress.userPreferences.userRole = userRole
    progress.userPreferences.goals = goals
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Your Client Portal!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Let's get you set up for success. This will take about 5 minutes.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="userName">What should we call you?</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your preferred name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="userRole">What's your role in the business?</Label>
          <Input
            id="userRole"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            placeholder="e.g., CEO, CFO, Business Owner, Bookkeeper"
            className="mt-1"
          />
        </div>

        <div>
          <Label>What are your main goals? (Select all that apply)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {goalOptions.map((goal) => {
              const Icon = goal.icon
              const isSelected = goals.includes(goal.id)

              return (
                <div
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {goal.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" disabled>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!userName.trim()}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function DocumentSetupStep({ onNext, onBack, progress }: any) {
  const [uploadPreferences, setUploadPreferences] = useState({
    autoCategories: true,
    mobileScan: true,
    notifications: true,
    bulkUpload: false
  })

  const handleNext = () => {
    progress.userPreferences.uploadPreferences = uploadPreferences
    onNext()
  }

  const features = [
    {
      key: 'autoCategories',
      title: 'Smart Auto-Categorization',
      description: 'AI automatically categorizes your documents',
      icon: Zap,
      benefits: ['Saves 80% setup time', 'Reduces errors', 'Smart suggestions']
    },
    {
      key: 'mobileScan',
      title: 'Mobile Scanning',
      description: 'Take photos of receipts and documents on-the-go',
      icon: Smartphone,
      benefits: ['Instant capture', 'OCR text extraction', 'Cloud sync']
    },
    {
      key: 'notifications',
      title: 'Upload Notifications',
      description: 'Get notified when documents are processed',
      icon: Bell,
      benefits: ['Real-time updates', 'Email alerts', 'Status tracking']
    },
    {
      key: 'bulkUpload',
      title: 'Bulk Upload (Advanced)',
      description: 'Upload multiple files at once with batch processing',
      icon: Upload,
      benefits: ['Time efficient', 'Progress tracking', 'Error handling']
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Management Setup
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure how you want to handle document uploads and organization
        </p>
      </div>

      <div className="space-y-4">
        {features.map((feature) => {
          const Icon = feature.icon
          const isEnabled = uploadPreferences[feature.key as keyof typeof uploadPreferences]

          return (
            <Card key={feature.key} className={cn(
              "transition-all",
              isEnabled ? "ring-2 ring-blue-500 ring-opacity-50" : ""
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isEnabled
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {feature.benefits.map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      setUploadPreferences(prev => ({
                        ...prev,
                        [feature.key]: checked
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Pro Tip: Start Simple, Scale Up
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          We recommend starting with auto-categorization and mobile scanning.
          You can always enable advanced features later as you get comfortable.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function CommunicationSetupStep({ onNext, onBack, progress }: any) {
  const [commPreferences, setCommPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    messageThreading: true,
    smartReplies: true,
    urgentAlerts: true
  })

  const handleNext = () => {
    progress.userPreferences.commPreferences = commPreferences
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
          <MessageCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Communication Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Set up how you want to communicate with your CPA team
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Settings</CardTitle>
            <CardDescription>
              Choose how you want to be notified about important updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive updates via email
                </p>
              </div>
              <Switch
                checked={commPreferences.emailNotifications}
                onCheckedChange={(checked) =>
                  setCommPreferences(prev => ({...prev, emailNotifications: checked}))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get instant notifications in the portal
                </p>
              </div>
              <Switch
                checked={commPreferences.pushNotifications}
                onCheckedChange={(checked) =>
                  setCommPreferences(prev => ({...prev, pushNotifications: checked}))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">SMS Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Critical updates via text message
                </p>
              </div>
              <Switch
                checked={commPreferences.smsNotifications}
                onCheckedChange={(checked) =>
                  setCommPreferences(prev => ({...prev, smsNotifications: checked}))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Smart Features</CardTitle>
            <CardDescription>
              Enable AI-powered communication enhancements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Message Threading</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Group related messages together
                </p>
              </div>
              <Switch
                checked={commPreferences.messageThreading}
                onCheckedChange={(checked) =>
                  setCommPreferences(prev => ({...prev, messageThreading: checked}))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Smart Reply Suggestions</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-generated response suggestions
                </p>
              </div>
              <Switch
                checked={commPreferences.smartReplies}
                onCheckedChange={(checked) =>
                  setCommPreferences(prev => ({...prev, smartReplies: checked}))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Urgent Alert System</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Priority notifications for time-sensitive items
                </p>
              </div>
              <Switch
                checked={commPreferences.urgentAlerts}
                onCheckedChange={(checked) =>
                  setCommPreferences(prev => ({...prev, urgentAlerts: checked}))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function CompletionStep({ onNext, onBack, progress }: any) {
  const [feedback, setFeedback] = useState('')

  const handleComplete = () => {
    progress.userPreferences.onboardingFeedback = feedback
    progress.completedSteps.push('completion')
    onNext()
  }

  const completionStats = {
    timeSpent: Math.round(progress.timeSpent / 60),
    featuresEnabled: Object.values({
      ...progress.userPreferences.uploadPreferences,
      ...progress.userPreferences.commPreferences
    }).filter(Boolean).length,
    engagementScore: progress.engagementScore
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
          <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Congratulations! You're All Set
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Your client portal is configured and ready to use
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {completionStats.timeSpent} minutes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Setup time</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {completionStats.featuresEnabled}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Features enabled</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Target className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {completionStats.engagementScore}%
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completion score</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Upload your first document to test the smart categorization</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Send a message to your CPA team to introduce yourself</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Review your financial dashboard and set up any missing information</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Explore the help resources and video tutorials</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="feedback">How was your onboarding experience? (Optional)</Label>
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Let us know how we can improve..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
          Complete Setup
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

export function ClientOnboardingWizard({
  onComplete,
  onSkip,
  className
}: ClientOnboardingWizardProps) {
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    userPreferences: {},
    timeSpent: 0,
    engagementScore: 0
  })

  const [startTime] = useState(Date.now())

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome & Goals',
      description: 'Tell us about yourself and your objectives',
      icon: Users,
      component: WelcomeStep,
      isRequired: true,
      estimatedTime: 2,
      benefits: ['Personalized experience', 'Relevant features', 'Smart defaults']
    },
    {
      id: 'documents',
      title: 'Document Setup',
      description: 'Configure document management preferences',
      icon: FileText,
      component: DocumentSetupStep,
      isRequired: false,
      estimatedTime: 2,
      benefits: ['Automated workflows', 'Smart categorization', 'Mobile access']
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Set up notifications and messaging preferences',
      icon: MessageCircle,
      component: CommunicationSetupStep,
      isRequired: false,
      estimatedTime: 1,
      benefits: ['Stay informed', 'Priority alerts', 'Smart features']
    },
    {
      id: 'completion',
      title: 'All Set!',
      description: 'Review your setup and start using the platform',
      icon: Trophy,
      component: CompletionStep,
      isRequired: true,
      estimatedTime: 1,
      benefits: ['Ready to use', 'Optimized setup', 'Next steps']
    }
  ]

  const currentStepData = steps[progress.currentStep]

  useEffect(() => {
    // Update time spent and engagement score
    const interval = setInterval(() => {
      const timeSpent = Date.now() - startTime
      const engagementScore = Math.min(
        100,
        Math.round((progress.completedSteps.length / steps.length) * 100)
      )

      setProgress(prev => ({
        ...prev,
        timeSpent,
        engagementScore
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, progress.completedSteps.length, steps.length])

  const handleNext = () => {
    if (progress.currentStep < steps.length - 1) {
      setProgress(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: [...prev.completedSteps, currentStepData.id]
      }))
    } else {
      onComplete(progress)
    }
  }

  const handleBack = () => {
    if (progress.currentStep > 0) {
      setProgress(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }))
    }
  }

  const handleSkipStep = () => {
    if (!currentStepData.isRequired) {
      setProgress(prev => ({
        ...prev,
        skippedSteps: [...prev.skippedSteps, currentStepData.id]
      }))
      handleNext()
    }
  }

  const progressPercentage = ((progress.currentStep + 1) / steps.length) * 100

  const StepComponent = currentStepData.component

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-sm font-medium text-gray-900 dark:text-white">
              Client Portal Setup
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Step {progress.currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ~{currentStepData.estimatedTime} min
            </span>
            {onSkip && !currentStepData.isRequired && (
              <Button variant="ghost" size="sm" onClick={handleSkipStep}>
                Skip
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{Math.round(progressPercentage)}% complete</span>
            <span>{currentStepData.benefits.join(' • ')}</span>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === progress.currentStep
            const isCompleted = progress.completedSteps.includes(step.id)
            const isSkipped = progress.skippedSteps.includes(step.id)

            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                  isActive && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                  isCompleted && "border-green-500 bg-green-50 dark:bg-green-900/20",
                  isSkipped && "border-gray-300 bg-gray-50 dark:bg-gray-800",
                  !isActive && !isCompleted && !isSkipped && "border-gray-300 bg-white dark:bg-gray-900"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive && "text-blue-600 dark:text-blue-400",
                      isSkipped && "text-gray-400",
                      !isActive && !isSkipped && "text-gray-400"
                    )} />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5 transition-all",
                    (isCompleted || isSkipped) ? "bg-green-300 dark:bg-green-700" : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={progress.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepComponent
                onNext={handleNext}
                onBack={handleBack}
                progress={progress}
                stepData={currentStepData}
              />
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}