import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle, User, Briefcase, Building2, Eye, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';
import { TableFilters, PaginatedResponse, ApiResponse } from '../types';

interface ProviderDetails {
  companyName?: string;
  location?: string;
  services?: string[];
  website?: string;
  employees?: string;
  experience?: string;
}

interface JobDetails {
  jobTitle?: string;
  location?: string;
  salaryRange?: string;
  type?: string;
  requirements?: string[];
  benefits?: string[];
}

interface BlogDetails {
  title?: string;
  wordCount?: number;
  featured?: boolean;
  excerpt?: string;
  tags?: string[];
}

interface CategoryDetails {
  name?: string;
  description?: string;
}

type ApprovalDetails = ProviderDetails | JobDetails | BlogDetails | CategoryDetails | undefined;

interface ApprovalRequest {
  id: string;
  type: 'provider' | 'job' | 'blog' | 'category';
  title: string;
  description: string;
  submitter: {
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  submittedAt: string;
  details?: ApprovalDetails;
  notes?: string;
}


export function ApprovalsPage() {
  const { toast } = useToast();
  
  const [approvalStats, setApprovalStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');

  // Use CRUD hook for approvals management
  // Cast the approvals API to the CRUD subset expected by useCRUD
  const approvalsApi = api.approvals as unknown as {
    list: (params?: TableFilters) => Promise<PaginatedResponse<ApprovalRequest>>;
    get: (id: string) => Promise<ApiResponse<ApprovalRequest>>;
    create?: (data?: unknown) => Promise<ApiResponse<ApprovalRequest>>;
    update?: (id: string, data?: unknown) => Promise<ApiResponse<ApprovalRequest>>;
    delete?: (id: string) => Promise<ApiResponse<void>>;
  };

  const {
    items: allApprovals,
    loading,
    fetchItems,
    setFilters,
  } = useCRUD<ApprovalRequest>({
    resource: 'approvals',
    api: approvalsApi,
  });

  // Separate state for different approval statuses
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [approvedApprovals, setApprovedApprovals] = useState<ApprovalRequest[]>([]);
  const [rejectedApprovals, setRejectedApprovals] = useState<ApprovalRequest[]>([]);

  const fetchApprovalData = React.useCallback(async () => {
    try {
      // Fetch pending approvals
      const pendingResponse = await api.approvals.getPending();
      if (pendingResponse.success) {
        setPendingApprovals(pendingResponse.data as ApprovalRequest[]);
      }

      // Fetch all approvals for approved/rejected lists
      const allResponse = await api.approvals.list();
      if (allResponse.success) {
        const approved = (allResponse.data as ApprovalRequest[]).filter((a) => a.status === 'approved');
        const rejected = (allResponse.data as ApprovalRequest[]).filter((a) => a.status === 'rejected');
        setApprovedApprovals(approved);
        setRejectedApprovals(rejected);
      }

      // Fetch approval statistics
      const statsResponse = await api.approvals.getStats();
      if (statsResponse.success) {
        setApprovalStats(statsResponse.data as { pending: number; approved: number; rejected: number; total: number });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Failed to fetch approval data:', msg);
      toast({
        title: 'Error loading approvals',
        description: `Unable to fetch approval data from the server. ${msg}`,
        variant: 'destructive',
      });
      
      // Set empty state instead of using mock data
      setPendingApprovals([]);
      setApprovedApprovals([]);
      setRejectedApprovals([]);
      setApprovalStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
    }
  }, [toast]);

  React.useEffect(() => { fetchApprovalData(); }, [fetchApprovalData]);

  const handleViewDetails = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setDetailsDialogOpen(true);
  };

  const handleApprovalAction = (approval: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(action);
    setActionNotes('');
    setActionDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedApproval) return;

    try {
      if (actionType === 'approve') {
        const response = await api.approvals.approve(selectedApproval.id, actionNotes.trim() || undefined);
        if (!response.success) {
          throw new Error(response.message || 'Failed to approve request');
        }
      } else {
        if (!actionNotes.trim()) {
          toast({
            title: 'Rejection reason required',
            description: 'Please provide a reason for rejecting this request',
            variant: 'destructive',
          });
          return;
        }
        
        const response = await api.approvals.reject(selectedApproval.id, actionNotes.trim());
        if (!response.success) {
          throw new Error(response.message || 'Failed to reject request');
        }
      }
      
      // Refresh approval data after action
      await fetchApprovalData();
      
      toast({
        title: `Request ${actionType === 'approve' ? 'approved' : 'rejected'}`,
        description: `${selectedApproval.title} has been ${actionType === 'approve' ? 'approved' : 'rejected'}`,
      });
      
      setActionDialogOpen(false);
      setSelectedApproval(null);
      setActionNotes('');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Approval action error:', msg);
      toast({
        title: 'Error',
        description: msg || 'Failed to process approval. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'provider': return Building2;
      case 'job': return Briefcase;
      case 'blog': return MessageSquare;
      case 'category': return User;
      default: return AlertCircle;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      provider: 'default',
      job: 'secondary',
      blog: 'outline',
      category: 'destructive'
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'outline'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderApprovalCard = (approval: ApprovalRequest) => {
    const TypeIcon = getTypeIcon(approval.type);
    
    return (
      <Card key={approval.id} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <TypeIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{approval.title}</CardTitle>
                <CardDescription className="text-sm">{approval.description}</CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {getTypeBadge(approval.type)}
              {getPriorityBadge(approval.priority)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>{approval.submitter.name}</span>
              </div>
              <span className="text-muted-foreground">{formatDate(approval.submittedAt)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              {getStatusBadge(approval.status)}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDetails(approval)}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Details
                </Button>
                {approval.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleApprovalAction(approval, 'reject')}
                      className="gap-1"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprovalAction(approval, 'approve')}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderApprovalDetails = (approval: ApprovalRequest) => {
    switch (approval.type) {
      case 'provider':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Company Name</Label>
                <div className="text-sm">{(approval.details as ProviderDetails | undefined)?.companyName}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm">{(approval.details as ProviderDetails | undefined)?.location}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Website</Label>
                <div className="text-sm">{(approval.details as ProviderDetails | undefined)?.website}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Company Size</Label>
                <div className="text-sm">{(approval.details as ProviderDetails | undefined)?.employees} employees</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Experience</Label>
                <div className="text-sm">{(approval.details as ProviderDetails | undefined)?.experience}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Services</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {approval.type === 'provider' && ((approval.details as ProviderDetails | undefined)?.services || []).map((service) => (
                  <Badge key={service} variant="outline">{service}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'job':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Job Title</Label>
                <div className="text-sm">{(approval.details as JobDetails | undefined)?.jobTitle}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm">{(approval.details as JobDetails | undefined)?.location}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Salary Range</Label>
                <div className="text-sm">{(approval.details as JobDetails | undefined)?.salaryRange}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <div className="text-sm">{(approval.details as JobDetails | undefined)?.type}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Requirements</Label>
              <ul className="text-sm list-disc list-inside mt-1">
                {approval.type === 'job' && ((approval.details as JobDetails | undefined)?.requirements || []).map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <Label className="text-sm font-medium">Benefits</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {approval.type === 'job' && ((approval.details as JobDetails | undefined)?.benefits || []).map((benefit) => (
                  <Badge key={benefit} variant="outline">{benefit}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'blog':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <div className="text-sm">{(approval.details as BlogDetails | undefined)?.title}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Word Count</Label>
                <div className="text-sm">{(approval.details as BlogDetails | undefined)?.wordCount} words</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Featured</Label>
                <div className="text-sm">{(approval.details as BlogDetails | undefined)?.featured ? 'Yes' : 'No'}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Excerpt</Label>
              <div className="text-sm">{(approval.details as BlogDetails | undefined)?.excerpt}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {approval.type === 'blog' && ((approval.details as BlogDetails | undefined)?.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
        
      default:
        return <div className="text-sm text-muted-foreground">No additional details available</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approvals</h1>
          <p className="text-muted-foreground">Review and manage pending approval requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {pendingApprovals.length} pending approvals
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{approvalStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvalStats.approved}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{approvalStats.rejected}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Lists */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({approvalStats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvalStats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({approvalStats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-muted-foreground">Loading approvals...</div>
              </CardContent>
            </Card>
          ) : (
          pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">No pending approvals</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingApprovals.map(renderApprovalCard)}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-muted-foreground">Loading approvals...</div>
              </CardContent>
            </Card>
          ) : (
          approvedApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">No approved requests</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedApprovals.map(renderApprovalCard)}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-muted-foreground">Loading approvals...</div>
              </CardContent>
            </Card>
          ) : (
          rejectedApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">No rejected requests</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedApprovals.map(renderApprovalCard)}
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedApproval?.title}</DialogTitle>
            <DialogDescription>
              {selectedApproval?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{selectedApproval.submitter.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedApproval.submitter.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Submitted</div>
                  <div className="text-sm">{formatDate(selectedApproval.submittedAt)}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {getTypeBadge(selectedApproval.type)}
                {getPriorityBadge(selectedApproval.priority)}
                {getStatusBadge(selectedApproval.status)}
              </div>
              
              {renderApprovalDetails(selectedApproval)}
              
              {selectedApproval.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm bg-muted p-3 rounded-md mt-1">{selectedApproval.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedApproval?.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleApprovalAction(selectedApproval, 'reject');
                  }}
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleApprovalAction(selectedApproval, 'approve');
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Are you sure you want to approve this request?' 
                : 'Please provide a reason for rejecting this request.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApproval && (
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{selectedApproval.title}</div>
                <div className="text-sm text-muted-foreground">{selectedApproval.description}</div>
              </div>
            )}
            
            {actionType === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejection-notes">Reason for rejection *</Label>
                <Textarea
                  id="rejection-notes"
                  placeholder="Please explain why this request is being rejected..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {actionType === 'approve' && (
              <div className="space-y-2">
                <Label htmlFor="approval-notes">Additional notes (optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Any additional comments or instructions..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAction} 
              disabled={loading || (actionType === 'reject' && !actionNotes.trim())}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ApprovalsPage;