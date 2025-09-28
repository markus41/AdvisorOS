'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PricingFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: {
    maxClients: number;
    maxUsers: number;
    storageGB: number;
    supportLevel: string;
    integrations: string[];
    advancedReporting: boolean;
    customBranding: boolean;
    whiteLabel?: boolean;
  };
}

interface PricingCardProps {
  tier: PricingTier;
  currentPlan?: string;
  popular?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

export function PricingCard({ tier, currentPlan, popular, onSelect, loading }: PricingCardProps) {
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async () => {
    try {
      setSelecting(true);
      await onSelect(tier.id);
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to select plan');
    } finally {
      setSelecting(false);
    }
  };

  const isCurrentPlan = currentPlan === tier.id;
  const isDisabled = loading || selecting || isCurrentPlan;

  const getCardIcon = () => {
    switch (tier.id) {
      case 'starter':
        return <Star className="h-6 w-6 text-blue-600" />;
      case 'professional':
        return <Zap className="h-6 w-6 text-purple-600" />;
      case 'enterprise':
        return <Crown className="h-6 w-6 text-yellow-600" />;
      default:
        return null;
    }
  };

  const formatLimit = (value: number) => {
    return value === -1 ? 'Unlimited' : value.toString();
  };

  const features: PricingFeature[] = [
    {
      name: `${formatLimit(tier.features.maxClients)} clients`,
      included: true
    },
    {
      name: `${formatLimit(tier.features.maxUsers)} team members`,
      included: true
    },
    {
      name: `${tier.features.storageGB}GB storage`,
      included: true
    },
    {
      name: `${tier.features.supportLevel} support`,
      included: true
    },
    {
      name: 'QuickBooks integration',
      included: tier.features.integrations.includes('quickbooks')
    },
    {
      name: 'Stripe integration',
      included: tier.features.integrations.includes('stripe')
    },
    {
      name: 'Microsoft 365 integration',
      included: tier.features.integrations.includes('microsoft365')
    },
    {
      name: 'Advanced reporting',
      included: tier.features.advancedReporting
    },
    {
      name: 'Custom branding',
      included: tier.features.customBranding
    },
    {
      name: 'White label solution',
      included: tier.features.whiteLabel || false
    }
  ];

  return (
    <Card className={`relative ${popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          {getCardIcon()}
        </div>
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <CardDescription>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-foreground">
              ${tier.price}
            </span>
            <span className="text-muted-foreground">/{tier.interval}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <Check
                className={`h-4 w-4 ${
                  feature.included
                    ? 'text-green-600'
                    : 'text-gray-300'
                }`}
              />
              <span
                className={`text-sm ${
                  feature.included
                    ? 'text-foreground'
                    : 'text-muted-foreground line-through'
                }`}
              >
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSelect}
          disabled={isDisabled}
          variant={isCurrentPlan ? 'outline' : 'default'}
        >
          {isCurrentPlan ? (
            'Current Plan'
          ) : selecting ? (
            'Selecting...'
          ) : (
            `Choose ${tier.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
