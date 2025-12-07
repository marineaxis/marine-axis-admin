import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import api from '../lib/api';
import { Job, CreateJobForm } from '../types';

const EditJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateJobForm>({
    title: '',
    description: '',
    providerId: '',
    categoryIds: [],
    location: '',
    salaryRange: { min: 0, max: 0, currency: 'USD' },
    requirements: [],
    benefits: [],
    type: 'full-time',
    remote: false,
    urgency: 'medium',
    expiresAt: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await api.jobs.get(id);
        if (res.success) {
          const j: Job = res.data;
          setFormData({
            title: j.title,
            description: j.description,
            providerId: j.providerId,
            categoryIds: j.categoryIds,
            location: j.location,
            salaryRange: j.salaryRange,
            requirements: j.requirements,
            benefits: j.benefits,
            type: j.type,
            remote: j.remote,
            urgency: j.urgency,
            expiresAt: j.expiresAt.substring(0, 10),
          });
        } else {
          toast({ title: 'Failed to load job', description: res.message || 'Please try again', variant: 'destructive' });
          navigate('/jobs');
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        toast({ title: 'Failed to load job', description: msg || 'Please try again', variant: 'destructive' });
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, toast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title required';
    if (!formData.description.trim()) newErrors.description = 'Description required';
    if (!formData.providerId) newErrors.providerId = 'Provider required';
    if (!formData.location.trim()) newErrors.location = 'Location required';
    if (formData.categoryIds.length === 0) newErrors.categoryIds = 'Select at least one category';
    if (formData.requirements.length === 0) newErrors.requirements = 'Add requirements';
    if (formData.benefits.length === 0) newErrors.benefits = 'Add benefits';
    if (!formData.expiresAt) newErrors.expiresAt = 'Expiration required';
    if (formData.salaryRange.min <= 0) newErrors.salaryMin = 'Min salary > 0';
    if (formData.salaryRange.max <= 0) newErrors.salaryMax = 'Max salary > 0';
    if (formData.salaryRange.min >= formData.salaryRange.max) newErrors.salaryRange = 'Max must exceed min';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function handleInputChange<K extends keyof CreateJobForm>(field: K, value: unknown) {
    setFormData(prev => {
      const next = { ...prev } as unknown as Record<string, unknown>;
      next[String(field)] = value as unknown;
      return next as unknown as CreateJobForm;
    });
    const key = String(field);
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  }

  const handleSalaryChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, salaryRange: { ...prev.salaryRange, [field]: numValue } } as CreateJobForm));
    const key = field === 'min' ? 'salaryMin' : 'salaryMax';
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const addRequirement = () => {
    if (currentRequirement.trim() && !formData.requirements.includes(currentRequirement.trim())) {
      setFormData(prev => ({ ...prev, requirements: [...prev.requirements, currentRequirement.trim()] }));
      setCurrentRequirement('');
      if (errors.requirements) setErrors(prev => ({ ...prev, requirements: '' }));
    }
  };

  const removeRequirement = (req: string) => {
    setFormData(prev => ({ ...prev, requirements: prev.requirements.filter(r => r !== req) }));
  };

  const addBenefit = () => {
    if (currentBenefit.trim() && !formData.benefits.includes(currentBenefit.trim())) {
      setFormData(prev => ({ ...prev, benefits: [...prev.benefits, currentBenefit.trim()] }));
      setCurrentBenefit('');
      if (errors.benefits) setErrors(prev => ({ ...prev, benefits: '' }));
    }
  };

  const removeBenefit = (b: string) => {
    setFormData(prev => ({ ...prev, benefits: prev.benefits.filter(x => x !== b) }));
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId) ? prev.categoryIds.filter(id => id !== categoryId) : [...prev.categoryIds, categoryId],
    }));
    if (errors.categoryIds) setErrors(prev => ({ ...prev, categoryIds: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await api.jobs.update(id, formData);
      if (!res.success) throw new Error(res.message || 'Failed to update job');
      toast({ title: 'Job updated', description: 'Changes saved successfully' });
      navigate('/jobs');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({ title: 'Update error', description: msg || 'Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Job</h1>
          <p className="text-muted-foreground">Update job posting details</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Edit core job information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className={errors.title ? 'border-destructive' : ''} />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Input id="provider" value={formData.providerId} onChange={(e) => handleInputChange('providerId', e.target.value)} className={errors.providerId ? 'border-destructive' : ''} />
                {errors.providerId && <p className="text-sm text-destructive">{errors.providerId}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} className={errors.location ? 'border-destructive' : ''} />
                {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expires On *</Label>
                <Input id="expires" type="date" value={formData.expiresAt} onChange={(e) => handleInputChange('expiresAt', e.target.value)} className={errors.expiresAt ? 'border-destructive' : ''} />
                {errors.expiresAt && <p className="text-sm text-destructive">{errors.expiresAt}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)}>
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
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={formData.urgency} onValueChange={(v) => handleInputChange('urgency', v)}>
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
              <div className="flex items-center space-x-2">
                <Checkbox id="remote" checked={formData.remote} onCheckedChange={(c) => handleInputChange('remote', !!c)} />
                <Label htmlFor="remote">Remote available</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea id="description" rows={6} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className={errors.description ? 'border-destructive' : ''} />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>Salary range for this position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary-min">Minimum Salary *</Label>
                <Input id="salary-min" type="number" value={formData.salaryRange.min || ''} onChange={(e) => handleSalaryChange('min', e.target.value)} className={errors.salaryMin ? 'border-destructive' : ''} />
                {errors.salaryMin && <p className="text-sm text-destructive">{errors.salaryMin}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-max">Maximum Salary *</Label>
                <Input id="salary-max" type="number" value={formData.salaryRange.max || ''} onChange={(e) => handleSalaryChange('max', e.target.value)} className={errors.salaryMax ? 'border-destructive' : ''} />
                {errors.salaryMax && <p className="text-sm text-destructive">{errors.salaryMax}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Input id="currency" value={formData.salaryRange.currency} onChange={(e) => handleInputChange('salaryRange', { ...formData.salaryRange, currency: e.target.value })} />
              </div>
            </div>
            {errors.salaryRange && <p className="text-sm text-destructive">{errors.salaryRange}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requirements & Benefits</CardTitle>
            <CardDescription>List requirements and benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Requirements *</Label>
              <div className="flex gap-2">
                <Input placeholder="Add requirement" value={currentRequirement} onChange={(e) => setCurrentRequirement(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())} />
                <Button type="button" onClick={addRequirement} className="gap-2"><Plus className="h-4 w-4" />Add</Button>
              </div>
              {formData.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map(req => (
                    <Badge key={req} variant="secondary" className="gap-1">
                      {req}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeRequirement(req)} />
                    </Badge>
                  ))}
                </div>
              )}
              {errors.requirements && <p className="text-sm text-destructive">{errors.requirements}</p>}
            </div>
            <div className="space-y-2">
              <Label>Benefits *</Label>
              <div className="flex gap-2">
                <Input placeholder="Add benefit" value={currentBenefit} onChange={(e) => setCurrentBenefit(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())} />
                <Button type="button" onClick={addBenefit} className="gap-2"><Plus className="h-4 w-4" />Add</Button>
              </div>
              {formData.benefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map(b => (
                    <Badge key={b} variant="secondary" className="gap-1">
                      {b}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeBenefit(b)} />
                    </Badge>
                  ))}
                </div>
              )}
              {errors.benefits && <p className="text-sm text-destructive">{errors.benefits}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default EditJobPage;
