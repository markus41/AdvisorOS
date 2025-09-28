'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Download,
  Eye,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Receipt,
  FileText,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Invoice {
  id: string
  invoiceNumber: string
  description: string
  amount: number
  issueDate: string
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'draft'
  services: InvoiceService[]
  paymentMethod?: string
  paidDate?: string
  downloadUrl: string
}

interface InvoiceService {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Payment {
  id: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMethod: string
  transactionId: string
  status: 'completed' | 'pending' | 'failed'
  receiptUrl: string
}

interface PaymentSummary {
  totalPaid: number
  totalOutstanding: number
  totalOverdue: number
  averagePaymentTime: number
}

const sampleInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    description: 'Monthly Bookkeeping Services - October 2024',
    amount: 1500,
    issueDate: '2024-11-01',
    dueDate: '2024-11-15',
    status: 'pending',
    services: [
      {
        description: 'Monthly Bookkeeping',
        quantity: 1,
        rate: 1200,
        amount: 1200
      },
      {
        description: 'Financial Statement Preparation',
        quantity: 1,
        rate: 300,
        amount: 300
      }
    ],
    downloadUrl: '/invoices/INV-2024-001.pdf'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    description: 'Q3 Tax Consultation',
    amount: 750,
    issueDate: '2024-10-15',
    dueDate: '2024-10-30',
    status: 'overdue',
    services: [
      {
        description: 'Tax Planning Consultation',
        quantity: 3,
        rate: 250,
        amount: 750
      }
    ],
    downloadUrl: '/invoices/INV-2024-002.pdf'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    description: 'Annual Financial Review',
    amount: 2500,
    issueDate: '2024-09-01',
    dueDate: '2024-09-15',
    status: 'paid',
    paymentMethod: 'Credit Card',
    paidDate: '2024-09-12',
    services: [
      {
        description: 'Comprehensive Financial Review',
        quantity: 1,
        rate: 2000,
        amount: 2000
      },
      {
        description: 'Strategic Planning Session',
        quantity: 1,
        rate: 500,
        amount: 500
      }
    ],
    downloadUrl: '/invoices/INV-2024-003.pdf'
  }
]

const samplePayments: Payment[] = [
  {
    id: '1',
    invoiceId: '3',
    invoiceNumber: 'INV-2024-003',
    amount: 2500,
    paymentDate: '2024-09-12',
    paymentMethod: 'Credit Card (**** 4242)',
    transactionId: 'txn_1234567890',
    status: 'completed',
    receiptUrl: '/receipts/receipt-1234567890.pdf'
  },
  {
    id: '2',
    invoiceId: '4',
    invoiceNumber: 'INV-2024-004',
    amount: 1200,
    paymentDate: '2024-08-15',
    paymentMethod: 'ACH Transfer',
    transactionId: 'txn_0987654321',
    status: 'completed',
    receiptUrl: '/receipts/receipt-0987654321.pdf'
  }
]

const paymentSummary: PaymentSummary = {
  totalPaid: 3700,
  totalOutstanding: 2250,
  totalOverdue: 750,
  averagePaymentTime: 8
}

function getStatusColor(status: Invoice['status']) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

function getStatusIcon(status: Invoice['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" />
    case 'paid':
      return <CheckCircle className="w-4 h-4" />
    case 'overdue':
      return <AlertCircle className="w-4 h-4" />
    case 'draft':
      return <FileText className="w-4 h-4" />
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface InvoiceCardProps {
  invoice: Invoice
  onView: (invoice: Invoice) => void
  onDownload: (invoice: Invoice) => void
  onPay?: (invoice: Invoice) => void
}

function InvoiceCard({ invoice, onView, onDownload, onPay }: InvoiceCardProps) {
  const canPay = invoice.status === 'pending' || invoice.status === 'overdue'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {invoice.invoiceNumber}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {invoice.description}
            </p>
          </div>
          <Badge variant="secondary" className={getStatusColor(invoice.status)}>
            <span className="flex items-center space-x-1">
              {getStatusIcon(invoice.status)}
              <span className="capitalize">{invoice.status}</span>
            </span>
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Amount</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(invoice.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Issue Date</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(invoice.issueDate)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Due Date</span>
            <span className={`${
              invoice.status === 'overdue'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {formatDate(invoice.dueDate)}
            </span>
          </div>
          {invoice.paidDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Paid Date</span>
              <span className="text-green-600 dark:text-green-400">
                {formatDate(invoice.paidDate)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(invoice)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(invoice)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {canPay && onPay && (
            <Button
              size="sm"
              onClick={() => onPay(invoice)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PaymentCardProps {
  payment: Payment
  onViewReceipt: (payment: Payment) => void
}

function PaymentCard({ payment, onViewReceipt }: PaymentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {payment.invoiceNumber}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Transaction ID: {payment.transactionId}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {payment.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Amount</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Payment Date</span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(payment.paymentDate)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Method</span>
            <span className="text-gray-900 dark:text-white">
              {payment.paymentMethod}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewReceipt(payment)}
          className="w-full"
        >
          <Receipt className="w-4 h-4 mr-2" />
          View Receipt
        </Button>
      </CardContent>
    </Card>
  )
}

interface PaymentSummaryCardProps {
  summary: PaymentSummary
}

function PaymentSummaryCard({ summary }: PaymentSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Total Paid</h3>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary.totalPaid)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            This year
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Outstanding</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(summary.totalOutstanding)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Currently due
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Overdue</h3>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(summary.totalOverdue)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Past due date
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Avg Payment Time</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.averagePaymentTime} days
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Average time to pay
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(sampleInvoices)
  const [payments] = useState<Payment[]>(samplePayments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleViewInvoice = (invoice: Invoice) => {
    console.log('View invoice:', invoice)
    // Handle invoice viewing logic
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    console.log('Download invoice:', invoice)
    // Handle invoice download logic
    window.open(invoice.downloadUrl, '_blank')
  }

  const handlePayInvoice = (invoice: Invoice) => {
    console.log('Pay invoice:', invoice)
    // Navigate to payment page or open payment modal
    window.location.href = `/portal/invoices/pay?invoice=${invoice.id}`
  }

  const handleViewReceipt = (payment: Payment) => {
    console.log('View receipt:', payment)
    // Handle receipt viewing logic
    window.open(payment.receiptUrl, '_blank')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoices & Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your invoices, make payments, and view payment history
          </p>
        </div>
        <Button asChild>
          <a href="/portal/invoices/pay">
            <CreditCard className="w-4 h-4 mr-2" />
            Make Payment
          </a>
        </Button>
      </motion.div>

      {/* Payment Summary */}
      <motion.div variants={itemVariants}>
        <PaymentSummaryCard summary={paymentSummary} />
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInvoices.map((invoice) => (
              <motion.div
                key={invoice.id}
                variants={itemVariants}
              >
                <InvoiceCard
                  invoice={invoice}
                  onView={handleViewInvoice}
                  onDownload={handleDownloadInvoice}
                  onPay={handlePayInvoice}
                />
              </motion.div>
            ))}
          </div>

          {filteredInvoices.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No invoices found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No invoices match your current search criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {payments.map((payment) => (
              <motion.div
                key={payment.id}
                variants={itemVariants}
              >
                <PaymentCard
                  payment={payment}
                  onViewReceipt={handleViewReceipt}
                />
              </motion.div>
            ))}
          </div>

          {payments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No payments yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your payment history will appear here once you make your first payment.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Need Help with Payments?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contact us if you have questions about your invoices or need assistance with payments.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" asChild>
                  <a href="/portal/messages">
                    Contact CPA
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                <Button asChild>
                  <a href="/portal/invoices/pay">
                    Make Payment
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}