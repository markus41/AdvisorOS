'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Building,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  amount: number;
  currency?: string;
  customerId?: string;
  invoiceId?: string;
  description?: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  showSavePaymentMethod?: boolean;
  requiresBillingAddress?: boolean;
}

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

function PaymentFormContent({
  amount,
  currency = 'usd',
  customerId,
  invoiceId,
  description,
  onSuccess,
  onError,
  showSavePaymentMethod = true,
  requiresBillingAddress = false
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment intent
      const response = await fetch('/api/billing/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          customerId,
          invoiceId,
          description,
          confirmationMethod: 'manual',
        }),
      });

      const { payment } = await response.json();

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        payment.id,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: billingDetails.name,
              email: billingDetails.email,
              ...(requiresBillingAddress && {
                address: billingDetails.address,
              }),
            },
          },
          setup_future_usage: savePaymentMethod ? 'on_session' : undefined,
        }
      );

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        setSucceeded(true);
        onSuccess?.(paymentIntent);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      onError?.(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your payment of {formatCurrency(amount, currency)} has been processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Enter your payment information to complete the transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Billing Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={billingDetails.name}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={billingDetails.email}
                  onChange={(e) =>
                    setBillingDetails({ ...billingDetails, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {requiresBillingAddress && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={billingDetails.address.line1}
                    onChange={(e) =>
                      setBillingDetails({
                        ...billingDetails,
                        address: { ...billingDetails.address, line1: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={billingDetails.address.city}
                      onChange={(e) =>
                        setBillingDetails({
                          ...billingDetails,
                          address: { ...billingDetails.address, city: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={billingDetails.address.state}
                      onChange={(e) =>
                        setBillingDetails({
                          ...billingDetails,
                          address: { ...billingDetails.address, state: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal_code">ZIP Code</Label>
                    <Input
                      id="postal_code"
                      type="text"
                      value={billingDetails.address.postal_code}
                      onChange={(e) =>
                        setBillingDetails({
                          ...billingDetails,
                          address: { ...billingDetails.address, postal_code: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={billingDetails.address.country}
                      onValueChange={(value) =>
                        setBillingDetails({
                          ...billingDetails,
                          address: { ...billingDetails.address, country: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card Details */}
          <div className="space-y-2">
            <Label>Card Information</Label>
            <div className="border rounded-md p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Save Payment Method */}
          {showSavePaymentMethod && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-payment"
                checked={savePaymentMethod}
                onCheckedChange={setSavePaymentMethod}
              />
              <Label htmlFor="save-payment" className="text-sm">
                Save this payment method for future use
              </Label>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!stripe || processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatCurrency(amount, currency)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By clicking "Pay", you agree to our terms of service and privacy policy.
            Your payment is secured by 256-bit SSL encryption.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}