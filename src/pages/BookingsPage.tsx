import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, CheckCircle, XCircle, Clock, Plus, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

interface Booking {
  id: string;
  providerId: string;
  serviceId?: string;
  customerId?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function BookingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await api.bookings.list(params);
      return response;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['bookings-stats'],
    queryFn: async () => {
      const response = await api.bookings.getStats();
      return response;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.bookings.updateStatus(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Status updated', description: 'Booking status updated successfully' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.bookings.cancel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Booking cancelled', description: 'Booking has been cancelled' });
    },
  });

  const bookings = bookingsData?.data || [];
  const stats = statsData?.data || { total: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>,
      confirmed: <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>,
      cancelled: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>,
      completed: <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>,
    };
    return variants[status] || <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage service bookings</p>
        </div>
        <Button onClick={() => navigate('/bookings/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Booking
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Confirmed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.confirmed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cancelled</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.cancelled}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings Management</CardTitle>
          <CardDescription>View and manage all bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search bookings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No bookings found</TableCell></TableRow>
                ) : (
                  bookings.map((booking: Booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">{booking.id.slice(0, 8)}...</TableCell>
                      <TableCell>Provider {booking.providerId}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(booking.startDate)}</div>
                          <div className="text-muted-foreground">to {formatDate(booking.endDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.currency} {booking.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/bookings/${booking.id}`)}>
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          {booking.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'confirmed' })}>
                              Confirm
                            </Button>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate(booking.id)}>
                              Cancel
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

export default BookingsPage;

