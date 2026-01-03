import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProviderForm } from '@/components/provider/ProviderForm';
import useCRUD from '@/hooks/useCRUD';
import api from '@/lib/api';

export function CreateProviderPage() {
  const navigate = useNavigate();
  
  const { createItem, creating } = useCRUD<any>({
    resource: 'providers',
    api: api.providers,
    messages: {
      created: 'Provider created successfully and is pending approval',
    },
  });

  const handleSubmit = async (data: any) => {
    const result = await createItem(data);
    if (result) {
      navigate('/providers');
    }
  };

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
          <h1 className="text-3xl font-bold">Create Provider</h1>
          <p className="text-muted-foreground">Add a new marine service provider</p>
        </div>
      </div>

      <ProviderForm
        mode="create"
        onSubmit={handleSubmit}
        loading={creating}
      />
    </div>
  );
}

export default CreateProviderPage;
