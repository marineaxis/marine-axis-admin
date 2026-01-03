import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileCheck, CheckCircle, XCircle, Clock, Plus, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

interface Contract {
  id: string;
  bookingId?: string;
  providerId: string;
  customerId: string;
  terms: string;
  value: number;
  currency: string;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  createdAt: string;
  updatedAt: string;
}

export function ContractsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts', statusFilter],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await api.contracts.list(params);
      return response;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['contracts-stats'],
    queryFn: async () => {
      const response = await api.contracts.getStats();
      return response;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.contracts.updateStatus(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Status updated', description: 'Contract status updated successfully' });
    },
  });

  const contracts = contractsData?.data || [];
  const stats = statsData?.data || { total: 0, draft: 0, active: 0, completed: 0, terminated: 0 };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Draft</Badge>,
      active: <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>,
      completed: <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>,
      terminated: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Terminated</Badge>,
    };
    return variants[status] || <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-muted-foreground">Manage service contracts</p>
        </div>
        <Button onClick={() => navigate('/contracts/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Contract
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Contracts Management</CardTitle><CardDescription>View and manage all contracts</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : contracts.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No contracts found</TableCell></TableRow>
                ) : (
                  contracts.map((contract: Contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono text-sm">{contract.id.slice(0, 8)}...</TableCell>
                      <TableCell>Provider {contract.providerId}</TableCell>
                      <TableCell>Customer {contract.customerId}</TableCell>
                      <TableCell>{contract.currency} {contract.value.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/contracts/${contract.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          {contract.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: contract.id, status: 'active' })}>
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContractsPage;

