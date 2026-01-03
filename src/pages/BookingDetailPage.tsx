import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, User, Building2, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

export function BookingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.bookings.get(id!);
      return response;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await api.bookings.updateStatus(id!, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Status updated', description: 'Booking status updated successfully' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await api.bookings.cancel(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Booking cancelled', description: 'Booking has been cancelled' });
    },
  });

  const booking = bookingData?.data;

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, any> = {
      pending: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>,
      confirmed: <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>,
      cancelled: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>,
      completed: <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>,
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
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/bookings')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Booking not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/bookings')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">View complete booking information</p>
          </div>
        </div>
        <div className="flex gap-2">
          {booking.status === 'pending' && (
            <Button onClick={() => updateStatusMutation.mutate('confirmed')} disabled={updateStatusMutation.isPending}>
              Confirm Booking
            </Button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Booking Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Primary booking details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booking ID</span>
              <span className="font-mono text-sm">{booking.id}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(booking.status)}
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Price
              </span>
              <span className="font-semibold">{booking.currency} {booking.totalPrice?.toLocaleString()}</span>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Booking Dates
              </span>
              <div className="space-y-1">
                <div><strong>Start:</strong> {formatDate(booking.startDate)}</div>
                <div><strong>End:</strong> {formatDate(booking.endDate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties Involved</CardTitle>
            <CardDescription>Provider and customer information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                Provider
              </span>
              <div className="font-medium">Provider ID: {booking.providerId}</div>
            </div>
            <Separator />
            {booking.customerId && (
              <>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    Customer
                  </span>
                  <div className="font-medium">Customer ID: {booking.customerId}</div>
                </div>
                <Separator />
              </>
            )}
            {booking.serviceId && (
              <div>
                <span className="text-sm text-muted-foreground">Service ID</span>
                <div className="font-medium font-mono text-sm">{booking.serviceId}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created At</span>
            <span className="text-sm">{formatDate(booking.createdAt)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm">{formatDate(booking.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BookingDetailPage;

