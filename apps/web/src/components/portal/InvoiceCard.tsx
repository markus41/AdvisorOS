'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  description: string
  amount: number
  issueDate: string
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'draft'
  paymentMethod?: string
  paidDate?: string
  downloadUrl: string
  previewUrl?: string
}

interface InvoiceCardProps {
  invoice: Invoice
  onView?: (invoice: Invoice) => void
  onDownload?: (invoice: Invoice) => void
  onPay?: (invoice: Invoice) => void
  showActions?: boolean
  className?: string
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

function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function InvoiceCard({
  invoice,
  onView,
  onDownload,
  onPay,
  showActions = true,
  className
}: InvoiceCardProps) {
  const canPay = invoice.status === 'pending' || invoice.status === 'overdue'
  const daysUntilDue = getDaysUntilDue(invoice.dueDate)
  const isOverdue = daysUntilDue < 0 && invoice.status !== 'paid'
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0 && invoice.status !== 'paid'

  const handleView = () => {
    if (onView) onView(invoice)
  }

  const handleDownload = () => {
    if (onDownload) onDownload(invoice)
  }

  const handlePay = () => {
    if (onPay) onPay(invoice)
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className={cn(
        'hover:shadow-lg transition-all duration-200',
        isOverdue && 'border-red-200 dark:border-red-800',
        isDueSoon && 'border-yellow-200 dark:border-yellow-800',
        className
      )}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-2 rounded-lg",
                invoice.status === 'paid' && "bg-green-100 dark:bg-green-900/20",
                invoice.status === 'pending' && "bg-yellow-100 dark:bg-yellow-900/20",
                invoice.status === 'overdue' && "bg-red-100 dark:bg-red-900/20",
                invoice.status === 'draft' && "bg-gray-100 dark:bg-gray-900/20"
              )}>
                <FileText className={cn(
                  "w-5 h-5",
                  invoice.status === 'paid' && "text-green-600 dark:text-green-400",
                  invoice.status === 'pending' && "text-yellow-600 dark:text-yellow-400",
                  invoice.status === 'overdue' && "text-red-600 dark:text-red-400",
                  invoice.status === 'draft' && "text-gray-600 dark:text-gray-400"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {invoice.invoiceNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {invoice.description}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={getStatusColor(invoice.status)}>
              <span className="flex items-center space-x-1">
                {getStatusIcon(invoice.status)}
                <span className="capitalize">{invoice.status}</span>
              </span>
            </Badge>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(invoice.amount)}
              </span>
            </div>
          </div>

          {/* Date Information */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Issue Date</span>
              <span className="text-gray-900 dark:text-white">
                {formatDate(invoice.issueDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Due Date</span>
              <span className={cn(
                "font-medium",
                isOverdue && "text-red-600 dark:text-red-400",
                isDueSoon && "text-yellow-600 dark:text-yellow-400",
                !isOverdue && !isDueSoon && "text-gray-900 dark:text-white"
              )}>
                {formatDate(invoice.dueDate)}
                {isOverdue && (
                  <span className="ml-1 text-xs">
                    ({Math.abs(daysUntilDue)} days overdue)
                  </span>
                )}
                {isDueSoon && (
                  <span className="ml-1 text-xs">
                    ({daysUntilDue} days left)
                  </span>
                )}
              </span>
            </div>
            {invoice.paidDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Paid Date</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {formatDate(invoice.paidDate)}
                </span>
              </div>
            )}
            {invoice.paymentMethod && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                <span className="text-gray-900 dark:text-white">
                  {invoice.paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2">
              {onView && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleView}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              )}
              {onDownload && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              {canPay && onPay && (
                <Button
                  size="sm"
                  onClick={handlePay}
                  className={cn(
                    "flex-1",
                    isOverdue && "bg-red-600 hover:bg-red-700",
                    isDueSoon && "bg-yellow-600 hover:bg-yellow-700"
                  )}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              )}
            </div>
          )}

          {/* Due Date Warning */}
          {(isOverdue || isDueSoon) && (
            <div className={cn(
              "mt-4 p-3 rounded-lg flex items-center space-x-2 text-sm",
              isOverdue && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
              isDueSoon && "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
            )}>
              <AlertCircle className="w-4 h-4" />
              <span>
                {isOverdue
                  ? `This invoice is ${Math.abs(daysUntilDue)} days overdue`
                  : `This invoice is due in ${daysUntilDue} days`
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}