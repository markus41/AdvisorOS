import React from 'react';

// Email template interfaces
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface TemplateData {
  customerName: string;
  customerEmail: string;
  companyName?: string;
  amount?: number;
  currency?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  dueDate?: string;
  planName?: string;
  nextPaymentDate?: string;
  paymentUrl?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
}

// Base email styles
const emailStyles = {
  container: `
    max-width: 600px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #ffffff;
  `,
  header: `
    background-color: #f8fafc;
    padding: 24px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 8px;
  `,
  tagline: `
    font-size: 14px;
    color: #64748b;
  `,
  content: `
    padding: 32px 24px;
  `,
  heading: `
    font-size: 24px;
    font-weight: bold;
    color: #1e293b;
    margin: 0 0 16px 0;
  `,
  subheading: `
    font-size: 18px;
    font-weight: 600;
    color: #334155;
    margin: 24px 0 12px 0;
  `,
  text: `
    font-size: 16px;
    line-height: 1.6;
    color: #334155;
    margin: 0 0 16px 0;
  `,
  button: `
    display: inline-block;
    background-color: #3b82f6;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 16px 0;
  `,
  buttonSecondary: `
    display: inline-block;
    background-color: #f1f5f9;
    color: #475569;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 16px 8px 16px 0;
  `,
  table: `
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  `,
  tableHeader: `
    background-color: #f8fafc;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
  `,
  tableCell: `
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  `,
  alert: `
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;
  `,
  alertText: `
    color: #92400e;
    font-weight: 600;
    margin: 0;
  `,
  footer: `
    background-color: #f8fafc;
    padding: 24px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    font-size: 14px;
    color: #64748b;
  `,
};

// Utility function to format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Template: Invoice Created/Finalized
export const invoiceNotificationTemplate = (data: TemplateData): EmailTemplate => ({
  subject: `Invoice ${data.invoiceNumber} from ${data.companyName || 'CPA Platform'}`,
  html: `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">${data.companyName || 'CPA Platform'}</div>
        <div style="${emailStyles.tagline}">Professional CPA Services</div>
      </div>

      <div style="${emailStyles.content}">
        <h1 style="${emailStyles.heading}">New Invoice</h1>

        <p style="${emailStyles.text}">
          Hello ${data.customerName},
        </p>

        <p style="${emailStyles.text}">
          A new invoice has been generated for your account.
        </p>

        <table style="${emailStyles.table}">
          <tr>
            <td style="${emailStyles.tableHeader}">Invoice Number</td>
            <td style="${emailStyles.tableCell}">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="${emailStyles.tableHeader}">Amount Due</td>
            <td style="${emailStyles.tableCell}">${formatCurrency(data.amount!, data.currency)}</td>
          </tr>
          <tr>
            <td style="${emailStyles.tableHeader}">Due Date</td>
            <td style="${emailStyles.tableCell}">${data.dueDate}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.invoiceUrl}" style="${emailStyles.button}">
            View & Pay Invoice
          </a>
        </div>

        <p style="${emailStyles.text}">
          You can view and pay this invoice online by clicking the button above.
          If you have any questions, please don't hesitate to contact our support team.
        </p>
      </div>

      <div style="${emailStyles.footer}">
        <p>
          ${data.companyName || 'CPA Platform'}<br>
          <a href="${data.supportUrl}">Support</a> |
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    </div>
  `,
  text: `
Invoice ${data.invoiceNumber} from ${data.companyName || 'CPA Platform'}

Hello ${data.customerName},

A new invoice has been generated for your account.

Invoice Details:
- Invoice Number: ${data.invoiceNumber}
- Amount Due: ${formatCurrency(data.amount!, data.currency)}
- Due Date: ${data.dueDate}

View and pay your invoice online: ${data.invoiceUrl}

If you have any questions, please contact our support team.

${data.companyName || 'CPA Platform'}
Support: ${data.supportUrl}
  `
});

// Template: Payment Successful
export const paymentSuccessTemplate = (data: TemplateData): EmailTemplate => ({
  subject: `Payment Confirmation - ${formatCurrency(data.amount!, data.currency)}`,
  html: `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">${data.companyName || 'CPA Platform'}</div>
        <div style="${emailStyles.tagline}">Professional CPA Services</div>
      </div>

      <div style="${emailStyles.content}">
        <h1 style="${emailStyles.heading}">Payment Received</h1>

        <p style="${emailStyles.text}">
          Hello ${data.customerName},
        </p>

        <p style="${emailStyles.text}">
          Thank you! We've successfully received your payment.
        </p>

        <table style="${emailStyles.table}">
          <tr>
            <td style="${emailStyles.tableHeader}">Payment Amount</td>
            <td style="${emailStyles.tableCell}">${formatCurrency(data.amount!, data.currency)}</td>
          </tr>
          <tr>
            <td style="${emailStyles.tableHeader}">Invoice Number</td>
            <td style="${emailStyles.tableCell}">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="${emailStyles.tableHeader}">Payment Date</td>
            <td style="${emailStyles.tableCell}">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.invoiceUrl}" style="${emailStyles.button}">
            Download Receipt
          </a>
        </div>

        <p style="${emailStyles.text}">
          Your payment has been applied to your account. You can download your receipt
          by clicking the button above.
        </p>
      </div>

      <div style="${emailStyles.footer}">
        <p>
          ${data.companyName || 'CPA Platform'}<br>
          <a href="${data.supportUrl}">Support</a> |
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    </div>
  `,
  text: `
Payment Confirmation - ${formatCurrency(data.amount!, data.currency)}

Hello ${data.customerName},

Thank you! We've successfully received your payment.

Payment Details:
- Payment Amount: ${formatCurrency(data.amount!, data.currency)}
- Invoice Number: ${data.invoiceNumber}
- Payment Date: ${new Date().toLocaleDateString()}

Download your receipt: ${data.invoiceUrl}

${data.companyName || 'CPA Platform'}
Support: ${data.supportUrl}
  `
});

// Template: Payment Failed
export const paymentFailedTemplate = (data: TemplateData): EmailTemplate => ({
  subject: `Payment Failed - Action Required`,
  html: `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">${data.companyName || 'CPA Platform'}</div>
        <div style="${emailStyles.tagline}">Professional CPA Services</div>
      </div>

      <div style="${emailStyles.content}">
        <h1 style="${emailStyles.heading}">Payment Failed</h1>

        <p style="${emailStyles.text}">
          Hello ${data.customerName},
        </p>

        <div style="${emailStyles.alert}">
          <p style="${emailStyles.alertText}">
            We were unable to process your payment for invoice ${data.invoiceNumber}.
          </p>
        </div>

        <p style="${emailStyles.text}">
          This could be due to:
        </p>

        <ul style="${emailStyles.text}">
          <li>Insufficient funds</li>
          <li>Expired payment method</li>
          <li>Payment method declined by your bank</li>
        </ul>

        <table style="${emailStyles.table}">
          <tr>
            <td style="${emailStyles.tableHeader}">Invoice Number</td>
            <td style="${emailStyles.tableCell}">${data.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="${emailStyles.tableHeader}">Amount Due</td>
            <td style="${emailStyles.tableCell}">${formatCurrency(data.amount!, data.currency)}</td>
          </tr>
          <tr>
            <td style="${emailStyles.tableHeader}">Due Date</td>
            <td style="${emailStyles.tableCell}">${data.dueDate}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.paymentUrl}" style="${emailStyles.button}">
            Update Payment Method
          </a>
          <a href="${data.invoiceUrl}" style="${emailStyles.buttonSecondary}">
            View Invoice
          </a>
        </div>

        <p style="${emailStyles.text}">
          Please update your payment method or try a different payment method to
          avoid any interruption to your service.
        </p>
      </div>

      <div style="${emailStyles.footer}">
        <p>
          ${data.companyName || 'CPA Platform'}<br>
          <a href="${data.supportUrl}">Support</a> |
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    </div>
  `,
  text: `
Payment Failed - Action Required

Hello ${data.customerName},

We were unable to process your payment for invoice ${data.invoiceNumber}.

Invoice Details:
- Invoice Number: ${data.invoiceNumber}
- Amount Due: ${formatCurrency(data.amount!, data.currency)}
- Due Date: ${data.dueDate}

This could be due to insufficient funds, expired payment method, or payment method declined by your bank.

Please update your payment method: ${data.paymentUrl}
View invoice: ${data.invoiceUrl}

${data.companyName || 'CPA Platform'}
Support: ${data.supportUrl}
  `
});

// Template: Subscription Created
export const subscriptionCreatedTemplate = (data: TemplateData): EmailTemplate => ({
  subject: `Welcome to ${data.planName} - Subscription Activated`,
  html: `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">${data.companyName || 'CPA Platform'}</div>
        <div style="${emailStyles.tagline}">Professional CPA Services</div>
      </div>

      <div style="${emailStyles.content}">
        <h1 style="${emailStyles.heading}">Welcome Aboard!</h1>

        <p style="${emailStyles.text}">
          Hello ${data.customerName},
        </p>

        <p style="${emailStyles.text}">
          Congratulations! Your ${data.planName} subscription has been activated and you now have
          access to all the powerful features of our CPA platform.
        </p>

        <h2 style="${emailStyles.subheading}">What's Next?</h2>

        <ul style="${emailStyles.text}">
          <li>Set up your firm profile and branding</li>
          <li>Invite team members to your workspace</li>
          <li>Import your existing client data</li>
          <li>Explore our document automation features</li>
          <li>Configure your client portal</li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.paymentUrl}" style="${emailStyles.button}">
            Get Started
          </a>
        </div>

        <p style="${emailStyles.text}">
          Your next payment of ${formatCurrency(data.amount!, data.currency)} will be
          automatically charged on ${data.nextPaymentDate}.
        </p>

        <p style="${emailStyles.text}">
          If you have any questions or need help getting started, our support team is here to help.
        </p>
      </div>

      <div style="${emailStyles.footer}">
        <p>
          ${data.companyName || 'CPA Platform'}<br>
          <a href="${data.supportUrl}">Support</a> |
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    </div>
  `,
  text: `
Welcome to ${data.planName} - Subscription Activated

Hello ${data.customerName},

Congratulations! Your ${data.planName} subscription has been activated and you now have access to all the powerful features of our CPA platform.

What's Next?
- Set up your firm profile and branding
- Invite team members to your workspace
- Import your existing client data
- Explore our document automation features
- Configure your client portal

Get started: ${data.paymentUrl}

Your next payment of ${formatCurrency(data.amount!, data.currency)} will be automatically charged on ${data.nextPaymentDate}.

${data.companyName || 'CPA Platform'}
Support: ${data.supportUrl}
  `
});

// Template: Trial Ending
export const trialEndingTemplate = (data: TemplateData): EmailTemplate => ({
  subject: `Your trial ends in 3 days - Don't lose access!`,
  html: `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">${data.companyName || 'CPA Platform'}</div>
        <div style="${emailStyles.tagline}">Professional CPA Services</div>
      </div>

      <div style="${emailStyles.content}">
        <h1 style="${emailStyles.heading}">Your Trial is Ending Soon</h1>

        <p style="${emailStyles.text}">
          Hello ${data.customerName},
        </p>

        <div style="${emailStyles.alert}">
          <p style="${emailStyles.alertText}">
            Your free trial ends in 3 days. Subscribe now to keep access to all features.
          </p>
        </div>

        <p style="${emailStyles.text}">
          We hope you've enjoyed exploring our CPA platform during your trial period.
          To continue using all the features you've been testing, you'll need to choose a subscription plan.
        </p>

        <h2 style="${emailStyles.subheading}">What happens if you don't subscribe?</h2>

        <ul style="${emailStyles.text}">
          <li>You'll lose access to all premium features</li>
          <li>Your data will be safely stored for 30 days</li>
          <li>You can reactivate anytime within 30 days</li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.paymentUrl}" style="${emailStyles.button}">
            Choose Your Plan
          </a>
        </div>

        <p style="${emailStyles.text}">
          Questions? Our support team is available to help you choose the right plan
          for your firm's needs.
        </p>
      </div>

      <div style="${emailStyles.footer}">
        <p>
          ${data.companyName || 'CPA Platform'}<br>
          <a href="${data.supportUrl}">Support</a> |
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    </div>
  `,
  text: `
Your Trial is Ending Soon

Hello ${data.customerName},

Your free trial ends in 3 days. Subscribe now to keep access to all features.

We hope you've enjoyed exploring our CPA platform during your trial period. To continue using all the features you've been testing, you'll need to choose a subscription plan.

What happens if you don't subscribe?
- You'll lose access to all premium features
- Your data will be safely stored for 30 days
- You can reactivate anytime within 30 days

Choose your plan: ${data.paymentUrl}

${data.companyName || 'CPA Platform'}
Support: ${data.supportUrl}
  `
});

// Template: Subscription Cancelled
export const subscriptionCancelledTemplate = (data: TemplateData): EmailTemplate => ({
  subject: `Subscription Cancelled - We're Sorry to See You Go`,
  html: `
    <div style="${emailStyles.container}">
      <div style="${emailStyles.header}">
        <div style="${emailStyles.logo}">${data.companyName || 'CPA Platform'}</div>
        <div style="${emailStyles.tagline}">Professional CPA Services</div>
      </div>

      <div style="${emailStyles.content}">
        <h1 style="${emailStyles.heading}">Subscription Cancelled</h1>

        <p style="${emailStyles.text}">
          Hello ${data.customerName},
        </p>

        <p style="${emailStyles.text}">
          We're sorry to see you go. Your ${data.planName} subscription has been cancelled
          and will remain active until ${data.dueDate}.
        </p>

        <h2 style="${emailStyles.subheading}">What happens now?</h2>

        <ul style="${emailStyles.text}">
          <li>You'll continue to have full access until ${data.dueDate}</li>
          <li>No further charges will be made to your account</li>
          <li>Your data will be safely stored for 30 days after cancellation</li>
          <li>You can reactivate your subscription anytime</li>
        </ul>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.paymentUrl}" style="${emailStyles.buttonSecondary}">
            Reactivate Subscription
          </a>
        </div>

        <p style="${emailStyles.text}">
          We'd love to hear your feedback about why you're leaving. Your input helps us
          improve our platform for all users.
        </p>

        <p style="${emailStyles.text}">
          Thank you for being a valued customer. We hope to serve you again in the future.
        </p>
      </div>

      <div style="${emailStyles.footer}">
        <p>
          ${data.companyName || 'CPA Platform'}<br>
          <a href="${data.supportUrl}">Support</a> |
          <a href="${data.unsubscribeUrl}">Unsubscribe</a>
        </p>
      </div>
    </div>
  `,
  text: `
Subscription Cancelled - We're Sorry to See You Go

Hello ${data.customerName},

We're sorry to see you go. Your ${data.planName} subscription has been cancelled and will remain active until ${data.dueDate}.

What happens now?
- You'll continue to have full access until ${data.dueDate}
- No further charges will be made to your account
- Your data will be safely stored for 30 days after cancellation
- You can reactivate your subscription anytime

Reactivate subscription: ${data.paymentUrl}

Thank you for being a valued customer. We hope to serve you again in the future.

${data.companyName || 'CPA Platform'}
Support: ${data.supportUrl}
  `
});

// Export all templates
export const billingEmailTemplates = {
  invoiceNotification: invoiceNotificationTemplate,
  paymentSuccess: paymentSuccessTemplate,
  paymentFailed: paymentFailedTemplate,
  subscriptionCreated: subscriptionCreatedTemplate,
  trialEnding: trialEndingTemplate,
  subscriptionCancelled: subscriptionCancelledTemplate,
};