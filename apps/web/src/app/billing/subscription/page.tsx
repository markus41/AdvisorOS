'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Check,
  Star,
  Users,
  Database,
  FileText,
  Globe,
  Shield,
  Zap,
  Crown,
  Plus,
  Minus
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PricingTier, PRICING_TIERS, ADDON_MODULES } from '@/lib/billing/pricing-config';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

export default function SubscriptionPage() {
  const [currentTier, setCurrentTier] = useState<PricingTier>(PricingTier.PROFESSIONAL);
  const [selectedTier, setSelectedTier] = useState<PricingTier>(PricingTier.PROFESSIONAL);
  const [isYearly, setIsYearly] = useState(false);
  const [userCount, setUserCount] = useState(8);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['advanced_analytics']);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculatePrice = (tier: PricingTier) => {
    const config = PRICING_TIERS[tier];
    const basePrice = isYearly ? config.basePriceYearly : config.basePriceMonthly;
    const includedUsers = config.limits.users;
    const extraUsers = Math.max(0, userCount - includedUsers);
    const userPrice = extraUsers * config.perUserPrice * (isYearly ? 12 : 1);

    const addonPrice = selectedAddons.reduce((total, addonKey) => {
      const addon = ADDON_MODULES[addonKey as keyof typeof ADDON_MODULES];
      if (addon && addon.availableForTiers.includes(tier)) {
        return total + (isYearly ? addon.priceYearly : addon.priceMonthly);
      }
      return total;
    }, 0);

    return basePrice + userPrice + addonPrice;
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: 'current_subscription_id', // Would come from state
          tier: selectedTier,
          users: userCount,
          addons: selectedAddons,
          yearly: isYearly,
        }),
      });

      if (response.ok) {
        setCurrentTier(selectedTier);
        setShowUpgradeDialog(false);
        // Show success notification
      } else {
        // Show error notification
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonKey: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonKey)
        ? prev.filter(a => a !== addonKey)
        : [...prev, addonKey]
    );
  };

  const PricingCard = ({ tier, config, isSelected, isCurrent }: {
    tier: PricingTier;
    config: any;
    isSelected: boolean;
    isCurrent: boolean;
  }) => (
    <Card className={`relative transition-all duration-200 ${
      isSelected ? 'ring-2 ring-primary' : ''
    } ${config.popular ? 'border-primary' : ''}`}>
      {config.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="mr-1 h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {tier === PricingTier.STARTER && <Users className="h-5 w-5 text-blue-500" />}
          {tier === PricingTier.PROFESSIONAL && <Crown className="h-5 w-5 text-purple-500" />}
          {tier === PricingTier.ENTERPRISE && <Shield className="h-5 w-5 text-green-500" />}
          <CardTitle className="text-xl capitalize">{tier}</CardTitle>
        </div>
        <CardDescription>{config.description}</CardDescription>
        <div className="text-3xl font-bold">
          {formatCurrency(calculatePrice(tier), 'usd')}
          <span className="text-base font-normal text-muted-foreground">
            /{isYearly ? 'year' : 'month'}
          </span>
        </div>
        {isYearly && (
          <p className="text-sm text-green-600">Save 17% annually</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {config.features.slice(0, 8).map((feature: string) => (
            <div key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
          {config.features.length > 8 && (
            <p className="text-sm text-muted-foreground">
              +{config.features.length - 8} more features
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Plan Limits</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Users: {config.limits.users === 999999 ? 'Unlimited' : config.limits.users}</div>
            <div>Clients: {config.limits.clients === 999999 ? 'Unlimited' : config.limits.clients}</div>
            <div>Storage: {config.limits.storage_gb === 999999 ? 'Unlimited' : `${config.limits.storage_gb} GB`}</div>
            <div>Documents: {config.limits.documents_processed === 999999 ? 'Unlimited' : config.limits.documents_processed}</div>
          </div>
        </div>

        <div className="pt-4">
          {isCurrent ? (
            <Button disabled className="w-full">
              <Check className="mr-2 h-4 w-4" />
              Current Plan
            </Button>
          ) : (
            <Button
              variant={isSelected ? 'default' : 'outline'}
              className="w-full"
              onClick={() => {
                setSelectedTier(tier);
                setShowUpgradeDialog(true);
              }}
            >
              {tier === PricingTier.STARTER && currentTier !== PricingTier.STARTER ? 'Downgrade' : 'Select Plan'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2">
          Select the perfect plan for your CPA practice
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label htmlFor="billing-toggle" className={!isYearly ? 'font-medium' : ''}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={isYearly ? 'font-medium' : ''}>
          Yearly
          <Badge variant="secondary" className="ml-2">Save 17%</Badge>
        </Label>
      </div>

      {/* User Count Selector */}
      <div className="max-w-md mx-auto mb-8">
        <Label htmlFor="user-count" className="text-center block mb-2">
          Number of Users
        </Label>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUserCount(Math.max(1, userCount - 1))}
            disabled={userCount <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="user-count"
            type="number"
            value={userCount}
            onChange={(e) => setUserCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="text-center"
            min="1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUserCount(userCount + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {Object.entries(PRICING_TIERS).map(([tier, config]) => (
          <PricingCard
            key={tier}
            tier={tier as PricingTier}
            config={config}
            isSelected={selectedTier === tier}
            isCurrent={currentTier === tier}
          />
        ))}
      </div>

      {/* Add-ons Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add-on Modules</CardTitle>
          <CardDescription>
            Enhance your plan with additional features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(ADDON_MODULES).map(([key, addon]) => (
              <div
                key={key}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAddons.includes(key) ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleAddon(key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{addon.name}</h4>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(isYearly ? addon.priceYearly : addon.priceMonthly, 'usd')}
                      <span className="text-sm text-muted-foreground">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {addon.description}
                </p>
                <div className="space-y-1">
                  {addon.features.slice(0, 3).map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Change</DialogTitle>
            <DialogDescription>
              Review your new plan details before confirming
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium">New Plan</h4>
              <p className="text-lg capitalize">{selectedTier}</p>
            </div>

            <div>
              <h4 className="font-medium">Users</h4>
              <p>{userCount} users</p>
            </div>

            {selectedAddons.length > 0 && (
              <div>
                <h4 className="font-medium">Add-ons</h4>
                <ul className="list-disc list-inside text-sm">
                  {selectedAddons.map((addonKey) => {
                    const addon = ADDON_MODULES[addonKey as keyof typeof ADDON_MODULES];
                    return <li key={addonKey}>{addon?.name}</li>;
                  })}
                </ul>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold">
                {formatCurrency(calculatePrice(selectedTier), 'usd')}
                <span className="text-sm font-normal text-muted-foreground">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              {currentTier !== selectedTier && (
                <p>
                  You will be charged a prorated amount for the remainder of your current billing period.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}