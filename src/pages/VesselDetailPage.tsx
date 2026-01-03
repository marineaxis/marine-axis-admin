import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ship, DollarSign, MapPin, Users, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';

import api from '../lib/api';

export function VesselDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: vesselData, isLoading } = useQuery({
    queryKey: ['vessel', id],
    queryFn: async () => {
      const response = await api.vessels.get(id!);
      return response;
    },
    enabled: !!id,
  });

  const vessel = vesselData?.data;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading vessel details...</p>
        </div>
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/vessels')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vessels
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Vessel not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/vessels')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vessels
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Vessel Details</h1>
          <p className="text-muted-foreground">View complete vessel information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              {vessel.name}
              {vessel.featured && <Badge><Star className="h-3 w-3 mr-1" />Featured</Badge>}
            </CardTitle>
            <CardDescription>{vessel.type}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vessel.description && (
              <>
                <p className="text-sm">{vessel.description}</p>
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity
              </span>
              <span className="font-semibold">{vessel.capacity} guests</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </span>
              <span className="font-semibold">{vessel.location}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price per Day
              </span>
              <span className="font-semibold">${vessel.pricePerDay?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vessel.amenities && vessel.amenities.length > 0 && (
              <>
                <div>
                  <span className="text-sm font-medium mb-2 block">Amenities</span>
                  <div className="flex flex-wrap gap-2">
                    {vessel.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}
            {vessel.specifications && (
              <div>
                <span className="text-sm font-medium mb-2 block">Specifications</span>
                <div className="space-y-2 text-sm">
                  {vessel.specifications.length && (
                    <div><strong>Length:</strong> {vessel.specifications.length}m</div>
                  )}
                  {vessel.specifications.width && (
                    <div><strong>Width:</strong> {vessel.specifications.width}m</div>
                  )}
                  {vessel.specifications.draft && (
                    <div><strong>Draft:</strong> {vessel.specifications.draft}m</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VesselDetailPage;

