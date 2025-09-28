'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Calendar,
  Users,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  Settings,
  Crown,
  Shield,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionData {
  id: string;
  tier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  users: number;
  addons: string[];
  nextInvoiceAmount?: number;
  nextInvoiceDate?: string;
}

interface UsageData {
  users: { current: number; limit: number };
  clients: { current: number; limit: number };
  documents: { current: number; limit: number };
  storage: { current: number; limit: number };
}

interface SubscriptionCardProps {
  subscription: SubscriptionData;
  usage?: UsageData;
  onUpgrade?: () => void;
  onModify?: () => void;
  onCancel?: () => void;
  onReactivate?: () => void;
  showUsage?: boolean;
}

export function SubscriptionCard({
  subscription,
  usage,
  onUpgrade,
  onModify,
  onCancel,
  onReactivate,
  showUsage = true
}: SubscriptionCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      trialing: { label: 'Trial', variant: 'secondary' as const, icon: Crown },
      past_due: { label: 'Past Due', variant: 'destructive' as const, icon: AlertTriangle },
      canceled: { label: 'Canceled', variant: 'outline' as const, icon: AlertTriangle },
      unpaid: { label: 'Unpaid', variant: 'destructive' as const, icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
      icon: FileText
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTierIcon = () => {
    switch (subscription.tier.toLowerCase()) {
      case 'starter':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'professional':
        return <Crown className="h-5 w-5 text-purple-500" />;
      case 'enterprise':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 999999) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {getTierIcon()}
            <div>
              <CardTitle className="capitalize">{subscription.tier} Plan</CardTitle>
              <CardDescription>
                {subscription.users} user{subscription.users !== 1 ? 's' : ''}
                {subscription.addons.length > 0 && ` • ${subscription.addons.length} add-on${subscription.addons.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Subscription Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Current Period
            </div>
            <p className="text-sm">
              {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>

          {subscription.nextInvoiceAmount && subscription.nextInvoiceDate && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" />
                Next Payment
              </div>
              <p className="text-sm">
                {formatCurrency(subscription.nextInvoiceAmount, 'usd')} on {new Date(subscription.nextInvoiceDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Add-ons */}
        {subscription.addons.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Active Add-ons</h4>
            <div className="flex flex-wrap gap-2">
              {subscription.addons.map((addon) => (
                <Badge key={addon} variant="secondary" className="text-xs">
                  {addon.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Usage Overview */}
        {showUsage && usage && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">Usage Overview</h4>
                <Button variant="ghost" size="sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>

              <div className="space-y-4">
                {/* Users */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Users
                    </span>
                    <span className={getUsageColor(getUsagePercentage(usage.users.current, usage.users.limit))}>
                      {usage.users.current} / {usage.users.limit === 999999 ? '∞' : usage.users.limit}
                    </span>
                  </div>
                  {usage.users.limit !== 999999 && (
                    <Progress value={getUsagePercentage(usage.users.current, usage.users.limit)} />
                  )}
                </div>

                {/* Storage */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Storage
                    </span>
                    <span className={getUsageColor(getUsagePercentage(usage.storage.current, usage.storage.limit))}>
                      {usage.storage.current} GB / {usage.storage.limit === 999999 ? '∞' : `${usage.storage.limit} GB`}
                    </span>
                  </div>
                  {usage.storage.limit !== 999999 && (
                    <Progress value={getUsagePercentage(usage.storage.current, usage.storage.limit)} />
                  )}
                </div>

                {/* Documents */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </span>
                    <span className={getUsageColor(getUsagePercentage(usage.documents.current, usage.documents.limit))}>
                      {usage.documents.current} / {usage.documents.limit === 999999 ? '∞' : usage.documents.limit}
                    </span>
                  </div>
                  {usage.documents.limit !== 999999 && (
                    <Progress value={getUsagePercentage(usage.documents.current, usage.documents.limit)} />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Cancellation Notice */}
        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Subscription Ending</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              You'll lose access to all features after this date.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <>
              {onUpgrade && (
                <Button onClick={onUpgrade}>
                  Upgrade Plan
                </Button>
              )}
              {onModify && (
                <Button variant="outline" onClick={onModify}>
                  <Settings className="mr-2 h-4 w-4" />
                  Modify
                </Button>
              )}
              {onCancel && (
                <Button variant="destructive" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </>
          )}

          {subscription.cancelAtPeriodEnd && onReactivate && (
            <Button onClick={onReactivate}>
              Reactivate Subscription
            </Button>
          )}

          {(subscription.status === 'past_due' || subscription.status === 'unpaid') && (
            <Button>
              Update Payment Method
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}