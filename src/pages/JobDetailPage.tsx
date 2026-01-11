import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, Trash2, Play, Pause, MapPin, Mail, Phone, DollarSign, Briefcase, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import useCRUD from '@/hooks/useCRUD';
import api from '@/lib/api';
import { Job } from '@/types';

export function JobDetailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const { deleteItem, deleting } = useCRUD<Job>({
    resource: 'jobs',
    api: api.jobs,
    messages: {
      deleted: 'Job deleted successfully',
    },
  });

  useEffect(() => {
    const fetchJob = async () => {
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
        setLoading(true);
        const response = await api.jobs.get(id);
        if (response.success) {
          setJob(response.data);
        } else {
          toast({
            title: 'Error',
            description: response.message || 'Failed to fetch job details.',
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
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, navigate, toast]);

  const handlePublish = async () => {
    if (!id) return;
    try {
      const response = await api.jobs.publish(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Job published successfully',
        });
        const updatedResponse = await api.jobs.get(id);
        if (updatedResponse.success) {
          setJob(updatedResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to publish job',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish job',
        variant: 'destructive',
      });
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      const response = await api.jobs.close(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Job closed successfully',
        });
        const updatedResponse = await api.jobs.get(id);
        if (updatedResponse.success) {
          setJob(updatedResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to close job',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close job',
        variant: 'destructive',
      });
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    try {
      const response = await api.jobs.reopen(id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Job reopened successfully',
        });
        const updatedResponse = await api.jobs.get(id);
        if (updatedResponse.success) {
          setJob(updatedResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to reopen job',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reopen job',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await deleteItem(id);
    if (result) {
      navigate('/jobs');
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'published':
      case 'open':
        return <Badge variant="default" className="gap-1"><Play className="h-3 w-3" />Open</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="gap-1">Draft</Badge>;
      case 'paused':
        return <Badge variant="outline" className="gap-1"><Pause className="h-3 w-3" />Paused</Badge>;
      case 'closed':
        return <Badge variant="destructive" className="gap-1">Closed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const formatSalary = (salary: any, jobType?: string) => {
    if (!salary) return 'Not specified';
    
    const { min, max, currency, period } = salary;
    const prefix = currency === 'USD' ? '$' : currency;
    
    if (period === 'hourly' || jobType === 'part-time') {
      return `${prefix}${min}-${max}/hr`;
    }
    
    if (period === 'annually' || !period) {
      return `${prefix}${min?.toLocaleString() || 0}-${max?.toLocaleString() || 0}/yr`;
    }
    
    return `${prefix}${min?.toLocaleString() || 0}-${max?.toLocaleString() || 0}/${period}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLocation = (job: Job) => {
    if (job.address) {
      const addr = job.address;
      const parts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
      return parts.join(', ');
    }
    if (job.location && typeof job.location === 'string') {
      return job.location;
    }
    return 'Not specified';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Job not found or could not be loaded.
        <Button variant="link" onClick={() => navigate('/jobs')}>Go back to jobs</Button>
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
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">Job details and information</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {(job.status === 'draft' || job.status === 'paused') && (
          <Button onClick={handlePublish} className="gap-2">
            <Play className="h-4 w-4" /> Publish
          </Button>
        )}
        {(job.status === 'open' || job.status === 'published') && (
          <Button onClick={handleClose} variant="outline" className="gap-2">
            <Pause className="h-4 w-4" /> Close
          </Button>
        )}
        {job.status === 'closed' && (
          <Button onClick={handleReopen} variant="outline" className="gap-2">
            <Play className="h-4 w-4" /> Reopen
          </Button>
        )}
        <Button onClick={() => navigate(`/jobs/${job.id}/edit`)} variant="secondary" className="gap-2">
          <Edit className="h-4 w-4" /> Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2" disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{job.title}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                Delete Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Job Content */}
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
          <CardDescription>Complete details about the job posting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Status:</span> {getStatusBadge(job.status)}</div>
                <div><span className="font-medium">Job Type:</span> <Badge variant="outline">{job.jobType || job.type || 'N/A'}</Badge></div>
                <div><span className="font-medium">Experience Level:</span> {job.experience || 'N/A'}</div>
                <div><span className="font-medium">Salary:</span> {formatSalary(job.salary, job.jobType || job.type)}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Dates & Metadata</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Created:</span> {formatDate(job.createdAt)}</div>
                <div><span className="font-medium">Updated:</span> {formatDate(job.updatedAt)}</div>
                {job.provider && (
                  <div>
                    <span className="font-medium">Provider:</span>{' '}
                    {typeof job.provider === 'object' 
                      ? (job.provider.companyName || job.provider.name || 'N/A')
                      : 'N/A'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description || 'No description provided'}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Location</h4>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {formatLocation(job)}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Contact Information</h4>
            <div className="space-y-2 text-sm">
              {job.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${job.contactEmail}`} className="text-primary hover:underline">
                    {job.contactEmail}
                  </a>
                </div>
              )}
              {job.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${job.contactPhone}`} className="text-primary hover:underline">
                    {job.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Requirements</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Responsibilities</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {job.responsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Benefits</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {job.tags && job.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default JobDetailPage;

