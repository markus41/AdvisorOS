'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  CreditCard,
  Send,
  Copy,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' | 'overdue';
  total: number;
  currency: string;
  createdAt: string;
  dueDate?: string;
  paidAt?: string;
  description?: string;
  customer: {
    name: string;
    email: string;
  };
}

interface InvoiceTableProps {
  invoices: Invoice[];
  loading?: boolean;
  onInvoiceSelect?: (invoice: Invoice) => void;
  onInvoiceAction?: (invoiceId: string, action: string) => void;
  onRefresh?: () => void;
  showCustomer?: boolean;
  showActions?: boolean;
}

export function InvoiceTable({
  invoices,
  loading = false,
  onInvoiceSelect,
  onInvoiceAction,
  onRefresh,
  showCustomer = true,
  showActions = true
}: InvoiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      open: { label: 'Open', variant: 'default' as const, icon: FileText },
      paid: { label: 'Paid', variant: 'default' as const, icon: CheckCircle },
      void: { label: 'Void', variant: 'outline' as const, icon: XCircle },
      uncollectible: { label: 'Uncollectible', variant: 'destructive' as const, icon: AlertCircle },
      overdue: { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
      icon: FileText
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleAction = (invoiceId: string, action: string) => {
    onInvoiceAction?.(invoiceId, action);
  };

  const getAvailableActions = (invoice: Invoice) => {
    const actions = [
      { label: 'View Details', value: 'view', icon: Eye },
      { label: 'Download PDF', value: 'download', icon: Download },
      { label: 'Copy Link', value: 'copy_link', icon: Copy },
    ];

    if (invoice.status === 'draft') {
      actions.push(
        { label: 'Send Invoice', value: 'send', icon: Send },
        { label: 'Finalize', value: 'finalize', icon: CheckCircle }
      );
    }

    if (invoice.status === 'open') {
      actions.push(
        { label: 'Mark as Paid', value: 'mark_paid', icon: CheckCircle },
        { label: 'Send Reminder', value: 'send_reminder', icon: Send },
        { label: 'Void Invoice', value: 'void', icon: XCircle }
      );
    }

    if (invoice.status === 'open' || invoice.status === 'overdue') {
      actions.push(
        { label: 'Process Payment', value: 'pay', icon: CreditCard }
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              {filteredInvoices.length} of {invoices.length} invoices
            </CardDescription>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
              <SelectItem value="uncollectible">Uncollectible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              {showCustomer && <TableHead>Customer</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Due Date</TableHead>
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className={onInvoiceSelect ? 'cursor-pointer hover:bg-muted/50' : ''}
                onClick={() => onInvoiceSelect?.(invoice)}
              >
                <TableCell className="font-medium">
                  <div>
                    <p>{invoice.number}</p>
                    {invoice.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-48">
                        {invoice.description}
                      </p>
                    )}
                  </div>
                </TableCell>

                {showCustomer && (
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                    </div>
                  </TableCell>
                )}

                <TableCell>
                  {getStatusBadge(invoice.status)}
                </TableCell>

                <TableCell className="font-medium">
                  {formatCurrency(invoice.total, invoice.currency)}
                </TableCell>

                <TableCell>
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </TableCell>

                <TableCell>
                  {invoice.dueDate ? (
                    <span className={
                      new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
                        ? 'text-red-600 font-medium'
                        : ''
                    }>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>

                {showActions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {getAvailableActions(invoice).map((action, index) => {
                          const Icon = action.icon;
                          const isDestructive = action.value === 'void' || action.value === 'delete';

                          return (
                            <div key={action.value}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAction(invoice.id, action.value);
                                }}
                                className={isDestructive ? 'text-destructive' : ''}
                              >
                                <Icon className="mr-2 h-4 w-4" />
                                {action.label}
                              </DropdownMenuItem>
                              {(action.value === 'copy_link' || action.value === 'finalize') && (
                                <DropdownMenuSeparator />
                              )}
                            </div>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'No invoices match your filters'
                : 'No invoices found'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}