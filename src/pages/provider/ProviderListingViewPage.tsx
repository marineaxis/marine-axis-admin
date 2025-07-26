// View listing details page for providers
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Image, Eye, Calendar, MapPin, DollarSign, Star, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock listing data (this would come from API based on ID)
const MOCK_LISTING = {
  id: '1',
  title: 'Marine Engine Repair Service',
  category: 'Repair Services',
  description: 'Professional marine engine repair and maintenance services. We specialize in both inboard and outboard engines, providing comprehensive diagnostics, repairs, and preventive maintenance. Our certified technicians have over 15 years of experience working with all major engine brands including Yamaha, Mercury, and Volvo Penta.',
  price: '$150/hour',
  priceType: 'Per Hour',
  location: 'Marina Bay, San Francisco',
  status: 'active' as const,
  views: 324,
  inquiries: 12,
  photos: 6,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-20T00:00:00Z',
  features: [
    '24/7 Emergency Service',
    'Certified Technicians',
    'All Engine Brands',
    'Warranty Included',
    'Mobile Service Available'
  ],
  requirements: [
    'Boat must be accessible by dock',
    'Engine specifications needed',
    'Previous maintenance records helpful'
  ],
  rating: 4.8,
  reviewCount: 47
};

export function ProviderListingViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing] = useState(MOCK_LISTING); // In real app, fetch based on ID
  const [isLoading, setIsLoading] = useState(false);

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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/provider/listings')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            <p className="text-muted-foreground">
              {listing.category} • {getStatusBadge(listing.status)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/provider/listings/${id}/photos`)}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            Manage Photos
          </Button>
          <Button
            onClick={() => navigate(`/provider/listings/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Listing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          {listing.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Service Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {listing.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {listing.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {requirement}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Views</span>
                </div>
                <span className="font-semibold">{listing.views}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Inquiries</span>
                </div>
                <span className="font-semibold">{listing.inquiries}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Photos</span>
                </div>
                <span className="font-semibold">{listing.photos}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">Rating</span>
                </div>
                <span className="font-semibold">
                  {listing.rating} ({listing.reviewCount} reviews)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Price</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{listing.price}</div>
                <div className="text-sm text-muted-foreground">{listing.priceType}</div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{listing.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Created</span>
                </div>
                <div className="text-sm font-medium">
                  {formatDate(listing.createdAt)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                </div>
                <div className="text-sm font-medium">
                  {formatDate(listing.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ProviderListingViewPage;