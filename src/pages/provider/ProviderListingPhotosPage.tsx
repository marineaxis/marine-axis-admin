// Photo management for specific listing
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Eye, Star, Plus, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  url: string;
  fileName: string;
  uploadDate: string;
  size: string;
  isPrimary: boolean;
  order: number;
}

// Mock data for specific listing
const MOCK_LISTING = {
  id: '1',
  title: 'Marine Engine Repair Service',
  category: 'Repair Services'
};

const MOCK_PHOTOS: Photo[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400',
    fileName: 'engine-repair-1.jpg',
    uploadDate: '2024-01-20T00:00:00Z',
    size: '2.4 MB',
    isPrimary: true,
    order: 1,
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    fileName: 'engine-repair-2.jpg',
    uploadDate: '2024-01-20T00:00:00Z',
    size: '1.8 MB',
    isPrimary: false,
    order: 2,
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
    fileName: 'engine-repair-3.jpg',
    uploadDate: '2024-01-22T00:00:00Z',
    size: '3.1 MB',
    isPrimary: false,
    order: 3,
  },
];

export function ProviderListingPhotosPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const [listing] = useState(MOCK_LISTING);
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeletePhoto = async (photoId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const photo = photos.find(p => p.id === photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      
      toast({
        title: 'Photo deleted',
        description: `${photo?.fileName} has been removed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setPhotos(prev => 
        prev.map(p => ({
          ...p,
          isPrimary: p.id === photoId
        }))
      );
      
      toast({
        title: 'Primary photo updated',
        description: 'Photo has been set as primary for the listing',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update primary photo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Simulate file upload
      const newPhotos = Array.from(files).map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        isPrimary: false,
        order: photos.length + index + 1,
      }));

      setPhotos(prev => [...prev, ...newPhotos]);
      
      toast({
        title: 'Photos uploaded',
        description: `${files.length} photo(s) uploaded successfully`,
      });
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/provider/listings/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listing
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Photos</h1>
            <p className="text-muted-foreground">
              {listing.title} • {listing.category}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById('photo-upload')?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Photos Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Photos ({photos.length})
          </CardTitle>
          <CardDescription>
            Manage photos for this listing. Click the star to set a primary photo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No photos uploaded</h3>
              <p className="text-muted-foreground mb-4">
                Upload photos to showcase your service
              </p>
              <Button
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload First Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos
                .sort((a, b) => a.order - b.order)
                .map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    
                    {/* Photo overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(photo.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetPrimary(photo.id)}
                          disabled={photo.isPrimary}
                        >
                          <Star className={`h-4 w-4 ${photo.isPrimary ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this photo? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Photo
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Primary badge */}
                    {photo.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                        <Star className="h-3 w-3 mr-1 fill-white" />
                        Primary
                      </Badge>
                    )}

                    {/* Photo info */}
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-medium truncate">{photo.fileName}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{photo.size}</span>
                        <span>{formatDate(photo.uploadDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div
            className="text-center py-8 cursor-pointer"
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload More Photos</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, GIF up to 10MB each
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProviderListingPhotosPage;