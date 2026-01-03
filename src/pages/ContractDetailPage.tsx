import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileCheck, DollarSign, User, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

export function ContractDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contractData, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const response = await api.contracts.get(id!);
      return response;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await api.contracts.updateStatus(id!, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Status updated', description: 'Contract status updated successfully' });
    },
  });

  const contract = contractData?.data;

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, any> = {
      draft: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Draft</Badge>,
      active: <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>,
      completed: <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>,
      terminated: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Terminated</Badge>,
    };
    return variants[status] || <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/contracts')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Contract not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/contracts')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Contracts
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contract Details</h1>
            <p className="text-muted-foreground">View complete contract information</p>
          </div>
        </div>
        {contract.status === 'draft' && (
          <Button onClick={() => updateStatusMutation.mutate('active')} disabled={updateStatusMutation.isPending}>
            Activate Contract
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contract ID</span>
              <span className="font-mono text-sm">{contract.id}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(contract.status)}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Contract Value
              </span>
              <span className="font-semibold">{contract.currency} {contract.value?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties Involved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                Provider
              </span>
              <div className="font-medium">Provider ID: {contract.providerId}</div>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Customer
              </span>
              <div className="font-medium">Customer ID: {contract.customerId}</div>
            </div>
            {contract.bookingId && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Booking ID</span>
                  <div className="font-medium font-mono text-sm">{contract.bookingId}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {contract.terms && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created At</span>
            <span className="text-sm">{formatDate(contract.createdAt)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm">{formatDate(contract.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContractDetailPage;

