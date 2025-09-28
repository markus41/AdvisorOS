'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  ArrowLeft,
  RefreshCw,
  FileText,
  Image,
  Users,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ReviewDocument {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  category: string;
  subcategory?: string;
  ocrStatus: string;
  ocrConfidence?: number;
  needsReview: boolean;
  createdAt: string;
  client: {
    businessName: string;
    primaryContactName: string;
  };
  uploader: {
    name: string;
    email: string;
  };
}

const getFileIcon = (mimeType: string, className?: string) => {
  if (mimeType.startsWith('image/')) {
    return <Image className={className} />;
  }
  return <FileText className={className} />;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'tax_return': 'bg-purple-100 text-purple-800',
    'financial_statement': 'bg-blue-100 text-blue-800',
    'invoice': 'bg-green-100 text-green-800',
    'receipt': 'bg-yellow-100 text-yellow-800',
    'bank_statement': 'bg-indigo-100 text-indigo-800',
    'w2': 'bg-red-100 text-red-800',
    '1099': 'bg-pink-100 text-pink-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const formatCategoryDisplay = (category: string, subcategory?: string): string => {
  const categoryLabels: Record<string, string> = {
    'tax_return': 'Tax Return',
    'financial_statement': 'Financial Statement',
    'invoice': 'Invoice',
    'receipt': 'Receipt',
    'bank_statement': 'Bank Statement',
    'w2': 'W-2 Form',
    '1099': '1099 Form',
    'general': 'General'
  };

  const label = categoryLabels[category] || category;
  return subcategory ? `${label} - ${subcategory}` : label;
};

export default function ReviewQueuePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });

  useEffect(() => {
    fetchDocuments();
    fetchClients();
  }, [selectedClient, selectedCategory]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (selectedClient) params.set('clientId', selectedClient);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('limit', '100');

      const response = await fetch(`/api/documents/review-queue?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch review queue');
      }

      const data = await response.json();
      setDocuments(data.documents);

      // Calculate stats
      const total = data.documents.length;
      const highPriority = data.documents.filter((doc: ReviewDocument) =>
        doc.ocrConfidence !== undefined && doc.ocrConfidence < 0.5
      ).length;
      const mediumPriority = data.documents.filter((doc: ReviewDocument) =>
        doc.ocrConfidence !== undefined && doc.ocrConfidence >= 0.5 && doc.ocrConfidence < 0.7
      ).length;
      const lowPriority = data.documents.filter((doc: ReviewDocument) =>
        doc.ocrConfidence !== undefined && doc.ocrConfidence >= 0.7
      ).length;

      setStats({ total, highPriority, mediumPriority, lowPriority });

    } catch (error) {
      console.error('Failed to fetch review queue:', error);
      toast({
        title: 'Failed to Load',
        description: 'Failed to load documents needing review. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (documentId: string) => {
    router.push(`/documents/${documentId}/review`);
  };

  const getPriorityBadge = (confidence?: number) => {
    if (confidence === undefined) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    if (confidence < 0.5) {
      return <Badge variant="destructive">High Priority</Badge>;
    } else if (confidence < 0.7) {
      return <Badge variant="secondary">Medium Priority</Badge>;
    } else {
      return <Badge variant="outline">Low Priority</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">OCR Review Queue</h1>
            <p className="text-muted-foreground">
              Documents requiring manual review of extracted data.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchDocuments} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
                <p className="text-xs text-muted-foreground">&lt; 50% confidence</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.mediumPriority}</p>
                <p className="text-xs text-muted-foreground">50-70% confidence</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Priority</p>
                <p className="text-2xl font-bold text-green-600">{stats.lowPriority}</p>
                <p className="text-xs text-muted-foreground">&gt; 70% confidence</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="tax_return">Tax Return</SelectItem>
                  <SelectItem value="financial_statement">Financial Statement</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="w2">W-2 Form</SelectItem>
                  <SelectItem value="1099">1099 Form</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedClient || selectedCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedClient('');
                  setSelectedCategory('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading documents...
            </div>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents need review</h3>
              <p className="text-muted-foreground">
                All documents have been processed successfully or are currently being processed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Document Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {getFileIcon(document.mimeType, 'h-10 w-10 text-gray-400')}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{document.fileName}</h3>
                        {getPriorityBadge(document.ocrConfidence)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {document.client.businessName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCategoryColor(document.category)}>
                          {formatCategoryDisplay(document.category, document.subcategory)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        OCR Confidence
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(document.ocrConfidence || 0) * 100}
                          className="w-20 h-2"
                        />
                        <span className="text-sm font-medium">
                          {Math.round((document.ocrConfidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/documents/${document.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button size="sm" onClick={() => handleStartReview(document.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Review Priority Guidelines:</strong>
          <br />
          • <strong>High Priority (Red):</strong> Confidence below 50% - Requires immediate attention
          <br />
          • <strong>Medium Priority (Yellow):</strong> Confidence 50-70% - Review when possible
          <br />
          • <strong>Low Priority (Gray):</strong> Confidence above 70% - Optional verification
        </AlertDescription>
      </Alert>
    </div>
  );
}