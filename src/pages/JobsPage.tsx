import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Play, Pause, Clock, MapPin, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { Job } from '../types';
import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

export function JobsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobStats, setJobStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
  });

  // Memoize the API object to prevent recreation on every render
  const memoizedJobApi = useMemo(() => api.jobs, []);

  // Use CRUD hook for job management
  const {
    items: jobs,
    loading,
    deleting,
    fetchItems,
    deleteItem,
  } = useCRUD<Job>({
    resource: 'jobs',
    api: memoizedJobApi,
    messages: {
      deleted: 'Job deleted successfully',
    },
  });

  // Fetch initial job statistics once
  useEffect(() => {
    const fetchJobStats = async () => {
      try {
        const statsResponse = await api.jobs.getStats();
        if (statsResponse.success) {
          setJobStats(statsResponse.data);
        }
      } catch (error: any) {
        console.error('Failed to fetch job stats:', error);
      }
    };
    fetchJobStats();
  }, []);

  // Apply filters and fetch items when search or filter values change
  useEffect(() => {
    const filters: any = {
      page: 1,
      limit: 25,
      sortOrder: 'desc',
    };
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    fetchItems(filters);
  }, [searchQuery]); // fetchItems is stable due to useCRUD's useCallback

  const handlePublish = async (jobId: string) => {
    try {
      const response = await api.jobs.publish(jobId);
      
      if (response.success) {
        toast({
          title: 'Job published',
          description: 'Job is now live and accepting applications',
        });
        fetchItems(); // Refresh the list
      }
    } catch (error: any) {
      toast({
        title: 'Error publishing job',
        description: error.message || 'Failed to publish job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = async (jobId: string) => {
    try {
      const response = await api.jobs.close(jobId);
      
      if (response.success) {
        toast({
          title: 'Job closed',
          description: 'Job has been closed and is no longer accepting applications',
        });
        fetchItems(); // Refresh the list
      }
    } catch (error: any) {
      toast({
        title: 'Error closing job',
        description: error.message || 'Failed to close job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const success = await deleteItem(jobId);
      if (success) {
        // fetchItems is called by useCRUD after successful deletion
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleViewDetails = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  const getStatusBadge = (status: string) => {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatSalary = (salary: any, jobType?: string) => {
    if (!salary || typeof salary !== 'object') return 'Not specified';
    
    const { min, max, currency, period } = salary;
    
    // Handle undefined or invalid values - only return "Not specified" if both are truly missing
    const hasMin = min !== undefined && min !== null && !isNaN(Number(min));
    const hasMax = max !== undefined && max !== null && !isNaN(Number(max));
    
    if (!hasMin && !hasMax) {
      return 'Not specified';
    }
    
    // If both min and max are 0, consider it as no salary specified
    if (hasMin && hasMax && Number(min) === 0 && Number(max) === 0) {
      return 'Not specified';
    }
    
    // Use the values we have, defaulting to 0 if missing
    const minVal = hasMin ? Number(min) : 0;
    const maxVal = hasMax ? Number(max) : minVal; // If max is missing, use min
    
    // Format currency prefix
    let prefix = '';
    if (currency === 'USD') {
      prefix = '$';
    } else if (currency === 'EUR') {
      prefix = '€';
    } else if (currency === 'GBP') {
      prefix = '£';
    } else if (currency === 'JPY' || currency === 'CNY') {
      prefix = currency === 'JPY' ? '¥' : '¥';
    } else if (currency === 'INR') {
      prefix = '₹';
    } else {
      prefix = currency || 'USD';
    }
    
    const periodSuffix = period || 'annually';
    
    if (periodSuffix === 'hourly' || jobType === 'part-time') {
      return `${prefix}${minVal.toLocaleString()}-${maxVal.toLocaleString()}/hr`;
    }
    
    if (periodSuffix === 'annually') {
      return `${prefix}${minVal.toLocaleString()}-${maxVal.toLocaleString()}/yr`;
    }
    
    return `${prefix}${minVal.toLocaleString()}-${maxVal.toLocaleString()}/${periodSuffix}`;
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
    // Use address if available (location is a GeoJSON object, not a string)
    if (job.address) {
      const addr = job.address;
      const parts = [addr.city, addr.state, addr.country].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    return 'Not specified';
  };

  // Filter jobs client-side (backend filtering can be added later)
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatLocation(job).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-muted-foreground">Manage job postings and applications</p>
          </div>
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" />
            Post Job
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
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
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage job postings and applications</p>
        </div>
        <Button onClick={() => navigate('/jobs/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Post Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Jobs</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{jobStats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Jobs</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>
            View and manage all job postings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                          {job.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {formatLocation(job)}
                      </div>
                    </TableCell>
                    <TableCell>{formatSalary(job.salary, job.type || job.jobType)}</TableCell>
                    <TableCell>{getStatusBadge(job.status || 'draft')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.type || job.jobType || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(job)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(job.status === 'draft' || job.status === 'paused') && (
                            <DropdownMenuItem onClick={() => handlePublish(job.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {(job.status === 'open' || job.status === 'published') && (
                            <DropdownMenuItem onClick={() => handleClose(job.id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Close
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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
                                  onClick={() => handleDelete(job.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deleting}
                                >
                                  Delete Job
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default JobsPage;
