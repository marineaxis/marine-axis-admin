import React, { useState } from 'react';
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

import { Job } from '../types';

// Mock job data
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Marine Engineer',
    description: 'Experienced marine engineer for luxury yacht maintenance.',
    providerId: '1',
    categoryIds: ['1', '2'],
    location: 'Miami, FL',
    salaryRange: { min: 75000, max: 95000, currency: 'USD' },
    requirements: ['5+ years experience', 'Marine engineering degree', 'Valid certifications'],
    benefits: ['Health insurance', '401k', 'Paid vacation'],
    type: 'full-time',
    remote: false,
    urgency: 'medium',
    status: 'published',
    expiresAt: '2024-03-15T00:00:00Z',
    applications: 12,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },
  {
    id: '2',
    title: 'Boat Captain',
    description: 'Looking for experienced boat captain for charter services.',
    providerId: '2',
    categoryIds: ['5'],
    location: 'San Diego, CA',
    salaryRange: { min: 60000, max: 80000, currency: 'USD' },
    requirements: ['Captain license', '10+ years experience', 'Clean record'],
    benefits: ['Competitive salary', 'Tips', 'Flexible schedule'],
    type: 'full-time',
    remote: false,
    urgency: 'high',
    status: 'published',
    expiresAt: '2024-02-28T00:00:00Z',
    applications: 8,
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
  {
    id: '3',
    title: 'Marine Electronics Technician',
    description: 'Part-time position for marine electronics installation and repair.',
    providerId: '3',
    categoryIds: ['3'],
    location: 'Boston, MA',
    salaryRange: { min: 25, max: 35, currency: 'USD' },
    requirements: ['Electronics background', 'Problem-solving skills'],
    benefits: ['Flexible hours', 'Training provided'],
    type: 'part-time',
    remote: false,
    urgency: 'low',
    status: 'draft',
    expiresAt: '2024-04-01T00:00:00Z',
    applications: 0,
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  },
];

export function JobsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handlePublish = async (jobId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'published' as const, updatedAt: new Date().toISOString() }
            : job
        )
      );
      
      toast({
        title: 'Job published',
        description: 'Job is now live and accepting applications',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async (jobId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'paused' as const, updatedAt: new Date().toISOString() }
            : job
        )
      );
      
      toast({
        title: 'Job paused',
        description: 'Job is no longer accepting applications',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async (jobId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'closed' as const, updatedAt: new Date().toISOString() }
            : job
        )
      );
      
      toast({
        title: 'Job closed',
        description: 'Job has been closed and archived',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const job = jobs.find(j => j.id === jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      
      toast({
        title: 'Job deleted',
        description: `${job?.title} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setViewDetailsOpen(true);
  };

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

  const formatSalary = (salaryRange: any, type: string) => {
    const { min, max, currency } = salaryRange;
    const prefix = currency === 'USD' ? '$' : currency;
    
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
                          {job.location}
                        </div>
                      </TableCell>
                      <TableCell>{formatSalary(job.salaryRange, job.type)}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{job.applications}</span>
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
                            <DropdownMenuItem>
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
                              <DropdownMenuItem onClick={() => handlePause(job.id)}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {(job.status === 'published' || job.status === 'paused') && (
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
                                    disabled={isLoading}
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
                    <div><span className="font-medium">Location:</span> {selectedJob.location}</div>
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