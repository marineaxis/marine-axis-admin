import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, Calendar, DollarSign, MapPin, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import { CreateJobForm } from '../types';
import api from '../lib/api';

// Mock categories for selection
const MOCK_CATEGORIES = [
  { id: '1', name: 'Marine Equipment' },
  { id: '2', name: 'Boat Maintenance' },
  { id: '3', name: 'Electronics & Navigation' },
  { id: '4', name: 'Repair Services' },
  { id: '5', name: 'Marina Services' },
];

// Mock providers for selection
const MOCK_PROVIDERS = [
  { id: '1', name: 'Marine Solutions Ltd' },
  { id: '2', name: 'Ocean Tech Services' },
  { id: '3', name: 'Coastal Marine Works' },
];

export function CreateJobPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateJobForm>({
    title: '',
    description: '',
    providerId: '',
    categoryIds: [],
    location: '',
    salaryRange: {
      min: 0,
      max: 0,
      currency: 'USD',
    },
    requirements: [],
    benefits: [],
    type: 'full-time',
    remote: false,
    urgency: 'medium',
    expiresAt: '',
  });

  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.providerId) newErrors.providerId = 'Provider is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.categoryIds.length === 0) newErrors.categoryIds = 'At least one category is required';
    if (formData.requirements.length === 0) newErrors.requirements = 'At least one requirement is required';
    if (formData.benefits.length === 0) newErrors.benefits = 'At least one benefit is required';
    if (!formData.expiresAt) newErrors.expiresAt = 'Expiration date is required';

    // Salary validation
    if (formData.salaryRange.min <= 0) newErrors.salaryMin = 'Minimum salary must be greater than 0';
    if (formData.salaryRange.max <= 0) newErrors.salaryMax = 'Maximum salary must be greater than 0';
    if (formData.salaryRange.min >= formData.salaryRange.max) {
      newErrors.salaryRange = 'Maximum salary must be greater than minimum salary';
    }

    // Date validation
    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate <= today) {
        newErrors.expiresAt = 'Expiration date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleInputChange<K extends keyof CreateJobForm>(field: K, value: unknown) {
    setFormData(prev => ({ ...prev, [field]: value as unknown as CreateJobForm[K] } as CreateJobForm));
    const key = String(field);
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  }

  const handleSalaryChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      salaryRange: {
        ...prev.salaryRange,
        [field]: numValue,
      },
    }));
    if (errors[`salary${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`salary${field.charAt(0).toUpperCase() + field.slice(1)}`]: '' }));
    }
  };

  const handleAddRequirement = () => {
    if (currentRequirement.trim() && !formData.requirements.includes(currentRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, currentRequirement.trim()],
      }));
      setCurrentRequirement('');
      if (errors.requirements) {
        setErrors(prev => ({ ...prev, requirements: '' }));
      }
    }
  };

  const handleRemoveRequirement = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(r => r !== requirement),
    }));
  };

  const handleAddBenefit = () => {
    if (currentBenefit.trim() && !formData.benefits.includes(currentBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, currentBenefit.trim()],
      }));
      setCurrentBenefit('');
      if (errors.benefits) {
        setErrors(prev => ({ ...prev, benefits: '' }));
      }
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await api.jobs.create(formData);
      if (!res.success) throw new Error(res.message || 'Failed to create job');
      toast({ title: 'Job posted successfully', description: `${formData.title} created` });
      navigate('/jobs');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({ title: 'Error creating job', description: msg || 'Please try again later', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setIsLoading(true);
    try {
      const draftData = { ...formData, status: 'draft' };
      const res = await api.jobs.create(draftData);
      if (!res.success) throw new Error(res.message || 'Failed to save draft');
      toast({ title: 'Job saved as draft', description: `${formData.title} saved` });
      navigate('/jobs');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({ title: 'Error saving draft', description: msg || 'Please try again later', variant: 'destructive' });
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
          onClick={() => navigate('/jobs')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Post New Job</h1>
          <p className="text-muted-foreground">Create a new job posting for marine professionals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Enter the basic information about the job position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Marine Engineer"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select value={formData.providerId} onValueChange={(value) => handleInputChange('providerId', value)}>
                  <SelectTrigger className={errors.providerId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.providerId && <p className="text-sm text-destructive">{errors.providerId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Miami, FL"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={errors.location ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires On *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="expires"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                    className={errors.expiresAt ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.expiresAt && <p className="text-sm text-destructive">{errors.expiresAt}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote"
                checked={formData.remote}
                onCheckedChange={(checked) => handleInputChange('remote', checked)}
              />
              <Label htmlFor="remote">Remote work available</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the job responsibilities, qualifications, and what makes this opportunity attractive..."
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>
              Set the salary range for this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary-min">Minimum Salary *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salary-min"
                    type="number"
                    placeholder="50000"
                    value={formData.salaryRange.min || ''}
                    onChange={(e) => handleSalaryChange('min', e.target.value)}
                    className={errors.salaryMin ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.salaryMin && <p className="text-sm text-destructive">{errors.salaryMin}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary-max">Maximum Salary *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salary-max"
                    type="number"
                    placeholder="80000"
                    value={formData.salaryRange.max || ''}
                    onChange={(e) => handleSalaryChange('max', e.target.value)}
                    className={errors.salaryMax ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.salaryMax && <p className="text-sm text-destructive">{errors.salaryMax}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.salaryRange.currency}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    salaryRange: { ...prev.salaryRange, currency: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors.salaryRange && <p className="text-sm text-destructive">{errors.salaryRange}</p>}
            
            <div className="text-sm text-muted-foreground">
              {formData.type === 'part-time' ? 'Hourly rate' : 'Annual salary'}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Select the categories that best match this job
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

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>
              List the qualifications and requirements for this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a requirement"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
              />
              <Button type="button" onClick={handleAddRequirement} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            {formData.requirements.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((requirement) => (
                  <Badge key={requirement} variant="secondary" className="gap-1">
                    {requirement}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveRequirement(requirement)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.requirements && <p className="text-sm text-destructive">{errors.requirements}</p>}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
            <CardDescription>
              Add the benefits and perks offered with this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a benefit"
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
              />
              <Button type="button" onClick={handleAddBenefit} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            {formData.benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary" className="gap-1">
                    {benefit}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveBenefit(benefit)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            {errors.benefits && <p className="text-sm text-destructive">{errors.benefits}</p>}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Job
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/jobs')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateJobPage;