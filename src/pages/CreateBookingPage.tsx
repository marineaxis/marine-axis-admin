import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CURRENCIES } from '../lib/constants';

import api from '../lib/api';

export function CreateBookingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    providerId: '',
    serviceId: '',
    startDate: '',
    endDate: '',
    totalPrice: '',
    currency: 'USD',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.bookings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({ title: 'Booking created', description: 'Booking has been created successfully' });
      navigate('/bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
        variant: 'destructive',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.providerId.trim()) newErrors.providerId = 'Provider ID is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.totalPrice || parseFloat(formData.totalPrice) <= 0) {
      newErrors.totalPrice = 'Valid total price is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData: any = {
      providerId: formData.providerId,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      totalPrice: parseFloat(formData.totalPrice),
      currency: formData.currency,
    };

    if (formData.serviceId.trim()) submitData.serviceId = formData.serviceId;
    if (formData.notes.trim()) submitData.notes = formData.notes;

    createMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/bookings')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Booking</h1>
          <p className="text-muted-foreground">Create a new service booking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Enter the booking details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="providerId">Provider ID *</Label>
                <Input
                  id="providerId"
                  placeholder="Enter provider ID"
                  value={formData.providerId}
                  onChange={(e) => handleInputChange('providerId', e.target.value)}
                  className={errors.providerId ? 'border-destructive' : ''}
                />
                {errors.providerId && <p className="text-sm text-destructive">{errors.providerId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceId">Service ID (Optional)</Label>
                <Input
                  id="serviceId"
                  placeholder="Enter service ID"
                  value={formData.serviceId}
                  onChange={(e) => handleInputChange('serviceId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={errors.endDate ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPrice">Total Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totalPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalPrice}
                    onChange={(e) => handleInputChange('totalPrice', e.target.value)}
                    className={errors.totalPrice ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.totalPrice && <p className="text-sm text-destructive">{errors.totalPrice}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this booking..."
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/bookings')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Booking
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateBookingPage;

