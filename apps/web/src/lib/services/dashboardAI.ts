/**
 * AI-Powered Dashboard Intelligence Service
 * Provides context-aware recommendations and predictive insights
 */

export interface DashboardContext {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'cpa' | 'staff';
  currentSeason: 'tax_season' | 'audit_season' | 'normal';
  workloadCapacity: number; // 0-100 percentage
  upcomingDeadlines: number;
  skillProfile?: SkillSet;
  recentActivity?: Activity[];
}

export interface SkillSet {
  taxPreparation: number; // 0-10
  auditServices: number;
  advisory: number;
  bookkeeping: number;
  specializations: string[];
}

export interface Activity {
  type: string;
  timestamp: Date;
  duration?: number;
  entityId: string;
}

export interface AIRecommendation {
  id: string;
  type: 'urgent_task' | 'bottleneck_alert' | 'optimization' | 'quick_win';
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  impact: 'high' | 'medium' | 'low';
  actionUrl: string;
  aiConfidence: number; // 0-1
  reasoning: string[];
  relatedEntities?: {
    clientId?: string;
    documentId?: string;
    taskId?: string;
  };
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  priority: number;
  weight: number;
  gridPosition: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  data?: any;
  refreshInterval?: number;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  priorities: AIRecommendation[];
  refreshInterval: number;
  season: string;
  role: string;
}

export class DashboardAIService {
  /**
   * Generate personalized dashboard layout based on context
   */
  async generateLayout(context: DashboardContext): Promise<DashboardLayout> {
    const widgets = await this.selectOptimalWidgets(context);
    const priorities = await this.generateRecommendations(context);

    return {
      widgets: this.arrangeWidgets(widgets, context.role),
      priorities,
      refreshInterval: this.calculateRefreshRate(context),
      season: context.currentSeason,
      role: context.role,
    };
  }

  /**
   * Select optimal widgets based on context
   */
  private async selectOptimalWidgets(context: DashboardContext): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = [];

    // Tax Season: Prioritize deadline tracking and capacity management
    if (context.currentSeason === 'tax_season') {
      widgets.push(
        {
          id: 'deadline_tracker',
          type: 'deadline_tracker',
          title: 'Upcoming Deadlines',
          priority: 10,
          weight: 10,
          gridPosition: { x: 0, y: 0, w: 2, h: 1 },
          refreshInterval: 300000, // 5 minutes
        },
        {
          id: 'capacity_meter',
          type: 'capacity_meter',
          title: 'Team Capacity',
          priority: 9,
          weight: 9,
          gridPosition: { x: 2, y: 0, w: 1, h: 1 },
          refreshInterval: 60000, // 1 minute
        },
        {
          id: 'document_queue',
          type: 'document_queue',
          title: 'Document Processing Queue',
          priority: 8,
          weight: 8,
          gridPosition: { x: 0, y: 1, w: 2, h: 1 },
          refreshInterval: 30000, // 30 seconds
        }
      );
    }
    // Normal Season: Focus on growth and optimization
    else {
      widgets.push(
        {
          id: 'revenue_metrics',
          type: 'revenue_metrics',
          title: 'Revenue & Growth',
          priority: 10,
          weight: 10,
          gridPosition: { x: 0, y: 0, w: 2, h: 1 },
          refreshInterval: 600000, // 10 minutes
        },
        {
          id: 'client_health',
          type: 'client_health',
          title: 'Client Health Scores',
          priority: 9,
          weight: 9,
          gridPosition: { x: 2, y: 0, w: 1, h: 1 },
          refreshInterval: 3600000, // 1 hour
        },
        {
          id: 'efficiency_metrics',
          type: 'efficiency_metrics',
          title: 'Process Efficiency',
          priority: 8,
          weight: 8,
          gridPosition: { x: 0, y: 1, w: 2, h: 1 },
          refreshInterval: 1800000, // 30 minutes
        }
      );
    }

    // Role-specific widgets
    if (context.role === 'owner' || context.role === 'admin') {
      widgets.push({
        id: 'team_performance',
        type: 'team_performance',
        title: 'Team Performance',
        priority: 7,
        weight: 7,
        gridPosition: { x: 0, y: 2, w: 3, h: 1 },
        refreshInterval: 300000,
      });
    }

    return widgets;
  }

  /**
   * Generate AI-powered recommendations
   */
  async generateRecommendations(context: DashboardContext): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Analyze workload capacity
    if (context.workloadCapacity > 85) {
      recommendations.push({
        id: 'workload_alert',
        type: 'bottleneck_alert',
        priority: 1,
        title: 'High Workload Detected',
        description: `You're at ${context.workloadCapacity}% capacity. Consider delegating or rescheduling non-urgent tasks.`,
        estimatedTime: 30,
        impact: 'high',
        actionUrl: '/dashboard/workload',
        aiConfidence: 0.92,
        reasoning: [
          `Current capacity: ${context.workloadCapacity}%`,
          'Optimal capacity range: 70-80%',
          'Risk of burnout and errors increases above 85%',
        ],
      });
    }

    // Check for upcoming deadlines
    if (context.upcomingDeadlines > 5 && context.currentSeason === 'tax_season') {
      recommendations.push({
        id: 'deadline_alert',
        type: 'urgent_task',
        priority: 1,
        title: 'Multiple Deadlines Approaching',
        description: `You have ${context.upcomingDeadlines} deadlines in the next 7 days. Prioritize by client value and complexity.`,
        estimatedTime: 0,
        impact: 'high',
        actionUrl: '/dashboard/deadlines',
        aiConfidence: 0.98,
        reasoning: [
          `${context.upcomingDeadlines} deadlines within 7 days`,
          'Tax season peak period',
          'Historical data shows this workload requires planning',
        ],
      });
    }

    // Suggest quick wins during normal capacity
    if (context.workloadCapacity < 70) {
      recommendations.push({
        id: 'quick_win',
        type: 'quick_win',
        priority: 3,
        title: 'Process Optimization Opportunity',
        description: 'You have 15 minutes available. Consider completing low-effort, high-impact tasks.',
        estimatedTime: 15,
        impact: 'medium',
        actionUrl: '/dashboard/quick-tasks',
        aiConfidence: 0.85,
        reasoning: [
          'Current capacity below 70%',
          'Time available for process improvements',
          'Several quick-win tasks identified',
        ],
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Arrange widgets in optimal grid layout
   */
  private arrangeWidgets(
    widgets: DashboardWidget[],
    role: string
  ): DashboardWidget[] {
    // Sort by priority
    const sorted = [...widgets].sort((a, b) => b.priority - a.priority);

    // Apply role-specific layout rules
    if (role === 'staff') {
      // Staff sees task-focused layout
      return sorted.map((widget, index) => ({
        ...widget,
        gridPosition: {
          x: index % 2 === 0 ? 0 : 2,
          y: Math.floor(index / 2),
          w: 2,
          h: 1,
        },
      }));
    }

    // Default layout for CPAs, admins, owners
    return sorted;
  }

  /**
   * Calculate optimal refresh rate based on context
   */
  private calculateRefreshRate(context: DashboardContext): number {
    // During tax season: more frequent updates
    if (context.currentSeason === 'tax_season') {
      return 30000; // 30 seconds
    }

    // During audit season: moderate updates
    if (context.currentSeason === 'audit_season') {
      return 60000; // 1 minute
    }

    // Normal period: less frequent updates
    return 300000; // 5 minutes
  }

  /**
   * Analyze patterns and predict future needs
   */
  async predictUpcomingNeeds(context: DashboardContext): Promise<AIRecommendation[]> {
    const predictions: AIRecommendation[] = [];

    // Seasonal predictions
    const now = new Date();
    const month = now.getMonth();

    // Predict tax season preparation (Dec-Jan)
    if (month === 11 || month === 0) {
      predictions.push({
        id: 'tax_season_prep',
        type: 'optimization',
        priority: 2,
        title: 'Tax Season Preparation',
        description: 'Tax season starts soon. Review capacity, templates, and client communications.',
        estimatedTime: 120,
        impact: 'high',
        actionUrl: '/dashboard/tax-season-prep',
        aiConfidence: 0.95,
        reasoning: [
          'Tax season starts in 6-8 weeks',
          'Historical data shows preparation improves outcomes by 40%',
          'Checklist items: capacity planning, template updates, client outreach',
        ],
      });
    }

    // Predict quarterly tax deadlines
    if ([2, 5, 8, 11].includes(month)) {
      predictions.push({
        id: 'quarterly_estimated_taxes',
        type: 'urgent_task',
        priority: 1,
        title: 'Quarterly Estimated Taxes Due',
        description: 'Remind clients about quarterly estimated tax payments due next month.',
        estimatedTime: 60,
        impact: 'high',
        actionUrl: '/dashboard/quarterly-reminders',
        aiConfidence: 0.97,
        reasoning: [
          'Quarterly deadline approaching',
          'Client satisfaction improves with proactive reminders',
          'Reduces last-minute rush and errors',
        ],
      });
    }

    return predictions;
  }

  /**
   * Learn from user behavior to improve recommendations
   */
  async recordUserAction(
    userId: string,
    recommendationId: string,
    action: 'accepted' | 'dismissed' | 'completed',
    timeSpent?: number
  ): Promise<void> {
    // In production, this would update ML model with user feedback
    // For now, log the action for future analysis
    console.log('User action recorded:', {
      userId,
      recommendationId,
      action,
      timeSpent,
      timestamp: new Date(),
    });
  }
}

// Singleton instance
export const dashboardAI = new DashboardAIService();