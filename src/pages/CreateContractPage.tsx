import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Loader2 } from 'lucide-react';

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

export function CreateContractPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    bookingId: '',
    providerId: '',
    customerId: '',
    terms: '',
    value: '',
    currency: 'USD',
    status: 'draft',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.contracts.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Contract created', description: 'Contract has been created successfully' });
      navigate('/contracts');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contract',
        variant: 'destructive',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.providerId.trim()) newErrors.providerId = 'Provider ID is required';
    if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID is required';
    if (!formData.terms.trim()) newErrors.terms = 'Contract terms are required';
    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Valid contract value is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData: any = {
      providerId: formData.providerId,
      customerId: formData.customerId,
      terms: formData.terms,
      value: parseFloat(formData.value),
      currency: formData.currency,
      status: formData.status,
    };

    if (formData.bookingId.trim()) submitData.bookingId = formData.bookingId;

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
        <Button variant="ghost" onClick={() => navigate('/contracts')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Contract</h1>
          <p className="text-muted-foreground">Create a new service contract</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
            <CardDescription>Enter the contract details</CardDescription>
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
                <Label htmlFor="customerId">Customer ID *</Label>
                <Input
                  id="customerId"
                  placeholder="Enter customer ID"
                  value={formData.customerId}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                  className={errors.customerId ? 'border-destructive' : ''}
                />
                {errors.customerId && <p className="text-sm text-destructive">{errors.customerId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                <Input
                  id="bookingId"
                  placeholder="Enter booking ID"
                  value={formData.bookingId}
                  onChange={(e) => handleInputChange('bookingId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Contract Value *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    className={errors.value ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
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
              <Label htmlFor="terms">Contract Terms *</Label>
              <Textarea
                id="terms"
                placeholder="Enter the contract terms and conditions..."
                rows={6}
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                className={errors.terms ? 'border-destructive' : ''}
              />
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/contracts')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Contract
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateContractPage;

