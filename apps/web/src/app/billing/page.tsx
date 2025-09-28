'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
  Settings,
  Users,
  Database,
  Globe
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
}

interface UsageData {
  users: { current: number; limit: number };
  clients: { current: number; limit: number };
  documents: { current: number; limit: number };
  storage: { current: number; limit: number };
}

interface InvoiceData {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
}

export default function BillingOverviewPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [upcomingInvoice, setUpcomingInvoice] = useState<InvoiceData | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load subscription data
      const subResponse = await fetch('/api/billing/subscription');
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.subscriptions[0] || null);
      }

      // Load usage data (this would come from your analytics/usage tracking)
      setUsage({
        users: { current: 8, limit: 15 },
        clients: { current: 142, limit: 250 },
        documents: { current: 1250, limit: 2500 },
        storage: { current: 85, limit: 250 },
      });

      // Load recent invoices
      const invoiceResponse = await fetch('/api/billing/invoice?limit=5');
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        setRecentInvoices(invoiceData.invoices || []);
      }

      // Mock upcoming invoice
      setUpcomingInvoice({
        id: 'in_upcoming',
        number: 'INV-2024-001',
        status: 'upcoming',
        total: 79.00,
        currency: 'usd',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      trialing: { label: 'Trial', variant: 'secondary' as const },
      past_due: { label: 'Past Due', variant: 'destructive' as const },
      canceled: { label: 'Canceled', variant: 'outline' as const },
      unpaid: { label: 'Unpaid', variant: 'destructive' as const },
    };

    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Overview</h1>
          <p className="text-muted-foreground">
            Manage your subscription, view usage, and track payments
          </p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Billing Settings
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {subscription?.tier || 'No Plan'}
            </div>
            {subscription && (
              <Badge variant={getStatusBadge(subscription.status).variant} className="mt-2">
                {getStatusBadge(subscription.status).label}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingInvoice ? formatCurrency(upcomingInvoice.total, upcomingInvoice.currency) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingInvoice ? `Due ${new Date(upcomingInvoice.dueDate).toLocaleDateString()}` : 'No upcoming payment'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage?.users.current || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              of {usage?.users.limit || 0} included
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage?.storage.current || 0} GB
            </div>
            <p className="text-xs text-muted-foreground">
              of {usage?.storage.limit || 0} GB included
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Track your current usage against plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usage && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Users</span>
                      <span>{usage.users.current} / {usage.users.limit}</span>
                    </div>
                    <Progress value={getUsagePercentage(usage.users.current, usage.users.limit)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Clients</span>
                      <span>{usage.clients.current} / {usage.clients.limit}</span>
                    </div>
                    <Progress value={getUsagePercentage(usage.clients.current, usage.clients.limit)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Documents Processed</span>
                      <span>{usage.documents.current} / {usage.documents.limit}</span>
                    </div>
                    <Progress value={getUsagePercentage(usage.documents.current, usage.documents.limit)} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage (GB)</span>
                      <span>{usage.storage.current} / {usage.storage.limit}</span>
                    </div>
                    <Progress value={getUsagePercentage(usage.storage.current, usage.storage.limit)} />
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Manage your current subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Plan</label>
                      <p className="text-lg capitalize">{subscription.tier}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <div className="mt-1">
                        <Badge variant={getStatusBadge(subscription.status).variant}>
                          {getStatusBadge(subscription.status).label}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Current Period</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Users</label>
                      <p className="text-lg">{subscription.users}</p>
                    </div>
                  </div>

                  {subscription.addons.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Add-ons</label>
                      <div className="flex gap-2 mt-1">
                        {subscription.addons.map((addon) => (
                          <Badge key={addon} variant="secondary">
                            {addon.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button>
                      Upgrade Plan
                    </Button>
                    <Button variant="outline">
                      Modify Subscription
                    </Button>
                    {subscription.cancelAtPeriodEnd ? (
                      <Button variant="outline">
                        Reactivate
                      </Button>
                    ) : (
                      <Button variant="destructive">
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active subscription</p>
                  <Button>
                    Start Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                View and download your billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingInvoice && (
                <div className="border rounded-lg p-4 mb-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Upcoming Invoice</h4>
                      <p className="text-sm text-muted-foreground">
                        Due {new Date(upcomingInvoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(upcomingInvoice.total, upcomingInvoice.currency)}
                      </p>
                      <Badge variant="secondary">Upcoming</Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.paidAt ? `Paid ${new Date(invoice.paidAt).toLocaleDateString()}` : `Due ${new Date(invoice.dueDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </p>
                          <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'open' ? 'secondary' : 'destructive'}>
                            {invoice.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                            {invoice.status === 'past_due' && <AlertCircle className="mr-1 h-3 w-3" />}
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No invoices found</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <Button variant="outline">
                  View All Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Default</Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}