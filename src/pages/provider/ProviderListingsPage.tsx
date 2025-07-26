// Provider listings management page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Image, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// Mock listing data
interface Listing {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  status: 'active' | 'inactive' | 'pending';
  views: number;
  inquiries: number;
  photos: number;
  createdAt: string;
  updatedAt: string;
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Marine Engine Repair Service',
    category: 'Repair Services',
    description: 'Professional marine engine repair and maintenance',
    price: '$150/hour',
    status: 'active',
    views: 324,
    inquiries: 12,
    photos: 6,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    title: 'Boat Electronics Installation',
    category: 'Electronics & Navigation',
    description: 'GPS, radar, and communication systems installation',
    price: '$200-400',
    status: 'active',
    views: 189,
    inquiries: 8,
    photos: 4,
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },
  {
    id: '3',
    title: 'Hull Cleaning Service',
    category: 'Boat Maintenance',
    description: 'Professional hull cleaning and antifouling',
    price: '$80/hour',
    status: 'pending',
    views: 56,
    inquiries: 3,
    photos: 2,
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
  },
];

export function ProviderListingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (listingId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setListings(prev => 
        prev.map(listing => 
          listing.id === listingId 
            ? { 
                ...listing, 
                status: listing.status === 'active' ? 'inactive' as const : 'active' as const,
                updatedAt: new Date().toISOString()
              }
            : listing
        )
      );
      
      toast({
        title: 'Status updated',
        description: 'Listing status has been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update listing status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const listing = listings.find(l => l.id === listingId);
      setListings(prev => prev.filter(l => l.id !== listingId));
      
      toast({
        title: 'Listing deleted',
        description: `${listing?.title} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending Review</Badge>;
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
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your service listings and offerings
          </p>
        </div>
        <Button onClick={() => navigate('/provider/listings/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Listing
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Service Listings</CardTitle>
          <CardDescription>
            View and manage all your service listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredListings.length} of {listings.length} listings
            </div>
          </div>

          {/* Listings Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Inquiries</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'No listings found matching your search' : 'No listings found'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{listing.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                            {listing.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{listing.category}</TableCell>
                      <TableCell>{listing.price}</TableCell>
                      <TableCell>{getStatusBadge(listing.status)}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{listing.views}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{listing.inquiries}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          <span className="text-sm">{listing.photos}</span>
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
                            <DropdownMenuItem onClick={() => navigate(`/provider/listings/${listing.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Listing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/provider/listings/${listing.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/provider/listings/${listing.id}/photos`)}>
                              <Image className="mr-2 h-4 w-4" />
                              Manage Photos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(listing.id)}>
                              {listing.status === 'active' ? (
                                <>
                                  <Star className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Star className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
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
                                  <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{listing.title}</strong>? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(listing.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={isLoading}
                                  >
                                    Delete Listing
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
    </div>
  );
}

export default ProviderListingsPage;