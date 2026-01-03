import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship, DollarSign, Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

export function CreateVesselPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    capacity: '',
    location: '',
    pricePerDay: '',
    amenities: [] as string[],
    specifications: {
      length: '',
      width: '',
      draft: '',
    },
  });

  const [currentAmenity, setCurrentAmenity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.vessels.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      toast({ title: 'Vessel created', description: 'Vessel has been created successfully' });
      navigate('/vessels');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create vessel',
        variant: 'destructive',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Vessel name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.type.trim()) newErrors.type = 'Vessel type is required';
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Valid capacity is required';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.pricePerDay || parseFloat(formData.pricePerDay) <= 0) {
      newErrors.pricePerDay = 'Valid price per day is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData: any = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      capacity: parseInt(formData.capacity),
      location: formData.location,
      pricePerDay: parseFloat(formData.pricePerDay),
    };

    if (formData.amenities.length > 0) submitData.amenities = formData.amenities;
    
    const specs: any = {};
    if (formData.specifications.length && formData.specifications.length.trim()) {
      specs.length = parseFloat(formData.specifications.length);
    }
    if (formData.specifications.width && formData.specifications.width.trim()) {
      specs.width = parseFloat(formData.specifications.width);
    }
    if (formData.specifications.draft && formData.specifications.draft.trim()) {
      specs.draft = parseFloat(formData.specifications.draft);
    }
    if (Object.keys(specs).length > 0) submitData.specifications = specs;

    createMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSpecChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value },
    }));
  };

  const handleAddAmenity = () => {
    if (currentAmenity.trim() && !formData.amenities.includes(currentAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, currentAmenity.trim()],
      }));
      setCurrentAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/vessels')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vessels
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Vessel</h1>
          <p className="text-muted-foreground">Add a new vessel listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vessel Information</CardTitle>
            <CardDescription>Enter the vessel details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vessel Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Luxury Yacht"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Vessel Type *</Label>
                <Input
                  id="type"
                  placeholder="e.g., yacht, sailboat, fishing boat"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={errors.type ? 'border-destructive' : ''}
                />
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (guests) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="e.g., 12"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  className={errors.capacity ? 'border-destructive' : ''}
                />
                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Miami, FL"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerDay">Price per Day (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pricePerDay"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.pricePerDay}
                    onChange={(e) => handleInputChange('pricePerDay', e.target.value)}
                    className={errors.pricePerDay ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.pricePerDay && <p className="text-sm text-destructive">{errors.pricePerDay}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the vessel..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenity">Amenities (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="amenity"
                  placeholder="e.g., AC, Kitchen, WiFi"
                  value={currentAmenity}
                  onChange={(e) => setCurrentAmenity(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAmenity();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddAmenity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                      <span className="text-sm">{amenity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => handleRemoveAmenity(amenity)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (m)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  placeholder="20"
                  value={formData.specifications.length}
                  onChange={(e) => handleSpecChange('length', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (m)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={formData.specifications.width}
                  onChange={(e) => handleSpecChange('width', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft">Draft (m)</Label>
                <Input
                  id="draft"
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  value={formData.specifications.draft}
                  onChange={(e) => handleSpecChange('draft', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/vessels')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Vessel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateVesselPage;

