import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, CheckCircle, XCircle, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { Provider } from '../types';
import useCRUD from '../hooks/useCRUD';
import api from '../lib/api';

// Helper function to format location for display
const formatLocation = (provider: any): string => {
  if (!provider) return 'N/A';
  
  // If location is a string, use it directly
  if (typeof provider.location === 'string' && provider.location.trim()) {
    return provider.location;
  }
  
  // If address object exists, use city and state
  if (provider.address && typeof provider.address === 'object') {
    const parts = [];
    if (provider.address.city && typeof provider.address.city === 'string') {
      parts.push(provider.address.city);
    }
    if (provider.address.state && typeof provider.address.state === 'string') {
      parts.push(provider.address.state);
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  // Fallback
  return 'N/A';
};

export function ProvidersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Use CRUD hook for provider management
  const {
    items: providers,
    loading,
    deleting,
    fetchItems,
    deleteItem,
    setFilters,
  } = useCRUD<Provider>({
    resource: 'providers',
    api: api.providers,
    messages: {
      updated: 'Provider updated successfully',
      deleted: 'Provider deleted successfully',
    },
  });

  // Apply filters when search or filter values change (use useRef to prevent infinite loop)
  const filtersRef = React.useRef<{ search?: string; status?: string } | null>(null);
  const isInitialMount = React.useRef(true);
  
  React.useEffect(() => {
    const filters: any = {};
    
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    // Only call setFilters if filters actually changed, or on initial mount
    const filtersString = JSON.stringify(filters);
    const refString = filtersRef.current ? JSON.stringify(filtersRef.current) : null;
    
    if (isInitialMount.current || filtersString !== refString) {
      filtersRef.current = filters;
      setFilters(filters);
      isInitialMount.current = false;
    }
  }, [searchQuery, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter providers (ensure it's always an array)
  const filteredProviders = Array.isArray(providers) ? providers : [];

  const handleApprove = async (providerId: string) => {
    try {
      const response = await api.providers.approve(providerId);
      
      if (response.success) {
        toast({
          title: 'Provider approved',
          description: 'Provider has been approved successfully',
        });
        await fetchItems(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve provider',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (providerId: string) => {
    try {
      const reason = 'Provider application does not meet requirements';
      const response = await api.providers.reject(providerId, reason);
      
      if (response.success) {
        toast({
          title: 'Provider rejected',
          description: 'Provider has been rejected',
        });
        await fetchItems(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject provider',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (providerId: string) => {
    try {
      const response = await api.providers.toggleFeatured(providerId);
      
      if (response.success) {
        const provider = providers.find(p => p.id === providerId);
        toast({
          title: provider?.featured ? 'Removed from featured' : 'Added to featured',
          description: provider?.featured ? 'Provider is no longer featured' : 'Provider is now featured',
        });
        await fetchItems(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update provider',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (providerId: string) => {
    await deleteItem(providerId);
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setViewDetailsOpen(true);
  };

  const handleEditProvider = (provider: Provider) => {
    navigate(`/providers/${provider.id}/edit`);
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="gap-1">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Providers</h1>
          <p className="text-muted-foreground">Manage marine service providers</p>
        </div>
        <Button onClick={() => navigate('/providers/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Management</CardTitle>
          <CardDescription>
            View and manage all service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {filteredProviders.length} of {providers.length} providers
            </div>
          </div>

          {/* Providers Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No providers found matching your criteria' : 'No providers found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {provider.name}
                              {provider.featured && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {provider.services.slice(0, 2).join(', ')}
                              {provider.services.length > 2 && ` +${provider.services.length - 2} more`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{provider.email}</div>
                          <div className="text-sm text-muted-foreground">{provider.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatLocation(provider)}</TableCell>
                      <TableCell>{getStatusBadge(provider.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{provider.rating}</span>
                          <span className="text-muted-foreground">({provider.reviewCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(provider.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(provider)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProvider(provider)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {provider.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleApprove(provider.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(provider.id)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {provider.status === 'approved' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleFeatured(provider.id)}>
                                  <Star className="mr-2 h-4 w-4" />
                                  {provider.featured ? 'Remove Featured' : 'Make Featured'}
                                </DropdownMenuItem>
                              </>
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
                                  <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{provider.name}</strong>? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(provider.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleting}
                                  >
                                    Delete Provider
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
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedProvider?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedProvider.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedProvider.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedProvider.phone}</div>
                    <div><span className="font-medium">Location:</span> {formatLocation(selectedProvider)}</div>
                    <div><span className="font-medium">Website:</span> {selectedProvider.website || 'Not provided'}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Status & Rating</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Status:</span> {getStatusBadge(selectedProvider.status)}</div>
                    <div><span className="font-medium">Featured:</span> {selectedProvider.featured ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">Rating:</span> {selectedProvider.rating} ({selectedProvider.reviewCount} reviews)</div>
                    <div><span className="font-medium">Created:</span> {formatDate(selectedProvider.createdAt)}</div>
                    <div><span className="font-medium">Updated:</span> {formatDate(selectedProvider.updatedAt)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedProvider.description}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.services.map((service) => (
                    <Badge key={service} variant="secondary">{service}</Badge>
                  ))}
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

export default ProvidersPage;