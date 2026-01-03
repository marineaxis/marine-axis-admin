import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProviderForm } from '@/components/provider/ProviderForm';
import useCRUD from '@/hooks/useCRUD';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function EditProviderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { updateItem, updating } = useCRUD<any>({
    resource: 'providers',
    api: api.providers,
    messages: {
      updated: 'Provider updated successfully',
    },
  });

  useEffect(() => {
    const fetchProvider = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await api.providers.get(id);
        if (response.success) {
          setProvider(response.data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load provider data',
            variant: 'destructive',
          });
          navigate('/providers');
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load provider data',
          variant: 'destructive',
        });
        navigate('/providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id, navigate, toast]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    const result = await updateItem(id, data);
    if (result) {
      navigate('/providers');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/providers')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Providers
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Provider</h1>
            <p className="text-muted-foreground">Update provider information</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/providers')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Providers
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Provider</h1>
          <p className="text-muted-foreground">Update provider information</p>
        </div>
      </div>

      <ProviderForm
        mode="edit"
        initialData={provider}
        onSubmit={handleSubmit}
        loading={updating}
      />
    </div>
  );
}

export default EditProviderPage;

