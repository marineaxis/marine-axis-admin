import React, { useState, useEffect } from 'react';
import { Search, Mail, User, Calendar, CheckCircle, XCircle, Clock, Trash2, Eye, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  providerId?: string | { _id: string; companyName?: string; contactName?: string; email?: string };
  status: 'pending' | 'resolved' | 'archived';
  notes?: string;
  resolvedAt?: string;
  resolvedBy?: string | { _id: string; name?: string; email?: string };
  createdAt: string;
  updatedAt: string;
}

export function EnquiriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');

  // Fetch enquiries
  const { data: enquiriesData, isLoading } = useQuery({
    queryKey: ['enquiries', statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: 100,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await api.enquiries.list(params);
      return response;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['enquiries-stats'],
    queryFn: async () => {
      const response = await api.enquiries.getStats();
      return response;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return await api.enquiries.updateStatus(id, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries-stats'] });
      toast({
        title: 'Status updated',
        description: 'Enquiry status has been updated successfully',
      });
      setUpdateDialogOpen(false);
      setSelectedEnquiry(null);
      setUpdateNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update enquiry status',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.enquiries.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries-stats'] });
      toast({
        title: 'Enquiry deleted',
        description: 'Enquiry has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete enquiry',
        variant: 'destructive',
      });
    },
  });

  // Extract enquiries from paginated response
  const enquiries = enquiriesData?.data?.data || enquiriesData?.data || [];
  const stats = statsData?.data || { total: 0, pending: 0, resolved: 0, archived: 0 };

  const handleViewDetails = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setUpdateNotes(enquiry.notes || '');
    setViewDialogOpen(true);
  };

  const handleUpdateStatus = (enquiry: Enquiry, status: 'pending' | 'resolved' | 'archived') => {
    setSelectedEnquiry(enquiry);
    setUpdateNotes(enquiry.notes || '');
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = () => {
    if (!selectedEnquiry) return;
    // Toggle between pending and resolved, or set to archived
    let newStatus: 'pending' | 'resolved' | 'archived';
    if (selectedEnquiry.status === 'pending') {
      newStatus = 'resolved';
    } else if (selectedEnquiry.status === 'resolved') {
      newStatus = 'pending';
    } else {
      newStatus = 'pending'; // If archived, set to pending
    }
    
    updateStatusMutation.mutate({
      id: selectedEnquiry.id,
      status: newStatus,
      notes: updateNotes.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'resolved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />Archived</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Enquiries</h1>
          <p className="text-muted-foreground">Manage customer enquiries and inquiries</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Enquiries Management</CardTitle>
          <CardDescription>
            View and manage all contact enquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search enquiries..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {enquiries.length} enquiry{enquiries.length !== 1 ? 'ies' : ''}
            </div>
          </div>

          {/* Enquiries Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">Loading enquiries...</div>
                    </TableCell>
                  </TableRow>
                ) : enquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No enquiries found matching your criteria' : 'No enquiries found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  enquiries.map((enquiry: Enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{enquiry.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {enquiry.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={enquiry.subject}>
                          {enquiry.subject}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(enquiry.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(enquiry.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">•••</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(enquiry)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {enquiry.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(enquiry, 'resolved')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Resolved
                              </DropdownMenuItem>
                            )}
                            {enquiry.status === 'resolved' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(enquiry, 'pending')}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Mark as Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedEnquiry(enquiry);
                                  setUpdateNotes(enquiry.notes || '');
                                  updateStatusMutation.mutate({
                                    id: enquiry.id,
                                    status: 'archived',
                                    notes: enquiry.notes || undefined,
                                  });
                                }}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            )}
                            {enquiry.status === 'archived' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(enquiry, 'pending')}>
                                <Clock className="mr-2 h-4 w-4" />
                                Restore to Pending
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
                                  <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this enquiry from <strong>{enquiry.name}</strong>? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(enquiry.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleteMutation.isPending}
                                  >
                                    Delete Enquiry
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
            <DialogDescription>
              Complete information about this enquiry
            </DialogDescription>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <div className="text-sm font-medium">{selectedEnquiry.name}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="text-sm font-medium">{selectedEnquiry.email}</div>
                </div>
                <div className="col-span-2">
                  <Label>Subject</Label>
                  <div className="text-sm font-medium">{selectedEnquiry.subject}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedEnquiry.status)}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="text-sm text-muted-foreground">{formatDate(selectedEnquiry.createdAt)}</div>
                </div>
                {selectedEnquiry.providerId && (
                  <div className="col-span-2">
                    <Label>Provider</Label>
                    <div className="text-sm font-medium">
                      {typeof selectedEnquiry.providerId === 'object' 
                        ? (selectedEnquiry.providerId.companyName || selectedEnquiry.providerId.contactName || 'N/A')
                        : 'N/A'}
                    </div>
                  </div>
                )}
                {selectedEnquiry.resolvedAt && (
                  <div>
                    <Label>Resolved At</Label>
                    <div className="text-sm text-muted-foreground">{formatDate(selectedEnquiry.resolvedAt)}</div>
                  </div>
                )}
                {selectedEnquiry.resolvedBy && (
                  <div>
                    <Label>Resolved By</Label>
                    <div className="text-sm font-medium">
                      {typeof selectedEnquiry.resolvedBy === 'object'
                        ? (selectedEnquiry.resolvedBy.name || selectedEnquiry.resolvedBy.email || 'N/A')
                        : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Message</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {selectedEnquiry.message}
                </div>
              </div>
              {selectedEnquiry.notes && (
                <div>
                  <Label>Admin Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {selectedEnquiry.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Enquiry Status</DialogTitle>
            <DialogDescription>
              {selectedEnquiry && (
                <>Update status for enquiry from {selectedEnquiry.name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this enquiry..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {selectedEnquiry?.status === 'pending' 
                ? 'Mark as Resolved' 
                : selectedEnquiry?.status === 'resolved'
                ? 'Mark as Pending'
                : 'Restore to Pending'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EnquiriesPage;

