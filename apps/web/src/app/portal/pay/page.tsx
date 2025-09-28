'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Building,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Shield,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  description?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    last4: string;
    bankName: string;
  };
}

export default function ClientPaymentPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice');

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [setupAutoPay, setSetupAutoPay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    } else {
      loadPaymentHistory();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);

      // Mock invoice data for demonstration
      const mockInvoice: Invoice = {
        id: invoiceId!,
        number: 'INV-2024-002',
        status: 'open',
        total: 158.00,
        currency: 'usd',
        dueDate: '2024-03-15T10:00:00Z',
        description: 'Monthly subscription - Professional Plan',
        lineItems: [
          { description: 'Professional Plan (Monthly)', quantity: 1, unitPrice: 79.00, amount: 79.00 },
          { description: 'Additional User', quantity: 3, unitPrice: 25.00, amount: 75.00 },
          { description: 'Advanced Analytics Add-on', quantity: 1, unitPrice: 39.00, amount: 39.00 }
        ]
      };

      setInvoice(mockInvoice);

      // Mock payment methods
      setPaymentMethods([
        {
          id: 'pm_1',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025
          }
        }
      ]);

    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    // Load payment history for client portal
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod || !invoice) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/billing/invoice/${invoice.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: selectedPaymentMethod,
        }),
      });

      if (response.ok) {
        setPaymentComplete(true);

        // Setup auto-pay if requested
        if (setupAutoPay) {
          await fetch('/api/billing/payment-method', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentMethodId: selectedPaymentMethod,
            }),
          });
        }
      } else {
        // Handle payment error
        console.error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Due', variant: 'destructive' as const, icon: AlertCircle },
      paid: { label: 'Paid', variant: 'default' as const, icon: CheckCircle },
      overdue: { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Your payment of {formatCurrency(invoice?.total || 0, invoice?.currency || 'usd')} has been processed successfully.
              </p>
              <div className="space-y-2">
                <Button className="w-full">
                  Download Receipt
                </Button>
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invoice && invoiceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
              <p className="text-muted-foreground">
                The invoice you're looking for could not be found or may have been already paid.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Building className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-3xl font-bold">Secure Payment Portal</h1>
          <p className="text-muted-foreground">
            Complete your payment securely with 256-bit SSL encryption
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Invoice Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {invoice?.number}
                    </CardTitle>
                    <CardDescription>{invoice?.description}</CardDescription>
                  </div>
                  {getStatusBadge(invoice?.status || 'open')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Amount Due</h4>
                    <p className="text-2xl font-bold">
                      {formatCurrency(invoice?.total || 0, invoice?.currency || 'usd')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Due Date</h4>
                    <p className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <h4 className="font-medium mb-4">Invoice Details</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice?.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice, invoice.currency)}</TableCell>
                        <TableCell>{formatCurrency(item.amount, invoice.currency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">Total</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(invoice?.total || 0, invoice?.currency || 'usd')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Select your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {method.type === 'card' ? (
                          <CreditCard className="h-5 w-5" />
                        ) : (
                          <Building className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        {method.type === 'card' && method.card ? (
                          <div>
                            <p className="font-medium capitalize">
                              {method.card.brand} ending in {method.card.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {method.card.expMonth}/{method.card.expYear}
                            </p>
                          </div>
                        ) : method.type === 'bank_account' && method.bankAccount ? (
                          <div>
                            <p className="font-medium">
                              {method.bankAccount.bankName} ending in {method.bankAccount.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">Bank Account</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add New Payment Method
                </Button>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-pay"
                      checked={setupAutoPay}
                      onCheckedChange={setSetupAutoPay}
                    />
                    <label
                      htmlFor="auto-pay"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Set up automatic payments for future invoices
                    </label>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Your payment information is encrypted and secure</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || processing}
                >
                  {processing ? (
                    'Processing...'
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay {formatCurrency(invoice?.total || 0, invoice?.currency || 'usd')}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By clicking "Pay", you agree to our terms of service and privacy policy.
                  Your payment is secured by 256-bit SSL encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}