'use client';

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  CreditCard,
  Send
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
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
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/billing/invoice');
      if (response.ok) {
        const data = await response.json();
        // Mock data for demonstration
        const mockInvoices: Invoice[] = [
          {
            id: 'inv_1',
            number: 'INV-2024-001',
            status: 'paid',
            total: 79.00,
            currency: 'usd',
            createdAt: '2024-01-15T10:00:00Z',
            dueDate: '2024-02-15T10:00:00Z',
            paidAt: '2024-01-16T14:30:00Z',
            description: 'Monthly subscription - Professional Plan',
            customer: { name: 'Acme Corp', email: 'billing@acme.com' },
            lineItems: [
              { description: 'Professional Plan (Monthly)', quantity: 1, unitPrice: 79.00, amount: 79.00 }
            ]
          },
          {
            id: 'inv_2',
            number: 'INV-2024-002',
            status: 'open',
            total: 158.00,
            currency: 'usd',
            createdAt: '2024-02-15T10:00:00Z',
            dueDate: '2024-03-15T10:00:00Z',
            description: 'Monthly subscription - Professional Plan',
            customer: { name: 'Acme Corp', email: 'billing@acme.com' },
            lineItems: [
              { description: 'Professional Plan (Monthly)', quantity: 1, unitPrice: 79.00, amount: 79.00 },
              { description: 'Additional User', quantity: 3, unitPrice: 25.00, amount: 75.00 },
              { description: 'Advanced Analytics Add-on', quantity: 1, unitPrice: 39.00, amount: 39.00 }
            ]
          },
          {
            id: 'inv_3',
            number: 'INV-2024-003',
            status: 'draft',
            total: 250.00,
            currency: 'usd',
            createdAt: '2024-03-01T10:00:00Z',
            description: 'Custom consulting services',
            customer: { name: 'Beta LLC', email: 'admin@beta.com' },
            lineItems: [
              { description: 'Tax consultation (5 hours)', quantity: 5, unitPrice: 50.00, amount: 250.00 }
            ]
          }
        ];
        setInvoices(mockInvoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      open: { label: 'Open', variant: 'default' as const, icon: FileText },
      paid: { label: 'Paid', variant: 'default' as const, icon: CheckCircle },
      void: { label: 'Void', variant: 'outline' as const, icon: XCircle },
      uncollectible: { label: 'Uncollectible', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const, icon: FileText };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoice/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });

      if (response.ok) {
        loadInvoices();
        // Show success notification
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const handleVoidInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoice/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void' }),
      });

      if (response.ok) {
        loadInvoices();
        // Show success notification
      }
    } catch (error) {
      console.error('Error voiding invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage and track all your invoices
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
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
                <SelectItem value="void">Void</SelectItem>
                <SelectItem value="uncollectible">Uncollectible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {filteredInvoices.length} of {invoices.length} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{invoice.number}</p>
                      {invoice.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-32">
                          {invoice.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{invoice.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
                    </div>
                  </TableCell>
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
                          ? 'text-red-600'
                          : ''
                      }>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInvoice(invoice.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.status === 'open' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVoidInvoice(invoice.id)}
                          >
                            Void
                          </Button>
                          <Button variant="default" size="sm">
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedInvoice?.number}</DialogTitle>
            <DialogDescription>
              Invoice details and line items
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Customer</h4>
                  <p>{selectedInvoice.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customer.email}</p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div>
                  <h4 className="font-medium">Created</h4>
                  <p>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Due Date</h4>
                  <p>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'No due date'}</p>
                </div>
              </div>

              {selectedInvoice.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Line Items</h4>
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
                    {selectedInvoice.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice, selectedInvoice.currency)}</TableCell>
                        <TableCell>{formatCurrency(item.amount, selectedInvoice.currency)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">Total</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                {selectedInvoice.status === 'open' && (
                  <Button>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}