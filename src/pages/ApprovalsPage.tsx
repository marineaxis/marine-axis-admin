import React, { useState } from 'react';
import { Check, X, Clock, AlertCircle, User, Briefcase, Building2, Eye, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
  details: any;
  notes?: string;
}

// Mock approval requests data
const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: '1',
    type: 'provider',
    title: 'Pacific Marine Solutions',
    description: 'New provider registration for marine equipment and services',
    submitter: {
      name: 'John Smith',
      email: 'john@pacificmarine.com'
    },
    status: 'pending',
    priority: 'high',
    submittedAt: '2024-01-25T10:30:00Z',
    details: {
      companyName: 'Pacific Marine Solutions',
      location: 'Seattle, WA',
      services: ['Equipment Supply', 'Maintenance', 'Repair'],
      website: 'https://pacificmarine.com',
      employees: '25-50',
      experience: '15 years'
    }
  },
  {
    id: '2',
    type: 'job',
    title: 'Senior Marine Engineer',
    description: 'Job posting for senior marine engineer position',
    submitter: {
      name: 'Sarah Johnson',
      email: 'sarah@marinesolutions.com'
    },
    status: 'pending',
    priority: 'medium',
    submittedAt: '2024-01-25T09:15:00Z',
    details: {
      jobTitle: 'Senior Marine Engineer',
      location: 'Miami, FL',
      salaryRange: '$85,000 - $120,000',
      type: 'full-time',
      requirements: ['10+ years experience', 'Marine engineering degree', 'Valid certifications'],
      benefits: ['Health insurance', '401k', 'Paid vacation']
    }
  },
  {
    id: '3',
    type: 'blog',
    title: 'The Future of Marine Technology',
    description: 'Blog post about emerging trends in marine technology',
    submitter: {
      name: 'Mike Davis',
      email: 'mike@marinetech.com'
    },
    status: 'pending',
    priority: 'low',
    submittedAt: '2024-01-24T16:45:00Z',
    details: {
      title: 'The Future of Marine Technology',
      excerpt: 'Exploring the latest innovations transforming the marine industry',
      wordCount: 1250,
      tags: ['Technology', 'Innovation', 'Marine Industry'],
      featured: false
    }
  },
  {
    id: '4',
    type: 'provider',
    title: 'Atlantic Maritime Services',
    description: 'Provider registration for maritime consultation services',
    submitter: {
      name: 'Emma Wilson',
      email: 'emma@atlanticmaritime.com'
    },
    status: 'approved',
    priority: 'medium',
    submittedAt: '2024-01-23T14:20:00Z',
    details: {
      companyName: 'Atlantic Maritime Services',
      location: 'Boston, MA',
      services: ['Consultation', 'Training', 'Compliance'],
      website: 'https://atlanticmaritime.com',
      employees: '10-25',
      experience: '8 years'
    },
    notes: 'Approved after verification of credentials and references.'
  },
  {
    id: '5',
    type: 'job',
    title: 'Boat Maintenance Technician',
    description: 'Part-time boat maintenance position',
    submitter: {
      name: 'Tom Rodriguez',
      email: 'tom@coastalmarine.com'
    },
    status: 'rejected',
    priority: 'low',
    submittedAt: '2024-01-22T11:30:00Z',
    details: {
      jobTitle: 'Boat Maintenance Technician',
      location: 'San Diego, CA',
      salaryRange: '$20 - $25/hour',
      type: 'part-time',
      requirements: ['Basic mechanical skills', 'Willingness to learn'],
      benefits: ['Flexible schedule', 'Training provided']
    },
    notes: 'Rejected due to insufficient job description and unclear requirements.'
  }
];

export function ApprovalsPage() {
  const { toast } = useToast();
  
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(MOCK_APPROVALS);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter approvals by status
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const approvedApprovals = approvals.filter(a => a.status === 'approved');
  const rejectedApprovals = approvals.filter(a => a.status === 'rejected');

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

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApprovals(prev => prev.map(approval => 
        approval.id === selectedApproval.id 
          ? { 
              ...approval, 
              status: actionType === 'approve' ? 'approved' : 'rejected',
              notes: actionNotes.trim() || undefined
            }
          : approval
      ));
      
      toast({
        title: `Request ${actionType === 'approve' ? 'approved' : 'rejected'}`,
        description: `${selectedApproval.title} has been ${actionType === 'approve' ? 'approved' : 'rejected'}`,
      });
      
      setActionDialogOpen(false);
      setSelectedApproval(null);
      setActionNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process approval. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
                <div className="text-sm">{approval.details.companyName}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm">{approval.details.location}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Website</Label>
                <div className="text-sm">{approval.details.website}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Company Size</Label>
                <div className="text-sm">{approval.details.employees} employees</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Experience</Label>
                <div className="text-sm">{approval.details.experience}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Services</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {approval.details.services.map((service: string) => (
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
                <div className="text-sm">{approval.details.jobTitle}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm">{approval.details.location}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Salary Range</Label>
                <div className="text-sm">{approval.details.salaryRange}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <div className="text-sm">{approval.details.type}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Requirements</Label>
              <ul className="text-sm list-disc list-inside mt-1">
                {approval.details.requirements.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
            <div>
              <Label className="text-sm font-medium">Benefits</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {approval.details.benefits.map((benefit: string) => (
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
                <div className="text-sm">{approval.details.title}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Word Count</Label>
                <div className="text-sm">{approval.details.wordCount} words</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Featured</Label>
                <div className="text-sm">{approval.details.featured ? 'Yes' : 'No'}</div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Excerpt</Label>
              <div className="text-sm">{approval.details.excerpt}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {approval.details.tags.map((tag: string) => (
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
            <div className="text-2xl font-bold text-orange-600">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedApprovals.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedApprovals.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Lists */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingApprovals.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedApprovals.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedApprovals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
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
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedApprovals.length === 0 ? (
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
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApprovals.length === 0 ? (
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
          )}
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
              disabled={isLoading || (actionType === 'reject' && !actionNotes.trim())}
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