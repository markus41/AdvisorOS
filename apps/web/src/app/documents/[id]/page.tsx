'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DocumentViewer } from '@/components/documents/viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user && params.id) {
      fetchDocument();
    }
  }, [session?.user, params.id]);

  const fetchDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        } else if (response.status === 403) {
          throw new Error('Access denied to this document');
        } else {
          throw new Error('Failed to load document');
        }
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMessage);
      console.error('Failed to fetch document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpdate = () => {
    // Refresh document data when it's updated
    fetchDocument();
    toast({
      title: 'Document Updated',
      description: 'The document has been updated successfully.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Loading Document</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we load your document...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Document</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={fetchDocument}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Document Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The document you're looking for doesn't exist or has been removed.
            </p>
            <Button variant="outline" onClick={() => router.push('/documents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DocumentViewer
      documentId={params.id}
      document={document}
      onUpdate={handleDocumentUpdate}
    />
  );
}