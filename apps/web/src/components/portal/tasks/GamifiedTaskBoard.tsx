'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Trophy,
  Star,
  Target,
  Zap,
  Award,
  TrendingUp,
  Calendar,
  FileText,
  Upload,
  MessageCircle,
  CreditCard,
  Flame,
  Gift,
  Medal,
  Crown,
  Coffee,
  Timer,
  CheckSquare,
  RotateCcw,
  ArrowRight,
  Users,
  Progress,
  BarChart3,
  Sparkles,
  PartyPopper,
  ThumbsUp,
  Heart,
  Smile
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress as ProgressBar } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string
  category: 'document' | 'payment' | 'review' | 'communication' | 'tax' | 'compliance'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  dueDate: string
  estimatedTime: number // in minutes
  points: number
  xpReward: number
  difficulty: 'easy' | 'medium' | 'hard'
  dependencies?: string[]
  assignedTo?: string
  completedAt?: string
  isRecurring?: boolean
  tags: string[]
  attachments?: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'completion' | 'speed' | 'streak' | 'collaboration' | 'quality'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  pointsRequired?: number
  criteria: string
  unlockedAt?: string
  progress?: number
  maxProgress?: number
}

interface UserStats {
  totalPoints: number
  totalXP: number
  level: number
  completedTasks: number
  streakDays: number
  averageCompletionTime: number
  achievements: Achievement[]
  weeklyGoal: number
  weeklyProgress: number
}

interface GamifiedTaskBoardProps {
  userId: string
  className?: string
}

const taskCategories = {
  document: { icon: FileText, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', name: 'Documents' },
  payment: { icon: CreditCard, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', name: 'Payments' },
  review: { icon: CheckCircle, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', name: 'Reviews' },
  communication: { icon: MessageCircle, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', name: 'Messages' },
  tax: { icon: Calculator, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', name: 'Tax' },
  compliance: { icon: Shield, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', name: 'Compliance' }
}

const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-800', multiplier: 1, icon: Coffee },
  medium: { color: 'bg-yellow-100 text-yellow-800', multiplier: 1.5, icon: Target },
  hard: { color: 'bg-red-100 text-red-800', multiplier: 2, icon: Flame }
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', urgency: 1 },
  medium: { color: 'bg-blue-100 text-blue-800', urgency: 2 },
  high: { color: 'bg-orange-100 text-orange-800', urgency: 3 },
  urgent: { color: 'bg-red-100 text-red-800', urgency: 4 }
}

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Upload Q3 Bank Statements',
    description: 'Upload your quarterly bank statements for reconciliation',
    category: 'document',
    priority: 'high',
    status: 'pending',
    dueDate: '2024-11-20',
    estimatedTime: 15,
    points: 50,
    xpReward: 75,
    difficulty: 'easy',
    tags: ['banking', 'quarterly', 'reconciliation'],
    attachments: 0
  },
  {
    id: '2',
    title: 'Review October Expenses',
    description: 'Review and categorize your October business expenses',
    category: 'review',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2024-11-18',
    estimatedTime: 30,
    points: 75,
    xpReward: 100,
    difficulty: 'medium',
    tags: ['expenses', 'categorization', 'monthly'],
    attachments: 12
  },
  {
    id: '3',
    title: 'Approve Invoice #INV-2024-156',
    description: 'Review and approve the invoice for consulting services',
    category: 'payment',
    priority: 'urgent',
    status: 'pending',
    dueDate: '2024-11-15',
    estimatedTime: 10,
    points: 100,
    xpReward: 150,
    difficulty: 'easy',
    tags: ['invoice', 'approval', 'consulting'],
    attachments: 1
  },
  {
    id: '4',
    title: 'Respond to CPA Query',
    description: 'Answer questions about the new equipment purchase',
    category: 'communication',
    priority: 'high',
    status: 'pending',
    dueDate: '2024-11-16',
    estimatedTime: 20,
    points: 60,
    xpReward: 90,
    difficulty: 'medium',
    tags: ['communication', 'equipment', 'query'],
    attachments: 0
  },
  {
    id: '5',
    title: 'Complete Tax Planning Questionnaire',
    description: 'Fill out the annual tax planning questionnaire',
    category: 'tax',
    priority: 'medium',
    status: 'completed',
    dueDate: '2024-11-10',
    estimatedTime: 45,
    points: 150,
    xpReward: 200,
    difficulty: 'hard',
    completedAt: '2024-11-08',
    tags: ['tax', 'planning', 'annual'],
    attachments: 0
  }
]

const mockAchievements: Achievement[] = [
  {
    id: 'first_task',
    title: 'Getting Started',
    description: 'Complete your first task',
    icon: Star,
    category: 'completion',
    rarity: 'common',
    criteria: 'Complete 1 task',
    unlockedAt: '2024-11-08',
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete 5 tasks in under estimated time',
    icon: Zap,
    category: 'speed',
    rarity: 'rare',
    criteria: 'Complete 5 tasks faster than estimated',
    progress: 2,
    maxProgress: 5
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Complete tasks for 7 consecutive days',
    icon: Flame,
    category: 'streak',
    rarity: 'epic',
    criteria: 'Maintain 7-day completion streak',
    progress: 3,
    maxProgress: 7
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete 50 tasks without any revisions',
    icon: Crown,
    category: 'quality',
    rarity: 'legendary',
    criteria: 'Complete 50 tasks with perfect quality',
    progress: 15,
    maxProgress: 50
  }
]

const mockUserStats: UserStats = {
  totalPoints: 1250,
  totalXP: 1875,
  level: 8,
  completedTasks: 23,
  streakDays: 3,
  averageCompletionTime: 18, // minutes
  achievements: mockAchievements,
  weeklyGoal: 10,
  weeklyProgress: 7
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

function getXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100
}

function TaskCard({ task, onComplete, onStart, userStats }: {
  task: Task
  onComplete: (taskId: string) => void
  onStart: (taskId: string) => void
  userStats: UserStats
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const categoryConfig = taskCategories[task.category]
  const diffConfig = difficultyConfig[task.difficulty]
  const priorityData = priorityConfig[task.priority]
  const Icon = categoryConfig.icon
  const DiffIcon = diffConfig.icon

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'
  const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const handleComplete = async () => {
    setIsCompleting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    onComplete(task.id)
    setIsCompleting(false)
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <Timer className="w-4 h-4 text-blue-600" />
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "group relative",
        task.status === 'completed' && "opacity-75"
      )}
    >
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        task.status === 'completed' && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        isOverdue && "border-red-200 bg-red-50/50 dark:bg-red-900/10",
        task.priority === 'urgent' && task.status !== 'completed' && "ring-2 ring-red-200 dark:ring-red-800"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={cn("p-1.5 rounded-lg", categoryConfig.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {task.description}
                </p>
              </div>
            </div>
            {getStatusIcon()}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={priorityData.color}>
                {task.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={diffConfig.color}>
                <DiffIcon className="w-3 h-3 mr-1" />
                {task.difficulty}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <Timer className="w-3 h-3" />
              <span>{task.estimatedTime}m</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span className="font-medium">{task.points} pts</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="font-medium">{task.xpReward} XP</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Due {daysUntilDue === 0 ? 'today' : daysUntilDue > 0 ? `in ${daysUntilDue}d` : `${Math.abs(daysUntilDue)}d ago`}
            </div>
          </div>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              {showDetails ? 'Hide' : 'Show'} Details
              <ArrowRight className={cn(
                "w-3 h-3 ml-1 transition-transform",
                showDetails && "rotate-90"
              )} />
            </Button>

            <div className="flex items-center space-x-2">
              {task.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStart(task.id)}
                >
                  Start
                </Button>
              )}
              {(task.status === 'pending' || task.status === 'in_progress') && (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCompleting ? (
                    <>
                      <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </>
                  )}
                </Button>
              )}
              {task.status === 'completed' && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{categoryConfig.name}</span>
                  </div>

                  {task.attachments !== undefined && task.attachments > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Attachments:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{task.attachments} files</span>
                    </div>
                  )}

                  {task.dependencies && task.dependencies.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Dependencies:</span>
                      <div className="mt-1 space-y-1">
                        {task.dependencies.map((dep, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">All Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Completion Animation */}
      <AnimatePresence>
        {isCompleting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 rounded-lg"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              </motion.div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Completing task...
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                +{task.points} points, +{task.xpReward} XP
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const rarityConfig = {
    common: { color: 'bg-gray-100 text-gray-800', glow: 'shadow-gray-200' },
    rare: { color: 'bg-blue-100 text-blue-800', glow: 'shadow-blue-200' },
    epic: { color: 'bg-purple-100 text-purple-800', glow: 'shadow-purple-200' },
    legendary: { color: 'bg-yellow-100 text-yellow-800', glow: 'shadow-yellow-200' }
  }

  const config = rarityConfig[achievement.rarity]
  const Icon = achievement.icon
  const isUnlocked = achievement.unlockedAt !== undefined
  const progress = achievement.progress || 0
  const maxProgress = achievement.maxProgress || 1

  return (
    <Card className={cn(
      "transition-all duration-200",
      isUnlocked && `${config.glow} shadow-lg`,
      !isUnlocked && "opacity-60 grayscale"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={cn(
            "p-2 rounded-lg",
            isUnlocked ? config.color : "bg-gray-100 text-gray-400"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {achievement.title}
              </h3>
              <Badge variant="outline" className={config.color}>
                {achievement.rarity}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {achievement.description}
            </p>

            {!isUnlocked && maxProgress > 1 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-gray-500">{progress}/{maxProgress}</span>
                </div>
                <ProgressBar value={(progress / maxProgress) * 100} className="h-1" />
              </div>
            )}

            {isUnlocked && (
              <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GamifiedTaskBoard({ userId, className }: GamifiedTaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [userStats, setUserStats] = useState<UserStats>(mockUserStats)
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'points' | 'difficulty'>('priority')
  const [filterBy, setFilterBy] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [celebrationQueue, setCelebrationQueue] = useState<string[]>([])

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        }

        // Update user stats
        setUserStats(prevStats => ({
          ...prevStats,
          totalPoints: prevStats.totalPoints + task.points,
          totalXP: prevStats.totalXP + task.xpReward,
          completedTasks: prevStats.completedTasks + 1,
          weeklyProgress: prevStats.weeklyProgress + 1,
          level: calculateLevel(prevStats.totalXP + task.xpReward)
        }))

        // Add celebration
        setCelebrationQueue(prev => [...prev, taskId])

        return updatedTask
      }
      return task
    }))
  }

  const handleStartTask = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: 'in_progress' as const } : task
    ))
  }

  const pendingTasks = tasks.filter(task => task.status === 'pending')
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress')
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const overdueTasks = tasks.filter(task =>
    new Date(task.dueDate) < new Date() && task.status !== 'completed'
  )

  const visibleTasks = [...pendingTasks, ...inProgressTasks, ...(showCompleted ? completedTasks : [])]
    .filter(task => {
      if (filterBy === 'all') return true
      if (filterBy === 'overdue') return overdueTasks.includes(task)
      return task.category === filterBy
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return priorityConfig[b.priority].urgency - priorityConfig[a.priority].urgency
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'points':
          return b.points - a.points
        case 'difficulty':
          return difficultyConfig[b.difficulty].multiplier - difficultyConfig[a.difficulty].multiplier
        default:
          return 0
      }
    })

  const nextLevelXP = getXPForNextLevel(userStats.level)
  const currentLevelXP = getXPForNextLevel(userStats.level - 1)
  const progressToNextLevel = ((userStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  const weeklyGoalProgress = (userStats.weeklyProgress / userStats.weeklyGoal) * 100

  // Remove celebration after showing
  useEffect(() => {
    if (celebrationQueue.length > 0) {
      const timer = setTimeout(() => {
        setCelebrationQueue(prev => prev.slice(1))
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [celebrationQueue])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Level and Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Level {userStats.level}
                </CardTitle>
                <CardDescription>
                  {userStats.totalXP.toLocaleString()} XP • {userStats.totalPoints.toLocaleString()} points
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {Math.round(progressToNextLevel)}% to Level {userStats.level + 1}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ProgressBar value={progressToNextLevel} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{userStats.completedTasks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{userStats.streakDays}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{userStats.averageCompletionTime}m</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {userStats.weeklyProgress}/{userStats.weeklyGoal}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  tasks this week
                </div>
              </div>
              <ProgressBar value={weeklyGoalProgress} className="h-2" />
              {weeklyGoalProgress >= 100 && (
                <div className="flex items-center justify-center text-green-600 text-sm">
                  <Trophy className="w-4 h-4 mr-1" />
                  Goal achieved!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="relative">
            Tasks
            {pendingTasks.length + inProgressTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingTasks.length + inProgressTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Achievements
            {userStats.achievements.filter(a => a.unlockedAt).length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {userStats.achievements.filter(a => a.unlockedAt).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Task Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Sort by Priority</SelectItem>
                      <SelectItem value="dueDate">Sort by Due Date</SelectItem>
                      <SelectItem value="points">Sort by Points</SelectItem>
                      <SelectItem value="difficulty">Sort by Difficulty</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="overdue">Overdue Tasks</SelectItem>
                      {Object.entries(taskCategories).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    {showCompleted ? 'Hide' : 'Show'} Completed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Timer className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{inProgressTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{overdueTasks.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            <AnimatePresence>
              {visibleTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onStart={handleStartTask}
                  userStats={userStats}
                />
              ))}
            </AnimatePresence>

            {visibleTasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No tasks found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filterBy === 'all' ? 'All caught up! Great work!' : 'No tasks match your current filter.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userStats.achievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-medium">
                      {Math.round((completedTasks.length / tasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Points per Task</span>
                    <span className="font-medium">
                      {Math.round(userStats.totalPoints / userStats.completedTasks)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tasks Completed This Week</span>
                    <span className="font-medium">{userStats.weeklyProgress}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(taskCategories).map(([key, config]) => {
                    const categoryTasks = tasks.filter(t => t.category === key)
                    const completed = categoryTasks.filter(t => t.status === 'completed').length

                    if (categoryTasks.length === 0) return null

                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <config.icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{config.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {completed}/{categoryTasks.length}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Celebration Animation */}
      <AnimatePresence>
        {celebrationQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <PartyPopper className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Task Completed!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You earned points and XP!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}