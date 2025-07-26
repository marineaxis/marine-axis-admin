// Provider documents management page
import React, { useState } from 'react';
import { Upload, Download, Trash2, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  uploadDate: string;
  expiryDate?: string;
  size: string;
  url: string;
  rejectionReason?: string;
}

const DOCUMENT_TYPES = [
  'Business License',
  'Insurance Certificate',
  'Professional Certification',
  'Tax ID',
  'Workers Compensation',
  'Bonding Certificate',
  'Other'
];

const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    name: 'Business License 2024',
    type: 'Business License',
    status: 'approved',
    uploadDate: '2024-01-15T00:00:00Z',
    expiryDate: '2024-12-31T00:00:00Z',
    size: '1.2 MB',
    url: '#'
  },
  {
    id: '2',
    name: 'General Liability Insurance',
    type: 'Insurance Certificate',
    status: 'approved',
    uploadDate: '2024-01-10T00:00:00Z',
    expiryDate: '2024-12-10T00:00:00Z',
    size: '2.1 MB',
    url: '#'
  },
  {
    id: '3',
    name: 'Marine Technician Certification',
    type: 'Professional Certification',
    status: 'pending',
    uploadDate: '2024-01-25T00:00:00Z',
    expiryDate: '2025-01-25T00:00:00Z',
    size: '1.8 MB',
    url: '#'
  },
  {
    id: '4',
    name: 'Workers Comp Certificate',
    type: 'Workers Compensation',
    status: 'expired',
    uploadDate: '2023-01-15T00:00:00Z',
    expiryDate: '2023-12-31T00:00:00Z',
    size: '900 KB',
    url: '#'
  }
];

export function ProviderDocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusBadge = (status: string, expiryDate?: string) => {
    const isExpiringSoon = expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    switch (status) {
      case 'approved':
        if (isExpiringSoon) {
          return <Badge variant="outline" className="text-orange-600 border-orange-600">Expires Soon</Badge>;
        }
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-600">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocuments = Array.from(files).map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: file.name,
        type: 'Other', // Default type, user should be able to change this
        status: 'pending' as const,
        uploadDate: new Date().toISOString(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: URL.createObjectURL(file)
      }));

      setDocuments(prev => [...prev, ...newDocuments]);
      
      toast({
        title: 'Documents uploaded',
        description: `${files.length} document(s) uploaded successfully and pending review`,
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const document = documents.find(d => d.id === documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      
      toast({
        title: 'Document deleted',
        description: `${document?.name} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const expiredCount = documents.filter(d => d.status === 'expired').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage your business documents and certifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="document-upload"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById('document-upload')?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required Documents Info */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            Upload these documents to maintain your provider status and receive customer inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_TYPES.slice(0, -1).map((type) => {
              const hasDocument = documents.some(d => d.type === type && d.status === 'approved');
              return (
                <div key={type} className="flex items-center gap-3 p-3 border rounded-lg">
                  {hasDocument ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{type}</p>
                    <p className="text-sm text-muted-foreground">
                      {hasDocument ? 'Uploaded and approved' : 'Required for verification'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            View and manage all uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
              <p className="text-muted-foreground mb-4">
                Upload your business documents to get verified
              </p>
              <Button
                onClick={() => document.getElementById('document-upload')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{getStatusBadge(doc.status, doc.expiryDate)}</TableCell>
                      <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                      <TableCell>
                        {doc.expiryDate ? formatDate(doc.expiryDate) : 'N/A'}
                      </TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{doc.name}</strong>? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Document
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div
            className="text-center py-8 cursor-pointer"
            onClick={() => document.getElementById('document-upload')?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB each
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProviderDocumentsPage;