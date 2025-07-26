import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { CreateProviderForm } from '../types';
import { sanitize } from '../lib/auth';

// Mock categories for selection
const MOCK_CATEGORIES = [
  { id: '1', name: 'Marine Equipment' },
  { id: '2', name: 'Boat Maintenance' },
  { id: '3', name: 'Electronics & Navigation' },
  { id: '4', name: 'Repair Services' },
  { id: '5', name: 'Marina Services' },
];

export function CreateProviderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProviderForm>({
    name: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    services: [],
    categoryIds: [],
    website: '',
    socialLinks: {
      linkedin: '',
      facebook: '',
      twitter: '',
    },
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const [currentService, setCurrentService] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) newErrors.name = 'Provider name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.categoryIds.length === 0) newErrors.categoryIds = 'At least one category is required';
    if (formData.services.length === 0) newErrors.services = 'At least one service is required';

    // URL validation
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleAddService = () => {
    if (currentService.trim() && !formData.services.includes(currentService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, currentService.trim()],
      }));
      setCurrentService('');
      if (errors.services) {
        setErrors(prev => ({ ...prev, services: '' }));
      }
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service),
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
    if (errors.categoryIds) {
      setErrors(prev => ({ ...prev, categoryIds: '' }));
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedPhotos(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sanitize data
      const sanitizedData = {
        ...formData,
        name: formData.name.trim(),
        email: sanitize.email(formData.email),
        phone: sanitize.phone(formData.phone),
        website: formData.website ? sanitize.url(formData.website) : undefined,
      };

      console.log('Creating provider:', sanitizedData);

      toast({
        title: 'Provider created successfully',
        description: `${sanitizedData.name} has been added and is pending approval`,
      });

      navigate('/providers');
    } catch (error) {
      toast({
        title: 'Error creating provider',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/providers')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Providers
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Provider</h1>
          <p className="text-muted-foreground">Add a new marine service provider</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details for the provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Provider Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter provider name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the provider's services and expertise"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={errors.website ? 'border-destructive' : ''}
              />
              {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              Add the services this provider offers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a service"
                value={currentService}
                onChange={(e) => setCurrentService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
              />
              <Button type="button" onClick={handleAddService} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            {formData.services.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.services.map((service) => (
                  <Badge key={service} variant="secondary" className="gap-1">
                    {service}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveService(service)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.services && <p className="text-sm text-destructive">{errors.services}</p>}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Select the categories that best describe this provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MOCK_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.categoryIds.includes(category.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-muted border-border'
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <div className="text-sm font-medium">{category.name}</div>
                </div>
              ))}
            </div>
            {errors.categoryIds && <p className="text-sm text-destructive mt-2">{errors.categoryIds}</p>}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links (optional)</CardTitle>
            <CardDescription>
              Add social media profiles for the provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="LinkedIn username or URL"
                  value={formData.socialLinks?.linkedin || ''}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  placeholder="Facebook username or URL"
                  value={formData.socialLinks?.facebook || ''}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  placeholder="Twitter username or URL"
                  value={formData.socialLinks?.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Upload photos to showcase the provider's work and facilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto h-12 w-12 text-muted-foreground">
                  <Upload className="h-full w-full" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload Photos</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose multiple photos to showcase the provider's services
                  </p>
                </div>
                <div>
                  <label htmlFor="photo-upload">
                    <Button type="button" variant="outline" className="cursor-pointer">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select Photos
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Uploaded Photos ({uploadedPhotos.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Provider
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/providers')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateProviderPage;