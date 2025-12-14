import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Play, Pause, Clock, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

import { Job, TableFilters, ApiResponse } from '../types';

export function JobsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // adapt api.jobs to the exact shape expected by useCRUD (delete returns ApiResponse<void>)
  const jobsApiForCrud = {
    list: api.jobs.list,
    get: api.jobs.get,
    create: api.jobs.create,
    update: api.jobs.update,
    delete: async (id: string) => {
      const res = await api.jobs.delete(id);
      return res as unknown as ApiResponse<void>;
    }
  };

  const {
    items: jobs,
    loading,
    setFilters,
    fetchItems,
    deleteItem,
    updateItem,
    filters,
  } = useCRUD<Job>({
    resource: 'jobs',
    api: jobsApiForCrud,
    messages: { deleted: 'Job deleted successfully', updated: 'Job updated successfully' }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Debounced fetch that reacts to the hook filters (prevents refresh storms)
  const fetchDebounceTimer = useRef<number | null>(null);
  const lastFetchedFiltersKeyRef = useRef<string | null>(null);

  const filtersKey = React.useMemo(() => {
    try { return JSON.stringify(filters || {}); } catch { return String(filters || ''); }
  }, [filters]);

  useEffect(() => {
    if (!filtersKey) return;
    // If we've already fetched this exact filter set, skip
    if (lastFetchedFiltersKeyRef.current === filtersKey) return;

    // debounce to avoid rapid repeated requests
    if (fetchDebounceTimer.current) {
      clearTimeout(fetchDebounceTimer.current);
      fetchDebounceTimer.current = null;
    }

    fetchDebounceTimer.current = window.setTimeout(async () => {
      let parsedFilters: TableFilters | undefined;
      try { parsedFilters = JSON.parse(filtersKey) as TableFilters; } catch { parsedFilters = undefined; }
      if (!parsedFilters) return;

      try {
        const result = await fetchItems(parsedFilters);
        if (result) {
          lastFetchedFiltersKeyRef.current = filtersKey;
        }
      } catch (error) {
        // swallow - fetchItems already handles toasts
        // but ensure we don't leave lastFetchedFiltersKeyRef set
      }
    }, 200);

    return () => {
      if (fetchDebounceTimer.current) {
        clearTimeout(fetchDebounceTimer.current);
        fetchDebounceTimer.current = null;
      }
    };
  }, [filtersKey, fetchItems]);

  React.useEffect(() => {
    const filters: Partial<TableFilters> = {};
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (statusFilter !== 'all') filters.status = statusFilter;
    setFilters(filters);
  }, [searchQuery, statusFilter, setFilters]);

  const handlePublish = async (jobId: string) => {
    try {
      const res = await api.jobs.publish(jobId);
      if (res.success) {
        toast({ title: 'Job published', description: 'Job is now live' });
        await fetchItems();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Error', description: msg || 'Failed to publish job', variant: 'destructive' });
    }
  };

  const handleUnpublish = async (jobId: string) => {
    try {
      const res = await api.jobs.unpublish(jobId);
      if (res.success) {
        toast({ title: 'Job unpublished', description: 'Job taken offline' });
        await fetchItems();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Error', description: msg || 'Failed to unpublish job', variant: 'destructive' });
    }
  };

  const handleClose = async (jobId: string) => {
    try {
      const res = await api.jobs.close(jobId);
      if (res.success) {
        toast({ title: 'Job closed', description: 'Job has been closed' });
        await fetchItems();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Error', description: msg || 'Failed to close job', variant: 'destructive' });
    }
  };

  const handleDelete = async (jobId: string) => {
    await deleteItem(jobId);
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setViewDetailsOpen(true);
  };

  const filteredJobs = jobs;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="gap-1"><Play className="h-3 w-3" />Published</Badge>;
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  const formatSalary = (salaryRange: Job['salaryRange'] | undefined, type: string) => {
    if (!salaryRange) return 'N/A';
    const { min, max, currency } = salaryRange;
    const prefix = currency === 'USD' ? '$' : `${currency} `;

    if (type === 'part-time') {
      return `${prefix}${min}-${max}/hr`;
    }

    return `${prefix}${min.toLocaleString()}-${max.toLocaleString()}/yr`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  };

  const formatLocation = (location: string | { type: 'Point'; coordinates: [number, number] }, address?: { street?: string; city: string; state: string; country: string }) => {
    if (typeof location === 'string') return location;
    if (address) return `${address.city}, ${address.state}, ${address.country}`;
    if (location && typeof location === 'object' && 'coordinates' in location) {
      return `${location.coordinates[1]}, ${location.coordinates[0]}`;
    }
    return 'Not specified';
  };

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

      {/* Filters */}
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
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredJobs.length} of {jobs.length} jobs
            </div>
          </div>

          {/* Jobs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No jobs found matching your criteria' : 'No jobs found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {job.title}
                            {getUrgencyBadge(job.urgency)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>{job.type}</span>
                            {!job.remote && <span>• On-site</span>}
                            {job.remote && <span>• Remote</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {formatLocation(job.location, job.address)}
                        </div>
                      </TableCell>
                      <TableCell>{formatSalary(job.salaryRange, job.type)}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{job.applications ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm ${isExpiringSoon(job.expiresAt) ? 'text-destructive' : 'text-muted-foreground'}`}>
                          <div className="flex items-center gap-1">
                            {isExpiringSoon(job.expiresAt) && <Clock className="h-3 w-3" />}
                            {formatDate(job.expiresAt)}
                          </div>
                        </div>
                      </TableCell>
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
                            {job.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handlePublish(job.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {job.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleUnpublish(job.id)}>
                                <Pause className="mr-2 h-4 w-4" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            {(job.status === 'draft' || job.status === 'published') && (
                              <DropdownMenuItem onClick={() => handleClose(job.id)}>
                                <Clock className="mr-2 h-4 w-4" />
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
                                    disabled={loading}
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
          </div>
        </CardContent>
      </Card>

      {/* View Job Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Job Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {selectedJob.title}</div>
                    <div><span className="font-medium">Type:</span> {selectedJob.type}</div>
                    <div>
                      <span className="font-medium">Location:</span>{' '}
                      {formatLocation(selectedJob.location, selectedJob.address)}
                    </div>
                    <div><span className="font-medium">Remote:</span> {selectedJob.remote ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">Salary:</span> {formatSalary(selectedJob.salaryRange, selectedJob.type)}</div>
                    <div><span className="font-medium">Urgency:</span> {getUrgencyBadge(selectedJob.urgency)}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Status & Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedJob.status)}</div>
                    <div><span className="font-medium">Applications:</span> {selectedJob.applications}</div>
                    <div><span className="font-medium">Expires:</span> {formatDate(selectedJob.expiresAt)}</div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedJob.createdAt)}</div>
                    <div><span className="font-medium">Updated:</span> {formatDate(selectedJob.updatedAt)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Benefits</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JobsPage;