import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, DollarSign, MapPin, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import useCRUD from '@/hooks/useCRUD';
import api from '@/lib/api';
import { Job, Category, Provider } from '../types';

interface JobFormData {
  title: string;
  description: string;
  providerId: string;
  category: string;
  address: {
    city: string;
    state: string;
    country: string;
    street?: string;
  };
  jobType: 'full-time' | 'part-time' | 'contract' | 'freelance';
  experience: 'entry' | 'mid' | 'senior' | 'executive';
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'daily' | 'monthly' | 'annually';
  };
  contactEmail: string;
  contactPhone?: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  tags: string[];
}

export function EditJobPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [jobData, setJobData] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const { updateItem, updating } = useCRUD<Job>({
    resource: 'jobs',
    api: api.jobs,
    messages: {
      updated: 'Job updated successfully',
    },
  });

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    providerId: '',
    category: '',
    address: {
      city: '',
      state: '',
      country: 'USA',
      street: '',
    },
    jobType: 'full-time',
    experience: 'entry',
    salary: {
      min: 0,
      max: 0,
      currency: 'USD',
      period: 'annually',
    },
    contactEmail: '',
    contactPhone: '',
    requirements: [],
    responsibilities: [],
    benefits: [],
    tags: [],
  });

  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentResponsibility, setCurrentResponsibility] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch job data and categories/providers
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast({
          title: 'Error',
          description: 'Job ID is missing.',
          variant: 'destructive',
        });
        navigate('/jobs');
        return;
      }

      try {
        setLoadingJob(true);
        const jobResponse = await api.jobs.get(id);
        if (jobResponse.success) {
          const job = jobResponse.data;
          setJobData(job);
          
          // Populate form with job data
          setFormData({
            title: job.title || '',
            description: job.description || '',
            providerId: typeof job.provider === 'object' && job.provider?.id 
              ? job.provider.id 
              : (job.providerId || ''),
            category: typeof job.category === 'object' && job.category?.id
              ? job.category.id
              : (job.category || ''),
            address: job.address || {
              city: '',
              state: '',
              country: 'USA',
              street: '',
            },
            jobType: (job.jobType || job.type || 'full-time') as 'full-time' | 'part-time' | 'contract' | 'freelance',
            experience: job.experience || 'entry',
            salary: job.salary || {
              min: 0,
              max: 0,
              currency: 'USD',
              period: 'annually',
            },
            contactEmail: job.contactEmail || '',
            contactPhone: job.contactPhone || '',
            requirements: job.requirements || [],
            responsibilities: job.responsibilities || [],
            benefits: job.benefits || [],
            tags: job.tags || [],
          });
        } else {
          toast({
            title: 'Error',
            description: jobResponse.message || 'Failed to fetch job details.',
            variant: 'destructive',
          });
          navigate('/jobs');
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch job details.',
          variant: 'destructive',
        });
        navigate('/jobs');
      } finally {
        setLoadingJob(false);
      }

      // Fetch categories and providers
      try {
        setLoadingCategories(true);
        const categoriesResponse = await api.categories.list();
        if (categoriesResponse.success) {
          const cats = Array.isArray(categoriesResponse.data) 
            ? categoriesResponse.data 
            : (categoriesResponse.data as any)?.data || [];
          setCategories(cats);
        }
      } catch (error: any) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }

      try {
        setLoadingProviders(true);
        const providersResponse = await api.providers.list({ limit: 100 });
        if (providersResponse.success) {
          const provs = Array.isArray(providersResponse.data)
            ? providersResponse.data
            : (providersResponse.data as any)?.data || [];
          setProviders(provs);
        }
      } catch (error: any) {
        console.error('Failed to fetch providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    // Provider is optional - jobs can be posted without a provider
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.address.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.state.trim()) newErrors.state = 'State is required';
    if (!formData.address.country.trim()) newErrors.country = 'Country is required';
    if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    if (!formData.contactEmail.includes('@')) newErrors.contactEmail = 'Valid email is required';
    
    // Salary validation - only validate if salary is provided
    if (formData.salary) {
      if (formData.salary.min <= 0) newErrors.salaryMin = 'Minimum salary must be greater than 0';
      if (formData.salary.max <= 0) newErrors.salaryMax = 'Maximum salary must be greater than 0';
      if (formData.salary.min >= formData.salary.max) {
        newErrors.salaryRange = 'Maximum salary must be greater than minimum salary';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else if (field.startsWith('salary.')) {
      const salaryField = field.replace('salary.', '');
      setFormData(prev => ({
        ...prev,
        salary: { ...prev.salary, [salaryField]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field] || errors[field.replace('address.', '')] || errors[field.replace('salary.', '')]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors[field.replace('address.', '')];
        delete newErrors[field.replace('salary.', '')];
        return newErrors;
      });
    }
  };

  const handleSalaryChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: numValue,
      },
    }));
    if (errors[`salary${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => ({ ...prev, [`salary${field.charAt(0).toUpperCase() + field.slice(1)}`]: '' }));
    }
  };

  const handleAddItem = (type: 'requirement' | 'responsibility' | 'benefit' | 'tag') => {
    let current: string;
    let setCurrent: (value: string) => void;
    let array: string[];
    let setArray: (items: string[]) => void;
    let errorKey: string;

    switch (type) {
      case 'requirement':
        current = currentRequirement;
        setCurrent = setCurrentRequirement;
        array = formData.requirements;
        setArray = (items) => setFormData(prev => ({ ...prev, requirements: items }));
        errorKey = 'requirements';
        break;
      case 'responsibility':
        current = currentResponsibility;
        setCurrent = setCurrentResponsibility;
        array = formData.responsibilities;
        setArray = (items) => setFormData(prev => ({ ...prev, responsibilities: items }));
        errorKey = 'responsibilities';
        break;
      case 'benefit':
        current = currentBenefit;
        setCurrent = setCurrentBenefit;
        array = formData.benefits;
        setArray = (items) => setFormData(prev => ({ ...prev, benefits: items }));
        errorKey = 'benefits';
        break;
      case 'tag':
        current = currentTag;
        setCurrent = setCurrentTag;
        array = formData.tags;
        setArray = (items) => setFormData(prev => ({ ...prev, tags: items }));
        errorKey = 'tags';
        break;
    }

    if (current.trim() && !array.includes(current.trim())) {
      setArray([...array, current.trim()]);
      setCurrent('');
      if (errors[errorKey]) {
        setErrors(prev => ({ ...prev, [errorKey]: '' }));
      }
    }
  };

  const handleRemoveItem = (type: 'requirement' | 'responsibility' | 'benefit' | 'tag', item: string) => {
    switch (type) {
      case 'requirement':
        setFormData(prev => ({ ...prev, requirements: prev.requirements.filter(r => r !== item) }));
        break;
      case 'responsibility':
        setFormData(prev => ({ ...prev, responsibilities: prev.responsibilities.filter(r => r !== item) }));
        break;
      case 'benefit':
        setFormData(prev => ({ ...prev, benefits: prev.benefits.filter(b => b !== item) }));
        break;
      case 'tag':
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== item) }));
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }

    try {
      // Map form data to backend schema
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        ...(formData.providerId && { providerId: formData.providerId }), // Only include if provided
        category: formData.category,
        address: {
          city: formData.address.city,
          state: formData.address.state,
          country: formData.address.country,
          ...(formData.address.street && { street: formData.address.street }),
        },
        location: {
          coordinates: (jobData?.location && typeof jobData.location === 'object' && 'coordinates' in jobData.location)
            ? (jobData.location as any).coordinates
            : [0, 0], // Keep existing coordinates or default
        },
        jobType: formData.jobType,
        experience: formData.experience,
        // Only include salary if it has valid min/max values (> 0)
        ...(formData.salary && typeof formData.salary.min === 'number' && formData.salary.min > 0 && typeof formData.salary.max === 'number' && formData.salary.max > 0 && {
          salary: {
            min: formData.salary.min,
            max: formData.salary.max,
            currency: formData.salary.currency || 'USD',
            period: formData.salary.period || 'annually',
          },
        }),
        contactEmail: formData.contactEmail,
        ...(formData.contactPhone && { contactPhone: formData.contactPhone }),
        // Always send arrays, even if empty, to ensure proper updates
        requirements: formData.requirements || [],
        responsibilities: formData.responsibilities || [],
        benefits: formData.benefits || [],
        tags: formData.tags || [],
      };

      const result = await updateItem(id, updateData);

      if (result) {
        toast({
          title: 'Job updated successfully',
          description: `${formData.title} has been updated`,
        });
        navigate('/jobs');
      }
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        title: 'Error updating job',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  if (loadingJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Job not found or could not be loaded.
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Edit Job</h1>
          <p className="text-muted-foreground">Update job posting details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information - Same as CreateJobPage */}
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
                <Label htmlFor="providerId">Provider (Optional)</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.providerId || ''} 
                    onValueChange={(value) => handleInputChange('providerId', value)}
                    disabled={loadingProviders}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={loadingProviders ? "Loading..." : "Select provider (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {(provider as any).companyName || provider.name || provider.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.providerId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleInputChange('providerId', '')}
                      title="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Leave blank if job is not associated with a provider</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={loadingCategories}
                >
                  <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                    <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => (c as any).isActive !== false && (c as any).active !== false).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type *</Label>
                <Select value={formData.jobType} onValueChange={(value: any) => handleInputChange('jobType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level *</Label>
                <Select value={formData.experience} onValueChange={(value: any) => handleInputChange('experience', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Enter the job location details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="street"
                    placeholder="e.g., 123 Marine Drive"
                    value={formData.address.street || ''}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Miami"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  placeholder="e.g., FL"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className={errors.state ? 'border-destructive' : ''}
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  placeholder="e.g., USA"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className={errors.country ? 'border-destructive' : ''}
                />
                {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              How applicants can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={errors.contactEmail ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary-min">Minimum Salary *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="salary-min"
                    type="number"
                    placeholder="50000"
                    value={formData.salary?.min || ''}
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
                    value={formData.salary?.max || ''}
                    onChange={(e) => handleSalaryChange('max', e.target.value)}
                    className={errors.salaryMax ? 'border-destructive pl-9' : 'pl-9'}
                  />
                </div>
                {errors.salaryMax && <p className="text-sm text-destructive">{errors.salaryMax}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.salary?.currency || 'USD'}
                  onValueChange={(value) => handleInputChange('salary.currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                    <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.salary?.period || 'annually'}
                  onValueChange={(value: any) => handleInputChange('salary.period', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors.salaryRange && <p className="text-sm text-destructive">{errors.salaryRange}</p>}
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
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('requirement'))}
              />
              <Button type="button" onClick={() => handleAddItem('requirement')} className="gap-2">
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
                      onClick={() => handleRemoveItem('requirement', requirement)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle>Responsibilities</CardTitle>
            <CardDescription>
              List the key responsibilities for this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a responsibility"
                value={currentResponsibility}
                onChange={(e) => setCurrentResponsibility(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('responsibility'))}
              />
              <Button type="button" onClick={() => handleAddItem('responsibility')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            {formData.responsibilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.responsibilities.map((responsibility) => (
                  <Badge key={responsibility} variant="secondary" className="gap-1">
                    {responsibility}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveItem('responsibility', responsibility)}
                    />
                  </Badge>
                ))}
              </div>
            )}
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
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('benefit'))}
              />
              <Button type="button" onClick={() => handleAddItem('benefit')} className="gap-2">
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
                      onClick={() => handleRemoveItem('benefit', benefit)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Add relevant tags to help candidates find this job
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a tag"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem('tag'))}
              />
              <Button type="button" onClick={() => handleAddItem('tag')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveItem('tag', tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={updating} className="min-w-32">
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Job
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/jobs')}
            disabled={updating}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EditJobPage;

