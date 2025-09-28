'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Star, Users, Database, FileText, Crown, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PricingTier, PricingConfig } from '@/lib/billing/pricing-config';

interface PricingCardProps {
  tier: PricingTier;
  config: PricingConfig;
  isPopular?: boolean;
  isCurrent?: boolean;
  isSelected?: boolean;
  yearly?: boolean;
  userCount?: number;
  onSelect?: () => void;
  onUpgrade?: () => void;
  showDetails?: boolean;
}

export function PricingCard({
  tier,
  config,
  isPopular = false,
  isCurrent = false,
  isSelected = false,
  yearly = false,
  userCount = 1,
  onSelect,
  onUpgrade,
  showDetails = true
}: PricingCardProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const calculatePrice = () => {
    const basePrice = yearly ? config.basePriceYearly : config.basePriceMonthly;
    const includedUsers = config.limits.users;
    const extraUsers = Math.max(0, userCount - includedUsers);
    const userPrice = extraUsers * config.perUserPrice * (yearly ? 12 : 1);
    return basePrice + userPrice;
  };

  const getIcon = () => {
    switch (tier) {
      case PricingTier.STARTER:
        return <Users className="h-5 w-5 text-blue-500" />;
      case PricingTier.PROFESSIONAL:
        return <Crown className="h-5 w-5 text-purple-500" />;
      case PricingTier.ENTERPRISE:
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const featuresToShow = showAllFeatures ? config.features : config.features.slice(0, 8);
  const hasMoreFeatures = config.features.length > 8;

  return (
    <Card className={`relative transition-all duration-200 ${
      isSelected ? 'ring-2 ring-primary' : ''
    } ${isPopular ? 'border-primary' : ''} ${isCurrent ? 'bg-primary/5' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="mr-1 h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary">
            <Check className="mr-1 h-3 w-3" />
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getIcon()}
          <CardTitle className="text-xl capitalize">{tier}</CardTitle>
        </div>
        <CardDescription className="min-h-[3rem] flex items-center justify-center">
          {config.description}
        </CardDescription>

        <div className="text-3xl font-bold">
          {formatCurrency(calculatePrice(), 'usd')}
          <span className="text-base font-normal text-muted-foreground">
            /{yearly ? 'year' : 'month'}
          </span>
        </div>

        {yearly && (
          <p className="text-sm text-green-600">Save 17% annually</p>
        )}

        {userCount > config.limits.users && (
          <p className="text-xs text-muted-foreground">
            Includes {userCount - config.limits.users} additional user{userCount - config.limits.users > 1 ? 's' : ''}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {showDetails && (
          <>
            <div className="space-y-2">
              {featuresToShow.map((feature: string) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}

              {hasMoreFeatures && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                >
                  {showAllFeatures
                    ? 'Show less'
                    : `+${config.features.length - 8} more features`
                  }
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Plan Limits</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {config.limits.users === 999999 ? 'Unlimited' : config.limits.users} users
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {config.limits.clients === 999999 ? 'Unlimited' : config.limits.clients} clients
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {config.limits.storage_gb === 999999 ? 'Unlimited' : `${config.limits.storage_gb} GB`}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {config.limits.documents_processed === 999999 ? 'Unlimited' : config.limits.documents_processed} docs
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pt-4">
          {isCurrent ? (
            <Button disabled className="w-full">
              <Check className="mr-2 h-4 w-4" />
              Current Plan
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant={isSelected ? 'default' : 'outline'}
                className="w-full"
                onClick={onSelect}
              >
                {tier === PricingTier.STARTER ? 'Downgrade' : 'Select Plan'}
              </Button>

              {onUpgrade && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={onUpgrade}
                >
                  Upgrade Now
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}