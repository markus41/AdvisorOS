'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Clock, CreditCard, Users, HardDrive, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SubscriptionData {
  subscription: {
    id: string;
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    features: any;
    limits: {
      maxClients: number;
      maxUsers: number;
      storageGB: number;
    };
    usage: {
      clients: { used: number; limit: number; percentage: number };
      users: { used: number; limit: number; percentage: number };
      storage: { used: number; limit: number; percentage: number };
    };
  } | null;
}

export function SubscriptionStatus() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/create-subscription');

      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoadingPortal(true);
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setLoadingPortal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      trialing: { variant: 'secondary', icon: Clock, color: 'text-blue-600' },
      past_due: { variant: 'destructive', icon: AlertTriangle, color: 'text-red-600' },
      canceled: { variant: 'destructive', icon: AlertTriangle, color: 'text-red-600' },
      incomplete: { variant: 'destructive', icon: AlertTriangle, color: 'text-yellow-600' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.incomplete;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className={`mr-1 h-3 w-3 ${config.color}`} />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatPlanName = (planName: string) => {
    return planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = subscriptionData?.subscription;

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>No active subscription found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <Button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
  const daysUntilRenewal = Math.ceil((currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Main Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            {getStatusBadge(subscription.status)}
          </CardTitle>
          <CardDescription>
            {formatPlanName(subscription.planName)} Plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Next billing date</p>
                <p className="text-sm text-muted-foreground">
                  {currentPeriodEnd.toLocaleDateString()} ({daysUntilRenewal} days)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Billing cycle</p>
                <p className="text-sm text-muted-foreground">Monthly</p>
              </div>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Your subscription will be canceled on {currentPeriodEnd.toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleManageBilling}
            disabled={loadingPortal}
            className="w-full"
          >
            {loadingPortal ? 'Loading...' : 'Manage Billing'}
          </Button>
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Your current usage across plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Clients Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Clients</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscription.usage.clients.used} / {subscription.usage.clients.limit === -1 ? '∞' : subscription.usage.clients.limit}
                </span>
              </div>
              <Progress
                value={subscription.usage.clients.percentage}
                className="h-2"
              />
            </div>

            {/* Users Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Team Members</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscription.usage.users.used} / {subscription.usage.users.limit === -1 ? '∞' : subscription.usage.users.limit}
                </span>
              </div>
              <Progress
                value={subscription.usage.users.percentage}
                className="h-2"
              />
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {subscription.usage.storage.used.toFixed(1)}GB / {subscription.usage.storage.limit}GB
                </span>
              </div>
              <Progress
                value={subscription.usage.storage.percentage}
                className="h-2"
              />
            </div>
          </div>

          {/* Warnings for high usage */}
          {(subscription.usage.clients.percentage > 80 ||
            subscription.usage.users.percentage > 80 ||
            subscription.usage.storage.percentage > 80) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  You're approaching your plan limits. Consider upgrading to avoid service interruption.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}